import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID, createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parse } from 'yaml';

export function findProjectRoot(start = process.cwd()) {
  let current = path.resolve(start);
  while (true) {
    if (['.git', 'AGENTS.md', '.project-id'].some(name => fs.existsSync(path.join(current, name)))) return current;
    const parent = path.dirname(current);
    if (parent === current) return path.resolve(start);
    current = parent;
  }
}
export function getProjectId(root) {
  const file = path.join(root, '.project-id');
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : path.basename(root);
}
export function findVaultRoot(explicit = null) {
  const selected = explicit || process.env.OBSIDIAN_VAULT;
  if (selected) {
    if (!fs.existsSync(selected) || !fs.statSync(selected).isDirectory()) throw new Error(`Vault directory not found: ${selected}`);
    return path.resolve(selected);
  }
  return [path.join(os.homedir(), 'Homeserver/Obsidian'), path.join(os.homedir(), 'Obsidian')]
    .find(dir => fs.existsSync(dir) && fs.statSync(dir).isDirectory()) || null;
}
export function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function realLocation(file) {
  let current = path.resolve(file);
  const tail = [];
  while (!fs.existsSync(current)) {
    const stat = fs.lstatSync(current, { throwIfNoEntry: false });
    if (stat?.isSymbolicLink()) throw new Error(`Dangling symlink: ${current}`);
    tail.unshift(path.basename(current));
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return path.join(fs.realpathSync(current), ...tail);
}
export function assertWithin(file, root) {
  const resolvedRoot = realLocation(root);
  const relative = path.relative(resolvedRoot, realLocation(file));
  if (relative.startsWith('..' + path.sep) || relative === '..' || path.isAbsolute(relative)) {
    throw new Error(`Path escapes project directory: ${file}`);
  }
}
export function safeWrite(file, content, dryRun = false, root = null) {
  if (root) assertWithin(file, root);
  if (dryRun) return;
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return;
  ensureDir(path.dirname(file));
  const temp = `${file}.tmp.${randomUUID()}`;
  try { fs.writeFileSync(temp, content, 'utf8'); fs.renameSync(temp, file); }
  finally { fs.rmSync(temp, { force: true }); }
}
export function isAgentWritable(file, paths) {
  const target = path.resolve(file);
  const actual = realLocation(file);
  const base = realLocation(paths.base);
  return [paths.agentDir, paths.tasksDir, paths.templatesDir, paths.attachmentsDir, paths.serviceDir]
    .some(dir => target.startsWith(path.resolve(dir) + path.sep)
      && actual.startsWith(path.join(base, path.relative(paths.base, dir)) + path.sep));
}
export function moduleDirectories(paths) {
  if (!fs.existsSync(paths.base)) return [];
  return fs.readdirSync(paths.base, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && (entry.name === 'Модули' || /^\d{2}_.+/.test(entry.name)))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(entry => path.join(paths.base, entry.name));
}
export function writeProject(file, content, options) {
  const { paths } = options;
  assertWithin(paths.base, paths.vaultRoot);
  assertWithin(file, paths.base);
  const bootstrap = [paths.agentsMd, paths.statusesFile].some(allowed => path.resolve(file) === path.resolve(allowed)) && !fs.existsSync(file);
  if (!bootstrap && !isAgentWritable(file, paths)) {
    throw new Error(`Read-only project documentation: ${file}. Module edits require an explicit user request; decisions are append-only.`);
  }
  safeWrite(file, content, options.dryRun, paths.base);
}
export function estimateTokens(text) { return Math.ceil(text.length / 3.5); }
export function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}
export function getGitHead(root) {
  try { return git(root, ['rev-parse', '--verify', 'HEAD']).trim(); }
  catch { return null; }
}
export function getGitState(root, baseline) {
  git(root, ['rev-parse', '--git-dir']);
  if (baseline && !/^[a-f0-9]{7,64}$/.test(baseline)) throw new Error('Invalid Git baseline');
  const head = getGitHead(root);
  const split = text => text.split('\0').filter(Boolean);
  const committed = head ? split(baseline
    ? git(root, ['diff', '--name-only', '-z', baseline, head])
    : git(root, ['ls-tree', '-r', '--name-only', '-z', head])) : [];
  const working = split(git(root, ['ls-files', '--modified', '--deleted', '--others', '--exclude-standard', '-z']));
  const staged = split(git(root, ['diff', '--cached', '--name-only', '-z']));
  const changedFiles = [...new Set([...committed, ...working, ...staged])].sort();
  // Only committed changes since the baseline are task evidence; the working tree may hold unrelated edits.
  const committedFiles = [...new Set(committed)].sort();
  const uncommittedFiles = [...new Set([...working, ...staged])].filter(file => !committedFiles.includes(file)).sort();
  const key = createHash('sha256').update(JSON.stringify({ baseline, head, files: changedFiles.map(file => {
    const full = path.join(root, file);
    const stat = fs.lstatSync(full, { throwIfNoEntry: false });
    return [file, !stat ? null : stat.isSymbolicLink() ? ['symlink', fs.readlinkSync(full)]
      : stat.isFile() ? createHash('sha256').update(fs.readFileSync(full)).digest('hex') : 'directory'];
  }) })).digest('hex');
  return { head, changedFiles, committedFiles, uncommittedFiles, key };
}
export function markdownFiles(dir) {
  if (!dir || !fs.existsSync(dir)) return [];
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...markdownFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.md')) result.push(full);
  }
  return result;
}
export function readNote(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { properties: {}, body: content };
  const properties = parse(match[1]) ?? {};
  if (typeof properties !== 'object' || Array.isArray(properties)) throw new Error('Note frontmatter must be a YAML mapping');
  return { properties, body: content.slice(match[0].length) };
}
export function updateNote(content, changes) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  let lines = match ? match[1].split(/\r?\n/) : [];
  for (const key of Object.keys(changes)) {
    const start = lines.findIndex(line => line.startsWith(key + ':'));
    if (start === -1) continue;
    let end = start + 1;
    while (end < lines.length && !/^[^\s#][^:]*:/.test(lines[end])) end++;
    lines.splice(start, end - start);
  }
  lines.push(...Object.entries(changes).map(([key, value]) => `${key}: ${JSON.stringify(value)}`));
  return `---\n${lines.join('\n')}\n---\n${match ? content.slice(match[0].length) : content}`;
}
export function wikiLink(file, paths, label = path.basename(file, '.md')) {
  return `[[${path.relative(paths.vaultRoot, file).split(path.sep).join('/').replace(/\.md$/, '')}|${label}]]`;
}
