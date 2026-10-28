import fs from 'node:fs';
import path from 'node:path';
import { markdownFiles, readNote, wikiLink, writeProject } from './utils.mjs';

export function listDecisions(paths) {
  // Generated navigation such as _INDEX.md is not a decision event.
  return markdownFiles(paths.decisionsDir).filter(file => !path.basename(file).startsWith('_')).map(file => ({ file, ...readNote(fs.readFileSync(file, 'utf8')) }))
    .sort((a, b) => String(a.properties.decided_at || a.properties.approved_at || '').localeCompare(String(b.properties.decided_at || b.properties.approved_at || '')) || a.file.localeCompare(b.file));
}
export function refreshDecisionTimeline(options, tasks) {
  if (options.dryRun) return;
  const lines = listDecisions(options.paths).map(decision => {
    const props = decision.properties;
    const taskLinks = (Array.isArray(props.task_ids) ? props.task_ids : []).map(id => {
      const task = tasks.find(item => item.id === id);
      return task ? wikiLink(task.file, options.paths, id) : id;
    }).join(', ') || 'не указаны';
    return `- ${props.decided_at || props.approved_at || 'Дата не указана'} — ${wikiLink(decision.file, options.paths, props.title || path.basename(decision.file, '.md'))}; задачи: ${taskLinks}`;
  });
  writeProject(options.paths.decisionsTimeline, '# Решения пользователя — таймлайн\n\nГенерируемая навигация. Исходные записи в Решения/ неизменяемы.\n\n' + (lines.join('\n') || 'Решений пока нет.') + '\n', options);
}
