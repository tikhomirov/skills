# Recipe: Prohibit Destructive Commands

## Source

`nunomaduro/essentials` → `Configurables/ProhibitDestructiveCommands`. Calls `DB::prohibitDestructiveCommands(true)`.

## Problem

`migrate:fresh`, `db:wipe`, `migrate:reset` can be run in production by accident. Data loss.

## Bad signs

- No guard around destructive commands.
- CI / cron can call `migrate:fresh` without explicit `--force`.

## How to fix

Add to `app/Providers/AppServiceProvider.php::boot()`:

```php
DB::prohibitDestructiveCommands(app()->isProduction());
```

In production these now require explicit `--force` and confirmation. In dev they work as before.

## Before

```php
public function boot(): void {}
```

## After

```php
public function boot(): void
{
    DB::prohibitDestructiveCommands(app()->isProduction());
}
```

## When not to apply

- Never disable this in production.

## Related recipes

- `force-https.md`
