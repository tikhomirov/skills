# Recipe: Fake Sleep in Tests

## Source

`nunomaduro/essentials` → `Configurables/FakeSleep`. Calls `Sleep::fake()`.

## Problem

`sleep(5)` or `Sleep::for(5)->seconds()` in test code waits real seconds. Slow CI.

## Bad signs

- Test takes 30+ seconds when logic should be instant.
- `sleep(` appears in `app/` or `tests/`.
- Hard to debug time-dependent code.

## How to fix

Add to `tests/TestCase.php::setUp()`:

```php
Sleep::fake();
```

Use `Sleep::for(...)` instead of `sleep(...)` in production code:

```php
// before
sleep(5);

// after
Sleep::for(5)->seconds();
```

In tests, advance time and assert the fake was called:

```php
Sleep::fake();
Sleep::for(10)->seconds();
Sleep::assertSleptTimes(10);
```

## When not to apply

- True integration tests that measure real timing — keep them slow on purpose.

## Related recipes

- `prevent-stray-requests.md`
- `immutable-dates.md`
