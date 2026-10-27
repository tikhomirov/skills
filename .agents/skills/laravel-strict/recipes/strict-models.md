# Recipe: Strict Models

## Source

`nunomaduro/essentials` → `Configurables/ShouldBeStrict`. Calls `Model::shouldBeStrict()` in the service provider boot.

## Problem

Eloquent silently allows lazy loading, accessing missing attributes, and assigning undefined attributes. Bugs hide in production.

## Bad signs

- `$user->undefined` returns `null` instead of throwing.
- `$entry->user` inside a Blade loop without `with('user')` triggers an extra query per row.
- `$model->typo_field = 'x'` is silently discarded.

## How to fix

Add to `app/Providers/AppServiceProvider.php::boot()`:

```php
Model::shouldBeStrict(! app()->isProduction());
```

`! app()->isProduction()` keeps dev strict while letting production views skip the N+1 panic.

## Before

```php
public function boot(): void
{
    // nothing about Model
}
```

## After

```php
public function boot(): void
{
    Model::shouldBeStrict(! app()->isProduction());
}
```

## When not to apply

- Legacy views with hundreds of lazy loads — fix them first, then turn strict on.
- Production hot path that cannot be fixed today — temporarily use `! app()->isProduction()` to keep dev strict.

## Related recipes

- `auto-eager-load.md`
- `detect-n-plus-one.md`
- `phpdoc-generics.md`
