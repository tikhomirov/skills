# Recipe: Optional Unguard

## Source

`nunomaduro/essentials` → `Configurables/Unguard`. Disabled by default — opt-in only.

## Problem

You want to skip `$fillable` declarations for trusted internal code, or you have `$guarded = []` (the dangerous anti-pattern) sprinkled around.

## Bad signs

- `Model::create($request->all())` with `$guarded = []`.
- `$fillable` is empty, code relies on `forceFill()` everywhere.

## How to fix

Pick one path, not both.

**Path A — global Unguard (clean, but trusts all code):**

```php
// app/Providers/AppServiceProvider.php::boot()
Model::unguard();
```

**Path B — explicit `$fillable` per model (safer):**

```php
class Entry extends Model
{
    /** @var list<string> */
    protected $fillable = ['date', 'text', 'source'];
}
```

## When not to apply

- Multi-tenant with role separation — never Unguard, always explicit `$fillable`.
- Legacy code with `Model::create($request->all())` — fix those first.
- Public forms that accept user input — never trust mass assignment.

## Related recipes

- `strict-models.md`
- `audit-mass-assignment.md`
