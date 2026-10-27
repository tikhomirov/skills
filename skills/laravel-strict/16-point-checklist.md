# 16-Point Essentials + Livewire Checklist

Use this as the audit backbone. Each row has: where to look, what to find, and which recipe to load.

## Essentials (13 points)

| #   | Check                                           | Where to look                              | Recipe                                       |
| --- | ----------------------------------------------- | ------------------------------------------ | -------------------------------------------- |
| 1   | `Model::shouldBeStrict()` enabled               | `app/Providers/AppServiceProvider::boot()` | `strict-models.md`                           |
| 2   | No lazy loading in hot paths                    | `grep "::with(" app/` + views              | `auto-eager-load.md`, `detect-n-plus-one.md` |
| 3   | `$with` on hot models                           | `app/Models/*.php`                         | `auto-eager-load.md`                         |
| 4   | `Date::use(CarbonImmutable::class)`             | `AppServiceProvider::boot()`               | `immutable-dates.md`                         |
| 5   | `URL::forceHttps()` only in production          | `AppServiceProvider::boot()`               | `force-https.md`                             |
| 6   | `DB::prohibitDestructiveCommands(true)` in prod | `AppServiceProvider::boot()`               | `safe-console.md`                            |
| 7   | `Password::defaults(...)` hardened in prod      | `AppServiceProvider::boot()`               | `password-defaults.md`, `audit-passwords.md` |
| 8   | `Http::preventStrayRequests()` in tests         | `tests/TestCase.php`                       | `prevent-stray-requests.md`                  |
| 9   | `Sleep::fake()` in tests                        | `tests/TestCase.php`                       | `fake-sleep.md`                              |
| 10  | `Vite::useAggressivePrefetching()`              | `AppServiceProvider::boot()`               | `asset-prefetch.md`                          |
| 11  | `final readonly` on services and Actions        | `app/Services/`, `app/Actions/`            | `final-readonly.md`                          |
| 12  | `#[Scope]` attribute on Eloquent scopes         | `app/Models/*.php`                         | `scope-attrs.md`                             |
| 13  | PHPDoc generics on Eloquent relations           | `app/Models/*.php`                         | `phpdoc-generics.md`                         |

## Livewire security (3 points — applies to any Livewire project)

| #   | Check                                                          | Where to look   | Recipe                          |
| --- | -------------------------------------------------------------- | --------------- | ------------------------------- |
| 14  | `#[Locked]` on server-side ID/flag public properties           | `app/Livewire/` | `lw-locked.md`                  |
| 15  | Auth checks in `boot()`, not `mount()`                         | `app/Livewire/` | `lw-boot-vs-mount.md`           |
| 16  | `catch (\Exception)` does not swallow `AuthorizationException` | `app/Livewire/` | `lw-authorization-exception.md` |

## Scoring

```
readiness = passed / 16 * 100%
```

- **≥ 90%** (≥ 14/16) — production-ready.
- **70–89%** (11–13/16) — needs targeted P0 + P1 fixes.
- **< 70%** (< 11/16) — needs full `AppServiceProvider` configuration + Livewire audit.

## Report format

When running the audit, group findings by priority and label every item with its source:

```markdown
## Audit — project

**Date:** YYYY-MM-DD
**Readiness:** X/16 (Y%)

### 🔴 P0 — critical (vulnerability or N+1)

- [LW-01] `$editingEntryId` without `#[Locked]` in `app/Livewire/Entries/EntryList.php:21`
- [ESS-02] Lazy loading in `app/Livewire/Entries/Index.php:34` → N+1

### 🟡 P1 — important (essentials standard not met)

- [LW-02] Authorization in `mount()` instead of `boot()` in `EntryList.php:51`
- [ESS-03] `Model::shouldBeStrict()` not called in `AppServiceProvider::boot()`

### 🟢 P2 — nice-to-have (style and DX)

- [ESS-11] `App\Services\Telegram\MomsSupportBotHandler` not `final readonly`

### Fix plan

1. LW-01 → recipe `lw-locked.md` on `EntryList.php`
2. ESS-03 → recipe `strict-models.md` in `AppServiceProvider`

### Commands after fixes

vendor/bin/pint --dirty && vendor/bin/phpstan analyse && vendor/bin/pest  # or project's equivalent
```

Always tag each item with one of:

- `[ESS-NN]` — from `nunomaduro/essentials` package
- `[LW-NN]` — from Livewire security article
- `[DANDY-NN]` — from Dandy Style (extra recommendation)
- `[LARAVEL-NN]` — from Laravel core team docs (extra recommendation)
