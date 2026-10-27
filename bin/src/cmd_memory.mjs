import fs from "node:fs";
import path from "node:path";
import { safeWrite, ensureDir, getGitHead, getGitDiff } from "./utils.mjs";
export function cmdCheckpoint(options) {
  const { paths, projectRoot, message = "Checkpoint", dryRun } = options;
  ensureDir(paths.sessionsDir);
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, "-");
  const sessionFile = path.join(paths.sessionsDir, "session-" + dateStr + ".md");
  const commit = getGitHead(projectRoot);
  let nowContent = "";
  if (fs.existsSync(paths.nowFile)) nowContent = fs.readFileSync(paths.nowFile, "utf8");
  const sessionBody = "# Сессия: " + dateStr + "\\n\\n**Сообщение:** " + message + "\\n**Git commit:** " + commit + "\\n**Время:** " + now.toISOString() + "\\n\\n## Снимок NOW\\n" + nowContent + "\\n";
  safeWrite(sessionFile, sessionBody, dryRun);
  return { success: true, sessionFile, commit };
}
