#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');
const canonicalSource = path.join(repoRoot, 'skills');

const args = process.argv.slice(2);
const isGlobal = args.includes('--global') || args.includes('-g');
const isHelp = args.includes('--help') || args.includes('-h');

if (isHelp) {
  console.log(`
Agent Skills Installer ⚡

Usage:
  skills-install [--global|-g] [skill1 skill2 ...]
  skills-install laraway pest-testing --global

Options:
  --global, -g    Install skills globally for all projects
  --help, -h      Show this help message

Available skills:
${fs.readdirSync(canonicalSource).filter(d => fs.statSync(path.join(canonicalSource, d)).isDirectory()).map(s => `  - ${s}`).join('\n')}
`);
  process.exit(0);
}

const unknownFlags = args.filter(a => a.startsWith('-') && !['--global', '-g'].includes(a));
if (unknownFlags.length) {
  console.error(`Unknown option: ${unknownFlags.join(', ')}. See skills-install --help.`);
  process.exit(1);
}
const requestedSkills = args.filter(a => !a.startsWith('-'));
const allAvailableSkills = fs.readdirSync(canonicalSource).filter(d => fs.statSync(path.join(canonicalSource, d)).isDirectory());
const unknownSkills = requestedSkills.filter(s => !allAvailableSkills.includes(s));
if (unknownSkills.length) {
  console.error(`Unknown skill: ${unknownSkills.join(', ')}. See skills-install --help.`);
  process.exit(1);
}
const skillsToInstall = requestedSkills.length > 0 ? [...new Set(requestedSkills)] : allAvailableSkills;

const homeDir = os.homedir();
const cwd = process.cwd();

const destinations = isGlobal
  ? [
      { name: '.agents', path: path.join(homeDir, '.agents', 'skills'), type: 'copy' },
      { name: 'opencode', path: path.join(homeDir, '.config', 'opencode', 'skills'), type: 'copy' },
      { name: 'claude', path: path.join(homeDir, '.claude', 'skills'), type: 'symlink' },
      { name: 'pi', path: path.join(homeDir, '.pi', 'skills'), type: 'symlink' },
    ]
  : [
      { name: '.agents', path: path.join(cwd, '.agents', 'skills'), type: 'copy' },
      { name: 'opencode', path: path.join(cwd, '.opencode', 'skills'), type: 'copy' },
      { name: 'claude', path: path.join(cwd, '.claude', 'skills'), type: 'symlink' },
      { name: 'pi', path: path.join(cwd, '.pi', 'skills'), type: 'symlink' },
    ];

console.log(`Installing skills: ${skillsToInstall.join(', ')} (${isGlobal ? 'Globally' : 'Locally in current project'})...\n`);

function sameTree(source, target) {
  const existing = fs.lstatSync(target, { throwIfNoEntry: false });
  if (!existing) return false;
  const original = fs.lstatSync(source);
  if (original.isSymbolicLink()) return existing.isSymbolicLink() && fs.readlinkSync(source) === fs.readlinkSync(target);
  if (original.isDirectory()) {
    if (!existing.isDirectory()) return false;
    const names = fs.readdirSync(source).sort();
    const other = fs.readdirSync(target).sort();
    return names.length === other.length && names.every((name, i) => name === other[i] && sameTree(path.join(source, name), path.join(target, name)));
  }
  return original.isFile() && existing.isFile() && fs.readFileSync(source).equals(fs.readFileSync(target));
}

for (const dest of destinations) {
  try {
    fs.mkdirSync(dest.path, { recursive: true });

    for (const skill of skillsToInstall) {
      // Links must survive removal of an npm cache or the remote installer's temporary clone.
      const src = dest.type === 'symlink'
        ? path.join(destinations[0].path, skill)
        : path.join(canonicalSource, skill);
      const target = path.join(dest.path, skill);

      if (!fs.existsSync(src)) continue;

      const existing = fs.lstatSync(target, { throwIfNoEntry: false });
      if (dest.type === 'symlink' && existing?.isSymbolicLink() && path.resolve(path.dirname(target), fs.readlinkSync(target)) === src) continue;
      if (!existing?.isSymbolicLink() && sameTree(src, target)) continue;
      if (existing?.isSymbolicLink()) fs.unlinkSync(target);
      else if (existing) fs.rmSync(target, { recursive: true, force: true });

      if (dest.type === 'copy') {
        fs.cpSync(src, target, { recursive: true });
      } else {
        try {
          fs.symlinkSync(src, target, 'dir');
        } catch {
          fs.cpSync(src, target, { recursive: true });
        }
      }
    }
    console.log(`✔ [${dest.name}] Installed to ${dest.path}`);
  } catch (err) {
    console.error(`Could not install to ${dest.name} (${dest.path}): ${err.message}`);
    process.exitCode = 1;
  }
}

if (!process.exitCode) console.log('\nDone! Your coding agents can now use the installed skills.');
