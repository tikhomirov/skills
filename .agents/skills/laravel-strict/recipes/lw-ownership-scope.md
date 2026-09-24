# Recipe (Livewire): Ownership-Scoped Lookups First

## Source

Dandy Style `frameworks` + the Livewire security article — defence-in-depth for IDOR.

## Problem

`Entry::find($id)` does not check ownership. Even if `authorize('update', $entry)` runs, the load itself leaks timing info ("exists / does not exist") and depends on a Policy being perfectly written.

## Bad signs

```bash
grep -rn "::find(" app/Livewire/
```

- `Entry::query()->find($id)` without `->forUser(Auth::id())` first.

## How to fix

Chain ownership scope before `find`:

```php
// before
$entry = Entry::query()->find($entryId);
if (! $entry) return;
$this->authorize('update', $entry);

// after
$entry = Entry::query()->forUser(Auth::id())->find($entryId);
if (! $entry) return;
$this->authorize('update', $entry);
```

Now the row is invisible to anyone who is not the owner, regardless of `Policy`.

## When not to apply

- Admin / Filament panels where ownership is global.
- Read endpoints that should return public records by design.

## Related recipes

- `lw-locked.md`
- `lw-boot-vs-mount.md`
- `lw-audit.md`
