<p align="center">
  <img src="https://raw.githubusercontent.com/nunomaduro/essentials/main/art/header-light.png" width="320" alt="Nunomaduro Essentials" />
</p>

<h1 align="center">Laravel Strict — Claude Skill</h1>

<p align="center">
  Claude Code skill for reviewing and improving PHP/Laravel projects.
  <br>
  Built on <a href="https://github.com/nunomaduro/essentials"><code>nunomaduro/essentials</code></a>, <a href="https://github.com/nunomaduro/larastan"><code>nunomaduro/larastan</code></a>, <a href="https://github.com/tikhomirov/dandy-code-skills">Dandy Style</a>, and Livewire security patterns.
</p>

<p align="center">
  <a href="https://github.com/tikhomirov/laravel-strict-skill/releases"><img alt="GitHub Release" src="https://img.shields.io/github/v/release/tikhomirov/laravel-strict-skill?style=flat-square"></a>
  <a href="https://github.com/tikhomirov/laravel-strict-skill/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square"></a>
  <img alt="PHP" src="https://img.shields.io/badge/PHP-8.2%2B-777BB4?style=flat-square&logo=php&logoColor=white">
  <img alt="Laravel" src="https://img.shields.io/badge/Laravel-11%2B-FF2D20?style=flat-square&logo=laravel&logoColor=white">
  <img alt="Agents" src="https://img.shields.io/badge/agents-Claude%20Code%20%7C%20.agents-purple?style=flat-square">
</p>

<p align="center">
  <a href="#english">English</a> ·
  <a href="#install">Install</a> ·
  <a href="#skills">Skills</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="#recipes">Recipes</a> ·
  <a href="https://github.com/tikhomirov/laravel-strict-skill/releases">Releases</a>
</p>

---

<a id="english"></a>

## English

