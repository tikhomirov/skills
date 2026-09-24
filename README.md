# Agent Skills Collection ⚡

A curated collection of production-ready **Agent Skills** for AI coding assistants (Claude Code, Codex, OpenCode, Pi, Cursor, etc.).

---

## 📦 Included Skills

| Skill | Description | Location |
|---|---|---|
| **`moonshine`** | Comprehensive toolkit for building, configuring, and extending Laravel **MoonShine** admin panels (MoonShine 4.x & 3.x). Includes deep-dive references for ModelResources, CRUD pages, relationships, FormBuilder, TableBuilder, and Blade components. | `skills/moonshine` |
| **`dandy-style`** | Dandy Code philosophy and 22 structured recipes for clean, idiomatic, readable, and maintainable PHP/Laravel code without unnecessary boilerplate. | `skills/dandy-style` |
| **`dandy-design`** | Concise MUST / SHOULD / NEVER rules for building accessible, responsive, fast, and delightful user interfaces. | `skills/dandy-design` |
| **`dandy-commit`** | Pre-commit git diff inspector to eliminate style drift, duplicate abstractions, and noisy AI-generated code smells before pushing. | `skills/dandy-commit` |

---

## 🚀 Quick Start & Installation

### Option 1: Using the installation script

Clone this repository and run the installer:

```bash
git clone https://github.com/tikhomirov/skills.git
cd skills
```

**Install globally (available across all your projects):**
```bash
./skill.sh --global
```

**Install locally in the current project (`.agents/skills/` & `.claude/skills/`):**
```bash
./skill.sh
```

**Install only a specific skill (e.g. MoonShine):**
```bash
./skill.sh --global moonshine
```

---

### Option 2: Manual Installation

Copy or symlink the desired skill folder from `skills/<skill-name>` to your agent's skills directory:

* **Global Agent Skills:** `~/.agents/skills/<skill-name>` or `~/.config/opencode/skills/<skill-name>`
* **Project Agent Skills:** `<your-project>/.agents/skills/<skill-name>`
* **Claude Code Skills:** `~/.claude/skills/<skill-name>` or `<your-project>/.claude/skills/<skill-name>`

---

## 📁 Repository Structure

```text
skills/
├── skills/                      # Main skills source directory
│   ├── moonshine/               # MoonShine 4.x admin panel skill & references
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── model-resources.md
│   │       ├── fields-guide.md
│   │       ├── relationships.md
│   │       ├── blade-components.md
│   │       └── common-patterns.md
│   ├── dandy-style/             # Dandy Code PHP/Laravel design recipes
│   │   ├── SKILL.md
│   │   ├── recipe-map.md
│   │   └── recipes/
│   ├── dandy-design/            # UI/UX engineering rules
│   │   └── SKILL.md
│   └── dandy-commit/            # Safe git diff pre-commit review
│       └── SKILL.md
├── .agents/skills/              # Compatibility mirror
├── skill.sh                     # Fast multi-agent installer script
└── README.md
```

---

## 🛠 Adding New Skills

1. Create a directory inside `skills/<your-skill-name>/`.
2. Add a `SKILL.md` file starting with YAML frontmatter:
   ```yaml
   ---
   name: your-skill-name
   description: Concise description explaining when this skill should be invoked.
   ---
   ```
3. Place any extended guides, schemas, or templates in `references/` or `assets/`.
4. Run `./skill.sh --global <your-skill-name>` to install.

---

## 📄 License

MIT
