import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { getGitState, markdownFiles, readNote, updateNote, wikiLink, writeProject } from '../utils.mjs';
import { activeTaskId, findTask, refreshIndexes } from '../task-store.mjs';
import { getStatus } from '../statuses.mjs';
import { getDocumentState } from '../document-state.mjs';

export function cmdKnowledgeSearch({ paths, query }) {
  const needle = query.toLocaleLowerCase();
  const results = markdownFiles(paths.base).filter(file => !file.startsWith(paths.attachmentsDir + path.sep) && !file.startsWith(paths.serviceDir + path.sep))
    .filter(file => path.basename(file).toLocaleLowerCase().includes(needle) || fs.readFileSync(file, 'utf8').toLocaleLowerCase().includes(needle))
    .map(file => ({ file: path.relative(paths.base, file), fullPath: file }));
  return { query, results, count: results.length };
}
export function cmdKnowledgeSync(options) {
  const { paths, projectRoot, dryRun } = options;
  const taskId = options.taskId || activeTaskId(paths);
  if (!taskId) throw new Error('Specify TASK-ID or start a task first');
  const task = findTask(paths, taskId);
  if (getStatus(paths, task.properties.status).role !== 'active') throw new Error('Knowledge sync requires a task with role active from _statuses.md; record checks before moving to role done');
  if (!options.summary?.trim() || !options.checks?.trim()) throw new Error('Supply --summary and --checks with the actual result, documentation updates and check results');
  if (!['passed', 'not-required'].includes(options.verification)) throw new Error('Supply --verification passed|not-required; explain actual checks or why checks are not required');
  // Git failures must stop synchronization, never manufacture successful evidence.
  const baseline = task.properties.git_baseline;
  const gitState = getGitState(projectRoot, baseline);
  const { head, changedFiles } = gitState;
  const reportFile = path.join(paths.reportsDir, taskId + '.md');
  const documentState = getDocumentState(paths);
  const signature = createHash('sha256').update(JSON.stringify({
    summary: options.summary, checks: options.checks, verification: options.verification, gitState: gitState.key, documentState,
  })).digest('hex');
  if (fs.existsSync(reportFile)) {
    const previous = readNote(fs.readFileSync(reportFile, 'utf8')).properties;
    if (previous.sync_key === signature && task.properties.knowledge_sync === 'synced') {
      return { success: true, unchanged: true, taskId, syncStatus: 'synced', reportFile, changedFiles };
    }
  }
  const now = new Date().toISOString();
  const content = updateNote(`\n# Отчёт — ${taskId}\n\nЗадача: ${wikiLink(task.file, paths, taskId)}\n\n## Результат и документация\n${options.summary}\n\n## Проверки и результаты\n${options.checks}\n\n## Git\nBaseline: ${baseline || 'нет коммита'}. HEAD: ${head || 'нет коммита'}.\n\n## Изменённые пути\n${changedFiles.map(file => '- ' + JSON.stringify(file)).join('\n') || 'Нет изменений.'}\n\n## Ограничения\nЭто запись предоставленных агентом результатов, не автоматическая проверка семантики кода и не одобрение пользователя. Содержимое diff и секреты не копируются.\n`, {
    type: 'report', task: wikiLink(task.file, paths, taskId), summary: options.summary,
    status: 'recorded', verification: options.verification,
    updated: now, tags: ['отчеты', 'задачи'], sources: changedFiles, review: 'pending',
    git_baseline: baseline || null, git_head: head, git_state: gitState.key, document_state: documentState, sync_key: signature,
  });
  writeProject(reportFile, content, options);
  const taskWithResult = task.content.replace(/(## Результат\n)[\s\S]*?(?=\n## |$)/, (_match, heading) => `${heading}${options.summary}\n`);
  const updated = updateNote(taskWithResult, {
    knowledge_sync: 'synced', report: wikiLink(reportFile, paths, `Отчёт ${taskId}`), updated: now, review: 'pending',
  }) + `\n- ${now}: отчёт и результаты проверок — ${wikiLink(reportFile, paths, taskId)}.\n`;
  writeProject(task.file, updated, options);
  refreshIndexes(options);
  return { success: true, dryRun: Boolean(dryRun), taskId, syncStatus: 'synced', reportFile, changedFiles };
}
