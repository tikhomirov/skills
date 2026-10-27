import fs from "node:fs";
import path from "node:path";
import { safeWrite, ensureDir } from "./utils.mjs";
import { generateTasksBase, generateProjectMd, generateNowMd, generateStateMd, generateIndexMd } from "./templates.mjs";

export function cmdInit(options) {
  const { projectRoot, vaultRoot, projectId, paths, dryRun, force } = options;
  if (!vaultRoot) throw new Error("Vault root not found. Set OBSIDIAN_VAULT or pass --vault");
  ensureDir(paths.base);
  ensureDir(paths.tasksDir);
  ensureDir(paths.memoryDir);
  ensureDir(paths.sessionsDir);
  ensureDir(paths.knowledgeDir);
  ensureDir(paths.archDir);
  ensureDir(paths.featuresDir);
  ensureDir(paths.decisionsDir);
  ensureDir(paths.glossaryDir);
  ensureDir(path.dirname(paths.roadmapFile));
  if (!fs.existsSync(paths.tasksBase) || force) safeWrite(paths.tasksBase, generateTasksBase(projectId), dryRun);
  if (!fs.existsSync(paths.projectMd) || force) safeWrite(paths.projectMd, generateProjectMd(projectId), dryRun);
  if (!fs.existsSync(paths.nowFile) || force) safeWrite(paths.nowFile, generateNowMd(projectId), dryRun);
  if (!fs.existsSync(paths.stateFile) || force) safeWrite(paths.stateFile, generateStateMd(projectId), dryRun);
  if (!fs.existsSync(paths.knowledgeIndex) || force) safeWrite(paths.knowledgeIndex, generateIndexMd(projectId), dryRun);
  const agentsFile = path.join(projectRoot, "AGENTS.md");
  if (!fs.existsSync(agentsFile)) {
    const bootstrap = "# AGENTS.md\n\n- Project: " + projectId + "\n- Vault: Projects/" + projectId + "/\n- Context: Run project context brief\n- Tasks: See TASKS.base in Vault\n";
    safeWrite(agentsFile, bootstrap, dryRun);
  }
  const projIdFile = path.join(projectRoot, ".project-id");
  if (!fs.existsSync(projIdFile) || force) safeWrite(projIdFile, projectId + "\\n", dryRun);
  return { success: true, base: paths.base, projectId };
}
