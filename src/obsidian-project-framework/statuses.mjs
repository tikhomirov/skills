import fs from 'node:fs';
import { DEFAULT_STATUSES } from './constants.mjs';

export function generateStatusDocument() {
  return `# Статусы задач

| status | Название | Роль | Описание |
|---|---|---|---|
${DEFAULT_STATUSES.map(status => `| ${status.id} | ${status.label} | ${status.role} | ${status.description} |`).join('\n')}
`;

}

export function readStatuses(paths, { allowDefault = false } = {}) {
  if (!fs.existsSync(paths.statusesFile)) {
    if (allowDefault) return DEFAULT_STATUSES;
    throw new Error('_statuses.md is missing. Run obsidian-project-framework init to create the project status registry.');
  }
  const result = [];
  for (const line of fs.readFileSync(paths.statusesFile, 'utf8').split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.trim().split(/(?<!\\)\|/).slice(1, -1).map(cell => cell.trim().replace(/\\\|/g, '|'));
    if (cells[0] === 'status' || /^:?-+:?$/.test(cells[0] || '')) continue;
    const [id, label, role, description] = cells;
    if (!/^[a-z][a-z0-9-]*$/.test(id || '') || !label || !description || !['backlog', 'active', 'done'].includes(role)) {
      throw new Error(`Invalid status row in _statuses.md: ${line.trim()}`);
    }
    if (result.some(status => status.id === id)) throw new Error(`Duplicate status in _statuses.md: ${id}`);
    result.push({ id, label, role, description });
  }
  for (const role of ['backlog', 'active', 'done']) {
    if (!result.some(status => status.role === role)) throw new Error(`_statuses.md must define at least one status with role ${role}`);
  }
  return result;
}
export function getStatus(paths, id) {
  const status = readStatuses(paths).find(item => item.id === id);
  if (!status) throw new Error(`Unknown task status: ${id}. Use the values defined in _statuses.md.`);
  return status;
}
export function firstStatus(paths, role) {
  return readStatuses(paths).find(status => status.role === role).id;
}
