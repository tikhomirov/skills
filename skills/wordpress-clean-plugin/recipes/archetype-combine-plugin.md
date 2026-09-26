# Recipe: Combine Plugin (Модульный комбайн)

## Назначение
Плагин средней и средне-высокой сложности, объединяющий несколько разнородных фичей под общим управлением (SEO-твики, шорткоды, кастомные колонки админки, микро-интеграции, оптимизации). Типичный пример: корпоративный плагин сайта (`wp-addon-plugin`) или набор утилит веб-студии.

## Главные проблемы комбайнов
1. **Связность «спагетти»:** модуль SEO лезет в код модуля шорткодов или напрямую дёргает глобальные функции админки.
2. **Монолитный init:** в один хук `init` свалены 50 функций.
3. **Невозможность отключить фичу:** если фича ломается или не нужна, её нельзя безболезненно выключить.

---

## Архитектура комбайна
```text
my-combine-plugin/
├── composer.json               # PSR-4: MyCombine\ -> src/
├── my-combine-plugin.php       # Входной файл (Header, проверка окружения, bootstrap)
├── src/
│   ├── Plugin.php              # Ядро плагина, инициализация DI контейнера и загрузка модулей
│   ├── Container/              # Легковесный PSR-11 контейнер
│   │   └── Container.php
│   ├── Contracts/
│   │   ├── ModuleInterface.php # Контракт модуля плагина
│   │   └── ServiceProviderInterface.php
│   ├── Services/               # Общие сервисы (Options, Cache, Logger)
│   │   ├── OptionService.php
│   │   └── ViewRenderer.php
│   └── Modules/                # Изолированные функциональные модули
│       ├── Seo/
│       │   ├── SeoModule.php   # Реализует ModuleInterface, регистрирует хуки
│       │   └── MetaRobotsFixer.php
│       ├── Shortcodes/
│       │   ├── ShortcodesModule.php
│       │   └── GalleryShortcode.php
│       └── AdminTweaks/
│           ├── AdminTweaksModule.php
│           └── CleanDashboardWidget.php
```

---

## Эталонная реализация

### 1. Контракт модуля (`src/Contracts/ModuleInterface.php`)
```php
<?php

declare(strict_types=1);

namespace MyCombine\Contracts;

use Psr\Container\ContainerInterface;

interface ModuleInterface
{
    /**
     * Уникальный идентификатор модуля для управления (вкл/выкл в опциях).
     */
    public function getId(): string;

    /**
     * Проверка, включен ли модуль в настройках сайта.
     */
    public function isEnabled(): bool;

    /**
     * Регистрация хуков WordPress и запуск модуля.
     */
    public function boot(ContainerInterface $container): void;
}
```

### 2. Реализация модуля (`src/Modules/Seo/SeoModule.php`)
```php
<?php

declare(strict_types=1);

namespace MyCombine\Modules\Seo;

use MyCombine\Contracts\ModuleInterface;
use MyCombine\Services\OptionService;
use Psr\Container\ContainerInterface;

final readonly class SeoModule implements ModuleInterface
{
    public function __construct(
        private OptionService $options
    ) {}

    public function getId(): string
    {
        return 'seo_tweaks';
    }

    public function isEnabled(): bool
    {
        return (bool) $this->options->get('enable_seo_tweaks', true);
    }

    public function boot(ContainerInterface $container): void
    {
        add_action('wp_head', [$container->get(MetaRobotsFixer::class), 'render'], 1);
    }
}
```

### 3. Оркестратор плагина (`src/Plugin.php`)
```php
<?php

declare(strict_types=1);

namespace MyCombine;

use MyCombine\Container\Container;
use MyCombine\Contracts\ModuleInterface;
use MyCombine\Services\OptionService;
use Psr\Container\ContainerInterface;

final class Plugin
{
    private static ?self $instance = null;
    private Container $container;

    /** @var list<class-string<ModuleInterface>> */
    private array $modules = [
        Modules\Seo\SeoModule::class,
        Modules\Shortcodes\ShortcodesModule::class,
        Modules\AdminTweaks\AdminTweaksModule::class,
    ];

    public static function instance(): self
    {
        return self::$instance ??= new self();
    }

    private function __construct()
    {
        $this->container = new Container();
        $this->registerCoreServices();
    }

    private function registerCoreServices(): void
    {
        $this->container->singleton(OptionService::class, static fn () => new OptionService('my_combine_options'));
    }

    public function boot(): void
    {
        foreach ($this->modules as $moduleClass) {
            /** @var ModuleInterface $module */
            $module = $this->container->get($moduleClass);

            if ($module->isEnabled()) {
                $module->boot($this->container);
            }
        }
    }
}
```

### 4. Точка входа (`wp-combine-plugin.php`)
```php
<?php
/**
 * Plugin Name: Site Core Addons (Combine)
 * Description: Modular multi-feature site engine.
 * Version:     1.0.0
 * Requires at least: 6.6
 * Tested up to: 6.7
 * Requires PHP: 8.3
 */

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
}

add_action('plugins_loaded', static function (): void {
    \MyCombine\Plugin::instance()->boot();
}, 10);
```

---

## Плохие знаки (Anti-patterns)
- Один модуль инстанциирует другой модуль напрямую через `new`.
- Настройки читаются через глобальные `get_option` по всему коду без единого типизированного репозитория/сервиса.
- Модули не могут быть выключены независимо друг от друга.
- Procedural `functions/` подключаются через гигантские простыни `require_once`.

## Хорошие знаки (Checklist)
- [ ] Каждый модуль инкапсулирован в собственную поддиректорию с `ModuleInterface`.
- [ ] Зависимости между модулями разрешаются через общий PSR-11 контейнер.
- [ ] Опция отключения модуля действительно предотвращает регистрацию его хуков.
- [ ] Строгая типизация параметров методов и возвращаемых значений.

## Связанные рецепты
- `di-container.md`
- `hook-architecture.md`
- `options-and-config.md`
