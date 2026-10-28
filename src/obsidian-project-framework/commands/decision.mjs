import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { assertWithin, ensureDir, updateNote, wikiLink } from '../utils.mjs';
import { findTask, refreshIndexes } from '../task-store.mjs';
import { listDecisions } from '../decisions-store.mjs';

export function cmdDecisionRecord(options) {
  const { paths, title, summary, source } = options;
  if (!summary?.trim() || !source?.trim()) throw new Error('A decision requires --summary and --source with the actual user decision and its source');
  const taskIds = [...new Set([options.taskId, ...(options.related || [])].filter(Boolean))].sort();
  if (!taskIds.length) throw new Error('Specify the task where the user made this decision: --task TASK-ID');
  for (const id of taskIds) findTask(paths, id);
  const decisions = listDecisions(paths);
  const previous = options.supersedes ? decisions.find(item => item.properties.id === options.supersedes) : null;
  if (options.supersedes && !previous) throw new Error(`Decision not found: ${options.supersedes}`);
  if (options.decidedAt && (!/^\d{4}-\d{2}-\d{2}$/.test(options.decidedAt) || Number.isNaN(Date.parse(options.decidedAt)) || new Date(options.decidedAt).toISOString().slice(0, 10) !== options.decidedAt)) {
    throw new Error('--decided-at must be a valid YYYY-MM-DD date');
  }
  const evidence = { title, summary, source, task_ids: taskIds, supersedes: options.supersedes || null, decided_at: options.decidedAt || null };
  const evidenceKey = createHash('sha256').update(JSON.stringify(evidence)).digest('hex');
  const key = createHash('sha256').update(options.key || evidenceKey).digest('hex');
  const existing = decisions.find(item => item.properties.request_key === key);
  if (existing) {
    if (existing.properties.evidence_key !== evidenceKey) throw new Error('Decision is immutable. Record a new decision with a new key and --supersedes; do not alter the original.');
    refreshIndexes(options);
    return { success: true, unchanged: true, decisionId: existing.properties.id, filePath: existing.file };
  }
  const now = new Date().toISOString();
  const decisionId = 'DEC-' + key.slice(0, 16);
  // File name carries the actual decision date; the recording time stays in recorded_at.
  const filePath = path.join(paths.decisionsDir, `${options.decidedAt || now.slice(0, 10)}_${decisionId}.md`);
  const content = updateNote(`\n# ${title}\n\n## Решение пользователя\n${summary}\n\n## Источник подтверждения\n${source.trim()}\n\nДата решения: ${options.decidedAt || now.slice(0, 10)}. Записано: ${now}.\n\n## Задачи\n${taskIds.map(id => '- ' + id).join('\n')}\n\n## История\n${previous ? 'Заменяет ' + wikiLink(previous.file, paths, previous.properties.id) + '. Оригинал не изменяется.' : 'Первичная запись.'}\n`, {
    id: decisionId, type: 'decision', ...evidence, decided_at: options.decidedAt || now, recorded_at: now,
    approved_at: options.decidedAt || now, approved_by: 'user', approval_source: source, review: 'approved',
    tags: ['решения'], request_key: key, evidence_key: evidenceKey,
  });
  assertWithin(paths.base, paths.vaultRoot);
  assertWithin(filePath, paths.decisionsDir);
  assertWithin(filePath, paths.base);
  if (fs.existsSync(filePath)) throw new Error(`Decision file already exists: ${filePath}`);
  if (!options.dryRun) {
    ensureDir(paths.decisionsDir);
    // Exclusive creation: decisions can only be added, never replaced.
    fs.writeFileSync(filePath, content, { encoding: 'utf8', flag: 'wx' });
  }
  refreshIndexes(options);
  return { success: true, dryRun: Boolean(options.dryRun), decisionId, filePath };
}
