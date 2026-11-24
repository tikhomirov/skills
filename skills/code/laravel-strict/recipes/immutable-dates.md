# Recipe: Immutable Dates

## Source

`nunomaduro/essentials` → `Configurables/ImmutableDates`. Calls `Date::use(CarbonImmutable::class)`.

## Problem

Mutable `Carbon` dates propagate mutations through the codebase. `now()->addDay()` mutates the original object if it leaks somewhere. Hard to debug.

## Bad signs

- `use Carbon\Carbon` in `app/` (should be `CarbonImmutable`).
- `cast: 'datetime'` returning mutable `Carbon` that surprises later code.
- Hard-to-find bugs where dates shift unexpectedly.

## How to fix

Add to `app/Providers/AppServiceProvider.php::boot()`:

```php
Date::use(CarbonImmutable::class);
```

Update existing code that depended on mutation:

```php
// before (mutable)
$expiresAt = now();
$expiresAt->addHours(24);

// after (immutable — works the same way)
$expiresAt = now()->addHours(24);
```

## When not to apply

- Code that explicitly mutates dates and depends on the side effect — refactor first.
- Third-party packages that type-hint `Carbon\Carbon` (rare) — wrap in adapter.

## Related recipes

- `strict-models.md`
