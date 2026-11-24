# Recipe: Audit Password Validation

## Source

`nunomaduro/essentials` `SetDefaultPassword` + `Password::defaults(...)`.

## Problem

Inconsistent password rules across FormRequests. Some allow 6 chars, some 12. None call `uncompromised()`.

## Bad signs

```bash
grep -rn "'password' =>" app/Http/Requests/
grep -rn "Password::" app/Http/Requests/
```

- `'password' => 'required|min:6'`
- Different rules in `LoginRequest` vs `RegisterRequest` vs `UpdatePasswordRequest`.

## How to fix

Set global defaults (recipe `password-defaults.md`), then use `Password::defaults()` everywhere:

```php
'password' => ['required', 'confirmed', Password::defaults()],
```

Default rules from `nunomaduro/essentials`:

```php
Password::min(12)
    ->letters()
    ->mixedCase()
    ->numbers()
    ->symbols()
    ->max(255)
    ->uncompromised();
```

## When not to apply

- External auth (SSO / OAuth) — passwords are not validated here.
- Legacy user migration — keep old rules temporarily, then migrate.

## Related recipes

- `password-defaults.md`
