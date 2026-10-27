import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { getGitHead, markdownFiles, readNote, updateNote, writeProject } from '../utils.mjs';

export function cmdCheckpoint(options) {
  const { paths, projectRoot, message = 'Checkpoint' } = options;
  const focus = fs.existsSync(paths.nowFile) ? fs.readFileSync(paths.nowFile, 'utf8') : 'NOW.md отсутствует.';
  const state = fs.existsSync(paths.stateFile) ? fs.readFileSync(paths.stateFile, 'utf8') : 'STATE.md отсутствует.';
  const commit = getGitHead(projectRoot);
  const checkpointKey = createHash('sha256').update(JSON.stringify([message, focus, state, commit])).digest('hex');
  const existing = markdownFiles(paths.sessionsDir).find(file => readNote(fs.readFileSync(file, 'utf8')).properties.checkpoint_key === checkpointKey);
  if (existing) return { success: true, unchanged: true, sessionFile: existing, commit };
  const now = new Date().toISOString();
  const sessionFile = path.join(paths.sessionsDir, `session-${now.replace(/[:.]/g, '-')}-${checkpointKey.slice(0, 12)}.md`);
  const content = updateNote(`\n# Передача контекста — ${now}\n\n## Что сделано, что осталось и следующий шаг\n${message}\n\n## Git\n${commit || 'Нет коммита'}\n\n## Снимок NOW\n${focus}\n\n## Снимок STATE\n${state}\n`, {
    type: 'session', updated: now, tags: ['память'], checkpoint_key: checkpointKey,
  });
  writeProject(sessionFile, content, options);
  return { success: true, dryRun: Boolean(options.dryRun), sessionFile, commit };
}
