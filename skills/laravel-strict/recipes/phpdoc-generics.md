# Recipe: PHPDoc Generics on Relations

## Source

`nunomaduro/larastan` (Larastan). Adds generic support for Eloquent relations in PHPStan and the IDE.

## Problem

`$user->entries` is typed as `mixed` (or untyped). IDE loses autocomplete. PHPStan flags `GenericModelViolation` in baseline.

## Bad signs

- `phpstan-baseline.neon` filled with `ignoreErrors: ... argument #1 (...) of method ...` for Eloquent calls.
- IDE can't suggest `->text` on an iterated `$entries`.

## How to fix

Add PHPDoc generics on every relation method:

```php
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable
{
    /** @return HasMany<Entry, $this> */
    public function entries(): HasMany
    {
        return $this->hasMany(Entry::class);
    }
}

class Entry extends Model
{
    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsToMany<Tag, $this> */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class)->withTimestamps();
    }
}
```

Type cheat-sheet:

| Relation        | PHPDoc                              |
| --------------- | ----------------------------------- |
| `hasMany`       | `@return HasMany<TChild, $this>`    |
| `hasOne`        | `@return HasOne<TChild, $this>`     |
| `belongsTo`     | `@return BelongsTo<TParent, $this>` |
| `belongsToMany` | `@return BelongsToMany<T, $this>`   |
| `morphMany`     | `@return MorphMany<TChild, $this>`  |

## When not to apply

- Project does not run Larastan / PHPStan — less value without static analysis.

## Related recipes

- `strict-models.md`
- `scope-attrs.md`