Laravel Strict is a small skill for AI coding agents. It helps them review and improve any PHP/Laravel project using the rules and ideas of [`nunomaduro/essentials`](https://github.com/nunomaduro/essentials) (strict models, auto eager loading, immutable dates, fake sleep, prevent stray requests, opinionated Pint/Rector configs) combined with [`nunomaduro/larastan`](https://github.com/nunomaduro/larastan) generics, [Dandy Style](https://github.com/tikhomirov/dandy-code-skills) readability principles, Laravel core team patterns, and Livewire security recipes.

The skill is structured for lazy loading. A small `SKILL.md` carries the principles; `recipe-map.md` and `source-map.md` route the agent to the right recipe; the 28 recipes in `recipes/` stay under 2.5 KB each and load only when a matching smell is detected.

**Use it for:** audit, code review, refactor planning, security checks (Livewire IDOR), N+1 detection, or as a quality filter inside another task.

<a id="install"></a>

## Install

### Interactive

```bash
curl -fsSL https://raw.githubusercontent.com/tikhomirov/laravel-strict-skill/main/install.sh | bash
```

The installer asks:

- **Where to install** — globally (`~/.agents/skills/` + `~/.claude/skills/` symlink) or locally in the current project.
- **Clean previous install** — remove any existing `laravel-strict` skill before installing the new one. Other skills in your `skills` directory are not touched.

### Non-interactive

```bash
# Global install, accept defaults
curl -fsSL https://raw.githubusercontent.com/tikhomirov/laravel-strict-skill/main/install.sh \
  | bash -s -- --global --yes

# Local install in a specific project
curl -fsSL https://raw.githubusercontent.com/tikhomirov/laravel-strict-skill/main/install.sh \
  | bash -s -- --local ~/Projects/my-app --yes

# Dry run (prints actions, changes nothing)
curl -fsSL https://raw.githubusercontent.com/tikhomirov/laravel-strict-skill/main/install.sh \
  | bash -s -- --global --yes --dry-run
```

### Manual (no installer)

```bash
git clone https://github.com/tikhomirov/laravel-strict-skill.git \
  ~/.agents/skills/laravel-strict

ln -s ../../.agents/skills/laravel-strict \
  ~/.claude/skills/laravel-strict
```

For a per-project install, drop the `ln -s` and clone into `.agents/skills/` of your project.

### Uninstall

```bash
curl -fsSL https://raw.githubusercontent.com/tikhomirov/laravel-strict-skill/main/install.sh \
  | bash -s -- --uninstall
```

<a id="skills"></a>

## Skills

| Skill | Invocation | Use when |
|---|---|---|
| `laravel-strict` | `/laravel-strict` | You want a 5-minute shallow scan of the project with 3–5 improvement areas, or a quality filter on a specific file/method. |

Good prompts:

```text
Review this project in laravel-strict.
Audit my Laravel app with laravel-strict.
Check this Livewire component for security issues.
/laravel-strict detect-n-plus-one on app/Livewire/Entries
```

<a id="how-it-works"></a>

## How it works

The skill follows the **Dandy Style** layout: one canonical skills tree, lazy loading, recipes per smell.

```text
laravel-strict/
├── SKILL.md               # principles, invocation modes, working formula
├── recipe-map.md          # smell → recipe (load this first)
├── source-map.md          # source → recipe (essentials, larastan, dandy, livewire)
├── 16-point-checklist.md  # audit backbone (13 essentials + 3 Livewire)
├── quick-audit.md         # 5-minute shallow scan workflow
├── install.sh             # this installer
└── recipes/               # 28 compact recipes (700B–2.5K each)
```

Loading order:

1. `SKILL.md` — always.
2. `recipe-map.md` for broad reviews.
3. Only the recipes that match the detected smell.
4. `quick-audit.md` for the 5-minute scan workflow.
5. `16-point-checklist.md` for full readiness scoring.

Loading limits (to keep your context window sane):

- **Contextual mode** — at most 1–3 recipes.
- **Review mode** — load `recipe-map.md`, then recipes after detecting smells.
- **Commit mode** — inspect changed files first; load the recipe that matches the smell.
- **Never** load all recipes "just in case".

<a id="recipes"></a>

## Recipes

### Essentials (from `nunomaduro/essentials` package)

| Recipe | Smell |
|---|---|
| `strict-models.md` | Lazy loading, missing attributes, mass-assignment slips |
| `auto-eager-load.md` | N+1 queries, missing `with()`, repeated eager load boilerplate |
| `unguard.md` | `$guarded = []` on a model, project trusts all input |
| `immutable-dates.md` | `Carbon::now()->addDay()` mutates shared dates |
| `force-https.md` | Mixed HTTP/HTTPS in production URLs |
| `safe-console.md` | `migrate:fresh` ran by accident in production |
| `asset-prefetch.md` | Front-end loads slowly, no Vite prefetching |
| `prevent-stray-requests.md` | Test makes a real HTTP call it did not fake |
| `fake-sleep.md` | `sleep(5)` in code, real seconds in tests |
| `password-defaults.md` | Weak password validation, no `uncompromised()` check |
| `make-action.md` | Need a `final readonly` Action class template |
| `pint-config.md` | Default `pint.json` is too permissive |
| `rector-config.md` | Default `rector.php` misses dead code / type decls |

### Laravel / PHP best practices

| Recipe | Smell |
|---|---|
| `final-readonly.md` | Service or Action class is not `final`, properties mutate |
| `scope-attrs.md` | `scopeForUser($query, $id)` legacy, no type hints |
| `phpdoc-generics.md` | Relation return types are `mixed`, IDE loses tracking |
| `enums-cast.md` | String field has a fixed set of values (status, role, type) |
| `actions-pattern.md` | Business logic in controller / Livewire, more than 5 lines |
| `query-builder.md` | `DB::raw("... $var ...")` with interpolation |
| `pest-migration.md` | Want to migrate a single test file to Pest |
| `detect-n-plus-one.md` | Slow pages, repeated queries in loops |
| `audit-passwords.md` | Need to harden `Password::defaults()` to production rules |
| `audit-mass-assignment.md` | `Model::create($request->all())`, unsafe `$fillable` |

### Livewire security

| Recipe | Smell |
|---|---|
| `lw-locked.md` | `public ?int $editingId` — IDOR via DevTools |
| `lw-boot-vs-mount.md` | Auth check only in `mount()` — fails after permission revoke and `wire:navigate` |
| `lw-authorization-exception.md` | `try { authorize() } catch (\Exception)` swallows authorization |
| `lw-ownership-scope.md` | `Entry::find($id)` without `forUser()` first |
| `lw-audit.md` | Need a checklist for the whole Livewire surface |

## Core principle

> **Do not look for code to fit a recipe. First find a real problem. Then choose the smallest set of recipes that solves it.**

**Working formula:** *Project first. Pain second. Recipe third. Small safe action last.*

When in doubt: do less, but always run the project's formatter and test suite before claiming the work is done (Pint + Rector + PHPUnit/Pest + PHPStan, or whatever the project uses).

## Compatibility

- PHP 8.2+ (recommends 8.3+)
- Laravel 11+ (recommends 12+)
- Livewire 3 or 4 (Livewire recipes only apply when Livewire is in use)
- Pest 3 / PHPUnit 11+
- PHPStan 2 / Larastan 3 (for the generics recipes to fully pay off)

## Contributing

1. Find a real smell in the wild.
2. Add a recipe under `recipes/` using the existing structure: **Source / Problem / Bad signs / How to fix / Before / After / When not / Related**.
3. Register it in `recipe-map.md` and `source-map.md`.
4. If it covers a new domain, update `16-point-checklist.md` and bump the score denominator.
5. Keep recipes under 2.5 KB.

## Credits

- [Nuno Maduro](https://nunomaduro.com) — [`nunomaduro/essentials`](https://github.com/nunomaduro/essentials), [`nunomaduro/larastan`](https://github.com/nunomaduro/larastan), [`nunomaduro/collision`](https://github.com/nunomaduro/collision)
- [Dandy Code](https://github.com/tikhomirov/dandy-code-skills) — readability principles, skill packaging pattern
- Laravel core team — `#[Scope]` attribute, enum cast, action patterns
- [Livewire security article](https://rwsite.ru/livewire-i-bezopasnost-tri-uyazvimosti-kotorye-legko-propustit/) — three IDOR patterns

## License

MIT. See [LICENSE](LICENSE).