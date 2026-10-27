import fs from 'node:fs';
import path from 'node:path';
import { markdownFiles, assertWithin, writeProject } from '../utils.mjs';

export function cmdMigrate(options) {
  const docs = path.join(options.projectRoot, 'docs');
  if (fs.existsSync(docs)) assertWithin(docs, options.projectRoot);
  const migrated = [], skipped = [];
  for (const file of markdownFiles(docs)) {
    assertWithin(file, options.projectRoot);
    const relative = path.relative(docs, file);
    const target = path.join(options.paths.knowledgeDir, 'Импорт', relative);
    if (fs.existsSync(target)) { skipped.push(relative); continue; }
    writeProject(target, fs.readFileSync(file, 'utf8'), options);
    migrated.push({ source: file, target });
  }
  return { success: true, dryRun: Boolean(options.dryRun), migrated, skipped,
    warning: 'Copied documents only; review links, metadata and classification before using them as canonical knowledge. Originals were not removed.' };
}
