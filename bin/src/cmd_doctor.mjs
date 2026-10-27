import fs from "node:fs";
import path from "node:path";
export function cmdDoctor(options) {
  const { paths, projectRoot, vaultRoot } = options; const checks = [];
  checks.push({ name: "Obsidian Vault root exists", ok: Boolean(vaultRoot && fs.existsSync(vaultRoot)) });
  checks.push({ name: "Project root exists", ok: Boolean(projectRoot && fs.existsSync(projectRoot)) });
  checks.push({ name: "HUMAN/ zone exists", ok: fs.existsSync(paths.humanDir) });
  checks.push({ name: "AGENT/ zone exists", ok: fs.existsSync(paths.agentDir) });
  checks.push({ name: "AGENT/TASKS.base exists", ok: fs.existsSync(paths.tasksBase) });
  checks.push({ name: "AGENT/memory/NOW.md exists", ok: fs.existsSync(paths.nowFile) });
  checks.push({ name: "AGENT/memory/STATE.md exists", ok: fs.existsSync(paths.stateFile) });
  if (fs.existsSync(paths.tasksBase)) {
    const b = fs.readFileSync(paths.tasksBase, "utf8");
    const validYaml = b.includes("filters:") && b.includes("views:") && b.includes("type: cards") && b.includes("groupBy: status");
    checks.push({ name: "TASKS.base YAML & Kanban schema valid", ok: validYaml });
  }
  const allOk = checks.every(c => c.ok);
  return { allOk, checks };
}
