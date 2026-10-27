import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import os from "node:os";
export function findProjectRoot(d = process.cwd()) {
  let c = path.resolve(d);
  while (c !== path.parse(c).root) {
    if (fs.existsSync(path.join(c, ".git")) || fs.existsSync(path.join(c, "AGENTS.md"))) return c;
    c = path.dirname(c);
  }
  return path.resolve(d);
}
export function getProjectId(r) {
  const m = path.join(r, ".project-id");
  if (fs.existsSync(m)) {
    const id = fs.readFileSync(m, "utf8").trim();
    if (id) return id;
  }
  return path.basename(r);
}
export function findVaultRoot(c = null) {
  if (c && fs.existsSync(c)) return path.resolve(c);
  if (process.env.OBSIDIAN_VAULT && fs.existsSync(process.env.OBSIDIAN_VAULT)) {
    return path.resolve(process.env.OBSIDIAN_VAULT);
  }
  const cand = [path.join(os.homedir(), "Homeserver/Obsidian"), path.join(os.homedir(), "Obsidian")];
  for (const p of cand) { if (fs.existsSync(p)) return p; }
  return null;
}
export function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
export function safeWrite(p, content, dryRun = false) {
  if (dryRun) { console.log("[dry-run] Would write: " + p); return; }
  ensureDir(path.dirname(p));
  const tmp = p + ".tmp." + Date.now();
  fs.writeFileSync(tmp, content, "utf8");
  fs.renameSync(tmp, p);
}
export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 3.5);
}
export function getGitDiff(cwd) {
  try { return execSync("git diff HEAD", { cwd, encoding: "utf8" }); } catch { return ""; }
}
export function getGitHead(cwd) {
  try { return execSync("git rev-parse --short HEAD", { cwd, encoding: "utf8" }).trim(); } catch { return "initial"; }
}
