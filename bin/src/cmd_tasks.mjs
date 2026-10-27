import fs from "node:fs";
import path from "node:path";
import { safeWriteAgent, ensureDir, getGitHead } from "./utils.mjs";
import { generateTaskTemplate } from "./templates.mjs";
import { TASK_STATUSES, KNOWLEDGE_SYNC_STATUSES } from "./constants.mjs";
export function getNextTaskId(tasksDir) {
  if (!fs.existsSync(tasksDir)) return "TASK-001";
  const files = fs.readdirSync(tasksDir).filter(f => f.endsWith(".md"));
  let max = 0;
  for (const f of files) {
    const m = f.match(/TASK-(\d+)/i);
    if (m) { const n = parseInt(m[1], 10); if (n > max) max = n; }
  }
  return "TASK-" + String(max + 1).padStart(3, "0");
}
export function cmdTaskCreate(options) {
  const { paths, title, priority, assignee, dryRun } = options;
  ensureDir(paths.tasksDir);
  const taskId = getNextTaskId(paths.tasksDir);
  const filePath = path.join(paths.tasksDir, taskId + ".md");
  const content = generateTaskTemplate(taskId, title, { priority, assignee });
  safeWriteAgent(filePath, content, dryRun, paths);
  return { success: true, taskId, filePath };
}
export function cmdTaskStart(options) {
  const { paths, taskId, projectRoot, dryRun } = options;
  const filePath = path.join(paths.tasksDir, taskId + ".md");
  if (!fs.existsSync(filePath)) throw new Error("Task file not found: " + taskId);
  const baseline = getGitHead(projectRoot);
  let content = fs.readFileSync(filePath, "utf8");
  content = content.replace(/status:\s*backlog/i, "status: in-progress");
  content = content.replace(/git_baseline:\s*.*$/m, "git_baseline: " + baseline);
  content = content.replace(/updated:\s*.*$/m, "updated: " + new Date().toISOString());
  safeWriteAgent(filePath, content, dryRun, paths);
  if (fs.existsSync(paths.nowFile)) {
    let nowText = fs.readFileSync(paths.nowFile, "utf8");
    nowText = nowText.replace(/\*\*Текущая задача:\*\*.*$/m, "**Текущая задача:** [[" + taskId + "]]");
    nowText = nowText.replace(/\*\*Статус:\*\*.*$/m, "**Статус:** in-progress");
    nowText = nowText.replace(/\*\*Git baseline:\*\*.*$/m, "**Git baseline:** " + baseline);
    nowText = nowText.replace(/\*\*Последнее обновление:\*\*.*$/m, "**Последнее обновление:** " + new Date().toISOString());
    safeWriteAgent(paths.nowFile, nowText, dryRun, paths);
  }
  return { success: true, taskId, status: "in-progress", baseline };
}
export function cmdTaskComplete(options) {
  const { paths, taskId, dryRun } = options;
  const filePath = path.join(paths.tasksDir, taskId + ".md");
  if (!fs.existsSync(filePath)) throw new Error("Task file not found: " + taskId);
  let content = fs.readFileSync(filePath, "utf8");
  const syncMatch = content.match(/knowledge_sync:\s*([a-zA-Z0-9-]+)/i);
  const syncStatus = syncMatch ? syncMatch[1].toLowerCase() : "pending-review";
  if (syncStatus === "conflict" || syncStatus === "pending-human" || syncStatus === "failed") {
    throw new Error("CANNOT COMPLETE TASK: Task " + taskId + " has unresolved Knowledge Sync status: " + syncStatus + ". Task completion is blocked.");
  }
  if (syncStatus !== "synced" && syncStatus !== "not-required") {
    throw new Error("CANNOT COMPLETE TASK: Task " + taskId + " requires verified knowledge_sync: synced. Run `project knowledge sync " + taskId + "` with evidence.");
  }
  if (!content.includes("Knowledge Sync Evidence:")) {
    throw new Error("CANNOT COMPLETE TASK: Task " + taskId + " does not contain verified Knowledge Sync Evidence in implementation log.");
  }
  content = content.replace(/status:\s*in-progress/i, "status: done");
  content = content.replace(/updated:\s*.*$/m, "updated: " + new Date().toISOString());
  safeWriteAgent(filePath, content, dryRun, paths);
  if (fs.existsSync(paths.nowFile)) {
    let nowText = fs.readFileSync(paths.nowFile, "utf8");
    nowText = nowText.replace(/\*\*Текущая задача:\*\*.*$/m, "**Текущая задача:** (нет активной задачи)");
    nowText = nowText.replace(/\*\*Статус:\*\*.*$/m, "**Статус:** idle");
    nowText = nowText.replace(/\*\*Последнее обновление:\*\*.*$/m, "**Последнее обновление:** " + new Date().toISOString());
    safeWriteAgent(paths.nowFile, nowText, dryRun, paths);
  }
  return { success: true, taskId, status: "done" };
}
