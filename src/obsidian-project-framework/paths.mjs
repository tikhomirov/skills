import fs from 'node:fs';
import path from 'node:path';

export function getProjectPaths(vaultRoot, projectId) {
  const vault = path.resolve(vaultRoot);
  if (!/^[\p{L}\p{N}_ .-]+$/u.test(projectId) || ['.', '..'].includes(projectId)) {
    throw new Error('Invalid project ID');
  }
  const projects = ['Projects', 'Проекты'].includes(path.basename(vault))
    ? vault
    : path.join(vault, fs.existsSync(path.join(vault, 'Projects')) ? 'Projects'
      : fs.existsSync(path.join(vault, 'Проекты')) ? 'Проекты' : 'Projects');
  const base = path.join(projects, projectId);
  const agentDir = path.join(base, '_agents');
  if (fs.existsSync(path.join(base, 'Tasks')) && fs.existsSync(path.join(base, 'Задачи'))) {
    throw new Error('Both Tasks/ and Задачи/ exist; explicitly choose and merge the task folders before continuing.');
  }
  const tasksDir = path.join(base, fs.existsSync(path.join(base, 'Задачи')) && !fs.existsSync(path.join(base, 'Tasks')) ? 'Задачи' : 'Tasks');
  return {
    vaultRoot: vault, base, agentDir,
    agentsMd: path.join(base, 'AGENTS.md'),
    statusesFile: path.join(base, '_statuses.md'),
    architectureMd: path.join(base, 'Архитектура.md'),
    templatesDir: path.join(base, '_шаблоны'),
    attachmentsDir: path.join(base, '_вложения'),
    serviceDir: path.join(base, '_служебное'),
    tasksDir,
    archiveDir: path.join(tasksDir, '_archive'),
    archiveIndex: path.join(tasksDir, '_archive', '_INDEX.md'),
    archiveBase: path.join(tasksDir, '_archive', '_Архив.base'),
    tasksBase: path.join(tasksDir, '_Задачи.base'),
    decisionsDir: path.join(base, 'Решения'),
    modulesDir: path.join(base, 'Модули'),
    memoryDir: path.join(agentDir, 'Memory'),
    nowFile: path.join(agentDir, 'Memory', 'NOW.md'),
    stateFile: path.join(agentDir, 'Memory', 'STATE.md'),
    sessionsDir: path.join(agentDir, 'Memory', 'sessions'),
    knowledgeDir: path.join(agentDir, 'Knowledge'),
    knowledgeIndex: path.join(agentDir, 'Knowledge', '_INDEX.md'),
    reportsDir: path.join(agentDir, 'Reports'),
    projectMap: path.join(agentDir, 'Knowledge', 'Карта проекта.md'),
    decisionsTimeline: path.join(agentDir, 'Knowledge', 'Решения — таймлайн.md'),
  };
}
