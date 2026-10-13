# Recipe: Super-Plugin / Platform Plugin (Платформенный монолит)

## Назначение
Крупномасштабные платформенные плагины (100+ классов), которые фундаментально трансформируют WordPress в полноценное бизнес-приложение (E-commerce уровня WooCommerce, LMS, CRM, Membership, биллинг, Helpdesk).

## Главные вызовы супер-плагинов
1. **Предел WordPress схемы БД:** стандартные таблицы `wp_posts` и `wp_postmeta` не выдерживают нагрузку при миллионах транзакций. Нужны кастомные таблицы и миграции.
2. **Асинхронность:** тяжелые процессы (оплата, вебхуки, генерация PDF, отправка email) нельзя выполнять синхронно в HTTP-запросе.
3. **Экосистема для сторонних разработчиков:** плагин сам становится платформой и обязан предоставлять собственные хуки, REST API, CLI и точки расширения.
4. **Масштабируемость кода:** без чистой или гексагональной архитектуры платформа деградирует в неуправляемый монолит.

---

## Архитектура слоев (Clean / Hexagonal)
```text
my-platform-plugin/
├── composer.json               # Зависимости: PHP-DI, wp-queue, Webmozart Assert и др.
├── platform-core.php           # Точка входа (проверка PHP 8.3+, версий WP/MySQL, boot)
├── database/                   # Миграции структуры таблиц
│   └── migrations/
├── src/
│   ├── Kernel.php              # Инициализация платформы, компиляция DI контейнера
│   ├── Domain/                 # Чистая бизнес-логика (НЕ зависит от WordPress API)
│   │   ├── Model/ (Entities, Value Objects)
│   │   ├── Events/ (Domain Events)
│   │   └── Repositories/ (Интерфейсы репозиториев)
│   ├── Application/            # Сценарии использования (Use Cases, DTO, Event Handlers)
│   │   ├── Commands/
│   │   └── Queries/
│   ├── Infrastructure/         # Реализации адаптеров к WordPress и внешним сервисам
│   │   ├── Persistence/        # $wpdb репозитории, кастомные таблицы
│   │   ├── Background/         # Action Scheduler задачи
│   │   ├── RestApi/            # WP REST API v1/v2 контроллеры
│   │   ├── Cli/                # WP-CLI команды
│   │   └── WordPress/          # Адаптеры к хукам ядра WP
│   └── Presentation/
│       ├── Admin/              # Админка (React/Gutenberg/Legacy)
│       └── Frontend/           # Шорткоды, шаблоны, ассеты
```

---

## Ключевые паттерны супер-плагина

### 1. Доменная сущность независима от WordPress (`src/Domain/Model/Order.php`)
```php
<?php

declare(strict_types=1);

namespace MyPlatform\Domain\Model;

final class Order
{
    public function __construct(
        private readonly int $id,
        private readonly string $customerEmail,
        private readonly int $totalCents,
        private OrderStatus $status
    ) {}

    public function markAsPaid(): void
    {
        if ($this->status === OrderStatus::PAID) {
            throw new \DomainException('Order already paid');
        }

        $this->status = OrderStatus::PAID;
    }

    public function getId(): int { return $this->id; }
    public function getCustomerEmail(): string { return $this->customerEmail; }
    public function getTotalCents(): int { return $this->totalCents; }
    public function getStatus(): OrderStatus { return $this->status; }
}
```

### 2. Контракт репозитория (`src/Domain/Repositories/OrderRepositoryInterface.php`)
```php
<?php

declare(strict_types=1);

namespace MyPlatform\Domain\Repositories;

use MyPlatform\Domain\Model\Order;

interface OrderRepositoryInterface
{
    public function findById(int $id): ?Order;
    public function save(Order $order): void;
}
```

### 3. Инфраструктурный репозиторий через кастомную таблицу (`src/Infrastructure/Persistence/WpdbOrderRepository.php`)
```php
<?php

declare(strict_types=1);

namespace MyPlatform\Infrastructure\Persistence;

use MyPlatform\Domain\Model\Order;
use MyPlatform\Domain\Model\OrderStatus;
use MyPlatform\Domain\Repositories\OrderRepositoryInterface;
use wpdb;

final readonly class WpdbOrderRepository implements OrderRepositoryInterface
{
    private string $table;

    public function __construct(private wpdb $wpdb)
    {
        $this->table = $this->wpdb->prefix . 'platform_orders';
    }

    public function findById(int $id): ?Order
    {
        $row = $this->wpdb->get_row(
            $this->wpdb->prepare("SELECT * FROM {$this->table} WHERE id = %d LIMIT 1", $id),
            ARRAY_A
        );

        if (! is_array($row)) {
            return null;
        }

        return new Order(
            id: (int) $row['id'],
            customerEmail: (string) $row['customer_email'],
            totalCents: (int) $row['total_cents'],
            status: OrderStatus::from((string) $row['status'])
        );
    }

    public function save(Order $order): void
    {
        $this->wpdb->replace(
            $this->table,
            [
                'id' => $order->getId(),
                'customer_email' => $order->getCustomerEmail(),
                'total_cents' => $order->getTotalCents(),
                'status' => $order->getStatus()->value,
                'updated_at' => current_time('mysql'),
            ],
            ['%d', '%s', '%d', '%s', '%s']
        );
    }
}
```

### 4. Точки расширения для сторонних разработчиков (Public Events)
Супер-плагин должен давать API другим плагинам:
```php
// Внутри Application Service или Command Handler:
do_action('my_platform_order_status_changed', $order->getId(), $order->getStatus()->value);
apply_filters('my_platform_calculate_order_fee', $calculatedFee, $order);
```

---

## Чек-лист платформенного плагина
- [ ] **Кастомные таблицы:** Бизнес-данные вынесены из `wp_posts`/`wp_postmeta` в нормализованные таблицы.
- [ ] **Мигратор схемы:** Версионирование БД в коде (`dbDelta` или мигратор) с безопасным обновлением.
- [ ] **Очереди и фоновые задачи:** Использование `wp-queue` или Action Scheduler для асинхронной обработки.
- [ ] **DI Контейнер:** Автовайринг интерфейсов к реализациям через PSR-11 контейнер (PHP-DI).
- [ ] **REST API:** Собственный namespace `/wp-json/my-platform/v1/` со строгой валидацией DTO.
- [ ] **WP-CLI команды:** Возможность управлять сущностями платформы из консоли.

## Связанные рецепты
- `di-container.md`
- `database-and-migrations.md`
- `background-processing.md`
- `hook-architecture.md`
- `security-contracts.md`
