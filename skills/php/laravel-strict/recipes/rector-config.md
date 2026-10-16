# Recipe: Opinionated Rector Configuration

## Source

`nunomaduro/essentials` → `Commands/EssentialsRectorCommand`. Publishes `rector.stub` as `rector.php`.

## Problem

Default `rector.php` (or none) misses prepared sets: deadCode, codeQuality, typeDeclarations, privatization, earlyReturn, codingStyle.

## Bad signs

- Dead code (unused methods, unreachable branches) ships.
- `if ($x) return $a; else return $b;` instead of early return.
- Properties are `protected` but never inherited.

## How to fix

Install essentials, then publish:

```bash
php artisan essentials:rector --force --backup
```

Published config uses `withPreparedSets(deadCode: true, codeQuality: true, typeDeclarations: true, privatization: true, earlyReturn: true, codingStyle: true)`.

If the project's `rector.php` already uses `LaravelSetList::*`, merge: keep the Laravel-specific sets, add the prepared sets on top.

## When not to apply

- Large refactor PRs that mix Rector with feature work — separate the PR.
- Codebase with 10k+ files and no Rector history — start with one set, dry-run.

## Related recipes

- `pint-config.md`
- `final-readonly.md`
