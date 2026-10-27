---
name: dandy-style
description: >-
  Living Dandy Code style for PHP/Laravel review and improvement — inspired by
  «Денди-код», not a 1:1 book copy. Author reinterpretation plus reader extensions
  (e.g. just-in-case). Use when reviewing, refactoring, or tightening readable Laravel code.
version: 1.2.0
---

# Dandy Style

Dandy Style is a way of thinking: first understand the project and the real task, then find weak spots in the code, and only then use Dandy Code recipes as tools.

Use the recipes, but do not limit yourself to them.

## Relation to the book «Денди-код»

This skill is **not** a one-to-one copy of the book.

It is a **living / author reinterpretation** for agents: the book is the root inspiration, but:

- book chapters age; tooling, frameworks, and day-to-day pain change;
- modern work (especially AI-assisted coding) creates new smells and needs new recipes;
- the recipe set **grows** beyond the printed table of contents.

Official recipes in `recipes/` stay tied to book chapters via `source-map.md`.
**Reader / author extensions** live in `extensions/` (see `extensions/README.md`).
They are part of Dandy Style as a skill ecosystem, **not** official chapters of the book author.

Today there is one such extension (`just-in-case`); more may follow. When you use one, say that it is a reader/author extension, not a book chapter.

## Core rule

Do not look for code to fit a recipe.

First find a real problem in the project, diff, file, or code fragment. Then choose the smallest set of recipes that helps solve that problem.

Workflow:

1. Understand the context.
2. Find weak spots.
3. Rank them and choose the most important ones.
4. Explain why they matter.
5. Select 1–3 relevant recipes (official and/or extensions).
6. Suggest a small, safe next action.

## Invocation modes

### 1. Direct invocation without a target

Use this mode when the user invokes `/dandy-style` or asks to improve the project without naming a file, module, or diff.

Start with a shallow project scan:

- read `README.md`, `AGENTS.md`, `composer.json`, `package.json`, test, formatter, and static analysis configs;
- inspect the directory tree and find the main application areas;
- choose a few representative files instead of scanning everything;
- understand the project style before judging it.

This is not a full audit. The goal is to find 3–5 likely improvement areas.

Return:

1. What this project is.
2. What style and architecture signals are visible.
3. Where the most useful improvement points likely are.
4. Why they matter.
5. What to do first.
6. Which Dandy Code recipes may help next.

If the best next step is obvious, suggest it. If several options are equally useful, ask the user where to start.

### 2. Contextual invocation or local code review

Use this mode when Dandy Style is mentioned inside another task or when the user provides a specific code fragment.

1. Understand the main task.
2. Use Dandy Style as a quality filter.
3. Select only rules that actually help this task.
4. Keep the answer short and practical.
5. Stay within the requested scope.

## How to use recipes

Use `recipe-map.md` only after finding concrete signs of a problem in the code.
For reader extensions, also check `extensions/recipe-map.md`.

Do not load all recipes “just in case”.

## Dandy Style principles

- Code communicates with the next reader.
- Clarity beats cleverness.
- Project style beats personal taste.
- Laravel-way beats custom architecture without a reason.
- Names must tell the truth.
- The main scenario should be visible.
- Nesting increases cognitive load.
- Comments should explain “why”, not repeat “what”.
- Magic values should become meaning, not pointless constants.
- AI-generated code is plausible, but not trusted until checked.
- One source of truth beats speculative “just in case” fallbacks (see extensions).
- Refactoring should be small, safe, and verifiable.

Dandy Style is not limited to these recipes. The recipes highlight frequent problems and common fixes. If another best-practice recipe fits better, suggest it.

## Output format

For a broad review:

```text
1. What I understood about the project
2. Main improvement points
3. Why they matter
4. What I suggest doing first
5. Which Dandy Code recipes may help
```

For a contextual task:

```text
1. Solution for the main task
2. What was considered from Dandy Code
3. Trade-offs
4. Next safe step
```

## Working formula

Project first. Pain second. Recipe third. Small safe action last.
