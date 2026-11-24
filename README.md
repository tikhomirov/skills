# Agent Skills Collection ⚡

[Кратко по-русски](README.ru.md)

A thematic collection of **Agent Skills** for AI coding assistants (**Claude Code**, **Codex**, **OpenCode**, **Pi**, **Cursor**, etc.).

Designed for modern **PHP 8.3+**, **Laravel 11/12/13**, **MoonShine Admin**, **Pest PHP**, **APIs & Webhooks**, **UI/UX Engineering**, and clean **OOP WordPress**.

---

## Experimental status: OF (Obsidian Framework)

**OF is an in-development project and skill, not a production-ready framework or the default workflow for this collection.** Its skill lives in `skills/in-dev/obsidian-framework/`. The related `code-improvement` and `project-workshop` skills are also experiments in `skills/in-dev/`.

Do not activate these skills, rely on their instructions or install them by default. Work on them only when explicitly requested. The installer excludes `in-dev` entirely, including explicitly named skills. Existing external links are not removed automatically.

The OF walkthrough and technical reference below document the experimental project only. They are not general setup instructions. The existing CLI name `obsidian-project-framework` is retained for compatibility.

## Start here: install the shared skill collection

### 1. Install once

You need **Node.js 20+** and Git. Obsidian is not required to install the skill collection.

```bash
git clone https://github.com/tikhomirov/skills.git
cd skills
npm ci
npm link
skills-install --global --link-source --dry-run
skills-install --global --link-source
```

Already cloned? Start with `cd skills`. `npm link` puts the executable helpers on your PATH; `skills-install` installs the agent instructions. If linking fails due to permissions, use a user-owned Node.js installation rather than running the whole setup with sudo.

### Experimental OF walkthrough — explicit opt-in only

The following describes OF development/testing, not default installation. Use a temporary vault; back up any existing data. Obsidian 1.14+ with Bases is needed to inspect the board. The experiment is not available through `skills-install`.

#### Ask your agent to test the experiment

Open **your application's repository** in your AI coding assistant. Restart its session if necessary to discover the newly installed skills. Send:

> Use project-workshop and obsidian-project-framework to set up this project's documentation in Obsidian. Vault: `/absolute/path/to/vault`; project ID: `my-project`. First inspect the project and existing documents, then agree on rules and modules with me. Do not change application code. Back up documents before replacing them. Create module documentation only after my explicit permission.

**Replace the path and ID.** The vault is an existing folder opened in Obsidian, not the application source directory. The agent asks questions and creates the structure; you do not need to write configuration files or learn the CLI first. If skills are not discovered, point the agent to `skills/in-dev/obsidian-framework/SKILL.md` and `skills/in-dev/project-workshop/SKILL.md` in this clone.

#### Inspect the experimental board

In Obsidian, open `Projects/my-project/Tasks/_Задачи.base`. An existing `Проекты/` folder is reused. Initial columns are **Backlog → In Progress → Done**.

- Give the agent a task; it creates the card and records the result.
- Drag cards yourself; before continuing, the agent runs `task sync` and preserves your chosen status.
- Ask to change statuses; their short source of truth is `_statuses.md`.
- Find memory/reports in `_agents/` and accepted user decisions in `Решения/`.
- Ask to archive or restore a completed task by ID; its card and history are retained.

You **do not need to enable Obsidian's own CLI**. Framework commands operate on files. A Done card is not proof that application tests passed.

For manual commands: `obsidian-project-framework --help`. The sections below are reference material, not additional onboarding steps.

## 📦 Included Skills and Frameworks

Verify recommendations and actual diffs before and after changes. Do not use the experimental `code-improvement` skill as a required review process.

