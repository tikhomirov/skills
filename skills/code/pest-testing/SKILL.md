---
name: pest-testing
description: Design, write, review, and refactor Pest PHP v3/v4 tests for Laravel applications, including feature tests, unit tests, architecture tests, datasets, and mock fakes.
argument-hint: [test task description]
---

# Pest Testing for Laravel Skill

Comprehensive guide and patterns for testing modern Laravel applications with **Pest PHP (v3 & v4)**.

---

## 1. Test Architecture & Directory Structure

```text
tests/
├── ArchTest.php               # Architecture tests enforcing code quality & boundaries
├── TestCase.php               # Base test case
├── Unit/                      # Fast isolated logic tests (no database)
└── Feature/                   # HTTP endpoint, database, integration, job, and command tests
    ├── Auth/
    ├── Orders/
    └── Api/
```

---

## 2. Feature Tests (API & Controllers)

### Standard HTTP API Test

```php
<?php

declare(strict_types=1);

use App\Models\Product;
use App\Models\User;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

test('authenticated user can create an order', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create(['price' => 500, 'stock_status' => 'in_stock']);

    $response = actingAs($user)->postJson('/api/v1/orders', [
        'items' => [
            ['product_id' => $product->id, 'quantity' => 2],
        ],
        'payment_type' => 'card',
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('ok', true)
        ->assertJsonPath('data.total', 1000);

    $this->assertDatabaseHas('orders', [
        'user_id' => $user->id,
        'total' => 1000,
    ]);
});
```

### Validation Failure Tests

```php
test('order validation fails when item quantity is zero or missing', function () {
    $user = User::factory()->create();

    actingAs($user)
        ->postJson('/api/v1/orders', ['items' => []])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['items']);
});
```

---

## 3. Architecture Tests (`ArchTest.php`)

Ensure strict architectural boundaries and standards across the entire project:

```php
<?php

declare(strict_types=1);

arch('strict types are declared everywhere')
    ->expect('App')
    ->toUseStrictTypes();

arch('controllers must have Controller suffix')
    ->expect('App\Http\Controllers')
    ->toHaveSuffix('Controller');

arch('models must extend Eloquent Model')
    ->expect('App\Models')
    ->toExtend('Illuminate\Database\Eloquent\Model');

arch('no debug functions left in codebase')
    ->expect(['dd', 'dump', 'ray', 'var_dump'])
    ->not->toBeUsed();

arch('actions must be final and have a single responsibility')
    ->expect('App\Actions')
    ->classes()
    ->toBeFinal();
```

---

## 4. Fakes, Mocks & External Services

Never perform real HTTP calls, external API hits, or background email dispatches in test runs:

### HTTP Client Fake

```php
use Illuminate\Support\Facades\Http;

test('external iiko cloud order sync sends correct payload', function () {
    Http::fake([
        'https://api-ru.iiko.services/api/1/deliveries/create' => Http::response([
            'orderInfo' => ['id' => 'iiko-order-123', 'status' => 'Success'],
        ], 200),
    ]);

    $service = app(IikoOrderService::class);
    $result = $service->sendOrder($order);

    expect($result->iikoId)->toBe('iiko-order-123');

    Http::assertSent(function ($request) {
        return $request->hasHeader('Authorization') &&
               $request['order']['items'] !== [];
    });
});
```

### Event & Queue Fakes

```php
use App\Events\OrderCreated;
use App\Jobs\ProcessPaymentJob;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;

test('order placement dispatches event and queue job', function () {
    Event::fake([OrderCreated::class]);
    Queue::fake([ProcessPaymentJob::class]);

    // Perform action
    postJson('/api/v1/orders', $payload)->assertCreated();

    Event::assertDispatched(OrderCreated::class);
    Queue::assertPushed(ProcessPaymentJob::class);
});
```

---

## 5. Datasets for Parameterized Testing

```php
test('discount calculation handles tier thresholds', function (int $cartTotal, int $expectedDiscount) {
    $calculator = new DiscountCalculator();
    expect($calculator->calculate($cartTotal))->toBe($expectedDiscount);
})->with([
    'under min tier' => [500, 0],
    'bronze tier'    => [1000, 50],
    'silver tier'    => [2500, 200],
    'gold tier'      => [5000, 600],
]);
```

---

## 6. Commands to Run Tests

- `php artisan test` or `vendor/bin/pest`
- Run single test file: `php artisan test tests/Feature/OrderTrackingTest.php`
- Run matching tests by filter: `php artisan test --filter=OrderTracking`
- Run architecture tests only: `php artisan test --arch`
- Run with coverage: `php artisan test --coverage`
