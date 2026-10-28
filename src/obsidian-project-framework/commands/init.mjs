import fs from 'node:fs';
import path from 'node:path';
import { assertWithin, ensureDir, safeWrite, writeProject } from '../utils.mjs';
import { generateAgentsMd, generateTasksBase, tasksBaseIsCurrent, generateNowMd, generateStateMd, generateTaskTemplate, generateDocumentTemplate } from '../templates.mjs';
import { generateStatusDocument, readStatuses } from '../statuses.mjs';
import { listTasks, refreshIndexes } from '../task-store.mjs';

export function cmdInit(options) {
  const { paths, projectRoot, projectId, dryRun, force } = options;
  assertWithin(paths.base, paths.vaultRoot);
  const statuses = readStatuses(paths, { allowDefault: true });
  const unsupported = listTasks(paths).filter(task => !statuses.some(status => status.id === task.properties.status));
  if (unsupported.length) throw new Error('Unsupported task statuses would be hidden by the Kanban board: ' + unsupported.map(task => `${task.id}: ${task.properties.status}`).join(', ') + '. Add them to _statuses.md or explicitly migrate the tasks to the registered statuses first.');
  const directories = ['templatesDir', 'attachmentsDir', 'serviceDir', 'tasksDir', 'decisionsDir', 'reportsDir', 'memoryDir', 'sessionsDir', 'knowledgeDir'];
  for (const key of directories) {
    assertWithin(paths[key], paths.base);
    if (!dryRun) ensureDir(paths[key]);
  }
  const files = [
    [paths.agentsMd, generateAgentsMd(projectId)],
    [paths.statusesFile, generateStatusDocument()],
    [paths.nowFile, generateNowMd()], [paths.stateFile, generateStateMd()],
    [paths.tasksBase, generateTasksBase(projectId, path.relative(paths.vaultRoot, paths.tasksDir).split(path.sep).join('/'), statuses)],
    [paths.knowledgeIndex, '# Knowledge — карта знаний\n\n[[Карта проекта]] — навигация по подтверждённым пользователем модулям.\n[[Решения — таймлайн]] — история решений и связанных задач.\n'],
    [paths.projectMap, '# Карта проекта\n\n## Подтверждённые модули\nСначала спросить пользователя о составе и расположении модулей. API — возможный модуль, не обязательный раздел.\n\n## Код и документация\nПосле согласования добавить только ссылки на существующую документацию; не создавать и не менять её без явной просьбы.\n'],
    [path.join(paths.templatesDir, 'Задача.md'), generateTaskTemplate('TASK-000', 'Название задачи', { now: '2000-01-01T00:00:00.000Z', status: statuses.find(status => status.role === 'backlog').id })],
    ...Object.entries({ message: 'Сообщение', module: 'Модуль', api: 'API', decision: 'Решение', report: 'Отчет' })
      .map(([type, name]) => [path.join(paths.templatesDir, name + '.md'), generateDocumentTemplate(type)]),
  ];
  for (const [file, text] of files) {
    // --force may refresh generated navigation/templates, never overwrite project rules or memory.
    const generated = file === paths.tasksBase || file.startsWith(paths.templatesDir + path.sep);
    const boardOutdated = file === paths.tasksBase && fs.existsSync(file)
      && !tasksBaseIsCurrent(fs.readFileSync(file, 'utf8'), path.relative(paths.vaultRoot, paths.tasksDir).split(path.sep).join('/'), statuses);
    if (!fs.existsSync(file) || boardOutdated || (force && generated && file !== paths.tasksBase)) writeProject(file, text, options);
  }
  const repoAgents = path.join(projectRoot, 'AGENTS.md');
  if (!fs.existsSync(repoAgents)) {
    safeWrite(repoAgents, `# AGENTS.md — ${projectId}\n\nПроектная база: ${paths.base}\nСначала прочитать ${paths.agentsMd}, затем _agents/Memory/NOW.md и нужную карточку Tasks/ (или существующей Задачи/).\n\nАрхитектура кода и команды проверок: заполнить после исследования проекта, не выдумывать.\n`, dryRun, projectRoot);
  }
  const idFile = path.join(projectRoot, '.project-id');
  if (!fs.existsSync(idFile) || force) safeWrite(idFile, projectId + '\n', dryRun, projectRoot);
  refreshIndexes(options);
  return { success: true, dryRun: Boolean(dryRun), base: paths.base, projectId };
}
