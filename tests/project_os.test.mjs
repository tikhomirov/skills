import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
const cli = "/home/alex/Projects/skills/bin/project.mjs";
const testVault = "/tmp/test_vault_" + Date.now();
const testRepo = "/tmp/test_repo_" + Date.now();
try {
  fs.mkdirSync(testVault, { recursive: true });
  fs.mkdirSync(testRepo, { recursive: true });
  execSync("git init", { cwd: testRepo });
  execSync("git config user.name TestAgent", { cwd: testRepo });
  execSync("git config user.email test@example.com", { cwd: testRepo });
  fs.writeFileSync(path.join(testRepo, "app.js"), "console.log(1);\n");
  execSync("git add . && git commit -m \"initial commit\"", { cwd: testRepo });
  // 1. Init test
  execSync(`node ${cli} init --vault ${testVault} --project demo`, { cwd: testRepo });
  assert(fs.existsSync(path.join(testVault, "Projects/demo/TASKS.base")), "TASKS.base created");
  assert(fs.existsSync(path.join(testVault, "Projects/demo/memory/NOW.md")), "NOW.md created");
  assert(fs.existsSync(path.join(testVault, "Projects/demo/knowledge/INDEX.md")), "INDEX.md created");
  assert(fs.existsSync(path.join(testRepo, "AGENTS.md")), "AGENTS.md created");
  // 2. Task create test
  execSync(`node ${cli} task create "Feature auth" --vault ${testVault} --project demo`, { cwd: testRepo });
  const t1 = path.join(testVault, "Projects/demo/tasks/TASK-001.md");
  assert(fs.existsSync(t1), "TASK-001 created");
  assert(fs.readFileSync(t1, "utf8").includes("status: backlog"), "Initial status backlog");
  // 3. Task start test
  execSync(`node ${cli} task start TASK-001 --vault ${testVault} --project demo`, { cwd: testRepo });
  assert(fs.readFileSync(t1, "utf8").includes("status: in-progress"), "Status updated to in-progress");
  assert(fs.readFileSync(path.join(testVault, "Projects/demo/memory/NOW.md"), "utf8").includes("[[TASK-001]]"), "NOW updated with active task");
  // 4. Checkpoint test
  execSync(`node ${cli} memory checkpoint "Working on auth" --vault ${testVault} --project demo`, { cwd: testRepo });
  const sess = fs.readdirSync(path.join(testVault, "Projects/demo/memory/sessions"));
  assert(sess.length > 0, "Checkpoint session created");
  // 5. Code modification + Knowledge Sync test
  fs.writeFileSync(path.join(testRepo, "app.js"), "console.log(2);\n");
  execSync(`node ${cli} knowledge sync TASK-001 --vault ${testVault} --project demo`, { cwd: testRepo });
  assert(fs.readFileSync(t1, "utf8").includes("knowledge_sync: synced"), "Knowledge sync marked synced");
  // 6. Complete task test
  execSync(`node ${cli} task complete TASK-001 --vault ${testVault} --project demo`, { cwd: testRepo });
  assert(fs.readFileSync(t1, "utf8").includes("status: done"), "Task completed");
  // 7. Context test
  const brief = execSync(`node ${cli} context brief --vault ${testVault} --project demo`, { cwd: testRepo, encoding: "utf8" });
  assert(brief.includes("AGENTS.md") && brief.includes("NOW.md"), "Context brief works");
  // 8. Doctor test
  const doc = execSync(`node ${cli} doctor --vault ${testVault} --project demo --json`, { cwd: testRepo, encoding: "utf8" });
  assert(JSON.parse(doc).allOk === true, "Doctor passed");
  // 9. Idempotency test (repeat init without overwriting tasks)
  execSync(`node ${cli} init --vault ${testVault} --project demo`, { cwd: testRepo });
  assert(fs.existsSync(t1) && fs.readFileSync(t1, "utf8").includes("status: done"), "Idempotency preserved task file");
  console.log("✔ All automated tests passed successfully!");
} finally {
  fs.rmSync(testVault, { recursive: true, force: true });
  fs.rmSync(testRepo, { recursive: true, force: true });
}
