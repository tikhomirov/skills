# Recipe: Detect N+1 Queries

## Source

`nunomaduro/essentials` `AutomaticallyEagerLoadRelationships` + `ShouldBeStrict` + Dandy Style `tests`.

## Problem

Lazy loading inside loops or templates fires one extra query per row. With 100 entries, 101 queries.

## Bad signs

- `phpstan-baseline.neon` filled with `GenericModelViolation`.
- Debugbar / Telescope shows repeating `select * from <table>` patterns.

## How to fix

1. Enable strict mode in dev (recipe `strict-models.md`).
2. Add `$with` to hot models (recipe `auto-eager-load.md`).
3. In views / Livewire, scope queries with `with(...)` explicitly.
4. Add a guard test:

```php
it('does not lazy load in entries list', function (): void {
    DB::enableQueryLog();

    $this->livewire(EntriesIndex::class)
        ->assertViewHas('entries');

    $queries = collect(DB::getQueryLog())
        ->pluck('query');

    expect($queries->filter(fn ($q) => str_contains($q, 'from `users`')))
        ->toHaveCount(1);   // single eager load, not N
});
```

## Manual probes

```bash
grep -rn "->user\b\|->tags\b\|->photos\b" app/Livewire/
grep -rn "foreach.*as .*=>" app/Livewire/ resources/views/
```

## When not to apply

- Truly rare code path with single-digit rows — not worth the optimization.
- Admin-only view where latency is acceptable.

## Related recipes

- `strict-models.md`
- `auto-eager-load.md`
