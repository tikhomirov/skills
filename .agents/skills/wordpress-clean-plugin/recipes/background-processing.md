# Recipe: Background Processing & Queues (wp-queue)

## Проблема
Выполнение тяжелых операций (отправка писем, выгрузка в CRM/ERP, импорт каталогов, генерация фидов, обработка медиа) синхронно в HTTP-запросе блокирует пользователей, вызывает таймауты PHP (`max_execution_time`) и теряет данные при сетевых сбоях.

Нативный WP-Cron (`wp_schedule_single_event`) ненадежен: срабатывает только при посещении сайта, не имеет очередей по приоритетам, повторов (retries) и UI мониторинга.

---

## Стандарт проекта: `wp-queue` (Laravel Horizon style для WordPress)

В качестве базового решения очередей используется пакет/плагин **[tikhomirov/wp-queue](https://github.com/tikhomirov/wp-queue)** (`rwsite/wp-queue`).

### Преимущества:
- **API в стиле Laravel:** чистый, fluent API для отправки задач, цепочек (`chain`) и батчей (`batch`).
- **PHP 8+ Атрибуты:** декларативная настройка очередей, таймаутов, повторов и расписаний прямо над классом джоба.
- **Поддержка нескольких драйверов:** Database, Redis, Memcached, Sync (с автоматическим определением доступности Redis).
- **Экспоненциальные повторы (Exponential Backoff):** автоматический перезапуск упавших задач.
- **Админ-панель:** дашборд статистики, монитор WP-Cron, просмотр упавших задач и ручной перезапуск.

---

## Архитектура и реализация

### 1. Подключение зависимости (`composer.json`)
```json
{
    "require": {
        "rwsite/wp-queue": "^1.0"
    }
}
```

### 2. Создание класса задачи (Job)
Каждая фоновая задача — это отдельный класс, наследующий `WPQueue\Jobs\Job`. Используй атрибуты PHP 8.3+:

```php
<?php

declare(strict_types=1);

namespace MyPlugin\Jobs;

use WPQueue\Jobs\Job;
use WPQueue\Attributes\Queue;
use WPQueue\Attributes\Timeout;
use WPQueue\Attributes\Retries;
use Throwable;

#[Queue('integrations')]
#[Timeout(120)]
#[Retries(3)]
final class SyncOrderToCrmJob extends Job
{
    /**
     * Все параметры конструктора автоматически сериализуются в очередь.
     */
    public function __construct(
        private int $orderId,
        private string $eventType = 'order_completed'
    ) {
        parent::__construct();
    }

    /**
     * Основная логика выполнения задачи в фоновом воркере.
     */
    public function handle(): void
    {
        $order = wc_get_order($this->orderId);
        if (! $order) {
            return;
        }

        // Воркер выполняет тяжелый API-запрос
        $client = new \MyPlugin\Services\CrmApiClient();
        $client->syncOrder($order, $this->eventType);
    }

    /**
     * Хук при окончательном падении задачи после всех попыток (retries).
     */
    public function failed(Throwable $e): void
    {
        error_log(sprintf(
            '[WP-Queue] SyncOrderToCrmJob failed for order %d: %s',
            $this->orderId,
            $e->getMessage()
        ));
    }
}
```

### 3. Отправка задач в очередь (Dispatching)

#### Одиночная отправка:
```php
use WPQueue\WPQueue;
use MyPlugin\Jobs\SyncOrderToCrmJob;

// Отправка в очередь по умолчанию (или указанную в атрибуте #[Queue]):
WPQueue::dispatch(new SyncOrderToCrmJob($orderId));

// Отправка с задержкой (например, через 5 минут):
WPQueue::dispatch(new SyncOrderToCrmJob($orderId))->delay(300);

// Переопределение очереди (например, высокий приоритет):
WPQueue::dispatch(new SyncOrderToCrmJob($orderId))->onQueue('high-priority');

// Синхронное выполнение (в обход очереди, например в CLI или тестах):
WPQueue::dispatchSync(new SyncOrderToCrmJob($orderId));
```

#### Цепочки задач (Chains):
Задачи выполняются строго последовательно; следующая стартует только после успешного завершения предыдущей:
```php
WPQueue::chain([
    new GenerateOrderPdfInvoiceJob($orderId),
    new SendOrderEmailWithAttachmentJob($orderId),
    new SyncOrderToCrmJob($orderId),
])->dispatch();
```

#### Пакетная обработка (Batches):
Параллельное распределение набора однотипных задач:
```php
$jobs = array_map(
    static fn (int $id): SyncProductJob => new SyncProductJob($id),
    $productIds
);

WPQueue::batch($jobs)
    ->onQueue('catalog-sync')
    ->dispatch();
```

### 4. Планирование задач по расписанию (Scheduling)

Используй хук `wp_queue_schedule` для регистрации периодических задач:

```php
add_action('wp_queue_schedule', static function ($scheduler): void {
    // Ежечасно
    $scheduler->job(CleanupOldSessionsJob::class)->hourly();

    // Каждые 15 минут с условием
    $scheduler->job(CheckStopListJob::class)
        ->everyMinutes(15)
        ->when(static fn (): bool => (bool) get_option('crm_sync_enabled', false));
});
```

---

## Graceful Fallback (если плагин может работать автономно)

Если плагин разрабатывается как независимый модуль и `wp-queue` может быть не установлен:

```php
if (class_exists(\WPQueue\WPQueue::class)) {
    \WPQueue\WPQueue::dispatch(new SyncOrderToCrmJob($orderId));
} else {
    // Фолбэк: Action Scheduler или немедленный синхронный запуск
    do_action('my_plugin_sync_order_sync_fallback', $orderId);
}
```

---

## Плохие знаки (Anti-patterns)
- Передача целых объектов сущностей WordPress (`WP_Post`, `WC_Order`, `$wpdb`) в конструктор Job. Сериализовать нужно **только ID и простые типы** (`int`, `string`, `array`), а в `handle()` доставать свежие данные из БД.
- Отсутствие обработки `failed(Throwable $e)` для критичных бизнес-транзакций.
- Тяжелые сетевые запросы без указания разумного `#[Timeout(30)]`.

## Хорошие знаки (Checklist)
- [ ] Конструктор задачи принимает только скаляры или DTO, подлежащие сериализации.
- [ ] Задаче назначен атрибут `#[Retries(3)]` или `#[Queue('name')]`.
- [ ] Ошибки логируются в `failed()`.
- [ ] Периодические задачи регистрируются через хук `wp_queue_schedule`.

## Связанные рецепты
- `archetype-combine-plugin.md`
- `archetype-super-plugin.md`
- `hook-architecture.md`
