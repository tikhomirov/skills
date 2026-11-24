# Recipe: Testing & Quality Assurance (Pest & Brain Monkey)

## Проблема
Тестирование WordPress плагинов традиционно считается «тяжелым», потому что ядро завязано на глобальные функции и базу данных MySQL. Из-за этого разработчики часто вообще не пишут тесты или пишут медленные интеграционные тесты, требующие поднятого Docker и WP-test-runner.

---

## Решение: Быстрые модульные тесты (Unit Tests) без WordPress

Изоляция бизнес-логики и использование **Brain Monkey** позволяет тестировать хуки, фильтры и сервисы за миллисекунды без запуска WordPress и без базы данных.

### 1. Стек тестирования
В `composer.json` (dev-зависимости):
```json
{
    "require-dev": {
        "pestphp/pest": "^3.0",
        "brain/monkey": "^2.6",
        "mockery/mockery": "^1.6"
    },
    "config": {
        "allow-plugins": {
            "pestphp/pest-plugin": true
        }
    }
}
```

### 2. Настройка Pest (`tests/Pest.php`)
```php
<?php

declare(strict_types=1);

use Brain\Monkey;

uses()
    ->beforeEach(function () {
        Monkey\setUp();
    })
    ->afterEach(function () {
        Monkey\tearDown();
    })
    ->in('Unit');
```

---

## Примеры тестов

### Тест 1: Проверка регистрации хука (Brain Monkey)
```php
<?php

declare(strict_types=1);

use Brain\Monkey\Actions;
use MyPlugin\Modules\Orders\Hooks\OrderNotificationSubscriber;
use MyPlugin\Modules\Orders\Actions\SendOrderNotificationAction;

it('subscribes to woocommerce order completed hook', function () {
    $actionMock = Mockery::mock(SendOrderNotificationAction::class);
    $subscriber = new OrderNotificationSubscriber($actionMock);

    // Ожидаем, что add_action будет вызван с нужными аргументами
    Actions\expectAdded('woocommerce_order_status_completed')
        ->once()
        ->with([$actionMock, 'execute'], 10, 1);

    $subscriber->subscribe();
});
```

### Тест 2: Тестирование чистого доменного сервиса без моков WP
Если бизнес-логика отделена от WordPress (согласно архитектуре Clean Plugin), доменные сервисы тестируются как стандартный PHP код:

```php
<?php

declare(strict_types=1);

use MyPlugin\Domain\Model\Order;
use MyPlugin\Domain\Model\OrderStatus;

it('cannot mark an already paid order as paid', function () {
    $order = new Order(
        id: 101,
        customerEmail: 'test@example.com',
        totalCents: 5000,
        status: OrderStatus::PAID
    );

    expect(fn () => $order->markAsPaid())
        ->toThrow(\DomainException::class, 'Order already paid');
});
```

### Тест 3: Мокирование функций ядра WordPress
Brain Monkey позволяет мокировать функции ядра вроде `get_option`, `sanitize_text_field`, `wp_create_nonce`:

```php
<?php

declare(strict_types=1);

use Brain\Monkey\Functions;
use MyPlugin\Config\OptionRepository;

it('loads default config when options are empty', function () {
    Functions\expect('get_option')
        ->once()
        ->with('my_plugin_settings', [])
        ->andReturn([]);

    $repo = new OptionRepository();
    $config = $repo->get();

    expect($config->enabled)->toBeFalse()
        ->and($config->cacheTtlSeconds)->toBe(3600);
});
```

---

## Плохие знаки (Anti-patterns)
- Тестирование через поднятие полного WordPress с базой данных ради проверки одного простого метода форматирования строки.
- Использование реальных вызовов `$wpdb` в unit-тестах вместо изоляции репозитория интерфейсом.
- Отсутствие `Monkey\tearDown()`, из-за чего моки протекают между соседними тестами.

## Хорошие знаки (Checklist)
- [ ] Быстрый прогон: 50+ тестов выполняются менее чем за 1 секунду.
- [ ] Доменная логика тестируется без моков WordPress.
- [ ] Регистрация хуков проверяется через `Actions\expectAdded()` / `Filters\expectAdded()`.

## Связанные рецепты
- `hook-architecture.md`
- `di-container.md`
- `archetype-combine-plugin.md`
- `archetype-super-plugin.md`
