# Source Map — Laravel Strict

Each recipe is grounded in a real source. If a recommendation is not in this map, label it as an extra recommendation (Dandy Style, Spatie, Laravel core, etc.), not as a Nuno recipe.

## `nunomaduro/essentials` package — configurables

| Configurable                                    | Recipe                              |
| ----------------------------------------------- | ----------------------------------- |
| `ShouldBeStrict`                                | `recipes/strict-models.md`          |
| `AutomaticallyEagerLoadRelationships`           | `recipes/auto-eager-load.md`        |
| `Unguard`                                       | `recipes/unguard.md`                |
| `ImmutableDates`                                | `recipes/immutable-dates.md`        |
| `ForceScheme`                                   | `recipes/force-https.md`            |
| `ProhibitDestructiveCommands`                   | `recipes/safe-console.md`           |
| `AggressivePrefetching`                         | `recipes/asset-prefetch.md`         |
| `PreventStrayRequests`                          | `recipes/prevent-stray-requests.md` |
| `FakeSleep`                                     | `recipes/fake-sleep.md`             |
| `SetDefaultPassword`                            | `recipes/password-defaults.md`      |
| `MakeActionCommand` (`make:action`)             | `recipes/make-action.md`            |
| `EssentialsPintCommand` (`essentials:pint`)     | `recipes/pint-config.md`            |
| `EssentialsRectorCommand` (`essentials:rector`) | `recipes/rector-config.md`          |

## Laravel / PHP best practices

| Practice                                           | Recipe                             | Origin                                                              |
| -------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------- |
| `final readonly` service / Action classes          | `recipes/final-readonly.md`        | Dandy Style + Nuno coding style in `essentials/src/Configurables/*` |
| `#[Scope]` attribute on Eloquent scopes            | `recipes/scope-attrs.md`           | Laravel 11+ attribute style                                           |
| PHPDoc generics on relations (`HasMany<X, $this>`) | `recipes/phpdoc-generics.md`       | `nunomaduro/larastan` (Larastan)                                    |
| PHP 8.1 enums + Eloquent cast                      | `recipes/enums-cast.md`            | Laravel 9+ enum cast                                                |
| Single-action controllers + `App\Actions\`         | `recipes/actions-pattern.md`       | `essentials/src/Commands/MakeActionCommand.php`                     |
| Query builder over `DB::raw`                       | `recipes/query-builder.md`         | Dandy Style (`exceptions`, `no-nonsense`)                           |
| Pest 3 style tests                                 | `recipes/pest-migration.md`        | `pestphp/pest` (dev dep in essentials)                              |
| N+1 detection patterns                             | `recipes/detect-n-plus-one.md`     | `AutomaticallyEagerLoadRelationships` + Dandy Style                 |
| Password complexity audit                          | `recipes/audit-passwords.md`       | `SetDefaultPassword` configurable                                   |
| Mass-assignment audit                              | `recipes/audit-mass-assignment.md` | `ShouldBeStrict` + `Unguard` + Dandy Style                          |

## Livewire security

| Pattern                                                  | Recipe                                  | Origin                                                                              |
| -------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------- |
| `#[Locked]` on public server-side properties             | `recipes/lw-locked.md`                  | <https://rwsite.ru/livewire-i-bezopasnost-tri-uyazvimosti-kotorye-legko-propustit/> |
| `boot()` vs `mount()` for auth                           | `recipes/lw-boot-vs-mount.md`           | same article + Livewire docs                                                        |
| `catch (\Exception)` swallowing `AuthorizationException` | `recipes/lw-authorization-exception.md` | same article                                                                        |
| Ownership-scoped lookups (`forUser()` first)             | `recipes/lw-ownership-scope.md`         | Dandy Style (`frameworks`, `laravel-way`) + article                                 |
| Full Livewire audit checklist                            | `recipes/lw-audit.md`                   | synthesis of all four                                                               |

## Cross-cutting

| Tool                                     | Recipe                  | Origin                                                                   |
| ---------------------------------------- | ----------------------- | ------------------------------------------------------------------------ |
| 16-point essentials + Livewire readiness | `16-point-checklist.md` | `nunomaduro/essentials/README.md` features + article         |
| Quick audit of the project               | `quick-audit.md`        | Dandy Style workflow + Nuno configurables                     |

## Rule for agents

If a recommendation is not in this map, label it explicitly as "extra recommendation (not from Laravel Strict)" so the user can judge the source.

When combining recommendations, prefer order:

1. Essentials configurables (cheapest wins — single boot provider method);
2. Laravel / PHP best practices (model + relation changes);
3. Livewire security (high-impact, low-risk fixes for IDOR);
4. Dandy Style (naming, comments, early exit, magic values, breath);
5. Pest / Rector / Pint presets (tooling layer).
