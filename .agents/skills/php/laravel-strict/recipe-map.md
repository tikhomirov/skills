# Recipe Map — Laravel Strict

Use this map before loading any recipe. Load only what matches a real smell.

## Essentials (configurables from the package)

| Smell or task                                                        | Load recipe                         |
| -------------------------------------------------------------------- | ----------------------------------- |
| Lazy loading in dev, missing attribute access, mass-assignment slips | `recipes/strict-models.md`          |
| N+1 queries, missing `with()`, repeated eager load boilerplate       | `recipes/auto-eager-load.md`        |
| `$guarded = []` on a model, project trusts all input                 | `recipes/unguard.md`                |
| `Carbon::now()->addDay()` mutates shared dates                       | `recipes/immutable-dates.md`        |
| Mixed HTTP/HTTPS in production URLs                                  | `recipes/force-https.md`            |
| `migrate:fresh` ran by accident in production                        | `recipes/safe-console.md`           |
| Front-end loads slowly, no Vite prefetching                          | `recipes/asset-prefetch.md`         |
| Test makes a real HTTP call it did not fake                          | `recipes/prevent-stray-requests.md` |
| `sleep(5)` in code, real seconds in tests                            | `recipes/fake-sleep.md`             |
| Weak password validation, no `uncompromised()` check                 | `recipes/password-defaults.md`      |
| Need a `final readonly` Action class template                        | `recipes/make-action.md`            |
| Default `pint.json` is too permissive                                | `recipes/pint-config.md`            |
| Default `rector.php` misses dead code / type decls                   | `recipes/rector-config.md`          |

## Laravel / PHP best practices

| Smell or task                                               | Load recipe                        |
| ----------------------------------------------------------- | ---------------------------------- |
| Service or Action class is not `final`, properties mutate   | `recipes/final-readonly.md`        |
| `scopeForUser($query, $id)` legacy, no type hints           | `recipes/scope-attrs.md`           |
| Relation return types are `mixed`, IDE loses tracking       | `recipes/phpdoc-generics.md`       |
| String field has a fixed set of values (status, role, type) | `recipes/enums-cast.md`            |
| Business logic in controller / Livewire, more than 5 lines  | `recipes/actions-pattern.md`       |
| `DB::raw("... $var ...")` with interpolation                | `recipes/query-builder.md`         |
| Want to migrate a single test file to Pest                  | `recipes/pest-migration.md`        |
| Slow pages, repeated queries in loops                       | `recipes/detect-n-plus-one.md`     |
| Need to harden `Password::defaults()` to production rules   | `recipes/audit-passwords.md`       |
| `Model::create($request->all())`, unsafe `$fillable`        | `recipes/audit-mass-assignment.md` |

## Livewire security (applies to any Livewire project — 3.x or 4.x)

| Smell or task                                                                    | Load recipe                             |
| -------------------------------------------------------------------------------- | --------------------------------------- |
| `public ?int $editingId` — IDOR via DevTools                                     | `recipes/lw-locked.md`                  |
| Auth check only in `mount()` — fails after permission revoke and `wire:navigate` | `recipes/lw-boot-vs-mount.md`           |
| `try { authorize() } catch (\Exception)` swallows authorization                  | `recipes/lw-authorization-exception.md` |
| `Entry::find($id)` without `forUser()` first                                     | `recipes/lw-ownership-scope.md`         |
| Need a checklist for the whole Livewire surface                                  | `recipes/lw-audit.md`                   |

## Cross-cutting

| Smell or task                                                    | Load recipe             |
| ---------------------------------------------------------------- | ----------------------- |
| Want the full 16-point essentials + Livewire readiness checklist | `16-point-checklist.md` |
| Quick audit of the project — boot providers, tests, style configs | `quick-audit.md`       |

## Loading limits

- Contextual mode: at most 1–3 recipes.
- Review mode: load this map, then recipes after detecting smells.
- Commit mode: inspect changed files first.
- Never load a recipe unless its smell is visible.
