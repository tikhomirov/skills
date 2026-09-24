# Recipe: Generate `final readonly` Action

## Source

`nunomaduro/essentials` → `Commands/MakeActionCommand`. Publishes `make:action` Artisan command and `action.stub`.

## Problem

Business logic accumulates in controllers and Livewire components. Hard to test, hard to reuse, no transaction boundary.

## Bad signs

- 50+ line controller method.
- `DB::transaction(...)` inside Livewire `render()` or controller.
- Same logic copy-pasted across web + Telegram bot.

## How to fix

Generate a class:

```bash
php artisan make:action CreateEntryAction
```

Fill it with single responsibility logic:

```php
final readonly class CreateEntryAction
{
    public function __construct(
        private SyncTagsFromEntryTextAction $syncTags,
    ) {}

    public function handle(User $user, string $text, ?CarbonImmutable $when = null): Entry
    {
        return DB::transaction(function () use ($user, $text, $when): Entry {
            $entry = Entry::create([
                'user_id' => $user->id,
                'text'    => trim($text),
                'date'    => ($when ?? now())->toDateString(),
            ]);
            $this->syncTags->handle($entry);

            return $entry;
        });
    }
}
```

Call from controller / Livewire / bot handler:

```php
$entry = app(CreateEntryAction::class)->handle($user, $text);
```

## When not to apply

- Single one-line CRUD — keep in controller.
- Logic that needs Livewire lifecycle hooks — extract method, not class.

## Related recipes

- `actions-pattern.md`
- `final-readonly.md`
