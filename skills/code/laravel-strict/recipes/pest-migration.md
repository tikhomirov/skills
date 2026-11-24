# Recipe: Migrate to Pest 3 (Optional)

## Source

`pestphp/pest` (dev dep in `nunomaduro/essentials`). Combined with Dandy Style `tests`.

## Problem

PHPUnit test boilerplate hides the intent. Long `testXxxYyyZzz` names. Heavy `setUp()`.

## Bad signs

- Test method name is the only readable part.
- Lots of `$this->assertSame(...)` chains for one expectation.
- One test class per scenario, even for trivial cases.

## How to fix

New tests — write in Pest. Old tests — leave until touched.

```php
// PHPUnit
public function test_user_can_be_created(): void
{
    $user = User::factory()->create();
    $this->assertDatabaseHas('users', ['id' => $user->id]);
}

// Pest 3
it('can be created', function (): void {
    $user = User::factory()->create();
    expect($user)->toBeInstanceOf(User::class)
        ->and($user->id)->toBeInt();
});
```

Bootstrap Pest in `tests/Pest.php`:

```php
uses(Tests\TestCase::class)->in('Feature', 'Unit');
```

## When not to apply

- Massive PHPUnit suite — migration is its own PR, not a side effect.
- Team has strong PHPUnit muscle memory — Pest adds learning cost.

## Related recipes

- `prevent-stray-requests.md`
- `fake-sleep.md`
