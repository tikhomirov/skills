import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getProjectPaths } from '../../src/obsidian-project-framework/paths.mjs';
import { markdownFiles, readNote, updateNote, writeProject } from '../../src/obsidian-project-framework/utils.mjs';

const cli = fileURLToPath(new URL('../../bin/obsidian-project-framework', import.meta.url));
function fixture(fn, russian = false) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'project-framework-'));
  const vault = path.join(root, 'vault with spaces');
  const repo = path.join(root, 'repo');
  fs.mkdirSync(vault); fs.mkdirSync(repo);
  if (russian) fs.mkdirSync(path.join(vault, 'Проекты'));
  const git = args => execFileSync('git', args, { cwd: repo, stdio: 'pipe' });
  git(['init']); git(['config', 'user.name', 'Test']); git(['config', 'user.email', 'test@example.com']);
  fs.writeFileSync(path.join(repo, 'app.js'), 'console.log(1);\n');
  git(['add', 'app.js']); git(['commit', '-m', 'initial']);
  const paths = getProjectPaths(vault, 'demo');
  const run = (args, success = true) => {
    const result = spawnSync(cli, [...args, '--vault', vault, '--project', 'demo', '--json'], { cwd: repo, encoding: 'utf8' });
    if (success) {
      assert.equal(result.status, 0, `${args.join(' ')}: ${result.stderr}\n${result.stdout}`);
      return JSON.parse(result.stdout);
    }
    assert.equal(result.status, 1, args.join(' '));
    return result;
  };
  try { fn({ root, vault, repo, paths, run, git }); }
  finally { fs.rmSync(root, { recursive: true, force: true }); }
}
function snapshot(dir) {
  if (!fs.existsSync(dir)) return {};
  return Object.fromEntries(fs.readdirSync(dir, { recursive: true }).sort().map(name => {
    const file = path.join(dir, name), stat = fs.lstatSync(file);
    return [name, stat.isFile() ? [createHash('sha256').update(fs.readFileSync(file)).digest('hex'), stat.mtimeMs] : stat.isSymbolicLink() ? fs.readlinkSync(file) : 'dir'];
  }));
}
const sameAfter = (root, operation) => { const before = snapshot(root); operation(); assert.deepEqual(snapshot(root), before); };

test('init follows the framework and is idempotent, including force and dry-run', () => fixture(({ root, vault, paths, run }) => {
  sameAfter(root, () => run(['init', '--dry-run']));
  assert.ok(!fs.existsSync(paths.base));
  run(['init']);
  for (const key of ['agentsMd', 'tasksIndex', 'templatesDir', 'attachmentsDir', 'serviceDir', 'decisionsDir', 'nowFile', 'stateFile', 'sessionsDir', 'knowledgeDir', 'reportsDir', 'projectMap', 'decisionsTimeline']) assert.ok(fs.existsSync(paths[key]), key);
  assert.ok(fs.existsSync(paths.tasksBase));
  assert.ok(fs.existsSync(paths.statusesFile));
  const board = fs.readFileSync(paths.tasksBase, 'utf8');
  assert.match(board, /type: kanban/);
  assert.match(board, /property: note\.status/);
  assert.match(board, /groupOrder:\n      - backlog\n      - in-progress\n      - done/);
  assert.ok(board.includes('Projects/demo/Tasks'));
  assert.doesNotMatch(board, /type: (cards|table)/);
  assert.ok(!fs.existsSync(paths.modulesDir));
  assert.ok(!fs.existsSync(path.join(paths.base, 'API')));
  assert.equal(path.basename(paths.agentDir), '_agents');
  assert.equal(path.basename(paths.reportsDir), 'Reports');
  for (const name of ['HUMAN', 'AGENT', 'Agents', 'Memory', 'Knowledge', 'Отчеты']) assert.ok(!fs.existsSync(path.join(paths.base, name)));
  assert.ok(paths.base.startsWith(path.join(vault, 'Projects')));
  fs.appendFileSync(paths.agentsMd, '\nМои правила.\n');
  fs.appendFileSync(paths.nowFile, '\nМой следующий шаг.\n');
  sameAfter(root, () => run(['init']));
  sameAfter(root, () => run(['init', '--force']));
  sameAfter(root, () => run(['init'])); assert.ok(fs.existsSync(paths.tasksBase));
  sameAfter(root, () => run(['init', '--force']));
  const doctor = run(['doctor']); assert.equal(doctor.allOk, true);
}));

