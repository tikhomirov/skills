#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { VERSION } from "./src/constants.mjs";
import { findProjectRoot, getProjectId, findVaultRoot } from "./src/utils.mjs";
import { getProjectPaths } from "./src/paths.mjs";
import { cmdInit } from "./src/cmd_init.mjs";
import { cmdStatus } from "./src/cmd_status.mjs";
import { cmdTaskCreate, cmdTaskStart, cmdTaskComplete } from "./src/cmd_tasks.mjs";
import { cmdContext } from "./src/cmd_context.mjs";
import { cmdCheckpoint } from "./src/cmd_memory.mjs";
import { cmdKnowledgeSearch, cmdKnowledgeSync } from "./src/cmd_knowledge.mjs";
import { cmdMigrate } from "./src/cmd_migrate.mjs";
import { cmdDoctor } from "./src/cmd_doctor.mjs";
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h") || args.length === 0) {
  console.log("Obsidian Project OS CLI v" + VERSION + "\
\
Usage: project <command> [options]\
\
Commands:\
  init\
  status\
  task create <title>\
  task start <id>\
  task complete <id>\
  context [mode]\
  memory checkpoint [msg]\
  knowledge search <query>\
  knowledge sync [id]\
  migrate\
  doctor");
  process.exit(0);
}
const flags = { dryRun: args.includes("--dry-run"), force: args.includes("--force"), json: args.includes("--json") };
let vaultArg = null;
const vIdx = args.indexOf("--vault"); if (vIdx !== -1 && args[vIdx + 1]) vaultArg = args[vIdx + 1];
let projArg = null;
const pIdx = args.indexOf("--project"); if (pIdx !== -1 && args[pIdx + 1]) projArg = args[pIdx + 1];
let tokenBudget = 4000;
const tbIdx = args.indexOf("--token-budget"); if (tbIdx !== -1 && args[tbIdx + 1]) tokenBudget = parseInt(args[tbIdx + 1], 10);
const projectRoot = findProjectRoot();
const projectId = projArg || getProjectId(projectRoot);
const vaultRoot = findVaultRoot(vaultArg);
const paths = vaultRoot ? getProjectPaths(vaultRoot, projectId) : {};
const cmd = args[0];
try {
  let res;
  if (cmd === "init") res = cmdInit({ projectRoot, vaultRoot, projectId, paths, ...flags });
  else if (cmd === "status") res = cmdStatus({ paths, projectId });
  else if (cmd === "task") {
    const sub = args[1];
    if (sub === "create") res = cmdTaskCreate({ paths, title: args[2] || "Новая задача", ...flags });
    else if (sub === "start") res = cmdTaskStart({ paths, taskId: args[2], ...flags });
    else if (sub === "complete") res = cmdTaskComplete({ paths, taskId: args[2], ...flags });
    else throw new Error("Unknown task subcommand: " + sub);
  }
  else if (cmd === "context") res = cmdContext({ paths, mode: args[1] || "brief", tokenBudget, projectRoot, taskId: args[2], topic: args[2] });
  else if (cmd === "memory" && args[1] === "checkpoint") res = cmdCheckpoint({ paths, projectRoot, message: args[2] || "Manual checkpoint", ...flags });
  else if (cmd === "knowledge") {
    const sub = args[1];
    if (sub === "search") res = cmdKnowledgeSearch({ paths, query: args[2] || "" });
    else if (sub === "sync") res = cmdKnowledgeSync({ paths, projectRoot, taskId: args[2], ...flags });
    else throw new Error("Unknown knowledge subcommand: " + sub);
  }
  else if (cmd === "migrate") res = cmdMigrate({ paths, projectRoot, ...flags });
  else if (cmd === "doctor") res = cmdDoctor({ paths, projectRoot, vaultRoot });
  else throw new Error("Unknown command: " + cmd);
  if (flags.json) console.log(JSON.stringify(res, null, 2));
  else if (res && res.output) console.log(res.output);
  else console.log(res);
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
