import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { findProjectRoot, getProjectId, findVaultRoot, assertWithin, ensureDir } from './utils.mjs';
import { getProjectPaths } from './paths.mjs';
import { DEFAULT_STATUSES } from './constants.mjs';
import { readStatuses, getStatus } from './statuses.mjs';
import { listTasks } from './task-store.mjs';

const usage = {
  init: 'init', status: 'status',
  decision: 'decision record <title> --task TASK-ID --summary <text> --source <user confirmation>',
  task: 'task create <title> | task start <TASK-ID> | task status <TASK-ID> <status> | task complete <TASK-ID> | task sync | task archive <TASK-ID> | task restore <TASK-ID>',
  context: 'context [--mode brief|full|task|topic] [--task TASK-ID] [--topic text]',
  checkpoint: 'checkpoint [message]',
  knowledge: 'knowledge search <query> | knowledge sync [TASK-ID] --summary <text> --checks <text> --verification passed|not-required',
  migrate: 'migrate', doctor: 'doctor',
};
const examples = {
  init: 'init --vault ~/Obsidian --project demo', status: 'status',
  decision: 'decision record "API is a module" --task TASK-001 --summary "User confirmed the module list" --source "User message: ..."',
  task: 'task create "Implement authentication" --tag модуль/auth --summary "Add login endpoint"',
  context: 'context --mode task --task TASK-001', checkpoint: 'checkpoint "Done: login. Next: API tests. Blockers: none."',
  knowledge: 'knowledge sync TASK-001 --summary "Implemented auth; documentation changes await user permission" --checks "npm test: 12 passed" --verification passed',
  migrate: 'migrate --dry-run', doctor: 'doctor --json',
};
const routes = {
  init: ['init', 'cmdInit'], status: ['status', 'cmdStatus'],
  'decision record': ['decision', 'cmdDecisionRecord'],
  'task create': ['task', 'cmdTaskCreate'], 'task start': ['task', 'cmdTaskStart'],
  'task archive': ['archive', 'cmdTaskArchive'],
  'task restore': ['archive', 'cmdTaskArchive'],
  'task sync': ['task', 'cmdTaskSync'],
  'task status': ['task', 'cmdTaskStatus'], 'task complete': ['task', 'cmdTaskComplete'],
  context: ['context', 'cmdContext'], checkpoint: ['checkpoint', 'cmdCheckpoint'],
  'knowledge search': ['knowledge', 'cmdKnowledgeSearch'], 'knowledge sync': ['knowledge', 'cmdKnowledgeSync'],
  migrate: ['migrate', 'cmdMigrate'], doctor: ['doctor', 'cmdDoctor'],
};

