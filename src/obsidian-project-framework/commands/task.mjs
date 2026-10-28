import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { getGitHead, getGitState, readNote, updateNote, wikiLink, writeProject } from '../utils.mjs';
import { generateTaskTemplate } from '../templates.mjs';
import { firstStatus, getStatus, isFinishedRole, readStatuses } from '../statuses.mjs';
import { getDocumentState } from '../document-state.mjs';
import { listTasks, findTask, taskFilename, renameTask, refreshIndexes, activeTaskId } from '../task-store.mjs';

export function cmdTaskCreate(options) {
  const tasks = listTasks(options.paths, true);
  const requestKey = createHash('sha256').update(options.key || options.title.trim()).digest('hex');
  const existing = tasks.find(task => task.properties.request_key === requestKey);
  if (existing) return { success: true, unchanged: true, taskId: existing.id, filePath: existing.file };
  const number = Math.max(0, ...tasks.map(task => Number(task.id.slice(5)))) + 1;
  const taskId = `TASK-${String(number).padStart(3, '0')}`;
  const now = new Date().toISOString();
  const status = firstStatus(options.paths, 'backlog');
  const filePath = path.join(options.paths.tasksDir, taskFilename(taskId, status, now.slice(0, 10)));
  const resolveLinks = ids => ids.map(id => wikiLink(findTask(options.paths, id).file, options.paths, id));
  const related = resolveLinks(options.related || []);
  const dependsOn = resolveLinks(options.dependsOn || []);
  const content = updateNote(generateTaskTemplate(taskId, options.title, { ...options, status, related, dependsOn, now }), { request_key: requestKey });
  writeProject(filePath, content, options);
  refreshIndexes(options);
  return { success: true, dryRun: Boolean(options.dryRun), taskId, filePath };
}

export function cmdTaskStatus(options) {
  const { paths, taskId, status, projectRoot } = options;
  const task = findTask(paths, taskId);
  const role = getStatus(paths, status).role;
  const filenameStatus = path.basename(task.file).match(/^TASK-\d+_([a-z][a-z0-9-]*)_\d{4}-\d{2}-\d{2}\.md$/)?.[1];
  const previous = options.reconcile ? filenameStatus || task.properties.status : task.properties.status;
  const tags = Array.isArray(task.properties.tags) ? task.properties.tags : [];
  const date = task.properties.status_changed;
  const consistent = /^\d{4}-\d{2}-\d{2}$/.test(date || '') && path.basename(task.file) === taskFilename(taskId, status, date)
    && tags.includes('задачи') && tags.includes(`статус/${status}`) && !tags.some(tag => String(tag).startsWith('статус/') && tag !== `статус/${status}`);
  if (previous === status && consistent) return { success: true, unchanged: true, taskId, status, filePath: task.file };
  const previousRole = readStatuses(paths).find(item => item.id === previous)?.role;
  if (role === 'active' && !options.reconcile) {
    for (const link of task.properties.depends_on || []) {
      const dependency = String(link).match(/TASK-\d+/)?.[0];
      if (!dependency || !isFinishedRole(getStatus(paths, findTask(paths, dependency).properties.status).role)) throw new Error(`Unfinished dependency: ${link}`);
    }
  }
  if (role === 'archive' && !options.reconcile && !isFinishedRole(previousRole)) {
    throw new Error(`Only completed tasks can get an archive status: complete ${taskId} first`);
  }
  if (role === 'done' && !options.reconcile) {
    if (task.properties.knowledge_sync !== 'synced' || !task.properties.report) {
      throw new Error(`Cannot complete ${taskId}: run obsidian-project-framework knowledge sync ${taskId} --summary "result" --checks "actual checks and results" --verification passed`);
    }
    const reportFile = path.join(paths.reportsDir, taskId + '.md');
    if (!fs.existsSync(reportFile)) throw new Error('Task report is missing');
    const report = readNote(fs.readFileSync(reportFile, 'utf8'));
    if (!['passed', 'not-required'].includes(report.properties.verification)) throw new Error('Report checks have not passed or been explicitly marked not required');
    if (report.properties.document_state !== getDocumentState(paths)) {
      throw new Error('Project documentation changed or the report predates document verification; repeat knowledge sync before completing the task');
    }
    if (report.properties.git_state !== getGitState(projectRoot, task.properties.git_baseline).key) {
      throw new Error('Code changed after the report was recorded; repeat checks and knowledge sync before completing the task');
    }
  }
  const now = new Date().toISOString();
  const statusDate = previous === status && /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? date : now.slice(0, 10);
  const filePath = path.join(paths.tasksDir, taskFilename(taskId, status, statusDate));
  const changes = {
    status, status_changed: statusDate, updated: now, review: 'pending',
    ...(options.reconcile && role === 'done' ? { completion_origin: 'board', verification_state: 'user-marked-review-required' } : {}),
    tags: [...new Set(['задачи', ...(Array.isArray(task.properties.tags) ? task.properties.tags : []).filter(tag => !String(tag).startsWith('статус/')), `статус/${status}`])],
  };
  if ((role === 'active' && previousRole !== 'active') || (isFinishedRole(previousRole) && !isFinishedRole(role))) {
    changes.git_baseline = getGitHead(projectRoot);
    changes.knowledge_sync = 'pending';
    changes.report = null;
  }
  const content = updateNote(task.content, changes) + `\n- ${now}: статус ${previous} → ${status}.\n`;
  renameTask(task, filePath, content, options);
  if (role === 'active' || activeTaskId(paths) === taskId) {
    const focused = role === 'active';
    const oldNow = fs.existsSync(paths.nowFile) ? fs.readFileSync(paths.nowFile, 'utf8') : '# NOW\n';
    const focus = `**Текущая задача:** ${focused ? wikiLink(filePath, paths, taskId) : 'нет'}\n**Статус:** ${focused ? status : 'idle'}\n**Последнее обновление:** ${now}`;
    const cleaned = oldNow.replace(/^\*\*(Текущая задача|Статус|Последнее обновление):\*\*.*\n?/gm, '');
    writeProject(paths.nowFile, `${focus}\n\n${cleaned.trim()}\n`, options);
  }
  refreshIndexes(options);
  return { success: true, dryRun: Boolean(options.dryRun), taskId, status, filePath };
}
export function cmdTaskSync(options) {
  const tasks = listTasks(options.paths);
  for (const task of tasks) {
    getStatus(options.paths, task.properties.status);
    cmdTaskStatus({ ...options, dryRun: true, reconcile: true, taskId: task.id, status: task.properties.status });
  }
  const results = tasks.map(task => cmdTaskStatus({ ...options, reconcile: true, taskId: task.id, status: task.properties.status }));
  refreshIndexes(options);
  return { success: true, dryRun: Boolean(options.dryRun), tasks: results };
}
export function cmdTaskStart(options) { return cmdTaskStatus({ ...options, status: firstStatus(options.paths, 'active') }); }
export function cmdTaskComplete(options) { return cmdTaskStatus({ ...options, status: firstStatus(options.paths, 'done') }); }
