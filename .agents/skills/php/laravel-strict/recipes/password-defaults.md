# Recipe: Set Default Password Complexity

## Source

`nunomaduro/essentials` → `Configurables/SetDefaultPassword`. Calls `Password::defaults(...)`.

## Problem

Weak password validation rules in `FormRequest`. No minimum length, no complexity, no `uncompromised()` check.

## Bad signs

- `'password' => 'required|min:6'` in FormRequest.
- No `Password::defaults()` configured globally.
- Users can set `12345678` as a password.

## How to fix

Add to `app/Providers/AppServiceProvider.php::boot()`:

```php
Password::defaults(function (): ?Password {
    return app()->isProduction()
        ? Password::min(12)->letters()->mixedCase()->numbers()->symbols()->max(255)->uncompromised()
        : null;
});
```

In FormRequest:

```php
public function rules(): array
{
    return [
        'password' => ['required', 'confirmed', Password::defaults()],
    ];
}
```

## When not to apply

- Legacy user base that has short passwords — migrate gradually.
- External IdP (SSO) — passwords are managed elsewhere.

## Related recipes

- `audit-passwords.md`
