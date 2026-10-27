import fs from 'node:fs';
import path from 'node:path';
export function getProjectPaths(vaultRoot, projectId) {
  const base = path.join(vaultRoot, "Projects", projectId);
  return {
    base,
    projectMd: path.join(base, "PROJECT.md"),
    tasksBase: path.join(base, "TASKS.base"),
    tasksDir: path.join(base, "tasks"),
    memoryDir: path.join(base, "memory"),
    nowFile: path.join(base, "memory", "NOW.md"),
    stateFile: path.join(base, "memory", "STATE.md"),
    sessionsDir: path.join(base, "memory", "sessions"),
    knowledgeDir: path.join(base, "knowledge"),
    knowledgeIndex: path.join(base, "knowledge", "INDEX.md"),
    archDir: path.join(base, "knowledge", "architecture"),
    featuresDir: path.join(base, "knowledge", "features"),
    decisionsDir: path.join(base, "knowledge", "decisions"),
    glossaryDir: path.join(base, "knowledge", "glossary"),
    roadmapFile: path.join(base, "planning", "ROADMAP.md")
  };
}
