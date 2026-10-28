import fs from 'node:fs';
import path from 'node:path';
import { findTask, listTasks, renameTask, refreshIndexes, taskFilename } from '../task-store.mjs';
import { firstStatus, getStatus, isFinishedRole } from '../statuses.mjs';
import { updateNote } from '../utils.mjs';

// Archive moves a finished card to _archive/<year>/. If _statuses.md has a status with role archive,
// the card gets that status on archive and returns to the first done status on restore.
export function cmdTaskArchive(options) {
  const { paths } = options;
  const task = findTask(paths, options.taskId);
  const archived = task.file.startsWith(paths.archiveDir + path.sep);
  const restore = options.restore;
  if (archived === !restore) return { success: true, unchanged: true, filePath: task.file };
  const role = getStatus(paths, task.properties.status).role;
  if (!restore && !isFinishedRole(role)) throw new Error('Only completed tasks can be archived');
  const now = new Date().toISOString();
  const archiveStatus = firstStatus(paths, 'archive');
  let status = task.properties.status;
  if (!restore && archiveStatus && role === 'done') status = archiveStatus;
  if (restore && role === 'archive') status = firstStatus(paths, 'done');
  const changes = { archived: !restore, archived_at: restore ? null : now };
  let name = path.basename(task.file);
  if (status !== task.properties.status) {
    const date = now.slice(0, 10);
    const tags = Array.isArray(task.properties.tags) ? task.properties.tags : [];
    Object.assign(changes, { status, status_changed: date, updated: now,
      tags: [...new Set(['задачи', ...tags.filter(tag => !String(tag).startsWith('статус/')), `статус/${status}`])] });
    name = taskFilename(task.id, status, date);
  }
  const filePath = restore ? path.join(paths.tasksDir, name) : path.join(paths.archiveDir, now.slice(0, 4), name);
  let content = updateNote(task.content, changes);
  if (status !== task.properties.status) content += `\n- ${now}: статус ${task.properties.status} → ${status}.\n`;
  renameTask(task, filePath, content, options);
  refreshIndexes(options);
  return { success: true, filePath, archived: !restore, status };
}
