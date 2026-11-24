import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../../bin/skills-install', import.meta.url));
const run = (args, cwd) => spawnSync(cli, args, { cwd, encoding: 'utf8' });

test('installer help and invalid arguments do not write files', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-cli-'));
  try {
    const help = run(['--help'], cwd);
    assert.equal(help.status, 0, help.stderr);
    assert.match(help.stdout, /skills-install/);
    assert.doesNotMatch(help.stdout, /  - (obsidian-framework|code-improvement|project-workshop)\b/);
    for (const name of ['obsidian-framework', 'code-improvement', 'project-workshop']) {
      const result = run([name], cwd);
      assert.equal(result.status, 1, result.stderr);
      assert.match(result.stderr, /Unknown skill/);
    }
    for (const args of [['--unknown'], ['nonexistent-skill'], ['laraway', 'nonexistent-skill']]) {
      const result = run(args, cwd);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Unknown/);
    }
    for (const args of [['--dry-run'], ['--link-source', '--dry-run']]) {
      const result = run(args, cwd);
      assert.equal(result.status, 0, result.stderr);
      assert.doesNotMatch(result.stdout, /obsidian-framework|code-improvement|project-workshop/);
      assert.match(result.stdout, /laraway/);
    }
    assert.deepEqual(fs.readdirSync(cwd), []);
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});

test('installer copies and links a skill, supports repeated installs and dangling links', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-install-'));
  try {
    for (let i = 0; i < 2; i++) {
      const before = i === 1 ? fs.readdirSync(cwd, { recursive: true }).map(file => [file, fs.lstatSync(path.join(cwd, file)).mtimeMs]) : null;
      const result = run(['laraway'], cwd);
      assert.equal(result.status, 0, result.stderr);
      if (before) assert.deepEqual(fs.readdirSync(cwd, { recursive: true }).map(file => [file, fs.lstatSync(path.join(cwd, file)).mtimeMs]), before);
      for (const dir of ['.agents', '.opencode', '.claude', '.pi']) {
        assert.ok(fs.existsSync(path.join(cwd, dir, 'skills/laraway/SKILL.md')));
      }
      for (const dir of ['.claude', '.pi']) {
        const link = path.join(cwd, dir, 'skills/laraway');
        assert.ok(fs.lstatSync(link).isSymbolicLink());
        assert.equal(fs.realpathSync(link), path.join(cwd, '.agents/skills/laraway'));
      }
    }
    const target = path.join(cwd, '.pi/skills/laraway');
    fs.unlinkSync(target);
    fs.symlinkSync('/nonexistent-skills-target', target);
    assert.equal(run(['laraway'], cwd).status, 0);
    assert.ok(fs.existsSync(path.join(target, 'SKILL.md')));
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});


test('source links support categories, dry-run, idempotence and safe conflicts', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-links-'));
  try {
    assert.equal(run(['--link-source', '--dry-run', 'laraway'], cwd).status, 0);
    assert.deepEqual(fs.readdirSync(cwd), []);
    for (let i = 0; i < 2; i++) {
      const result = run(['--link-source', 'laraway'], cwd);
      assert.equal(result.status, 0, result.stderr);
      for (const dir of ['.agents', '.opencode', '.claude', '.pi', '.cursor']) {
        const target = path.join(cwd, dir, 'skills/laraway');
        assert.ok(fs.lstatSync(target).isSymbolicLink());
        assert.match(fs.realpathSync(target), /skills\/code\/laraway$/);
      }
    }
    const target = path.join(cwd, '.cursor/skills/laraway');
    fs.unlinkSync(target);
    fs.symlinkSync('/missing-personal-skill', target);
    const result = run(['--link-source', 'laraway', 'pest-testing'], cwd);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Conflict/);
    assert.equal(fs.readlinkSync(target), '/missing-personal-skill');
    assert.equal(fs.existsSync(path.join(cwd, '.agents/skills/pest-testing')), false);
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});
