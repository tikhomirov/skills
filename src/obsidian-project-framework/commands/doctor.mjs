import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { readStatuses } from '../statuses.mjs';
import { assertWithin, markdownFiles, readNote } from '../utils.mjs';
import { listTasks, taskFilename } from '../task-store.mjs';

export function cmdDoctor({ paths }) {
  const checks = [];
  const check = (name, ok) => checks.push({ name, ok: Boolean(ok) });
  check('Project directory exists', fs.existsSync(paths.base));
  for (const key of ['agentsMd', 'templatesDir', 'attachmentsDir', 'serviceDir', 'tasksDir', 'archiveIndex', 'archiveBase', 'tasksBase', 'statusesFile', 'decisionsDir', 'memoryDir', 'nowFile', 'stateFile', 'sessionsDir', 'knowledgeDir', 'reportsDir', 'projectMap', 'decisionsTimeline']) {
    check(`${key} exists`, fs.existsSync(paths[key]));
  }
  try { assertWithin(paths.base, paths.vaultRoot); }
  catch (error) { check(error.message, false); return { allOk: false, checks }; }
  for (const key of ['HUMAN', 'AGENT', 'Agents', 'Memory', 'Knowledge', 'Отчеты']) {
    check(`No obsolete root directory: ${key}`, !fs.existsSync(path.join(paths.base, key)));
  }
  let statuses;
  try { statuses = readStatuses(paths); check('_statuses.md is valid', true); }
  catch (error) { check(error.message, false); return { allOk: false, checks }; }
  if (fs.existsSync(paths.tasksBase)) {
    try {
      const board = parse(fs.readFileSync(paths.tasksBase, 'utf8'));
      const view = board?.views?.find(view => view.type === 'kanban');
      check('Native Kanban view configured', view?.groupBy?.property === 'note.status');
      check('Kanban columns match _statuses.md', JSON.stringify(view?.groupOrder) === JSON.stringify(statuses.map(status => status.id)));
      check('Kanban task filter configured', Array.isArray(board?.filters?.and) && board.filters.and.includes('type == "task"') && board.filters.and.includes(`file.inFolder(${JSON.stringify(path.relative(paths.vaultRoot, paths.tasksDir).split(path.sep).join('/'))})`));
    } catch (error) { check(`Kanban YAML: ${error.message}`, false); }
  }
  const tasks = listTasks(paths);
  for (const task of tasks) {
    const props = task.properties;
    const status = statuses.find(item => item.id === props.status);
    const validStatus = Boolean(status);
    check(`${task.id}: status`, validStatus);
    check(`${task.id}: required fields`, ['id', 'title', 'summary', 'status_changed', 'updated', 'created'].every(key => props[key]));
    check(`${task.id}: properties`, Array.isArray(props.related) && Array.isArray(props.depends_on) && Array.isArray(props.sources));
    check(`${task.id}: tags`, Array.isArray(props.tags) && props.tags.includes('задачи') && props.tags.includes(`статус/${props.status}`));
    check(`${task.id}: filename`, validStatus && /^\d{4}-\d{2}-\d{2}$/.test(props.status_changed || '') && path.basename(task.file) === taskFilename(task.id, props.status, props.status_changed));
    if (status?.role === 'done' && props.completion_origin !== 'board') check(`${task.id}: report`, props.knowledge_sync === 'synced' && Boolean(props.report) && fs.existsSync(path.join(paths.reportsDir, task.id + '.md')));
  }
  for (const file of markdownFiles(paths.decisionsDir)) {
    const props = readNote(fs.readFileSync(file, 'utf8')).properties;
    check(`${path.basename(file)}: decision approved by user`, props.review === 'approved' && props.approved_by && props.approved_at && props.approval_source);
    check(`${path.basename(file)}: decision task IDs`, Array.isArray(props.task_ids) && props.task_ids.length > 0 && props.task_ids.every(id => tasks.some(task => task.id === id)));
  }
  for (const file of markdownFiles(paths.base)) {
    const content = fs.readFileSync(file, 'utf8');
    for (const match of content.matchAll(/\[\[([^\]|#]+)[^\]]*\]\]/g)) {
      const target = match[1];
      if (!/TASK-\d+/.test(target)) continue;
      const name = target.endsWith('.md') ? target : target + '.md';
      const candidates = [path.resolve(paths.vaultRoot, name), path.resolve(path.dirname(file), name), path.resolve(paths.base, name), path.join(paths.tasksDir, path.basename(name))];
      check(`${path.relative(paths.base, file)}: task link ${target}`, candidates.some(candidate => fs.existsSync(candidate)));
    }
  }
  return { allOk: checks.every(item => item.ok), checks };
}
