import fs from "node:fs";
import path from "node:path";
import { safeWriteAgent, ensureDir } from "./utils.mjs";
export function cmdMigrate(options) {
  const { paths, projectRoot, dryRun } = options; const migrated = [];
  const docsDir = path.join(projectRoot, "docs");
  ensureDir(paths.knowledgeDir);
  if (fs.existsSync(docsDir)) {
    for (const f of fs.readdirSync(docsDir)) {
      const full = path.join(docsDir, f);
      if (fs.statSync(full).isFile() && f.endsWith(".md")) {
        const target = path.join(paths.knowledgeDir, f);
        if (!fs.existsSync(target)) {
          const c = fs.readFileSync(full, "utf8");
          const header = "# Migrated from docs/" + f + "\\n\\n";
          safeWriteAgent(target, header + c, dryRun, paths);
          migrated.push("docs/" + f + " -> AGENT/knowledge/" + f);
        }
      }
    }
  }
  return { success: true, count: migrated.length, migrated };
}
