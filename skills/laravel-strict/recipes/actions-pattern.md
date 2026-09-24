# Recipe: Actions Pattern

## Source

`nunomaduro/essentials` → `Commands/MakeActionCommand` + Dandy Style `component-boundaries`.

## Problem

Business logic in controllers / Livewire methods. Hard to test, hard to reuse, breaks under `wire:navigate`.

## Bad signs

- Controller method > 30 lines.
- Livewire method with `DB::transaction(...)`.
- Same logic copy-pasted between web and Telegram bot handlers.

## How to fix

Thin controller / Livewire → Action → `DB::transaction`.

```php
// Controller — 2 lines
final class EntryController extends Controller
{
    public function store(StoreEntryRequest $request, CreateEntryAction $action): RedirectResponse
    {
        $entry = $action->handle($request->user(), $request->validated());
        return redirect()->route('entries.show', $entry);
    }
}

// Action — all the logic
final readonly class CreateEntryAction
{
    public function __construct(
        private SyncTagsFromEntryTextAction $syncTags,
    ) {}

    public function handle(User $user, array $data): Entry
    {
        return DB::transaction(function () use ($user, $data): Entry {
            $entry = Entry::create([
                'user_id' => $user->id,
                'text'    => $data['text'],
                'date'    => $data['date'] ?? now()->toDateString(),
            ]);
            $this->syncTags->handle($entry);
            return $entry;
        });
    }
}
```

## When not to apply

- One-line CRUD that does not need a transaction.
- Pure read queries — keep in controller, no Action needed.

## Related recipes

- `make-action.md`
- `final-readonly.md`