| Skill | Description | Location |
|---|---|---|
| **`obsidian`** | Precise instructions for Obsidian tools and formats: Markdown, Properties/YAML, wiki links, Bases, Canvas and the application's CLI. | `skills/engineering/obsidian` |
| **OF / `obsidian-framework`** | **In development.** Experimental project and skill; excluded from installation. | `skills/in-dev/obsidian-framework` |
| **`code-improvement`** | **In development.** Experimental improvement instructions; not a required workflow. | `skills/in-dev/code-improvement` |
| **`project-workshop`** | **In development.** Experimental project setup dialogue. | `skills/in-dev/project-workshop` |
| **`main-rule`** | Baseline senior development rules: simplicity, minimal code volume, step-by-step plans, and working code first. | `skills/System/main-rule` |
| **`moonshine`** | Comprehensive toolkit for building, configuring, and extending Laravel **MoonShine** admin panels (MoonShine 4.x & 3.x). Deep-dive references for ModelResources, CRUD pages, relationships, FormBuilder, TableBuilder, and Blade components. | `skills/code/moonshine` |
| **`laraway`** | Core philosophy, conventions, and pragmatic architecture of **The Laravel Way** (laraway.github.io, Laracasts, community practices). Anti-pattern prevention (no cargo-cult repositories, no N+1, lean controllers, native PHP vs magic balance). | `skills/code/laraway` |
| **`laravel-strict`** | Strict model enforcement (`nunomaduro/essentials`), auto eager loading, immutable dates, HTTP client fakes, Livewire security patterns, and 28 actionable recipes. | `skills/code/laravel-strict` |
| **`pest-testing`** | Pest PHP v3/v4 testing guide for Laravel: Feature/Unit tests, Architecture tests (`arch()`), datasets, and mocking external services (`Http::fake()`, `Queue::fake()`, `Event::fake()`). | `skills/code/pest-testing` |
| **`api-integrations`** | Resilient external API integrations & webhook receivers: HMAC signature validation, idempotency keys, automatic retry backoff, sensitive data masking, and deduplication. | `skills/code/api-integrations` |
| **`wordpress-clean-plugin`** | Modern OOP WordPress development: archetypes (Micro, Combine, Super-plugins), PSR-11 DI container, `wp-queue` background processing, wp-kama performance snippets, mandatory 2FA, restricted REST API, and full project security audit. | `skills/code/wordpress-clean-plugin` |
| **`dandy-style`** | Dandy Code philosophy and 22 structured recipes for clean, idiomatic, readable PHP/Laravel code without unnecessary boilerplate. | `skills/code/dandy-style` |
| **`dandy-design`** | Concise MUST / SHOULD / NEVER rules for building accessible, responsive, fast, and delightful user interfaces. | `skills/ui-ux/dandy-design` |
| **`dandy-commit`** | Pre-commit git diff inspector to eliminate style drift, duplicate abstractions, and noisy AI-generated code smells before pushing. | `skills/engineering/dandy-commit` |
| **`ai-docs-setup`** | Agent entry points and documentation placement. OF-related migration guidance remains experimental and requires explicit opt-in. | `skills/engineering/ai-docs-setup` |

---

## 🚀 One-Line Installation

### Install Globally (All projects & agents)
```bash
curl -sSL https://raw.githubusercontent.com/tikhomirov/skills/main/install.sh | bash -s -- --global
```

### Install Into Current Project Only
```bash
curl -sSL https://raw.githubusercontent.com/tikhomirov/skills/main/install.sh | bash
```

### Install Specific Skills Only
```bash
curl -sSL https://raw.githubusercontent.com/tikhomirov/skills/main/install.sh | bash -s -- --global obsidian laraway
```

---

## 🛠 CLI tools (Node.js 20+)

If you cloned the repository:

```bash
git clone https://github.com/tikhomirov/skills.git
cd skills
```

```bash
# Show available skills and options
./bin/skills-install --help

# Install globally or in the current working directory
./bin/skills-install --global
./bin/skills-install

# Install specific skills
./bin/skills-install --global moonshine pest-testing

# Register package commands in PATH (includes the experimental OF CLI)
npm link
skills-install --help
```

Supported agent paths:
* **Global:** `~/.agents/skills/`, `~/.config/opencode/skills/`, `~/.claude/skills/`, `~/.pi/skills/`
* **Local:** `.agents/skills/`, `.opencode/skills/`, `.claude/skills/`, `.pi/skills/`

---

## Thematic storage and shared source

See [skills storage](docs/skills-storage.md) for the full category tree and safe multi-agent symlinks. For a persistent clone: `./bin/skills-install --global --link-source --dry-run`, then repeat without `--dry-run`. Existing conflicting skills are never replaced in this mode. Zed integration depends on its agent; see the guide.

Experimental entries live under `skills/in-dev/{obsidian-framework,code-improvement,project-workshop}` and are excluded from discovery and installation. OF includes both the experimental skill and its CLI project; keeping the CLI available does not make the project ready for routine use.

## 📁 Repository Structure

