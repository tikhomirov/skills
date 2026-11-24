# Recipe: No Raw SQL with Interpolation

## Source

Dandy Style `exceptions` + `no-nonsense`. Combined with `strict-models.md` (lazy-load ban).

## Problem

`DB::raw("... $var ...")` is SQL injection. Even when "trusted", it's a footgun for the next reader.

## Bad signs

```bash
grep -rn "DB::raw\|->raw(" app/
```

- Returns hits inside `app/` (not just migrations).
- Raw strings with `$variable` interpolation.

## How to fix

Use query builder with bindings, even for raw fragments:

```php
// before
DB::select("SELECT * FROM entries WHERE text LIKE '%{$search}%'");

// after
DB::table('entries')
    ->where('text', 'like', '%'.$search.'%')
    ->get();

// raw fragment with bindings (only when builder cannot express it)
DB::table('entries')
    ->whereRaw('MATCH(text) AGAINST (?)', [$search])
    ->get();
```

## When not to apply

- Migrations that need DDL — raw SQL is fine there.
- Database-specific functions (JSON, FULLTEXT) where no builder method exists.

## Related recipes

- `strict-models.md`
- `detect-n-plus-one.md`
