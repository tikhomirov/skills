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
    for (const args of [['--unknown'], ['nonexistent-skill'], ['laraway', 'nonexistent-skill']]) {
      const result = run(args, cwd);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Unknown/);
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
