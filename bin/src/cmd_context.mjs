import fs from "node:fs";
import path from "node:path";
import { estimateTokens } from "./utils.mjs";
import { CONTEXT_MODES } from "./constants.mjs";
export function cmdContext(options) {
  const { paths, mode = "brief", tokenBudget = 4000, projectRoot, taskId, topic } = options;
  let sections = [];
  const agentsFile = path.join(projectRoot, "AGENTS.md");
  if (fs.existsSync(agentsFile)) sections.push({ title: "L0: AGENTS.md", content: fs.readFileSync(agentsFile, "utf8") });
  if (fs.existsSync(paths.nowFile)) sections.push({ title: "L1: NOW.md", content: fs.readFileSync(paths.nowFile, "utf8") });
  if (mode !== "brief") {
    if (fs.existsSync(paths.stateFile)) sections.push({ title: "L2: STATE.md", content: fs.readFileSync(paths.stateFile, "utf8") });
    if (fs.existsSync(paths.projectMd)) sections.push({ title: "L2: PROJECT.md", content: fs.readFileSync(paths.projectMd, "utf8") });
  }
  if (mode === "task") {
    let targetTask = taskId;
    if (!targetTask && fs.existsSync(paths.nowFile)) {
      const m = fs.readFileSync(paths.nowFile, "utf8").match(/\[\[(TASK-\d+)\]\]/);
      if (m) targetTask = m[1];
    }
    if (targetTask) {
      const tFile = path.join(paths.tasksDir, targetTask + ".md");
      if (fs.existsSync(tFile)) sections.push({ title: "Task: " + targetTask, content: fs.readFileSync(tFile, "utf8") });
    }
  }
  if (mode === "topic" && topic) {
    function scanTopic(dir) {
      if (!fs.existsSync(dir)) return;
      for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) scanTopic(full);
        else if (f.endsWith(".md") && (f.toLowerCase().includes(topic.toLowerCase()) || fs.readFileSync(full, "utf8").toLowerCase().includes(topic.toLowerCase()))) {
          sections.push({ title: "Topic doc: " + f, content: fs.readFileSync(full, "utf8") });
        }
      }
    }
    scanTopic(paths.knowledgeDir);
  }
  if (mode === "full" || mode === "resume") {
    if (fs.existsSync(paths.sessionsDir)) {
      const sessions = fs.readdirSync(paths.sessionsDir).filter(f => f.endsWith(".md")).sort().reverse();
      if (sessions.length > 0) {
        const lastSession = path.join(paths.sessionsDir, sessions[0]);
        sections.push({ title: "L3: Last Session (" + sessions[0] + ")", content: fs.readFileSync(lastSession, "utf8") });
      }
    }
  }
  let fullOutput = "";
  let tokenCount = 0;
  let truncated = false;
  for (const s of sections) {
    const block = "\\n=== " + s.title + " ===\\n" + s.content.trim() + "\\n";
    const t = estimateTokens(block);
    if (tokenCount + t > tokenBudget) {
      truncated = true;
      fullOutput += "\\n[WARNING: Token budget exceeded (" + tokenBudget + "). Output truncated.]\\n";
      break;
    }
    fullOutput += block;
    tokenCount += t;
  }
  return { output: fullOutput.trim(), tokenCount, truncated, sectionsCount: sections.length };
}
