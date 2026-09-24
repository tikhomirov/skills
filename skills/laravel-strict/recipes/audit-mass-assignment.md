# Recipe: Audit Mass Assignment

## Source

`nunomaduro/essentials` `ShouldBeStrict` + `Unguard` + Dandy Style `frameworks`.

## Problem

`Model::create($request->all())` writes whatever the client sends, including `is_admin`, `user_id`, `telegram_id`. Mass-assignment vulnerability.

## Bad signs

```bash
grep -rn "Model::create\|::create(\$request" app/
grep -rn "::fill(\$request" app/
grep -rn '\$guarded = \[\]' app/Models/
```

- `$guarded = []` (fully open).
- `Model::create($request->all())`.
- `$fillable` includes `is_admin`, `user_id`, `telegram_id` without authorization check.

## How to fix

Pick one path:

**Path A — explicit `$fillable` (recommended):**

```php
class Entry extends Model
{
    /** @var list<string> */
    protected $fillable = ['date', 'text', 'source'];
    // user_id comes from auth()->id(), never from request
}
```

**Path B — global `Model::unguard()` after audit:**

```php
// app/Providers/AppServiceProvider.php::boot()
Model::unguard();
```

Always use `$request->validated()` (or `safe()->only()`) in controllers:

```php
public function store(StoreEntryRequest $request, CreateEntryAction $action): RedirectResponse
{
    $entry = $action->handle(
        user: $request->user(),
        data: $request->validated(),
    );
    return redirect()->route('entries.show', $entry);
}
```

## When not to apply

- Never accept `$request->all()` in a controller that writes to DB.

## Related recipes

- `unguard.md`
- `strict-models.md`
