# Recipe: Aggressive Vite Prefetching

## Source

`nunomaduro/essentials` → `Configurables/AggressivePrefetching`. Calls `Vite::useAggressivePrefetching()`.

## Problem

Front-end loads slowly on PWA navigation. Each page fetch is a fresh download of JS chunks.

## Bad signs

- Lighthouse PWA score is low on Time-to-Interactive.
- `link rel="modulepreload"` missing for chunks.

## How to fix

Add to `app/Providers/AppServiceProvider.php::boot()`:

```php
Vite::useAggressivePrefetching();
```

## When not to apply

- Very large number of routes / chunks — wastes bandwidth on mobile.
- Heavy asset bundles where each prefetch costs more than the savings.

## Related recipes

- (no close peers — Vite-specific)
