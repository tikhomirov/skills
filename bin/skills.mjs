#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const canonicalSource = path.join(repoRoot, 'skills');

const args = process.argv.slice(2);
const isGlobal = args.includes('--global') || args.includes('-g');
const isHelp = args.includes('--help') || args.includes('-h');

if (isHelp) {
  console.log(`
Agent Skills Installer ⚡

Usage:
  npx @tikhomirov/skills [--global|-g] [skill1 skill2 ...]

Options:
  --global, -g    Install skills globally for all projects
  --help, -h      Show this help message

Available skills:
${fs.readdirSync(canonicalSource).filter(d => fs.statSync(path.join(canonicalSource, d)).isDirectory()).map(s => `  - ${s}`).join('\n')}
`);
  process.exit(0);
}

const requestedSkills = args.filter(a => !a.startsWith('-'));
const allAvailableSkills = fs.readdirSync(canonicalSource).filter(d => fs.statSync(path.join(canonicalSource, d)).isDirectory());
const skillsToInstall = requestedSkills.length > 0 ? requestedSkills.filter(s => allAvailableSkills.includes(s)) : allAvailableSkills;

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

for (const dest of destinations) {
  try {
    fs.mkdirSync(dest.path, { recursive: true });

    for (const skill of skillsToInstall) {
      const src = path.join(canonicalSource, skill);
      const target = path.join(dest.path, skill);

      if (!fs.existsSync(src)) continue;

      if (fs.existsSync(target) || fs.lstatSync(target).isSymbolicLink?.()) {
        fs.rmSync(target, { recursive: true, force: true });
      }

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
    console.warn(`⚠ Could not install to ${dest.name} (${dest.path}): ${err.message}`);
  }
}

console.log('\n✨ Done! Your coding agents can now use the installed skills.');
