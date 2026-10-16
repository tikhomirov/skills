# Recipe: `final readonly` on Services and Actions

## Source

Dandy Style + Nuno coding style in `essentials/src/Configurables/*` (all `final readonly class`). Combined with `pint.json` rule `final_class`.

## Problem

Mutable shared state in services. Inheritance abuse. Mocking surprises.

## Bad signs

- `class TelegramMediaSaveService` (not `final`).
- Properties on services that change during the request.
- Subclasses of services that override behavior unpredictably.

## How to fix

```php
final readonly class TelegramMediaSaveService
{
    public function __construct(
        private PhotoUploadService $uploader,
    ) {}

    public function save(User $user, TelegramMediaPayload $payload, ?string $caption = null): Entry
    {
        // ...
    }
}
```

## When not to apply

- Eloquent models — never make them `final`, Eloquent needs inheritance.
- Livewire components — `extends Component` already requires non-final.
- Filament Resources / Pages — framework expectation.
- Abstract classes and interfaces.

## Related recipes

- `make-action.md`
- `actions-pattern.md`
