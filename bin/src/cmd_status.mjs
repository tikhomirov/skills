import fs from "node:fs";
import path from "node:path";
export function cmdStatus(options) {
  const { paths, projectId } = options;
  let nowContent = fs.existsSync(paths.nowFile) ? fs.readFileSync(paths.nowFile, "utf8").trim() : "(нет NOW.md)";
  let taskCount = 0;
  if (fs.existsSync(paths.tasksDir)) taskCount = fs.readdirSync(paths.tasksDir).filter(f => f.endsWith(".md")).length;
  return { projectId, taskCount, now: nowContent };
}
