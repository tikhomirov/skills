import fs from "node:fs";
import path from "node:path";
import { safeWrite, ensureDir } from "./utils.mjs";
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
  safeWrite(filePath, content, dryRun);
  return { success: true, taskId, filePath };
}
export function cmdTaskStart(options) {
  const { paths, taskId, dryRun } = options;
  const filePath = path.join(paths.tasksDir, taskId + ".md");
  if (!fs.existsSync(filePath)) throw new Error("Task file not found: " + taskId);
  let content = fs.readFileSync(filePath, "utf8");
  content = content.replace(/status:\s*backlog/i, "status: in-progress");
  content = content.replace(/updated:\s*.*$/m, "updated: " + new Date().toISOString());
  safeWrite(filePath, content, dryRun);
  if (fs.existsSync(paths.nowFile)) {
    let nowText = fs.readFileSync(paths.nowFile, "utf8");
    nowText = nowText.replace(/\*\*Текущая задача:\*\*.*$/m, "**Текущая задача:** [[" + taskId + "]]");
    nowText = nowText.replace(/\*\*Статус:\*\*.*$/m, "**Статус:** in-progress");
    nowText = nowText.replace(/\*\*Последнее обновление:\*\*.*$/m, "**Последнее обновление:** " + new Date().toISOString());
    safeWrite(paths.nowFile, nowText, dryRun);
  }
  return { success: true, taskId, status: "in-progress" };
}
export function cmdTaskComplete(options) {
  const { paths, taskId, dryRun, force } = options;
  const filePath = path.join(paths.tasksDir, taskId + ".md");
  if (!fs.existsSync(filePath)) throw new Error("Task file not found: " + taskId);
  let content = fs.readFileSync(filePath, "utf8");
  const isSynced = /knowledge_sync:\s*(synced|not-required)/i.test(content);
  if (!isSynced && !force) {
    throw new Error("Cannot complete task " + taskId + ": knowledge_sync is pending or failed. Run `project knowledge sync " + taskId + "` first, or use --force.");
  }
  content = content.replace(/status:\s*in-progress/i, "status: done");
  content = content.replace(/updated:\s*.*$/m, "updated: " + new Date().toISOString());
  safeWrite(filePath, content, dryRun);
  if (fs.existsSync(paths.nowFile)) {
    let nowText = fs.readFileSync(paths.nowFile, "utf8");
    nowText = nowText.replace(/\*\*Текущая задача:\*\*.*$/m, "**Текущая задача:** (нет активной задачи)");
    nowText = nowText.replace(/\*\*Статус:\*\*.*$/m, "**Статус:** idle");
    nowText = nowText.replace(/\*\*Последнее обновление:\*\*.*$/m, "**Последнее обновление:** " + new Date().toISOString());
    safeWrite(paths.nowFile, nowText, dryRun);
  }
  return { success: true, taskId, status: "done" };
}
