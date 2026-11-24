# Recipe: Prevent Stray Requests in Tests

## Source

`nunomaduro/essentials` → `Configurables/PreventStrayRequests`. Calls `Http::preventStrayRequests()`.

## Problem

Tests make real HTTP calls to external services they forgot to fake. Flaky, slow, or rate-limited CI.

## Bad signs

- Test hits `https://api.telegram.org/...` without `Http::fake()`.
- CI fails on rate limits.
- Tests depend on network availability.

## How to fix

Add to `tests/TestCase.php::setUp()`:

```php
protected function setUp(): void
{
    parent::setUp();
    Http::preventStrayRequests();
    // ...
}
```

When a test fails with a "stray request" exception, add the matching fake:

```php
Http::fake([
    'https://api.telegram.org/*' => Http::response(['ok' => true, 'result' => []], 200),
]);
```

## Before

```php
protected function setUp(): void
{
    parent::setUp();
    $this->app->make(Repository::class)->set('session.driver', 'array');
}
```

## After

```php
protected function setUp(): void
{
    parent::setUp();
    Http::preventStrayRequests();
    Sleep::fake();

    $this->app->make(Repository::class)->set('session.driver', 'array');
}
```

## When not to apply

- Integration tests that hit a local docker — keep, but document.
- Outbound HTTP smoke tests — separate suite, not unit/feature tests.

## Related recipes

- `fake-sleep.md`
