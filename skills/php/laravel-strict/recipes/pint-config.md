# Recipe: Opinionated Pint Configuration

## Source

`nunomaduro/essentials` → `Commands/EssentialsPintCommand`. Publishes `pint.stub` as `pint.json`.

## Problem

Default `pint.json` only sets `"preset": "laravel"`. Misses the strict, ordered, final-class rules that Essentials enforces.

## Bad signs

- Files without `declare(strict_types=1)`.
- Classes without `final` (when not abstract).
- Inconsistent method ordering.
- `==` instead of `===`.

## How to fix

Install essentials, then publish:

```bash
composer require nunomaduro/essentials --dev
php artisan essentials:pint --force --backup
```

This overwrites `pint.json` with 23 rules including `declare_strict_types`, `final_class`, `ordered_class_elements`, `strict_comparison`, `fully_qualified_strict_types`, `global_namespace_import`, `mb_str_functions`.

If the project already has its own `pint.json`, diff carefully:

```bash
cp pint.json pint.json.backup
php artisan essentials:pint --force
diff pint.json.backup pint.json
```

Merge the rules you want — at minimum add `final_class`, `final_internal_class`, `protected_to_private`.

## When not to apply

- Project intentionally follows a different standard — keep your config.
- Mid-PR with many files about to be reformatted — finish the PR first, then change the config.

## Related recipes

- `rector-config.md`
- `final-readonly.md`
