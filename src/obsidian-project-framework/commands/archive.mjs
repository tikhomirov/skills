import fs from 'node:fs';
import path from 'node:path';
import { findTask, listTasks, renameTask, refreshIndexes } from '../task-store.mjs';
import { getStatus } from '../statuses.mjs';
import { updateNote } from '../utils.mjs';

export function cmdTaskArchive(options) {
  const task = findTask(options.paths, options.taskId);
  const archived = task.file.startsWith(options.paths.archiveDir + path.sep);
  const restore = options.restore;
  if (archived === !restore) return { success: true, unchanged: true, filePath: task.file };
  if (!restore && getStatus(options.paths, task.properties.status).role !== 'done') throw new Error('Only completed tasks can be archived');
  const now = new Date().toISOString();
  const filePath = restore ? path.join(options.paths.tasksDir, path.basename(task.file))
    : path.join(options.paths.archiveDir, now.slice(0, 4), path.basename(task.file));
  const content = updateNote(task.content, { archived: !restore, archived_at: restore ? null : now });
  renameTask(task, filePath, content, options);
  refreshIndexes(options);
  return { success: true, filePath, archived: !restore };
}
