import fs from "node:fs";
import path from "node:path";
import { safeWrite, ensureDir, getGitHead, getGitDiff } from "./utils.mjs";
export function cmdKnowledgeSearch(options) {
  const { paths, query } = options;
  const results = [];
  function searchDir(dir) {
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) searchDir(full);
      else if (f.endsWith(".md")) {
        const content = fs.readFileSync(full, "utf8");
        if (f.toLowerCase().includes(query.toLowerCase()) || content.toLowerCase().includes(query.toLowerCase())) {
          results.push({ file: path.relative(paths.base, full), fullPath: full, matches: f });
        }
      }
    }
  }
  searchDir(paths.knowledgeDir);
  return { query, results, count: results.length };
}
export function cmdKnowledgeSync(options) {
  const { paths, projectRoot, taskId, dryRun, force, markSynced = true } = options;
  let activeTask = taskId;
  if (!activeTask && fs.existsSync(paths.nowFile)) {
    const m = fs.readFileSync(paths.nowFile, "utf8").match(/\[\[(TASK-\d+)\]\]/);
    if (m) activeTask = m[1];
  }
  if (!activeTask) throw new Error("No active task specified and none found in NOW.md. Usage: project knowledge sync <TASK-ID>");
  const taskFile = path.join(paths.tasksDir, activeTask + ".md");
  if (!fs.existsSync(taskFile)) throw new Error("Task file not found: " + activeTask);
  const diff = getGitDiff(projectRoot);
  const commit = getGitHead(projectRoot);
  let taskContent = fs.readFileSync(taskFile, "utf8");
  const nowIso = new Date().toISOString();
  const syncEntry = "\\n- " + nowIso + ": Knowledge Sync checked against Git (" + commit + "). Status: " + (markSynced ? "synced" : "pending") + "\\n";
  if (markSynced) {
    taskContent = taskContent.replace(/knowledge_sync:\s*.*$/m, "knowledge_sync: synced");
  }
  taskContent = taskContent.replace(/updated:\s*.*$/m, "updated: " + nowIso);
  if (!taskContent.includes("Knowledge Sync checked")) {
    taskContent = taskContent.replace(/## Журнал реализации/i, "## Журнал реализации" + syncEntry);
  }
  safeWrite(taskFile, taskContent, dryRun);
  return { success: true, taskId: activeTask, commit, syncStatus: markSynced ? "synced" : "pending" };
}
