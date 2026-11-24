# Recipe: Hook Architecture & Event Subscribers

## Проблема
В типичных плагинах вызовы `add_action()` и `add_filter()` разбросаны случайным образом по файлам, конструкторам или статическим методам. Часто используются анонимные функции, которые невозможно протестировать или отвязать через `remove_action()`.

---

## Архитектурный стандарт

### 1. Контракт подписчика (`HookSubscriberInterface`)
Каждый модуль или фича определяет свой класс подписчика на хуки ядра или сторонних плагинов:

```php
<?php

declare(strict_types=1);

namespace MyPlugin\Contracts;

interface HookSubscriberInterface
{
    /**
     * Регистрирует слушатели через add_action и add_filter.
     */
    public function subscribe(): void;
}
```

### 2. Реализация подписчика (`OrderNotificationSubscriber.php`)
Подписчик получает необходимые обработчики (actions) через DI-контейнер и связывает их с событиями WordPress:

```php
<?php

declare(strict_types=1);

namespace MyPlugin\Modules\Orders\Hooks;

use MyPlugin\Contracts\HookSubscriberInterface;
use MyPlugin\Modules\Orders\Actions\SendOrderNotificationAction;

final readonly class OrderNotificationSubscriber implements HookSubscriberInterface
{
    public function __construct(
        private SendOrderNotificationAction $sendNotification
    ) {}

    public function subscribe(): void
    {
        add_action('woocommerce_order_status_completed', [$this->sendNotification, 'execute'], 10, 1);
    }
}
```

### 3. Однозадачные Invokable Actions
Каждый обработчик хука отвечает за одно действие. Метод принимает входные данные из WordPress, валидирует их и вызывает доменную логику:

```php
<?php

declare(strict_types=1);

namespace MyPlugin\Modules\Orders\Actions;

use MyPlugin\Domain\Services\NotificationService;
use WC_Order;

final readonly class SendOrderNotificationAction
{
    public function __construct(
        private NotificationService $notificationService
    ) {}

    public function execute(int $orderId): void
    {
        $order = wc_get_order($orderId);
        if (! $order instanceof WC_Order) {
            return;
        }

        $email = (string) $order->get_billing_email();
        if ($email === '') {
            return;
        }

        $this->notificationService->sendCompletedNotice($orderId, $email);
    }
}
```

---

## Работа с фильтрами (`add_filter`) и строгая типизация

WordPress фильтры обязаны всегда возвращать значение того же типа, что и первый аргумент.

```php
<?php

declare(strict_types=1);

namespace MyPlugin\Modules\Content\Filters;

final readonly class ExcerptLengthFilter
{
    public function __construct(
        private int $customLength = 25
    ) {}

    public function filter(int $length): int
    {
        if (is_admin()) {
            return $length;
        }

        return $this->customLength;
    }
}
```

---

## Плохие знаки (Anti-patterns)
- Регистрация хуков внутри конструктора бизнес-сущностей (`new Order()` вызывает `add_action`).
- Неименованные замыкания `add_action('init', function() { ... 100 строк кода ... })`.
- Использование `$this` в конструкторе для регистрации без разделения обязанностей.
- Отсутствие проверки типов аргументов, приходящих из хука WP.

## Хорошие знаки (Checklist)
- [ ] Все хуки сгруппированы в Subscriber классах.
- [ ] Обработчики действий являются `readonly` и внедряются через DI.
- [ ] Фильтры всегда возвращают типизированное значение и имеют ранний выход (`early exit`).
- [ ] Логика отделена от WordPress API: действие можно вызвать из CLI, REST API или очереди без эмуляции хука.

## Связанные рецепты
- `di-container.md`
- `archetype-combine-plugin.md`
- `security-contracts.md`
