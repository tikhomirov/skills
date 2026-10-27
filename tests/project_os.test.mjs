import assert from "node:assert";
import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto";
import { execSync } from "node:child_process"; import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cli = path.resolve(__dirname, "../bin/project.mjs");
const testVault = "/tmp/test_vault_" + Date.now(); const testRepo = "/tmp/test_repo_" + Date.now();
function getDirSha256(dir) {
  if (!fs.existsSync(dir)) return {}; const hashes = {};
  for (const f of fs.readdirSync(dir, { recursive: true })) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isFile()) {
      const data = fs.readFileSync(full); hashes[f] = crypto.createHash("sha256").update(data).digest("hex");
    }
  }
  return hashes;
}
try {
  fs.mkdirSync(testVault, { recursive: true });
  fs.mkdirSync(testRepo, { recursive: true });
  execSync("git init", { cwd: testRepo });
  execSync("git config user.name TestAgent", { cwd: testRepo });
  execSync("git config user.email test@example.com", { cwd: testRepo });
  fs.writeFileSync(path.join(testRepo, "app.js"), "console.log(1);\\n");
  execSync("git add . && git commit -m \"initial\"", { cwd: testRepo });
  execSync(`node ${cli} init --vault ${testVault} --project demo`, { cwd: testRepo });
  const humanDir = path.join(testVault, "Projects/demo/HUMAN");
  const agentDir = path.join(testVault, "Projects/demo/AGENT");
  assert(fs.existsSync(humanDir), "HUMAN dir created");
  assert(fs.existsSync(agentDir), "AGENT dir created");
  fs.writeFileSync(path.join(humanDir, "RULES.md"), "# Project Rules\\nStrict rules.\\n");
  fs.writeFileSync(path.join(humanDir, "ARCHITECTURE.md"), "# Architecture\\nSystem uses JWT authentication.\\n");
  const initialHashes = getDirSha256(humanDir);
  // 1. Task create & start
  execSync(`node ${cli} task create "Implement auth" --vault ${testVault} --project demo`, { cwd: testRepo });
  const t1 = path.join(agentDir, "tasks/TASK-001.md");
  assert(fs.existsSync(t1), "TASK-001 created in AGENT/tasks");
  execSync(`node ${cli} task start TASK-001 --vault ${testVault} --project demo`, { cwd: testRepo });
  assert(fs.readFileSync(t1, "utf8").includes("status: in-progress"), "Task in progress");
  // 2. Code change that conflicts with HUMAN/ARCHITECTURE (session vs JWT)
  fs.writeFileSync(path.join(testRepo, "app.js"), "const session = require(\"express-session\");\\n");
  execSync(`node ${cli} knowledge sync TASK-001 --vault ${testVault} --project demo`, { cwd: testRepo });
  assert(fs.readFileSync(t1, "utf8").includes("knowledge_sync: conflict"), "Knowledge sync detected conflict");
  assert(fs.existsSync(path.join(agentDir, "proposals/PROP-001.md")), "Human Change Proposal created in AGENT/proposals");
  // 3. Negative test: completing task with conflict MUST fail even with --force
  let completionBlocked = false;
  try {
    execSync(`node ${cli} task complete TASK-001 --force --vault ${testVault} --project demo`, { cwd: testRepo, stdio: "pipe" });
  } catch (err) {
    completionBlocked = true;
  }
  assert(completionBlocked, "Task completion strictly blocked on conflict even with --force");
  // 4. Resolve code to comply with HUMAN JWT rule
  fs.writeFileSync(path.join(testRepo, "app.js"), "const jwt = require(\"jsonwebtoken\");\\n");
  execSync(`node ${cli} knowledge sync TASK-001 --vault ${testVault} --project demo`, { cwd: testRepo });
  assert(fs.readFileSync(t1, "utf8").includes("knowledge_sync: synced"), "Knowledge sync marked synced on verified compliance");
  execSync(`node ${cli} task complete TASK-001 --vault ${testVault} --project demo`, { cwd: testRepo });
  assert(fs.readFileSync(t1, "utf8").includes("status: done"), "Task completed successfully");
  // 5. Context priority test
  const brief = execSync(`node ${cli} context brief --vault ${testVault} --project demo`, { cwd: testRepo, encoding: "utf8" });
  assert(brief.includes("HUMAN: RULES.md"), "Context contains normative human rules");
  // 6. SHA256 Invariance Test: HUMAN zone MUST NOT be touched by any agent command
  const finalHashes = getDirSha256(humanDir);
  assert.deepStrictEqual(initialHashes, finalHashes, "HUMAN zone SHA256 hashes strictly unchanged");
  // 7. Doctor validation test
  const doc = execSync(`node ${cli} doctor --vault ${testVault} --project demo --json`, { cwd: testRepo, encoding: "utf8" });
  assert(JSON.parse(doc).allOk === true, "Project doctor passed all checks");
  console.log("✔ ALL SECURITY, ISOLATION & WORKFLOW TESTS PASSED!");
} finally {
  fs.rmSync(testVault, { recursive: true, force: true });
  fs.rmSync(testRepo, { recursive: true, force: true });
}
