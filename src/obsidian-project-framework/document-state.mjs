import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { markdownFiles } from './utils.mjs';

// Only substantive project documents; generated navigation, tasks, reports and operational memory
// change during sync itself and must not invalidate their own evidence.
export function getDocumentState(paths) {
  const excluded = [paths.tasksDir, paths.memoryDir, paths.reportsDir, paths.templatesDir, paths.attachmentsDir, paths.serviceDir];
  const files = markdownFiles(paths.base).filter(file => !excluded.some(dir => file.startsWith(dir + path.sep)))
    .filter(file => path.basename(file) !== '_INDEX.md' && file !== paths.decisionsTimeline).sort();
  return createHash('sha256').update(JSON.stringify(files.map(file => [
    path.relative(paths.base, file), createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
  ]))).digest('hex');
}
