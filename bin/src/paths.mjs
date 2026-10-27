import fs from "node:fs";
import path from "node:path";
export function getProjectPaths(vaultRoot, projectId) {
  const base = path.join(vaultRoot, "Projects", projectId);
  const human = path.join(base, "HUMAN");
  const agent = path.join(base, "AGENT");
  return {
    base, humanDir: human, agentDir: agent,
    humanProjectMd: path.join(human, "PROJECT.md"),
    humanRulesMd: path.join(human, "RULES.md"),
    humanArchMd: path.join(human, "ARCHITECTURE.md"),
    humanGlossaryMd: path.join(human, "GLOSSARY.md"),
    humanRoadmapMd: path.join(human, "ROADMAP.md"),
    humanIndexMd: path.join(human, "INDEX.md"),
    humanDecisionsDir: path.join(human, "DECISIONS"),
    tasksBase: path.join(agent, "TASKS.base"),
    tasksDir: path.join(agent, "tasks"),
    memoryDir: path.join(agent, "memory"),
    nowFile: path.join(agent, "memory", "NOW.md"),
    stateFile: path.join(agent, "memory", "STATE.md"),
    sessionsDir: path.join(agent, "memory", "sessions"),
    knowledgeDir: path.join(agent, "knowledge"),
    knowledgeIndex: path.join(agent, "knowledge", "INDEX.md"),
    proposalsDir: path.join(agent, "proposals"),
    reportsDir: path.join(agent, "reports")
  };
}
