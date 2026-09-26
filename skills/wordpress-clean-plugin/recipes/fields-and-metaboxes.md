# Recipe: Fields, Forms & Metaboxes (Storage Strategy)

## Паттерн из практики
Основан на архитектуре **`wp-field-plugin`**.

## Проблема
Код кастомных полей жестко завязан на конкретное место хранения (например, методы прямо вызывают `get_post_meta` / `update_post_meta`). Если то же самое поле нужно привязать к таксономии (`term_meta`), пользователю (`user_meta`), странице настроек (`options`) или вынести в кастомную таблицу БД для ускорения запросов — приходится полностью переписывать логику отрисовки, сохранения и санитизации.

---

## Решение: Паттерн Storage Strategy

Поле или форма объявляется один раз (тип инпута, лейбл, валидация, санитизация), а механизм сохранения делегируется отдельной стратегии через интерфейс:

```php
<?php

declare(strict_types=1);

namespace MyPlugin\Fields\Contracts;

interface FieldStorageStrategyInterface
{
    public function get(int|string $objectId, string $key, mixed $default = null): mixed;
    public function set(int|string $objectId, string $key, mixed $value): bool;
    public function delete(int|string $objectId, string $key): bool;
}
```

### Реализации стратегий:
- **`PostMetaStorageStrategy`:** использует `get_post_meta()` / `update_post_meta()`.
- **`TermMetaStorageStrategy`:** использует `get_term_meta()` / `update_term_meta()`.
- **`UserMetaStorageStrategy`:** использует `get_user_meta()` / `update_user_meta()`.
- **`OptionStorageStrategy`:** использует `get_option()` / `update_option()`.
- **`CustomTableStorageStrategy`:** использует `$wpdb` и кастомную таблицу.

---

## Архитектура поля (Fluent Builder)

```php
<?php

declare(strict_types=1);

namespace MyPlugin\Fields;

use MyPlugin\Fields\Contracts\FieldStorageStrategyInterface;

final readonly class TextField
{
    public function __construct(
        public string $key,
        public string $label,
        public FieldStorageStrategyInterface $storage,
        public bool $required = false
    ) {}

    public function getValue(int|string $objectId): string
    {
        $raw = $this->storage->get($objectId, $this->key, '');
        return is_string($raw) ? $raw : '';
    }

    public function save(int|string $objectId, mixed $rawValue): bool
    {
        $sanitized = sanitize_text_field(wp_unslash((string) $rawValue));

        if ($this->required && $sanitized === '') {
            return false;
        }

        return $this->storage->set($objectId, $this->key, $sanitized);
    }

    public function render(int|string $objectId): void
    {
        $value = $this->getValue($objectId);
        ?>
        <div class="field-wrap">
            <label for="<?php echo esc_attr($this->key); ?>"><?php echo esc_html($this->label); ?></label>
            <input 
                type="text" 
                id="<?php echo esc_attr($this->key); ?>" 
                name="<?php echo esc_attr($this->key); ?>" 
                value="<?php echo esc_attr($value); ?>" 
                class="regular-text"
            />
        </div>
        <?php
    }
}
```

## Связанные рецепты
- `security-contracts.md`
- `options-and-config.md`
- `database-and-migrations.md`
