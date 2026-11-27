import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const skillsRoot = path.join(repoRoot, 'skills');

/** Триггер вызова скилла: Use when… / Используй… */
const TRIGGER_RE = /Use when|Используй/i;

function listSkillFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'in-dev') continue;
      listSkillFiles(full, out);
    } else if (entry.name === 'SKILL.md') {
      out.push(full);
    }
  }
  return out;
}

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  return parseYaml(match[1]);
}

function readDescription(file) {
  const fm = parseFrontmatter(fs.readFileSync(file, 'utf8'));
  if (!fm || typeof fm !== 'object') return { ok: false, reason: 'missing YAML frontmatter' };
  const description = typeof fm.description === 'string' ? fm.description.trim() : '';
  if (!description) return { ok: false, reason: 'empty description' };
  return { ok: true, description };
}

test('each skill has non-empty description with Use when / Используй trigger', () => {
  const files = listSkillFiles(skillsRoot);
  assert.ok(files.length > 0, 'expected at least one SKILL.md');

  const failures = [];
  for (const file of files) {
    const rel = path.relative(repoRoot, file);
    const result = readDescription(file);
    if (!result.ok) {
      failures.push(`${rel}: ${result.reason}`);
      continue;
    }
    if (!TRIGGER_RE.test(result.description)) {
      failures.push(`${rel}: description lacks «Use when…» / «Используй…» trigger`);
    }
  }

  // Пока часть legacy-скиллов без явного триггера — требуем триггер у всех,
  // кроме известного долга; новые/переписанные (ai-docs-setup) в долг не входят.
  const allowedDebt = new Set([
    'skills/System/main-rule/SKILL.md',
    'skills/code/api-integrations/SKILL.md',
    'skills/code/laravel-strict/SKILL.md',
    'skills/code/laraway/SKILL.md',
    'skills/code/pest-testing/SKILL.md',
    'skills/code/wordpress-clean-plugin/SKILL.md',
    'skills/engineering/obsidian/SKILL.md',
    'skills/engineering/wayfinder/SKILL.md',
    'skills/tools/find-skills/SKILL.md',
    'skills/ui-ux/dandy-design/SKILL.md',
  ]);

  const blocking = failures.filter((line) => {
    const rel = line.split(':')[0];
    if (rel.endsWith('ai-docs-setup/SKILL.md')) return true;
    if (line.includes('empty description') || line.includes('missing YAML')) return true;
    if (line.includes('lacks') && allowedDebt.has(rel)) return false;
    return true;
  });

  assert.deepEqual(blocking, [], blocking.join('\n'));
});

test('ai-docs-setup description triggers on project memory setup', () => {
  const file = path.join(skillsRoot, 'engineering/ai-docs-setup/SKILL.md');
  const result = readDescription(file);
  assert.ok(result.ok, result.reason);
  assert.match(result.description, /Use when/i);
  assert.match(result.description, /AGENTS\.md|\.ai\//);
});
