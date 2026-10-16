# Recipe (Livewire): `#[Locked]` on Server-Side Properties

## Source

<https://rwsite.ru/livewire-i-bezopasnost-tri-uyazvimosti-kotorye-legko-propustit/> — vulnerability #1.

## Problem

In Livewire 3 / 4, every `public` property syncs with the browser. Any logged-in user can change it from DevTools:

```js
Livewire.find("component-id").set("editingId", 999);
```

If `999` is someone else's record, IDOR.

## Bad signs

- `public ?int $editingId` or `$editingEntryId`, `$selectedId`, `$ownerId`, `$isAdmin` — all mutable from JS.
- `wire:model` is NOT used for these properties.

## How to fix

Mark with `#[Locked]`:

```php
use Livewire\Attributes\Locked;

class EntryList extends Component
{
    #[Locked]
    public ?int $editingEntryId = null;
}
```

Livewire now throws when JS tries to set it. The server-side value stays trusted.

Alternative — pass the ID as a method parameter (not a property), since parameters are not synced with the browser:

```php
public function updateEntry(int $entryId): void
{
    $entry = Entry::query()->forUser(Auth::id())->find($entryId);
    // ...
}
```

## Probe

```bash
grep -rn "public\s\+\(?\(int\|string\|bool\)\?\s*\$\(editing\|selected\|owner\|user\|photo\|tag\)\?Id\)" app/Livewire/
```

## When not to apply

- Properties that genuinely need `wire:model` (user-edited form fields).

## Related recipes

- `lw-boot-vs-mount.md`
- `lw-ownership-scope.md`
- `lw-audit.md`
