# Recipe (Livewire): `boot()` for Auth, `mount()` for Data

## Source

<https://rwsite.ru/livewire-i-bezopasnost-tri-uyazvimosti-kotorye-legko-propustit/> — vulnerability #2.

## Problem

`mount()` runs **once**, on first render. It does NOT re-run on subsequent Livewire requests (method calls, property updates, `wire:poll`). With `wire:navigate` (SPA mode), `mount()` may not run at all on navigation.

If your auth check is in `mount()`, an admin who revoked the user's permission cannot kick them off the page.

## Bad signs

```bash
grep -rn "function mount" app/Livewire/ -A 20 | grep -B2 "abort\|authorize\|Gate::"
```

- `mount()` contains `abort(403)` or `Auth::user()->can(...)`.
- Component is reachable via `wire:navigate` or `Livewire::visit(...)`.

## How to fix

```php
use Symfony\Component\HttpKernel\Exception\HttpResponseException;

class EntryList extends Component
{
    public function boot(): void
    {
        if (! Auth::check() || ! Auth::user()->can('viewAny', Entry::class)) {
            throw new HttpResponseException(response()->noContent(403));
        }
    }

    public function mount(): void
    {
        // Only data initialization
        $this->newEntryDate = now()->format('Y-m-d');
    }
}
```

`boot()` runs before every action. `mount()` runs only on first render. Use `HttpResponseException` instead of `abort()` inside Livewire — `abort()` is unpredictable in Ajax context.

## When not to apply

- Truly public components (`Auth\Login`, `Auth\Register`, `Auth\ForgotPassword`) — they have no auth context yet.
- Static pages without mutations.

## Related recipes

- `lw-locked.md`
- `lw-ownership-scope.md`
