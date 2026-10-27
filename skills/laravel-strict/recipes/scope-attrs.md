# Recipe: `#[Scope]` Attribute

## Source

Laravel 11+ modern style. `Illuminate\Database\Eloquent\Attributes\Scope`.

## Problem

Legacy `scopeForUser($query, $id)` loses IDE type info and has no return type.

## Bad signs

- Methods named `scopeXxx`.
- Parameters without type hints.
- IDE can't autocomplete inside the scope body.

## How to fix

Add the `#[Scope]` attribute and rename:

```php
use Illuminate\Database\Eloquent\Attributes\Scope;

class Entry extends Model
{
    #[Scope]
    protected function forUser($query, int $userId): void
    {
        $query->where('user_id', $userId);
    }

    #[Scope]
    protected function forDateRange($query, string $startDate, string $endDate): void
    {
        $query->whereBetween('date', [$startDate, $endDate]);
    }
}
```

Calling code does not change:

```php
Entry::query()->forUser($userId)->forDateRange('2025-01-01', '2025-01-31')->get();
```

## When not to apply

- Project pinned to Laravel 10 — keep `scopeXxx()` style.

## Related recipes

- `phpdoc-generics.md`
