import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const files = ['bin/skills-install', 'bin/obsidian-project-framework'];
for (const root of ['src', 'tests']) {
  for (const file of fs.readdirSync(root, { recursive: true })) {
    if (file.endsWith('.mjs')) files.push(`${root}/${file}`);
  }
}
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.error || result.status !== 0) process.exit(1);
}
console.log(`Syntax OK: ${files.length} files`);
