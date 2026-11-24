---
name: laravel-strict
description: Use Nuno Maduro's essentials and related Laravel best practices to review and improve PHP/Laravel code
---

# Laravel Strict

Laravel Strict is a way of thinking: first understand the project and the real task, then find weak spots, and only then pull a recipe from `recipes/` as a tool.

Use the recipes, but do not limit yourself to them.

This skill is rooted in the [`nunomaduro/essentials`](https://github.com/nunomaduro/essentials) package — better defaults for Laravel (strict models, auto eager loading, immutable dates, fake sleep, prevent stray requests) — plus `nunomaduro/larastan`, Dandy Style, Laravel core team practices, and Livewire security patterns. Recipes may combine and extend these sources. When in doubt, prefer Laravel-way over custom architecture.

## Core rule

Do not look for code to fit a recipe.

First find a real problem in the project, diff, file, or code fragment. Then choose the smallest set of recipes that helps solve that problem.

Workflow:

1. Understand the context (the project's framework, version, conventions — read its `AGENTS.md`, `README.md`, `composer.json`, configs).
2. Find weak spots (N+1, missing `#[Locked]`, mutable Carbon, missing tests, etc.).
3. Rank them and choose the most important ones.
4. Explain why they matter.
5. Select 1–3 relevant recipes from `recipe-map.md`.
6. Suggest a small, safe next action.

## Invocation modes

### 1. Direct invocation without a target — `/laravel-strict`

Use when the user invokes the skill or asks to improve the project without naming a file, module, or diff.

Start with a shallow project scan:

- read `AGENTS.md`, `README.md`, `composer.json`, `phpstan.neon`, `phpunit.xml`, `pint.json`, `rector.php`;
- check `bootstrap/app.php` and `app/Providers/AppServiceProvider.php` for essentials configuration;
- inspect `app/Models/`, `app/Livewire/`, `app/Services/`, `tests/` for patterns;
- choose a few representative files instead of scanning everything.

This is not a full audit. The goal is to find 3–5 likely improvement areas.

Return:

1. What this project is and where it stands on essentials (rough % of the 16-point checklist).
2. What style and architecture signals are visible.
3. Where the most useful improvement points likely are.
4. Why they matter.
5. What to do first.
6. Which recipes may help next (link to `recipes/` files).

If the best next step is obvious, suggest it. If several options are equally useful, ask the user where to start.

### 2. Contextual invocation or local code review

Use when the skill is mentioned inside another task or when the user provides a specific code fragment.

1. Understand the main task.
2. Use the essentials checklist as a quality filter (see `16-point-checklist.md`).
3. Select only recipes that actually help this task.
4. Keep the answer short and practical.
5. Stay within the requested scope.

## How to use recipes

Use `recipe-map.md` only after finding concrete signs of a problem in the code.

Do not load all recipes "just in case". Context window is the budget.

## Loading limits

- Contextual mode: at most 1–3 recipes.
- Review mode: load `recipe-map.md`, then recipes after detecting smells.
- Commit mode: inspect changed files first; load the recipe that matches the smell.
- Never load examples unless editing or explaining concrete code.

## Core principles

- Strict models beat silent bugs (lazy load, missing attributes, mass-assignment slips).
- Immutable dates beat accidental mutations.
- Type declarations beat runtime surprises.
- Auto eager loading and ownership-scoped queries beat N+1.
- Explicit `final readonly` on services and Actions beats mutable shared state.
- `#[Locked]` and ownership-scoped lookups in Livewire beat IDOR.
- Boot-time auth checks beat mount-time checks (Livewire does not re-run `mount()` on every request).
- A small safe PR beats a heroic refactor.
- Tests are a contract, not decoration. Stray HTTP and real sleep in tests are bugs, not features.
- AI-generated code is plausible but not trusted until checked against recipes.

Laravel Strict is not limited to these recipes. The recipes highlight frequent problems and common fixes. If another best-practice recipe fits better — Dandy Style, Spatie, Pest, Laravel core team guidance — suggest it and label it as an extra recommendation.

## Output format

For a broad review (mode 1):

```text
1. What I understood about the project
2. Essentials readiness (X/16)
3. Main improvement points (P0/P1/P2)
4. Why they matter
5. What I suggest doing first
6. Which recipes may help (links to recipes/*.md)
```

For a contextual task (mode 2):

```text
1. Solution for the main task
2. What was considered from essentials
3. Trade-offs
4. Next safe step
```

## Working formula

Project first. Pain second. Recipe third. Small safe action last.

When in doubt: do less, but always run the project's formatter and test suite before claiming the work is done (Pint + Rector + PHPUnit/Pest + PHPStan, or whatever the project uses).
