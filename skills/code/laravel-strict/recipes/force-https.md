# Recipe: Force HTTPS in Production

## Source

`nunomaduro/essentials` → `Configurables/ForceScheme`. Calls `URL::forceHttps()`.

## Problem

Generated URLs use `http://` in production. Cookies, redirects, asset URLs leak scheme.

## Bad signs

- `url('/some/path')` returns `http://...` in production.
- Mixed-content warnings in browser console.
- Cookies without `Secure` flag.

## How to fix

Guard with environment check:

```php
// app/Providers/AppServiceProvider.php::boot()
if (app()->isProduction()) {
    URL::forceHttps();
}
```

## Before

```php
public function boot(): void {}
```

## After

```php
public function boot(): void
{
    if (app()->isProduction()) {
        URL::forceHttps();
    }
}
```

## When not to apply

- Local development behind HTTP proxy — only force in production.
- Behind nginx/cloudflare without `TrustProxies` configured — `isProduction()` check may misfire.

## Related recipes

- `safe-console.md`
