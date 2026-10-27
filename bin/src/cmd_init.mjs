import fs from "node:fs";
import path from "node:path";
import { safeWrite, safeWriteAgent, ensureDir } from "./utils.mjs";
import { generateTasksBase, generateProjectBase, generateNowMd, generateStateMd, generateAgentIndexMd } from "./templates.mjs";
export function cmdInit(options) {
  const { projectRoot, vaultRoot, projectId, paths, dryRun, force } = options;
  if (!vaultRoot) throw new Error("Vault root not found. Set OBSIDIAN_VAULT or pass --vault");
  ensureDir(paths.base);
  ensureDir(paths.humanDir);
  ensureDir(paths.humanDecisionsDir);
  ensureDir(paths.agentDir);
  ensureDir(paths.tasksDir);
  ensureDir(paths.memoryDir);
  ensureDir(paths.sessionsDir);
  ensureDir(paths.knowledgeDir);
  ensureDir(paths.proposalsDir);
  ensureDir(paths.reportsDir);
  if (!fs.existsSync(paths.tasksBase) || force) safeWriteAgent(paths.tasksBase, generateTasksBase(projectId), dryRun, paths);
  const projBase = path.join(paths.base, "PROJECT.base");
  if (!fs.existsSync(projBase) || force) safeWriteAgent(projBase, generateProjectBase(projectId), dryRun, paths);
  if (!fs.existsSync(paths.nowFile) || force) safeWriteAgent(paths.nowFile, generateNowMd(projectId), dryRun, paths);
  if (!fs.existsSync(paths.stateFile) || force) safeWriteAgent(paths.stateFile, generateStateMd(projectId), dryRun, paths);
  if (!fs.existsSync(paths.knowledgeIndex) || force) safeWriteAgent(paths.knowledgeIndex, generateAgentIndexMd(projectId), dryRun, paths);
  const agentsFile = path.join(projectRoot, "AGENTS.md");
  if (!fs.existsSync(agentsFile)) {
    const b1 = "# AGENTS.md\\n\\n- Project: " + projectId + "\\n- Vault: Projects/" + projectId + "/\\n- HUMAN (Read-Only): Projects/" + projectId + "/HUMAN/\\n";
    const b2 = "- AGENT (Read-Write): Projects/" + projectId + "/AGENT/\\n- Security Rule: Never modify HUMAN/. It is owned exclusively by the human. Propose changes in AGENT/proposals/.\\n";
    const b3 = "- Context: Run project context brief\\n- Tasks: See AGENT/TASKS.base or run project status\\n";
    safeWrite(agentsFile, b1 + b2 + b3, dryRun);
  }
  const projIdFile = path.join(projectRoot, ".project-id");
  if (!fs.existsSync(projIdFile) || force) safeWrite(projIdFile, projectId + "\\n", dryRun);
  return { success: true, base: paths.base, projectId };
}