test('existing Russian Projects directory is reused', () => fixture(({ vault, paths, run }) => {
  run(['init']); assert.ok(paths.base.includes('/Проекты/'));
  assert.ok(!fs.existsSync(path.join(vault, 'Projects')));
}, true));

test('task create and status transitions are idempotent and keep references current', () => fixture(({ root, paths, run }) => {
  run(['init']);
  const first = run(['task', 'create', 'Авторизация', '--key', 'auth', '--tag', 'модуль/auth', '--summary', 'Вход через API']);
  assert.match(first.filePath, /TASK-001_backlog_\d{4}-\d{2}-\d{2}\.md$/);
  sameAfter(root, () => assert.equal(run(['task', 'create', 'Авторизация', '--key', 'auth']).taskId, first.taskId));
  const second = run(['task', 'create', 'Авторизация', '--key', 'auth-ui', '--related', first.taskId, '--depends-on', first.taskId]);
  assert.equal(second.taskId, 'TASK-002');
  const beforeDry = snapshot(root);
  run(['task', 'start', first.taskId, '--dry-run']); assert.deepEqual(snapshot(root), beforeDry);
  const started = run(['task', 'start', first.taskId]);
  assert.ok(!fs.existsSync(first.filePath));
  assert.ok(fs.readFileSync(second.filePath, 'utf8').includes(path.basename(started.filePath, '.md')));
  assert.ok(!fs.readFileSync(second.filePath, 'utf8').includes(path.basename(first.filePath, '.md')));
  sameAfter(root, () => run(['task', 'start', first.taskId]));
  run(['task', 'complete', first.taskId], false);
  run(['task', 'start', second.taskId], false);
  const props = readNote(fs.readFileSync(started.filePath, 'utf8')).properties;
  assert.ok(props.tags.includes('задачи') && props.tags.includes('статус/in-progress') && props.tags.includes('модуль/auth'));
  run(['task', 'status', first.taskId, 'backlog']);
  sameAfter(root, () => run(['task', 'status', first.taskId, 'backlog']));
  const resumed = run(['task', 'start', first.taskId]);
  const reportArgs = ['knowledge', 'sync', first.taskId, '--summary', 'Реализован вход; API актуализирован', '--checks', 'node --test: passed', '--verification', 'passed'];
  run(['knowledge', 'sync', first.taskId], false);
  run(reportArgs);
  sameAfter(root, () => run(reportArgs));
  assert.match(fs.readFileSync(resumed.filePath, 'utf8'), /## Результат\nРеализован вход/);
  const completed = run(['task', 'complete', first.taskId]);
  sameAfter(root, () => run(['task', 'complete', first.taskId]));
  assert.ok(fs.readFileSync(path.join(paths.reportsDir, 'TASK-001.md'), 'utf8').includes(path.basename(completed.filePath, '.md')));
  run(['task', 'status', first.taskId, 'cancelled'], false);
  run(['task', 'start', second.taskId]);
  assert.equal(run(['doctor']).allOk, true);
  assert.equal(run(['status']).taskCount, 2);
}));

test('default task identity is the title and checkpoint is idempotent', () => fixture(({ root, paths, run }) => {
  run(['init']); const task = run(['task', 'create', 'Проверить API']);
  sameAfter(root, () => assert.equal(run(['task', 'create', 'Проверить API']).taskId, task.taskId));
  run(['task', 'start', task.taskId]);
  const message = 'Сделано: аудит. Осталось: тесты. Следующий шаг: контракт API.';
  const checkpoint = run(['checkpoint', message]);
  sameAfter(root, () => assert.equal(run(['checkpoint', message]).sessionFile, checkpoint.sessionFile));
  fs.appendFileSync(paths.nowFile, '\nНовый блокер.\n');
  assert.notEqual(run(['checkpoint', message]).sessionFile, checkpoint.sessionFile);
  assert.equal(markdownFiles(paths.sessionsDir).length, 2);
  assert.ok(run(['context', '--mode', 'task', '--task', task.taskId]).output.includes('Проверить API'));
  const tiny = run(['context', '--token-budget', '1']);
  assert.equal(tiny.truncated, true); assert.ok(tiny.tokenCount <= 1);
  assert.ok(run(['context', '--mode', 'full', '--token-budget', '12000']).output.includes('Новый блокер'));
}));

test('knowledge search includes components and accepted decisions without special ownership zones', () => fixture(({ paths, run }) => {
  run(['init']);
  const module = path.join(paths.base, '01_Auth'); fs.mkdirSync(module);
  fs.writeFileSync(path.join(module, 'Auth.md'), '# Авторизация JWT\n');
  const task = run(['task', 'create', 'Исследование']);
  const decision = updateNote('# JWT — принятое решение\n', { review: 'approved', approved_by: 'user', approved_at: '2026-10-27', approval_source: 'Запрос пользователя', task_ids: [task.taskId] });
  fs.writeFileSync(path.join(paths.decisionsDir, 'JWT.md'), decision);
  assert.equal(run(['knowledge', 'search', 'JWT']).count, 2);
  const topic = run(['context', '--mode', 'topic', '--topic', 'JWT', '--token-budget', '12000']);
  assert.match(topic.output, /Авторизация JWT/); assert.match(topic.output, /принятое решение/);
  assert.equal(run(['doctor']).allOk, true);
}));

test('migration and all dry-run writes preserve original files and existing imports', () => fixture(({ root, repo, paths, run }) => {
  run(['init']); fs.mkdirSync(path.join(repo, 'docs', 'nested'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'docs', 'nested', 'API.md'), '# API\n');
  sameAfter(root, () => run(['migrate', '--dry-run']));
  run(['migrate']);
  const imported = path.join(paths.knowledgeDir, 'Импорт/nested/API.md');
  assert.equal(fs.readFileSync(imported, 'utf8'), '# API\n');
  sameAfter(root, () => run(['migrate']));
  fs.writeFileSync(imported, '# Пользовательская правка\n');
  sameAfter(root, () => run(['migrate']));
  assert.ok(fs.existsSync(path.join(repo, 'docs/nested/API.md')));
  sameAfter(root, () => run(['task', 'create', 'Dry-run', '--dry-run']));
  sameAfter(root, () => run(['checkpoint', 'Dry-run', '--dry-run']));
}));

test('doctor reports stale filenames, missing tags and unapproved decisions', () => fixture(({ paths, run }) => {
  run(['init']); const task = run(['task', 'create', 'Проверка']);
  const text = fs.readFileSync(task.filePath, 'utf8');
  fs.writeFileSync(task.filePath, updateNote(text, { tags: [], status: 'blocked' }));
  fs.writeFileSync(path.join(paths.decisionsDir, 'Не принято.md'), '# Предложение\n');
  const result = JSON.parse(run(['doctor'], false).stdout);
  assert.ok(result.checks.some(check => !check.ok && check.name.includes('filename')));
  assert.ok(result.checks.some(check => !check.ok && check.name.includes('tags')));
  assert.ok(result.checks.some(check => !check.ok && check.name.includes('approved')));
}));

test('native Kanban drag changes are reconciled without duplicate status events', () => fixture(({ root, paths, run }) => {
  run(['init']); const task = run(['task', 'create', 'Kanban drag']);
  fs.writeFileSync(task.filePath, updateNote(fs.readFileSync(task.filePath, 'utf8'), { status: 'in-progress' }));
  sameAfter(root, () => run(['task', 'sync', '--dry-run']));
  const sync = run(['task', 'sync']); const working = sync.tasks[0];
  assert.ok(!fs.existsSync(task.filePath)); assert.match(working.filePath, /_in-progress_/);
  assert.ok(readNote(fs.readFileSync(working.filePath, 'utf8')).properties.tags.includes('статус/in-progress'));
  sameAfter(root, () => run(['task', 'sync']));
  fs.writeFileSync(working.filePath, updateNote(fs.readFileSync(working.filePath, 'utf8'), { status: 'done' }));
  assert.match(run(['task', 'sync'], false).stderr, /Cannot complete/);
  fs.writeFileSync(working.filePath, updateNote(fs.readFileSync(working.filePath, 'utf8'), { status: 'in-progress' }));
  run(['knowledge', 'sync', task.taskId, '--summary', 'Implemented', '--checks', 'Tests passed', '--verification', 'passed']);
  fs.writeFileSync(working.filePath, updateNote(fs.readFileSync(working.filePath, 'utf8'), { status: 'done' }));
  const completed = run(['task', 'sync']).tasks[0]; assert.match(completed.filePath, /_done_/);
  sameAfter(root, () => run(['task', 'sync']));
  assert.equal(run(['doctor']).allOk, true);
}));

test('_statuses.md is authoritative for custom status IDs, roles and Kanban column order', () => fixture(({ root, paths, run }) => {
  run(['init']);
  let registry = fs.readFileSync(paths.statusesFile, 'utf8')
    .replace('| backlog | Backlog |', '| todo | To Do |')
    .replace('| in-progress | In Progress |', '| working | Working |')
    .replace('| done | Done |', '| completed | Completed |');
  registry = registry.replace('| completed |', '| review | Review | active | Проверка результата. |\n| completed |');
  fs.writeFileSync(paths.statusesFile, registry);
  run(['task', 'sync']);
  const board = fs.readFileSync(paths.tasksBase, 'utf8');
  assert.match(board, /groupOrder:\n      - todo\n      - working\n      - review\n      - completed/);
  const created = run(['task', 'create', 'Custom workflow']); assert.match(created.filePath, /_todo_/);
  const started = run(['task', 'start', created.taskId]); assert.match(started.filePath, /_working_/);
  const baseline = readNote(fs.readFileSync(started.filePath, 'utf8')).properties.git_baseline;
  const reviewed = run(['task', 'status', created.taskId, 'review']); assert.match(reviewed.filePath, /_review_/);
  assert.equal(readNote(fs.readFileSync(reviewed.filePath, 'utf8')).properties.git_baseline, baseline);
  run(['knowledge', 'sync', created.taskId, '--summary', 'Ready', '--checks', 'Tests passed', '--verification', 'passed']);
  const completed = run(['task', 'complete', created.taskId]); assert.match(completed.filePath, /_completed_/);
  assert.equal(run(['doctor']).allOk, true);
  assert.match(run(['task', 'status', created.taskId, 'in-progress'], false).stderr, /_statuses.md/);
  sameAfter(root, () => run(['task', 'sync']));
  run(['init', '--force']);
  sameAfter(root, () => run(['init', '--force']));
  assert.equal(fs.readFileSync(paths.statusesFile, 'utf8'), registry);
}));

test('invalid status registries fail clearly rather than falling back to defaults', () => fixture(({ paths, run }) => {
  run(['init']); const registry = fs.readFileSync(paths.statusesFile, 'utf8');
  fs.writeFileSync(paths.statusesFile, registry.replace('| done | Done | done |', '| done | Done | unknown |'));
  assert.match(run(['task', 'create', 'Invalid registry'], false).stderr, /Invalid status row/);
  fs.writeFileSync(paths.statusesFile, registry.replace('| done | Done |', '| backlog | Done |'));
  assert.match(run(['task', 'sync'], false).stderr, /Duplicate status/);
  fs.unlinkSync(paths.statusesFile);
  assert.match(run(['task', 'create', 'Missing registry'], false).stderr, /_statuses.md is missing/);
}));

test('legacy task directory is reused and unsupported statuses are not silently hidden', () => fixture(({ vault, paths, run }) => {
  fs.mkdirSync(path.join(paths.base, 'Задачи'), { recursive: true });
  const legacy = getProjectPaths(vault, 'demo'); run(['init']);
  assert.ok(fs.existsSync(legacy.tasksBase)); assert.ok(!fs.existsSync(path.join(paths.base, 'Tasks')));
  assert.ok(fs.readFileSync(legacy.tasksBase, 'utf8').includes('Projects/demo/Задачи'));
  const task = run(['task', 'create', 'Legacy status']);
  fs.writeFileSync(task.filePath, updateNote(fs.readFileSync(task.filePath, 'utf8'), { status: 'blocked' }));
  assert.match(run(['init'], false).stderr, /would be hidden/);
}));

test('user decisions are append-only, idempotent and appear in a live timeline', () => fixture(({ root, paths, run }) => {
  run(['init']); const task = run(['task', 'create', 'Подтвердить модули']);
  const args = ['decision', 'record', 'API как модуль', '--key', 'api-module', '--task', task.taskId,
    '--summary', 'Пользователь подтвердил модуль API', '--source', 'Сообщение пользователя: API является модулем', '--decided-at', '2026-01-15'];
  sameAfter(root, () => run([...args, '--dry-run']));
  const recorded = run(args);
  const original = snapshot(paths.decisionsDir);
  const props = readNote(fs.readFileSync(recorded.filePath, 'utf8')).properties;
  assert.equal(props.decided_at, '2026-01-15'); assert.ok(props.recorded_at);
  sameAfter(root, () => run(args));
  assert.match(run([...args, '--summary', 'Changed'], false).stderr, /immutable|multiple/i);
  const changed = [...args]; changed[changed.indexOf('--summary') + 1] = 'Другое решение';
  assert.match(run(changed, false).stderr, /immutable/);
  const amended = run(['decision', 'record', 'API v2', '--key', 'api-v2', '--task', task.taskId,
    '--summary', 'Новое решение', '--source', 'Новое сообщение пользователя', '--supersedes', recorded.decisionId]);
  assert.ok(fs.readFileSync(amended.filePath, 'utf8').includes(recorded.decisionId));
  assert.deepEqual(snapshot(paths.decisionsDir)[path.basename(recorded.filePath)], original[path.basename(recorded.filePath)]);
  const beforeRename = snapshot(paths.decisionsDir);
  const started = run(['task', 'start', task.taskId]);
  assert.deepEqual(snapshot(paths.decisionsDir), beforeRename);
  const timeline = fs.readFileSync(paths.decisionsTimeline, 'utf8');
  assert.ok(timeline.includes('2026-01-15') && timeline.includes(recorded.decisionId));
  assert.ok(timeline.includes(path.basename(started.filePath, '.md')));
  assert.equal(run(['doctor']).allOk, true);
  assert.throws(() => writeProject(recorded.filePath, 'overwrite', { paths }), /Read-only/);
}));

test('module documentation is untouched by task renames and writable only outside generic CLI helpers', () => fixture(({ paths, run }) => {
  run(['init']); const task = run(['task', 'create', 'Документация']);
  const numbered = path.join(paths.base, '01_Module'); fs.mkdirSync(numbered);
  const nested = path.join(paths.modulesDir, 'Other'); fs.mkdirSync(nested, { recursive: true });
  for (const dir of [numbered, nested]) {
    fs.writeFileSync(path.join(dir, 'Doc.md'), `[[${path.basename(task.filePath, '.md')}]]`);
  }
  const beforeNumbered = snapshot(numbered), beforeNested = snapshot(paths.modulesDir);
  run(['task', 'start', task.taskId]);
  assert.deepEqual(snapshot(numbered), beforeNumbered);
  assert.deepEqual(snapshot(paths.modulesDir), beforeNested);
  for (const dir of [numbered, nested]) assert.throws(() => writeProject(path.join(dir, 'New.md'), 'unsafe', { paths }), /Read-only/);
  const alias = path.join(paths.agentDir, 'module-alias'); fs.symlinkSync(numbered, alias);
  assert.throws(() => writeProject(path.join(alias, 'Bypass.md'), 'unsafe', { paths }), /Read-only/);
  writeProject(path.join(paths.agentDir, 'Research', 'Notes.md'), 'Allowed', { paths });
  assert.ok(fs.existsSync(path.join(paths.agentDir, 'Research', 'Notes.md')));
  // Stale links in protected docs are reported, never silently repaired without permission.
  const doctor = JSON.parse(run(['doctor'], false).stdout);
  assert.ok(doctor.checks.some(check => !check.ok && check.name.includes('task link')));
}));

test('staged changes are reported and stale verification cannot complete a task', () => fixture(({ repo, run, git }) => {
  run(['init']); const task = run(['task', 'create', 'Staged changes']); run(['task', 'start', task.taskId]);
  fs.writeFileSync(path.join(repo, 'staged.js'), 'console.log(2);\n'); git(['add', 'staged.js']);
  const args = ['knowledge', 'sync', task.taskId, '--summary', 'Implemented', '--checks', 'Tests passed', '--verification', 'passed'];
  const sync = run(args); assert.ok(sync.changedFiles.includes('staged.js'));
  fs.writeFileSync(path.join(repo, 'staged.js'), 'console.log(2222);\n');
  assert.match(run(['task', 'complete', task.taskId], false).stderr, /Code changed/);
  run(args); run(['task', 'complete', task.taskId]);
}));

test('project lock prevents overlapping mutations and is preserved on failure', () => fixture(({ paths, run }) => {
  run(['init']); const lock = path.join(paths.serviceDir, '.cli.lock'); fs.writeFileSync(lock, 'other-process');
  assert.match(run(['task', 'create', 'Locked'], false).stderr, /lock/);
  assert.equal(fs.readFileSync(lock, 'utf8'), 'other-process');
}));

test('writes cannot escape through a symlink and invalid explicit vault does not fall back', () => fixture(({ root, vault, paths, run }) => {
  run(['init']); const outside = path.join(root, 'outside'); fs.mkdirSync(outside);
  fs.rmSync(paths.tasksDir, { recursive: true }); fs.symlinkSync(outside, paths.tasksDir);
  assert.match(run(['task', 'create', 'Unsafe'], false).stderr, /escapes/);
  assert.deepEqual(fs.readdirSync(outside), []);
  const result = spawnSync(cli, ['init', '--vault', path.join(vault, 'missing')], { encoding: 'utf8' });
  assert.equal(result.status, 1); assert.match(result.stderr, /Vault directory not found/);
}));


test('reopening through backlog invalidates the previous completion report', () => fixture(({ run }) => {
  run(['init']); const task = run(['task', 'create', 'Reopen']); run(['task', 'start', task.taskId]);
  run(['knowledge', 'sync', task.taskId, '--summary', 'Done', '--checks', 'Tests passed', '--verification', 'passed']);
  run(['task', 'complete', task.taskId]); run(['task', 'status', task.taskId, 'backlog']);
  assert.match(run(['task', 'complete', task.taskId], false).stderr, /Cannot complete/);
}));

test('substantive vault edits invalidate reports but memory and generated navigation do not', () => fixture(({ paths, run }) => {
  run(['init']); const task = run(['task', 'create', 'Docs']); run(['task', 'start', task.taskId]);
  const args = ['knowledge', 'sync', task.taskId, '--summary', 'Updated docs', '--checks', 'Links checked', '--verification', 'passed'];
  run(args); fs.writeFileSync(path.join(paths.knowledgeDir, 'Research.md'), '# New research\n');
  assert.match(run(['task', 'complete', task.taskId], false).stderr, /documentation changed/);
  run(args); fs.appendFileSync(paths.nowFile, '\nNext step.\n');
  run(['task', 'complete', task.taskId]);
}));

test('same-sized Git edits with restored timestamps invalidate evidence', () => fixture(({ repo, run }) => {
  run(['init']); const task = run(['task', 'create', 'Content hash']); run(['task', 'start', task.taskId]);
  const file = path.join(repo, 'app.js'); fs.writeFileSync(file, 'console.log(2);\n');
  const args = ['knowledge', 'sync', task.taskId, '--summary', 'Changed', '--checks', 'Tests passed', '--verification', 'passed'];
  run(args); const stat = fs.statSync(file); fs.writeFileSync(file, 'console.log(3);\n'); fs.utimesSync(file, stat.atime, stat.mtime);
  assert.match(run(['task', 'complete', task.taskId], false).stderr, /Code changed/);
}));

test('doctor rejects malformed Kanban YAML and indexes folded summaries correctly', () => fixture(({ paths, run }) => {
  run(['init']); const task = run(['task', 'create', 'Folded summary']);
  const text = fs.readFileSync(task.filePath, 'utf8').replace(/^summary:.*$/m, 'summary: >-\n  First line\n  second line');
  fs.writeFileSync(task.filePath, text); run(['task', 'sync']);
  assert.ok(fs.readFileSync(paths.tasksIndex, 'utf8').includes('First line second line'));
  fs.appendFileSync(paths.tasksBase, '\ninvalid: [unterminated\n');
  const doctor = JSON.parse(run(['doctor'], false).stdout);
  assert.ok(doctor.checks.some(check => !check.ok && check.name.includes('Kanban YAML')));
}));
