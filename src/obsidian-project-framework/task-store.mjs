import fs from 'node:fs';
import path from 'node:path';
import { isFinishedRole, readStatuses } from './statuses.mjs';
import { generateTasksBase, tasksBaseIsCurrent } from './templates.mjs';
import { refreshDecisionTimeline } from './decisions-store.mjs';
import { assertWithin, isAgentWritable, markdownFiles, readNote, wikiLink, writeProject } from './utils.mjs';

export function listTasks(paths, includeArchived = false) {
  if (!fs.existsSync(paths.tasksDir)) return [];
  const tasks = [];
  const ids = new Set();
  const names = fs.readdirSync(paths.tasksDir, { recursive: includeArchived }).sort();
  for (const name of names) {
    if (!/^TASK-\d+.*\.md$/.test(path.basename(name))) continue;
    const file = path.join(paths.tasksDir, name);
    assertWithin(file, paths.base);
    const content = fs.readFileSync(file, 'utf8');
    const { properties, body } = readNote(content);
    const id = properties.id || path.basename(name).match(/^(TASK-\d+)/)[1];
    if (!/^TASK-\d+$/.test(id)) throw new Error(`Invalid task ID in ${name}`);
    if (ids.has(id)) throw new Error(`Duplicate task ID: ${id}`);
    ids.add(id);
    tasks.push({ id, file, content, properties, body });
  }
  return tasks.sort((a, b) => Number(a.id.slice(5)) - Number(b.id.slice(5)));
}
export function findTask(paths, id) {
  const task = listTasks(paths, true).find(item => item.id === id);
  if (!task) throw new Error(`Task not found: ${id}`);
  return task;
}
export function taskFilename(id, status, date) {
  if (!/^TASK-\d+$/.test(id) || !/^[a-z][a-z0-9-]*$/.test(status) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Invalid task filename components');
  }
  return `${id}_${status}_${date}.md`;
}
export function refreshIndexes(options) {
  if (options.dryRun) return;
  const tasks = listTasks(options.paths);
  const archived = listTasks(options.paths, true).filter(task => task.file.startsWith(options.paths.archiveDir + path.sep));
  writeProject(options.paths.archiveIndex, '# Архив задач\n\n| Задача | Название | Статус |\n|---|---|---|\n' + archived.map(task => `| ${wikiLink(task.file, options.paths, task.id)} | ${String(task.properties.title).replaceAll('|', ' ')} | ${task.properties.status} |`).join('\n') + '\n', options);
  const statuses = readStatuses(options.paths);
  const boardFolder = path.relative(options.paths.vaultRoot, options.paths.tasksDir).split(path.sep).join('/');
  // Keep a board that Obsidian re-saved (e.g. `status` instead of `note.status`); regenerate only a missing or outdated one.
  const board = fs.existsSync(options.paths.tasksBase) ? fs.readFileSync(options.paths.tasksBase, 'utf8') : null;
  if (board === null || !tasksBaseIsCurrent(board, boardFolder, statuses)) writeProject(options.paths.tasksBase, generateTasksBase(path.basename(options.paths.base), boardFolder, statuses), options);
  writeProject(options.paths.archiveBase, `filters:\n  and:\n    - 'file.inFolder(${JSON.stringify(path.relative(options.paths.vaultRoot, options.paths.archiveDir).split(path.sep).join('/'))})'\n    - 'type == "task"'\nviews:\n  - type: table\n    name: Архив задач\n    order:\n      - id\n      - title\n      - status\n      - archived_at\n`, options);
  refreshDecisionTimeline(options, listTasks(options.paths, true));
  const focus = tasks.filter(task => !isFinishedRole(statuses.find(status => status.id === task.properties.status)?.role));
  const oldState = fs.existsSync(options.paths.stateFile) ? fs.readFileSync(options.paths.stateFile, 'utf8') : '';
  const section = focus.map(task => `- ${wikiLink(task.file, options.paths, task.id)}: ${task.properties.title} — ${task.properties.status}`).join('\n') || 'Нет открытых задач.';
  const state = oldState.includes('## Задачи\n')
    ? oldState.replace(/(## Задачи\n)[\s\S]*?(?=\n## |$)/, `$1${section}\n`)
    : `# STATE\n\n## Задачи\n${section}\n\n${oldState}`;
  writeProject(options.paths.stateFile, state, options);
}
export function renameTask(task, newFile, content, options) {
  const { paths } = options;
  assertWithin(task.file, paths.base);
  assertWithin(newFile, paths.base);
  if (newFile !== task.file && fs.existsSync(newFile)) throw new Error(`Destination already exists: ${newFile}`);
  const oldRelative = path.relative(paths.vaultRoot, task.file).split(path.sep).join('/').replace(/\.md$/, '');
  const newRelative = path.relative(paths.vaultRoot, newFile).split(path.sep).join('/').replace(/\.md$/, '');
  const oldStem = path.basename(task.file, '.md');
  const newStem = path.basename(newFile, '.md');
  const updates = [];
  for (const file of markdownFiles(paths.base)) {
    // Module documentation and historical decisions must never be rewritten on a task rename.
    if (!isAgentWritable(file, paths)) continue;
    const original = file === task.file ? content : fs.readFileSync(file, 'utf8');
    const updated = original.replace(/(!?\[\[)([^\]|#]+)([^\]]*\]\])/g, (match, open, target, tail) => {
      if (target === oldRelative || target === oldRelative + '.md') return open + newRelative + (target.endsWith('.md') ? '.md' : '') + tail;
      const slash = target.lastIndexOf('/');
      const name = target.slice(slash + 1);
      if (name !== oldStem && name !== oldStem + '.md') return match;
      const prefix = target.slice(0, slash + 1);
      const allowed = ['', 'Tasks/', 'Задачи/', path.relative(paths.vaultRoot, paths.tasksDir).split(path.sep).join('/') + '/'];
      if (!allowed.includes(prefix)) return match;
      return open + prefix + newStem + (name.endsWith('.md') ? '.md' : '') + tail;
    });
    if (file === task.file || original !== updated) {
      assertWithin(file, paths.base);
      updates.push([file === task.file ? newFile : file, updated]);
    }
  }
  if (options.dryRun) return;
  // Keep the original until the new card is safely written.
  for (const [file, text] of updates) writeProject(file, text, options);
  if (newFile !== task.file) fs.unlinkSync(task.file);
}
export function activeTaskId(paths) {
  if (!fs.existsSync(paths.nowFile)) return null;
  return fs.readFileSync(paths.nowFile, 'utf8').match(/TASK-\d+/)?.[0] || null;
}
