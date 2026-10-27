import fs from 'node:fs';
import { listTasks } from '../task-store.mjs';

export function cmdStatus({ paths, projectId }) {
  const tasks = listTasks(paths);
  const counts = {};
  for (const task of tasks) counts[task.properties.status] = (counts[task.properties.status] || 0) + 1;
  return { projectId, taskCount: tasks.length, counts,
    now: fs.existsSync(paths.nowFile) ? fs.readFileSync(paths.nowFile, 'utf8').trim() : 'NOW.md отсутствует' };
}
