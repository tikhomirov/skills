# Recipe: Scoped Dependencies (Изоляция библиотек)

## Паттерн из практики
Основан на опыте **`woo2iiko`** (`Woo2IikoVendor\League\Container`).

## Проблема «Ада зависимостей» в WordPress
В WordPress все активные плагины делят единое глобальное пространство имен PHP. Если:
- Плагин A подключает `Guzzle 7.8`.
- Плагин B подключает `Guzzle 6.5`.
- Тот плагин, который загрузился первым через `plugins_loaded`, побеждает, а второй падает с фатальной ошибкой `Method not found` или `Declaration incompatible`.

Аналогично для PSR-интерфейсов, DI-контейнеров (`league/container`, `php-di`) и HTTP-клиентов.

---

## Решение: Префиксирование вендоров (PHP-Scoper / Strauss)

Все сторонние зависимости, поставляемые с плагином, переносятся в изолированный неймспейс плагина во время сборки релиза:
`League\Container\Container` ➔ `MyPluginVendor\League\Container\Container`.

### 1. Инструмент: Strauss (наиболее простой в настройке для WP)
В `composer.json` плагина:
```json
{
    "require": {
        "league/container": "^4.2"
    },
    "require-dev": {
        "brianhenryie/strauss": "^0.16"
    },
    "extra": {
        "strauss": {
            "target_directory": "src/Vendor",
            "namespace_prefix": "MyPlugin\\Vendor\\",
            "classmap_prefix": "MyPlugin_Vendor_"
        }
    },
    "scripts": {
        "strauss": "strauss"
    }
}
```

### 2. Сборка:
```bash
composer run strauss
```
Все классы из `vendor/league/container` копируются в `src/Vendor/League/Container` с переписанными неймспейсами `MyPlugin\Vendor\League\Container`.

### 3. Использование в коде:
```php
<?php

declare(strict_types=1);

namespace MyPlugin\Container;

use MyPlugin\Vendor\League\Container\Container;

final class ContainerFactory
{
    public static function create(): Container
    {
        return new Container();
    }
}
```

---

## Когда использовать
- В **супер-плагинах** и **комбайнах**, распространяемых для клиентов или на публичном рынке, где состав других плагинов на сайте неизвестен.
- При использовании популярных Composer-пакетов (`guzzlehttp/guzzle`, `symfony/*`, `monolog/monolog`, `league/*`).

## Когда НЕ использовать
- В **микро-плагинах** (в них нет Composer).
- В закрытых in-house монорепозиториях, где все зависимости сайта управляются одним корневым `composer.json`.

## Связанные рецепты
- `archetype-super-plugin.md`
- `di-container.md`