try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    help: { type: 'boolean', short: 'h' }, vault: { type: 'string' }, project: { type: 'string' },
    source: { type: 'string' }, supersedes: { type: 'string' }, 'decided-at': { type: 'string' },
    json: { type: 'boolean' }, 'dry-run': { type: 'boolean' }, force: { type: 'boolean' },
    mode: { type: 'string', default: 'brief' }, task: { type: 'string' }, topic: { type: 'string' },
    'token-budget': { type: 'string', default: '4000' },
    key: { type: 'string' }, summary: { type: 'string' }, checks: { type: 'string' }, verification: { type: 'string' },
    tag: { type: 'string', multiple: true }, related: { type: 'string', multiple: true },
    'depends-on': { type: 'string', multiple: true },
  } });
  const [command, ...rest] = positionals;
  if (command && !usage[command]) throw new Error(`Unknown command: ${command}`);
  if (values.help || !command) {
    console.log(`Usage: obsidian-project-framework ${command ? usage[command] : '<command> [options]'}\n`);
    if (!command) console.log(Object.values(usage).map(line => `  ${line}`).join('\n'));
    console.log('\nCommon options: --vault <path> --project <id> --json --dry-run --help');
    if (!command || command === 'init') console.log('Init: creates _Задачи.base, a native Kanban board for Obsidian 1.14+ (initially backlog → in-progress → done; the project _statuses.md is authoritative). --force refreshes templates, not user rules or memory. No application modules are created.');
    if (!command || command === 'task') console.log(`Task create: --key <request-id> --summary <text> --tag <tag> --related <TASK-ID> --depends-on <TASK-ID> (repeatable)\nStatuses: read the project's _statuses.md. Initial defaults: ${DEFAULT_STATUSES.map(status => status.id).join(', ')}`);
    if (!command || command === 'decision') console.log('Decision record: --key <event-id> --task <id> --related <id> --supersedes <DEC-ID> --decided-at <YYYY-MM-DD>. Append-only; source must be an actual user decision.');
    if (!command || command === 'knowledge') console.log('Knowledge sync records supplied results; it does not run tests or approve user decisions.');
    if (!command || command === 'context') console.log('Context: --mode <mode> --task <id> --topic <text> --token-budget <number>');
    console.log(`\nExample: obsidian-project-framework ${examples[command || 'init']}`);
  } else {
    const grouped = ['task', 'knowledge', 'decision'].includes(command);
    const route = grouped ? `${command} ${rest.shift() || ''}` : command;
    if (!routes[route]) throw new Error(`Unknown subcommand: ${route}`);
    const maxArgs = route === 'task status' ? 2 : 1;
    if (rest.length > maxArgs) throw new Error('Too many arguments; quote titles and messages containing spaces.');
    const argument = rest[0];
    if (['task create', 'task start', 'task status', 'task complete', 'task archive', 'task restore', 'knowledge search', 'decision record'].includes(route) && !argument?.trim()) throw new Error(`Missing argument. Usage: obsidian-project-framework ${usage[command]}`);
    if (['init', 'status', 'doctor', 'migrate', 'context', 'task sync'].includes(route) && argument) throw new Error(`Unexpected argument: ${argument}`);
    if (route === 'task status' && !rest[1]) throw new Error('Specify a status defined in the project _statuses.md');
    if (!['brief', 'full', 'task', 'topic'].includes(values.mode)) throw new Error(`Unknown context mode: ${values.mode}`);
    if (values.mode === 'topic' && !values.topic?.trim()) throw new Error('Topic context requires --topic');
    const tokenBudget = Number(values['token-budget']);
    if (!Number.isSafeInteger(tokenBudget) || tokenBudget <= 0) throw new Error('--token-budget must be a positive integer');
    const taskId = ((command === 'task' && !['task create', 'task sync'].includes(route)) || route === 'knowledge sync') ? argument : values.task;
    for (const id of [taskId, ...(values.related || []), ...(values['depends-on'] || [])].filter(Boolean)) {
      if (!/^TASK-\d+$/.test(id)) throw new Error('Task ID must have the form TASK-001');
    }
    const projectRoot = findProjectRoot();
    const projectId = values.project || getProjectId(projectRoot);
    const vaultRoot = findVaultRoot(values.vault);
    if (!vaultRoot) throw new Error('Vault not found. Pass --vault <path> or set OBSIDIAN_VAULT.');
    const paths = getProjectPaths(vaultRoot, projectId);
    const mutating = !['status', 'context', 'doctor', 'knowledge search'].includes(route);
    if (route !== 'init' && !fs.existsSync(paths.agentsMd)) throw new Error('Project not initialized; run obsidian-project-framework init first');
    assertWithin(paths.base, paths.vaultRoot);
    if (mutating && route !== 'init') {
      const statuses = readStatuses(paths);
      const unsupported = listTasks(paths).filter(task => !statuses.some(status => status.id === task.properties.status));
      if (unsupported.length) throw new Error('Unknown task statuses: ' + unsupported.map(task => task.id + ': ' + task.properties.status).join(', ') + '. Add them to _statuses.md or explicitly repair their properties before synchronization.');
    }
    if (route === 'task status') getStatus(paths, rest[1]);
    let lock;
    try {
      if (mutating && !values['dry-run']) {
        lock = path.join(paths.serviceDir, '.cli.lock');
        assertWithin(lock, paths.base);
        ensureDir(paths.serviceDir);
        try { const fd = fs.openSync(lock, 'wx'); fs.writeSync(fd, `${process.pid}\n`); fs.closeSync(fd); }
        catch (error) { lock = null; throw new Error(`Cannot acquire project lock: ${error.message}. Another CLI operation may be active.`); }
      }
      const [module, handler] = routes[route];
      const commands = await import(`./commands/${module}.mjs`);
      const result = commands[handler]({
        projectRoot, projectId, vaultRoot, paths, taskId, status: rest[1],
        restore: route === 'task restore', title: argument, query: argument, message: argument || 'Manual checkpoint',
        mode: values.mode, topic: values.topic, tokenBudget,
        source: values.source, supersedes: values.supersedes, decidedAt: values['decided-at'],
        key: values.key, summary: values.summary, checks: values.checks, verification: values.verification,
        tags: values.tag, related: values.related, dependsOn: values['depends-on'],
        dryRun: Boolean(values['dry-run']), force: Boolean(values.force),
      });
      if (values.json) console.log(JSON.stringify(result, null, 2));
      else if (result.output !== undefined) { console.log(result.output); if (result.warning) console.error(result.warning); }
      else console.log(JSON.stringify(result, null, 2));
      if (route === 'doctor' && !result.allOk) process.exitCode = 1;
    } finally { if (lock) fs.unlinkSync(lock); }
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
