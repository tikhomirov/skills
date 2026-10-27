import fs from "node:fs";
import path from "node:path";
import { safeWrite, ensureDir } from "./utils.mjs";
export function cmdMigrate(options) {
  const { paths, projectRoot, dryRun } = options;
  const migrated = [];
  const docsDir = path.join(projectRoot, "docs");
  if (fs.existsSync(docsDir)) {
    for (const f of fs.readdirSync(docsDir)) {
      const full = path.join(docsDir, f);
      if (fs.statSync(full).isFile() && f.endsWith(".md")) {
        const target = path.join(paths.featuresDir, f);
        if (!fs.existsSync(target)) {
          const c = fs.readFileSync(full, "utf8");
          const header = "# Migrated from docs/" + f + "\\n\\n";
          safeWrite(target, header + c, dryRun);
          migrated.push("docs/" + f + " -> knowledge/features/" + f);
        }
      }
    }
  }
  const aiDir = path.join(projectRoot, ".ai");
  if (fs.existsSync(aiDir)) {
    for (const f of fs.readdirSync(aiDir)) {
      const full = path.join(aiDir, f);
      if (fs.statSync(full).isFile() && f.endsWith(".md")) {
        const target = path.join(paths.archDir, f);
        if (!fs.existsSync(target)) {
          const c = fs.readFileSync(full, "utf8");
          const header = "# Migrated from .ai/" + f + "\\n\\n";
          safeWrite(target, header + c, dryRun);
          migrated.push(".ai/" + f + " -> knowledge/architecture/" + f);
        }
      }
    }
  }
  return { success: true, count: migrated.length, migrated };
}