```text
skills/
├── skills/                      # Main skills directory
│   ├── System/                  # Baseline rules
│   ├── engineering/             # Workflow, Obsidian, reviews
│   ├── code/                    # PHP, Laravel, WordPress
│   ├── in-dev/                  # Experiments; never installed
│   ├── seo/                     # One directory + SKILL.md per skill
│   ├── tools/                   # Search and skill discovery
│   └── ui-ux/                   # Design and frontend
├── bin/                         # Executable entry points only
│   ├── skills-install
│   └── obsidian-project-framework
├── src/
│   ├── skills-install/          # Multi-agent skills installer
│   └── obsidian-project-framework/ # Framework implementation
│       └── commands/            # Command implementations
├── tests/
│   ├── check.mjs                # Syntax checker, invoked by npm run check / make check
│   ├── skills-install/          # Installer tests
│   └── obsidian-project-framework/ # Framework CLI and workflow tests
├── Makefile                     # Developer shortcuts
├── install.sh                   # Remote one-line curl installer
├── skill.sh                     # Compatibility wrapper for skills-install
└── README.md
```

---

## OF — experimental project reference

**The entire Obsidian Framework project is in development**, including its skill, CLI, templates and generated instructions. The following documents implementation behavior, not a readiness guarantee or mandatory process.

- `skills/engineering/obsidian/` — separate Obsidian tools skill, outside OF;
- `skills/in-dev/obsidian-framework/` — experimental agent entry skill, protocol and recipes;
- generated `AGENTS.md`, `_statuses.md`, templates and navigation — project instructions and structure;
- `bin/obsidian-project-framework` with `src/obsidian-project-framework/` — executable helpers implementing that protocol.

Run the CLI from the project repository. Commands work without Make.

```bash
obsidian-project-framework init --vault ~/Obsidian --project my-project
obsidian-project-framework status --vault ~/Obsidian
obsidian-project-framework task create "Implement authentication" --key auth-login --tag модуль/auth --vault ~/Obsidian
obsidian-project-framework task start TASK-001 --vault ~/Obsidian
obsidian-project-framework context --mode brief --vault ~/Obsidian
obsidian-project-framework context --mode task --task TASK-001 --vault ~/Obsidian
obsidian-project-framework checkpoint "Authentication implemented" --vault ~/Obsidian
obsidian-project-framework knowledge search "authentication" --vault ~/Obsidian
obsidian-project-framework knowledge sync TASK-001 --summary "Implemented login; proposed API documentation updates await user permission" \
  --checks "npm test: 12 passed" --verification passed --vault ~/Obsidian
obsidian-project-framework task complete TASK-001 --vault ~/Obsidian
obsidian-project-framework doctor --vault ~/Obsidian --json
```

Set `OBSIDIAN_VAULT` to avoid repeating `--vault`. Every command supports `--help`.
`context` accepts `--token-budget`; mutation commands support `--dry-run` without creating files or directories. `init --force` refreshes generated templates/views, not user rules or memory.

### Framework structure

```text
<Vault>/Projects/<project>/
  AGENTS.md                  # Rules, architecture and code/navigation map
  _statuses.md               # User-defined status IDs, meanings, roles and column order
  _шаблоны/
  _вложения/
  _служебное/
  Tasks/                     # Existing Задачи/ is reused instead of duplicated
    _Задачи.base             # Native Obsidian Kanban board, created by default
    TASK-001_backlog_2026-10-27.md
  Решения/                   # Append-only user decisions with dates, sources and task IDs
  01_ModuleName/             # Example only: module list/layout must be confirmed by the user
  02_OtherModule/            # Read-only unless the user explicitly requests documentation edits
  _agents/
    Memory/
      NOW.md
      STATE.md
      sessions/
    Knowledge/
    Reports/
```

An existing `Проекты/` directory is reused instead of creating a parallel `Projects/`.
The agent workspace is `_agents/` with basic Memory, Knowledge and Reports folders; additional working materials and skill pointers can be added as needed. No HUMAN/AGENT/Agents directories.

**Modules belong to the user:** propose their list, names and location, ask for confirmation and wait. API is an ordinary possible module, not a required root folder. Fewer than 10 modules may use numbered root folders (01_Name/, 02_Name/) or Модули/; the user chooses. Init does not create any module folders. Module documentation is read-only without an explicit request to edit it; changing code or confirming a module list does not grant that permission.

`_Задачи.base` is a **native Kanban board for Obsidian 1.14+**, not a table, ordinary Cards view or community-plugin Markdown board. Init creates it by default for all `type: task` cards in Tasks/ (or the existing Задачи/ folder). Initial columns: **Backlog → In Progress → Done** (`backlog`, `in-progress`, `done`).

**`_statuses.md` is the single source of truth:** users may extend, rename, describe and reorder statuses. Agents must read the registry before creating or changing tasks, not rely on a fixed list from a skill or code. Its table defines IDs, labels, roles and descriptions; row order defines Kanban columns. Roles backlog/active/done control creation, work and completion checks, not the number of allowed statuses. Existing registries are preserved even with init --force.

