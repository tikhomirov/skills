import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../../bin/obsidian-project-framework', import.meta.url));
const run = args => spawnSync(cli, args, { encoding: 'utf8' });

test('executable provides general and command help without a vault', () => {
  for (const command of ['', 'init', 'status', 'task', 'context', 'checkpoint', 'knowledge', 'migrate', 'doctor']) {
    const result = run(command ? [command, '--help'] : []);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Usage: obsidian-project-framework/);
    assert.ok(!result.stdout.includes('\\n'));
  }
});

test('invalid commands and arguments fail clearly before accessing a vault', () => {
  for (const args of [
    ['unknown'], ['task', 'unknown'], ['task', 'create'], ['task', 'start', '../bad'],
    ['knowledge', 'search'], ['status', '--unknown'], ['context', '--mode', 'invalid'],
    ['context', '--token-budget', 'NaN'], ['context', '--token-budget', '0'],
    ['status', '--vault'], ['init', 'extra'],
  ]) {
    const result = run(args);
    assert.equal(result.status, 1, `${args}: ${result.stderr}`);
    assert.match(result.stderr, /Error:/);
    assert.doesNotMatch(result.stderr, /at file:/);
  }
});
