import fs from "node:fs";
import path from "node:path";
export function cmdDoctor(options) {
  const { paths, projectRoot, vaultRoot } = options;
  const checks = [];
  checks.push({ name: "Obsidian Vault root exists", ok: Boolean(vaultRoot && fs.existsSync(vaultRoot)) });
  checks.push({ name: "Project root exists", ok: Boolean(projectRoot && fs.existsSync(projectRoot)) });
  checks.push({ name: "Project directory in Vault exists", ok: fs.existsSync(paths.base) });
  checks.push({ name: "TASKS.base exists", ok: fs.existsSync(paths.tasksBase) });
  checks.push({ name: "NOW.md exists", ok: fs.existsSync(paths.nowFile) });
  checks.push({ name: "STATE.md exists", ok: fs.existsSync(paths.stateFile) });
  checks.push({ name: "knowledge/INDEX.md exists", ok: fs.existsSync(paths.knowledgeIndex) });
  if (fs.existsSync(paths.tasksBase)) {
    const b = fs.readFileSync(paths.tasksBase, "utf8");
    const validYaml = b.includes("filters:") && b.includes("views:") && b.includes("type: cards");
    checks.push({ name: "TASKS.base YAML & Kanban syntax valid", ok: validYaml });
  }
  const allOk = checks.every(c => c.ok);
  return { allOk, checks };
}
