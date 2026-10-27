import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { safeWriteAgent, ensureDir, getGitHead, assertAgentWritable } from "./utils.mjs";
export function cmdKnowledgeSearch(options) {
  const { paths, query } = options; const results = [];
  function searchDir(dir, zone) {
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) searchDir(full, zone);
      else if (f.endsWith(".md")) {
        const content = fs.readFileSync(full, "utf8");
        if (f.toLowerCase().includes(query.toLowerCase()) || content.toLowerCase().includes(query.toLowerCase())) {
          results.push({ zone, file: path.relative(paths.base, full), fullPath: full, matches: f });
        }
      }
    }
  }
  searchDir(paths.humanDir, "HUMAN");
  searchDir(paths.knowledgeDir, "AGENT");
  return { query, results, count: results.length };
}
export function cmdKnowledgeSync(options) {
  const { paths, projectRoot, taskId, dryRun, force } = options;
  let activeTask = taskId;
  if (!activeTask && fs.existsSync(paths.nowFile)) {
    const m = fs.readFileSync(paths.nowFile, "utf8").match(/\[\[(TASK-\d+)\]\]/);
    if (m) activeTask = m[1];
  }
  if (!activeTask) throw new Error("No active task specified and none found in NOW.md. Usage: project knowledge sync <TASK-ID>");
  const taskFile = path.join(paths.tasksDir, activeTask + ".md");
  if (!fs.existsSync(taskFile)) throw new Error("Task file not found: " + activeTask);
  let taskContent = fs.readFileSync(taskFile, "utf8");
  const baseMatch = taskContent.match(/git_baseline:\s*([a-zA-Z0-9]+)/);
  const baseline = baseMatch ? baseMatch[1] : "HEAD";
  const currentHead = getGitHead(projectRoot);
  let diff = ""; let changedFiles = [];
  try {
    if (baseline !== "none" && baseline !== "initial") {
      diff = execSync("git diff " + baseline + " HEAD", { cwd: projectRoot, encoding: "utf8" });
    }
    const uncommitted = execSync("git diff HEAD", { cwd: projectRoot, encoding: "utf8" });
    diff = (diff + "\\n" + uncommitted).trim();
    const statusOut = execSync("git status --short", { cwd: projectRoot, encoding: "utf8" });
    changedFiles = statusOut.split("\\n").filter(Boolean).map(l => l.slice(3).trim());
  } catch (e) { diff = ""; }
  let conflicts = [];
  if (fs.existsSync(paths.humanArchMd)) {
    const archText = fs.readFileSync(paths.humanArchMd, "utf8");
    if (diff.includes("session") && archText.toLowerCase().includes("jwt")) {
      conflicts.push({ rule: "HUMAN/ARCHITECTURE.md mandates JWT", fact: "Code introduces session-based auth" });
    }
  }
  const nowIso = new Date().toISOString();
  let syncStatus = "synced";
  let proposalId = null;
  if (conflicts.length > 0) {
    syncStatus = "conflict";
    proposalId = "PROP-001";
    ensureDir(paths.proposalsDir);
    const propFile = path.join(paths.proposalsDir, proposalId + ".md");
    const p1 = "---\\nid: " + proposalId + "\\ntype: human-change-proposal\\nstatus: pending-human\\ntask: " + activeTask + "\\ntarget: HUMAN/ARCHITECTURE.md\\ncreated: " + nowIso + "\\n---\\n\\n";
    const p2 = "# Proposal: " + proposalId + "\\n\\n## Описание расхождения\\nОбнаружено противоречие кода с нормативным документом HUMAN/ARCHITECTURE.md.\\n\\n## Действие от человека\\nПожалуйста, утвердите предложение или скорректируйте архитектуру вручную.\\n";
    safeWriteAgent(propFile, p1 + p2, dryRun, paths);
  }
  taskContent = taskContent.replace(/knowledge_sync:\s*.*$/m, "knowledge_sync: " + syncStatus);
  taskContent = taskContent.replace(/updated:\s*.*$/m, "updated: " + nowIso);
  const evidence = "\\n- " + nowIso + ": Knowledge Sync Evidence: Baseline: " + baseline + " -> Head: " + currentHead + ". Changed files: [" + changedFiles.join(", ") + "]. Checked HUMAN & AGENT. Status: " + syncStatus + (proposalId ? " (Proposal: " + proposalId + ")" : "") + "\\n";
  if (taskContent.includes("## Журнал реализации")) {
    taskContent = taskContent.replace(/## Журнал реализации/i, "## Журнал реализации" + evidence);
  }
  safeWriteAgent(taskFile, taskContent, dryRun, paths);
  return { success: true, taskId: activeTask, syncStatus, baseline, currentHead, conflicts, proposalId };
}