After changing the registry, run `obsidian-project-framework task sync` and `doctor`. Before removing/renaming a used value, explicitly map its tasks; unknown values must never be silently hidden. Dragging a card in Obsidian only updates status: **run task sync afterward** to reconcile filenames, dates, tags, links and indexes. Agent-driven completion requires checks and a report. Human board moves are authoritative: sync preserves the chosen status and flags unverified completion rather than reverting it.

Reports now fingerprint Git file **content** and substantive project Markdown (rules, statuses, knowledge, modules and decisions). Generated indexes, task cards, reports and operational memory are excluded to avoid self-invalidating sync. Editing substantive documentation requires a fresh report. Reports created before this verification format must be regenerated before completion. Returning a completed task to any unfinished role invalidates its old completion evidence.

The CLI uses the `yaml` package to parse frontmatter and validate board YAML; install dependencies with `npm ci` when running from a Git clone. `doctor` checks syntax/configuration, not visual rendering or the truth of recorded test results.

**Decisions are append-only:** record what the user decided, when, the source and relevant stable task IDs. Never edit/delete/rename past events; amendments create a new event linked with supersedes. The live timeline and links to current task filenames are generated in `_agents/Knowledge/Решения — таймлайн.md`. Task status changes do not rewrite module documentation or historical decisions.
Tasks have mandatory tags, descriptions, related tasks and dependencies. A status change renames the file, updates its status/date/tag and repairs task links, indexes and memory. The date in the filename is the UTC date of the status change, not the last text edit.

**Idempotency:** repeated `init`, creation with the same `--key` (title by default), setting the current status, unchanged synchronization and identical checkpoints do not create duplicates or rewrite unchanged files. Use a different key for a genuinely new task with the same title. Imports preserve existing destinations and never delete originals. Concurrent mutating operations are protected by a project lock.

`knowledge sync` records supplied results and Git metadata; it does not run tests or approve user decisions. State actual verification results and record proposed module documentation updates in the agent workspace; change module documents only with explicit user permission.

`obsidian` teaches application tools; `obsidian-project-framework` defines the project workflow. Its helper CLI works on files without running Obsidian. Scripts are optional: agents must follow the same protocol manually if they are unavailable.

Migration from the old entry points:

| Old | New |
|---|---|
| `node bin/skills.mjs` | `./bin/skills-install` |
| `node bin/project.mjs` / `project` | `./bin/obsidian-project-framework` / `obsidian-project-framework` |
| `project memory checkpoint "message"` | `obsidian-project-framework checkpoint "message"` |
| `project context brief` | `obsidian-project-framework context --mode brief` |

The npm aliases `skills` and `tikhomirov-skills` remain available for compatibility.
When using `npx`, select a command explicitly:

```bash
npx --package @tikhomirov/skills skills-install --help
npx --package @tikhomirov/skills obsidian-project-framework --help
```

## Development

```bash
make help            # List developer commands (default target)
make check           # Check JavaScript syntax
make test            # Run CLI and workflow tests
make install-local   # Install skills in this repository
make install-global  # Install skills globally
```

`make check` / `npm run check` executes `tests/check.mjs`: it checks JavaScript syntax in the executable entry points, source files and tests via `node --check`. It does not execute the application or replace `make test`. Workflow tests use temporary repositories and vaults, never a user's working project.

### Independent framework evaluations

For parallel evaluations, give each agent a separate output workspace and documentation variant. Treat the target application as read-only: use a sanitized source snapshot, exclude secrets and dependencies, and do not run its scripts, containers or migrations. Keep review artifacts outside both the target application and this repository. Compare source manifests before and after evaluation.

Do not invent user approvals, accepted decisions or a confirmed module list. Put inferred modules in workspace proposals pending confirmation. Reports should cite source paths and distinguish verified facts, hypotheses, unavailable checks and reproducible framework defects.

## 📄 License

MIT © [Aleksei Tikhomirov](https://github.com/tikhomirov)


## Project setup and archive
`project-workshop` is the framework's separate dialogue skill: agree on user-owned rules and module documentation without extending ai-docs-setup. Keep _statuses.md minimal (heading plus table only).
There is no active task index; open Tasks/_Задачи.base. `task archive TASK-ID` moves a completed card to Tasks/_archive/<year>; `task restore TASK-ID` restores it. Archive has a table database _Архив.base and generated _INDEX.md. No automatic archival, no ID reuse.
