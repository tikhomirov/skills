# Recipe: Options, Configuration & Settings

## Проблема
Вызовы `get_option('my_plugin_option_key')` размазаны по десяткам файлов. Дефолтные значения дублируются, типы возвращаемых данных не гарантированы (WordPress возвращает `false`, если опция не найдена, или неструктурированные массивы/строки).

---

## Архитектурный стандарт

### 1. Типизированный DTO конфигурации (`PluginConfig.php`)
Вся конфигурация инкапсулируется в неизменяемый (readonly) объект со строгими типами:

```php
<?php

declare(strict_types=1);

namespace MyPlugin\Config;

final readonly class PluginConfig
{
    public function __construct(
        public bool $enabled,
        public string $apiKey,
        public int $cacheTtlSeconds,
        public array $allowedPostTypes
    ) {}

    /**
     * @param array<string, mixed> $raw
     */
    public static function fromArray(array $raw): self
    {
        return new self(
            enabled: (bool) ($raw['enabled'] ?? false),
            apiKey: sanitize_text_field((string) ($raw['api_key'] ?? '')),
            cacheTtlSeconds: max(60, (int) ($raw['cache_ttl'] ?? 3600)),
            allowedPostTypes: array_values(array_filter(
                (array) ($raw['allowed_post_types'] ?? ['post']),
                'is_string'
            ))
        );
    }
}
```

### 2. Репозиторий опций (`OptionRepository.php`)
Один класс отвечает за чтение и запись конфигурации:

```php
<?php

declare(strict_types=1);

namespace MyPlugin\Config;

final readonly class OptionRepository
{
    private const OPTION_KEY = 'my_plugin_settings';

    public function get(): PluginConfig
    {
        $raw = get_option(self::OPTION_KEY, []);

        return PluginConfig::fromArray(is_array($raw) ? $raw : []);
    }

    public function save(PluginConfig $config): bool
    {
        return update_option(self::OPTION_KEY, [
            'enabled' => $config->enabled,
            'api_key' => $config->apiKey,
            'cache_ttl' => $config->cacheTtlSeconds,
            'allowed_post_types' => $config->allowedPostTypes,
        ]);
    }
}
```

---

## Взаимодействие с UI фреймворками (CodeStar / Carbon Fields / ACF)

Если плагин использует визуальный фреймворк настроек (например, CodeStar Framework в `wp-addon-plugin`):
1. **Фреймворк отвечает только за UI** в админ-панели и сохранение в БД.
2. **Бизнес-код плагина никогда не знает о фреймворке напрямую.**
3. `OptionRepository` читает массив опций фреймворка и преобразует его в чистый DTO.

```php
// В OptionRepository:
public function get(): PluginConfig
{
    // CodeStar сохраняет массив в одну опцию:
    $csfOptions = get_option('_my_plugin_csf_options', []);
    return PluginConfig::fromArray(is_array($csfOptions) ? $csfOptions : []);
}
```

---

## Важные правила WordPress Options
- **Автозагрузка (`autoload`):** При создании опций (`add_option`) по умолчанию WordPress загружает их на каждом запросе (`autoload = yes`). Если в опции хранится большой JSON или кэш — передавай `autoload = 'no'`.
- **Кэширование:** Нативный `get_option()` уже кэшируется в WP Object Cache. Не оборачивай каждый `get_option` в свой `wp_cache_get` без необходимости.

## Связанные рецепты
- `di-container.md`
- `archetype-combine-plugin.md`
- `security-contracts.md`
