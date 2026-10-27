# Recipe (Livewire): Full Audit Checklist

## Source

Synthesis of the four Livewire security recipes + Dandy Style audit workflow.

## Use

When the user asks "audit Livewire", "check Livewire security", or "review Livewire components". Run the five probes in order.

## Probes

```bash
# 1. All public properties in Livewire components
grep -rn "public\s\+" app/Livewire/

# 2. Public ID/flag properties without #[Locked]
grep -rB1 "public\s\+\(?\(int\|bool\|string\)\?\?\?\?\?\?\?\?\?\)\s*\$\(editing\|selected\|owner\|user\|photo\|tag\)\?Id\b" app/Livewire/

# 3. Auth checks in mount() (anti-pattern)
grep -rn "function mount" app/Livewire/ -A 15 | grep -B2 "abort\|authorize\|Gate::"

# 4. catch (\Exception) / catch (Throwable) in Livewire
grep -rn "catch\s*(\\\\\(Exception\|Throwable\)" app/Livewire/

# 5. authorize() inside try blocks
grep -rn "try {" app/Livewire/ -A 15 | grep "authorize"

# 6. find() without ownership scope
grep -rn "::find(" app/Livewire/
```

For each hit, apply the matching recipe:

| Probe | Recipe                          |
| ----- | ------------------------------- |
| 1, 2  | `lw-locked.md`                  |
| 3     | `lw-boot-vs-mount.md`           |
| 4, 5  | `lw-authorization-exception.md` |
| 6     | `lw-ownership-scope.md`         |

## Quick-fix matrix

| Smell                                 | One-line fix                                                |
| ------------------------------------- | ----------------------------------------------------------- |
| `public ?int $editingId`              | Add `use Livewire\Attributes\Locked;` and `#[Locked]`       |
| Auth in `mount()`                     | Move check to `boot()`, throw `HttpResponseException(403)`  |
| `catch (\Exception)` around authorize | Add explicit `catch (AuthorizationException) { throw $e; }` |
| `Entry::find($id)` without scope      | `Entry::query()->forUser(Auth::id())->find($id)`            |

## When not to apply

- Public components without mutations (`Auth\Login`).
- Components that genuinely accept any user input as public (`SupportPage` for guests — verify first).

## Related recipes

- All four `lw-*.md` recipes.
