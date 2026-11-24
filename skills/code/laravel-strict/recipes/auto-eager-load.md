# Recipe: Auto Eager Loading via `$with`

## Source

`nunomaduro/essentials` → `Configurables/AutomaticallyEagerLoadRelationships`. Laravel 12.8+ ships `Model::automaticallyEagerLoadRelationships()`.

## Problem

N+1 queries on hot models. Every `Entry::find()` triggers separate queries for `user`, `tags`, `photos`.

## Bad signs

- `Debugbar` / Telescope shows `entries` + 20 × `select * from users` on a 20-row page.
- `phpstan-baseline.neon` is full of `GenericModelViolation` lines.

## How to fix

Declare the hot relations in `$with` on the model:

```php
/** @use HasFactory<EntryFactory> */
class Entry extends Model
{
    /** @var list<string> */
    protected $with = ['user', 'tags'];
    // ...
}
```

## Before

```php
// In Livewire:
$entry = Entry::find($id);
// In Blade:
{{ $entry->user->name }}   // lazy load — N+1 if iterating
```

## After

```php
// In Livewire:
$entry = Entry::find($id);  // user + tags already loaded
// In Blade:
{{ $entry->user->name }}    // no extra query
```

## When not to apply

- Heavy or rarely used relations — inflate memory.
- Admin-only relations — load explicitly in admin queries.

## Related recipes

- `strict-models.md`
- `detect-n-plus-one.md`
- `phpdoc-generics.md`
