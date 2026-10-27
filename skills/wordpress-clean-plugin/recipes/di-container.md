# Recipe: Dependency Injection & Container (PSR-11)

## Проблема
WordPress исторически построен на глобальных функциях и хуках. Разработчики плагинов часто используют синглтоны `Plugin::getInstance()` как глобальный Service Locator или обращаются к `$GLOBALS`. Это приводит к:
- Невозможности покрыть код изолированными unit-тестами.
- Скрытым неявным зависимостям между классами.
- Гонкам состояний при тестировании или интеграциях.

---

## Решение: PSR-11 Контейнер + Service Providers

### 1. Легковесный PSR-11 Контейнер (для микро-комбайнов)
Если не хочется тянуть сторонние пакеты, используется минимальный контейнер с поддержкой рефлексии (autowiring) и синглтонов:

```php
<?php

declare(strict_types=1);

namespace MyPlugin\Container;

use Psr\Container\ContainerInterface;
use ReflectionClass;
use RuntimeException;

final class Container implements ContainerInterface
{
    /** @var array<string, mixed> */
    private array $instances = [];

    /** @var array<string, callable(ContainerInterface): mixed> */
    private array $definitions = [];

    public function set(string $id, callable $factory): void
    {
        $this->definitions[$id] = $factory;
    }

    public function singleton(string $id, callable $factory): void
    {
        $this->set($id, function (ContainerInterface $c) use ($id, $factory) {
            return $this->instances[$id] ??= $factory($c);
        });
    }

    public function instance(string $id, mixed $instance): void
    {
        $this->instances[$id] = $instance;
    }

    public function get(string $id): mixed
    {
        if (isset($this->instances[$id])) {
            return $this->instances[$id];
        }

        if (isset($this->definitions[$id])) {
            return ($this->definitions[$id])($this);
        }

        if (class_exists($id)) {
            return $this->autowire($id);
        }

        throw new RuntimeException("Service not found in container: {$id}");
    }

    public function has(string $id): bool
    {
        return isset($this->instances[$id]) || isset($this->definitions[$id]) || class_exists($id);
    }

    private function autowire(string $class): object
    {
        $reflector = new ReflectionClass($class);
        $constructor = $reflector->getConstructor();

        if ($constructor === null || $constructor->getNumberOfParameters() === 0) {
            return new $class();
        }

        $dependencies = [];
        foreach ($constructor->getParameters() as $param) {
            $type = $param->getType();
            if ($type instanceof \ReflectionNamedType && ! $type->isBuiltin()) {
                $dependencies[] = $this->get($type->getName());
                continue;
            }

            if ($param->isDefaultValueAvailable()) {
                $dependencies[] = $param->getDefaultValue();
                continue;
            }

            throw new RuntimeException("Cannot resolve parameter {$param->getName()} for {$class}");
        }

        return $reflector->newInstanceArgs($dependencies);
    }
}
```

### 2. Использование PHP-DI (для супер-плагинов)
В `composer.json`:
```json
{
    "require": {
        "php-di/php-di": "^7.0"
    }
}
```
Конфигурация контейнера (`src/Config/container.php`):
```php
<?php

declare(strict_types=1);

use DI\ContainerBuilder;
use MyPlugin\Domain\Repositories\OrderRepositoryInterface;
use MyPlugin\Infrastructure\Persistence\WpdbOrderRepository;
use function DI\autowire;
use function DI\create;
use function DI\get;

$builder = new ContainerBuilder();
$builder->addDefinitions([
    wpdb::class => static function (): wpdb {
        global $wpdb;
        return $wpdb;
    },
    OrderRepositoryInterface::class => autowire(WpdbOrderRepository::class),
]);

return $builder->build();
```

---

## Паттерн Service Provider

Сервис-провайдер разделяет две фазы жизненного цикла:
1. `register()`: Биндинг сервисов в контейнер (до вызова хуков).
2. `boot()`: Регистрация хуков WordPress через `add_action` / `add_filter`.

```php
<?php

declare(strict_types=1);

namespace MyPlugin\Providers;

use MyPlugin\Services\OrderService;
use MyPlugin\Hooks\OrderHooksSubscriber;
use Psr\Container\ContainerInterface;

final readonly class OrderServiceProvider
{
    public function register(ContainerInterface $container): void
    {
        // Конфигурация зависимостей в контейнере
    }

    public function boot(ContainerInterface $container): void
    {
        /** @var OrderHooksSubscriber $subscriber */
        $subscriber = $container->get(OrderHooksSubscriber::class);
        $subscriber->subscribe();
    }
}
```

---

## Ключевое правило: Антипаттерн Service Locator

❌ **НИКОГДА НЕ ДЕЛАЙ ТАК в бизнес-сервисах:**
```php
final class OrderService
{
    // Запрещено передавать контейнер в бизнес-сервис
    public function __construct(private ContainerInterface $container) {}

    public function process(): void
    {
        $mailer = $this->container->get(Mailer::class); // Service Locator smell!
    }
}
```

✅ **ПРАВИЛЬНО: явные зависимости через конструктор:**
```php
final readonly class OrderService
{
    public function __construct(
        private MailerInterface $mailer,
        private OrderRepositoryInterface $repository
    ) {}

    public function process(): void
    {
        $this->mailer->send(...);
    }
}
```

Контейнер используется **только на границе системы (bootstrap / subscriber / controller)** для разрешения зависимостей и запуска хуков.

## Связанные рецепты
- `hook-architecture.md`
- `archetype-combine-plugin.md`
- `archetype-super-plugin.md`
- `testing-and-qa.md`
