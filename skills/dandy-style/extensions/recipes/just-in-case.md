# Extension recipe: No "Just In Case"

> **Статус:** читательское / авторское дополнение Dandy Style.
> **Не** официальная глава книги «Денди-код». Нет канонического `content/021-*.md`.
> См. `extensions/README.md`.

## Problem

Code (and especially **AI-generated** code) adds speculative fallbacks, extra branches,
and duplicate lookups "just in case" instead of fixing **one** source of truth.

AI often does not know the truth. It infers from nearby code and reasoning, then invents
a second path that *looks* plausible. Typical failure: it treats two spellings or casings
as different concepts (`UserId` vs `userId`, `A` vs `a` in camelCase), duplicates logic,
and leaves dead or insecure branches. Extra paths become maintenance debt and sometimes
security holes (wrong file served, wrong config read, silent fallback to a weaker check).

Human "just in case" programming has the same smell: cascading ternaries, multi-path
filesystem probes, defensive wrappers that hide the real bug.

**Correct idea:** one canonical source of truth. If you cannot determine it, ask — do not guess.

## Bad signs

- Cascading checks: `pathA ?? pathB ?? pathC` or nested `is_file($a) ? … : is_file($b) ? …`.
- AI (or a human) re-implements the same rule with a slightly different name/case.
- Config files with dynamic `is_file()` / runtime probes.
- Silent suppression (`2>/dev/null`, empty catch) "in case the tool is missing".
- Guessing between options instead of asking the developer.

## Before

```php
$path = resource_path('docs/openapi.yaml');
if (! is_file($path)) {
    $path = storage_path('app/private/scribe/openapi.yaml');
}
if (! is_file($path)) {
    $path = storage_path('app/scribe/openapi.yaml');
}
abort_unless(is_file($path), 404);

return response()->file($path);
```

Three guesses. Nobody knows which path is real; failures are masked until production.

## After

```php
$path = resource_path('docs/openapi.yaml');
abort_unless(is_file($path), 404);

return response()->file($path);
```

One path. Missing file fails loudly. If the canonical location is unclear — stop and ask.

## How to fix

1. Name the single canonical source (path, config key, method, naming rule).
2. Delete speculative fallbacks and duplicate AI-invented variants.
3. Keep config static; no runtime `is_file()` probes inside config arrays.
4. If the truth is unclear, ask the user — do not invent a second camelCase / second path.
5. Prefer an explicit failure over a silent "maybe this other thing works".

## When not to apply

- Documented contractual failover (e.g. secondary payment gateway required by the business).
- Standard cache-aside (`Cache::remember()`).

## Related

- Official: `recipes/no-nonsense.md`, `recipes/conditions.md`, `recipes/ai-generated-code.md`
- Map: `extensions/recipe-map.md`
