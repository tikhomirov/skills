# Agent Skills Collection ⚡

A curated collection of production-ready **Agent Skills** for AI coding assistants (**Claude Code**, **Codex**, **OpenCode**, **Pi**, **Cursor**, etc.).

Designed for modern **PHP 8.3+**, **Laravel 11/12/13**, **MoonShine Admin**, **Pest PHP**, **APIs & Webhooks**, **UI/UX Engineering**, and clean **OOP WordPress**.

---

## 📦 Included Skills

| Skill | Description | Location |
|---|---|---|
| **`moonshine`** | Comprehensive toolkit for building, configuring, and extending Laravel **MoonShine** admin panels (MoonShine 4.x & 3.x). Deep-dive references for ModelResources, CRUD pages, relationships, FormBuilder, TableBuilder, and Blade components. | `skills/moonshine` |
| **`laravel-best-practices`** | Modern Laravel architecture: single-action controllers/actions, form requests, Eloquent eager loading, query optimization, standard API envelopes, and security best practices. | `skills/laravel-best-practices` |
| **`laravel-strict`** | Strict model enforcement (`nunomaduro/essentials`), auto eager loading, immutable dates, HTTP client fakes, Livewire security patterns, and 28 actionable recipes. | `skills/laravel-strict` |
| **`pest-testing`** | Pest PHP v3/v4 testing guide for Laravel: Feature/Unit tests, Architecture tests (`arch()`), datasets, and mocking external services (`Http::fake()`, `Queue::fake()`, `Event::fake()`). | `skills/pest-testing` |
| **`api-integrations`** | Resilient external API integrations & webhook receivers: HMAC signature validation, idempotency keys, automatic retry backoff, sensitive data masking, and deduplication. | `skills/api-integrations` |
| **`wordpress-clean-plugin`** | Modern Object-Oriented WordPress & WooCommerce plugins with PSR-4 autoloading, strict security (nonces/capabilities), Transients caching, and zero global clutter. | `skills/wordpress-clean-plugin` |
| **`dandy-style`** | Dandy Code philosophy and 22 structured recipes for clean, idiomatic, readable PHP/Laravel code without unnecessary boilerplate. | `skills/dandy-style` |
| **`dandy-design`** | Concise MUST / SHOULD / NEVER rules for building accessible, responsive, fast, and delightful user interfaces. | `skills/dandy-design` |
| **`dandy-commit`** | Pre-commit git diff inspector to eliminate style drift, duplicate abstractions, and noisy AI-generated code smells before pushing. | `skills/dandy-commit` |
| **`ai-docs-setup`** | Automated setup of standardized agent documentation (`AGENTS.md`, `CLAUDE.md`, `.ai/MEMORY.md`, `.ai/project-rules.md`, `.ai/glossary.md`). | `skills/ai-docs-setup` |

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
curl -sSL https://raw.githubusercontent.com/tikhomirov/skills/main/install.sh | bash -s -- --global moonshine laravel-best-practices pest-testing
```

---

## 🛠 Local CLI Installation (`skill.sh`)

If you cloned the repository:

```bash
git clone https://github.com/tikhomirov/skills.git
cd skills
```

```bash
# Global install
./skill.sh --global

# Local project install
./skill.sh

# Install specific skills
./skill.sh --global moonshine pest-testing
```

Supported agent paths:
* **Global:** `~/.agents/skills/`, `~/.config/opencode/skills/`, `~/.claude/skills/`, `~/.pi/skills/`
* **Local:** `.agents/skills/`, `.opencode/skills/`, `.claude/skills/`, `.pi/skills/`

---

## 📁 Repository Structure

```text
skills/
├── skills/                      # Main skills directory
│   ├── moonshine/
│   ├── laravel-best-practices/
│   ├── laravel-strict/
│   ├── pest-testing/
│   ├── api-integrations/
│   ├── wordpress-clean-plugin/
│   ├── dandy-style/
│   ├── dandy-design/
│   ├── dandy-commit/
│   └── ai-docs-setup/
├── .agents/skills/              # Compatibility mirror
├── install.sh                   # Remote one-line curl installer
├── skill.sh                     # Local multi-agent installer script
└── README.md
```

---

## 📄 License

MIT © [Aleksei Tikhomirov](https://github.com/tikhomirov)
