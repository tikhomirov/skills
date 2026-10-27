import fs from 'node:fs';
import path from 'node:path';
import { estimateTokens, markdownFiles, moduleDirectories } from '../utils.mjs';
import { activeTaskId, findTask } from '../task-store.mjs';

export function cmdContext({ paths, projectRoot, mode = 'brief', tokenBudget = 4000, taskId, topic }) {
  const sections = [];
  const seen = new Set();
  const add = (file, title) => {
    if (!fs.existsSync(file) || seen.has(path.resolve(file))) return;
    seen.add(path.resolve(file));
    sections.push({ title, content: fs.readFileSync(file, 'utf8') });
  };
  add(path.join(projectRoot, 'AGENTS.md'), 'Правила репозитория');
  add(paths.agentsMd, 'Правила и архитектура проекта');
  add(paths.statusesFile, '_statuses.md — допустимые статусы и порядок колонок');
  add(paths.nowFile, '_agents/Memory/NOW.md');
  if (mode !== 'brief') {
    add(paths.architectureMd, 'Архитектура.md');
    add(paths.stateFile, '_agents/Memory/STATE.md');
  }
  if (mode === 'task') {
    const id = taskId || activeTaskId(paths);
    if (!id) throw new Error('Specify --task TASK-ID or start a task');
    const task = findTask(paths, id);
    add(task.file, `Задача ${id}`);
  }
  if (mode === 'topic') {
    if (!topic?.trim()) throw new Error('Topic context requires --topic');
    for (const dir of [...moduleDirectories(paths), paths.decisionsDir, paths.knowledgeDir]) {
      for (const file of markdownFiles(dir)) {
        const text = fs.readFileSync(file, 'utf8');
        if ((file + '\n' + text).toLocaleLowerCase().includes(topic.toLocaleLowerCase())) add(file, path.relative(paths.base, file));
      }
    }
  }
  if (mode === 'full') {
    const sessions = markdownFiles(paths.sessionsDir).sort().reverse();
    if (sessions[0]) add(sessions[0], 'Последняя сессия');
  }
  let output = '', tokenCount = 0, included = 0;
  for (const section of sections) {
    const block = `\n=== ${section.title} ===\n${section.content.trim()}\n`;
    const tokens = estimateTokens(block);
    if (tokenCount + tokens > tokenBudget) break;
    output += block; tokenCount += tokens; included++;
  }
  const truncated = included < sections.length;
  return { output: output.trim(), tokenCount, truncated, sectionsCount: included, totalSections: sections.length,
    ...(truncated ? { warning: 'Token budget exceeded; required context may be missing. Increase --token-budget.' } : {}) };
}
