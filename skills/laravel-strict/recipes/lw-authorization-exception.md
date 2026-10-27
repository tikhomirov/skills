# Recipe (Livewire): Never Swallow `AuthorizationException`

## Source

<https://rwsite.ru/livewire-i-bezopasnost-tri-uyazvimosti-kotorye-legko-propustit/> — vulnerability #3.

## Problem

`AuthorizationException extends \Exception`. A `try { ... } catch (\Exception $e)` will swallow the auth denial and show a generic "Error" toast instead of 403. If the mutation happened BEFORE the `authorize()` call (anti-pattern), data is already corrupt.

## Bad signs

```bash
grep -rn "catch\s*(\\\\\(Exception\|Throwable\)" app/Livewire/
```

- `try { ... } catch (\Exception $e)` wrapping both mutation and `authorize()`.
- `authorize()` placed AFTER the mutation.
- No separate `catch (AuthorizationException $e)` re-throw.

## How to fix

Pattern A — `authorize()` BEFORE the mutation, explicit re-throw:

```php
public function updateEntry(): void
{
    try {
        $this->validate([
            'editEntryText' => 'required|min:1',
            'editEntryDate' => 'required|date',
        ]);

        $entry = Entry::find($this->editingEntryId);
        if (! $entry) return;

        $this->authorize('update', $entry);    // BEFORE mutation

        $entry->update([...]);                  // then mutation
        $entry->syncTagsFromText();

        $this->reset([...]);
    } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
        throw $e;                               // re-throw → Livewire returns 403
    } catch (\Exception $e) {
        $this->dispatch('notify', message: 'Ошибка сохранения', type: 'error');
        report($e);
    }
}
```

Pattern B — `authorize()` outside the `try`:

```php
public function updateEntry(): void
{
    $entry = Entry::find($this->editingEntryId);
    if (! $entry) return;

    $this->authorize('update', $entry);    // outside try, throws up

    try {
        $this->validate([...]);
        $entry->update([...]);
        $this->dispatch('notify', message: 'Сохранено', type: 'success');
    } catch (\Exception $e) {
        $this->dispatch('notify', message: 'Ошибка БД', type: 'error');
        report($e);
    }
}
```

## When not to apply

- Read-only operations that cannot throw `AuthorizationException` (no `authorize()`).
- Public components without auth checks.

## Related recipes

- `lw-locked.md`
- `lw-boot-vs-mount.md`
