# Recipe: Database, Custom Tables & Migrations

## Проблема
Попытка запихнуть миллионы строк транзакционных данных (заказы, логи, аналитика, токены) в `wp_posts` и `wp_postmeta` приводит к деградации производительности сайта, раздуванию индексов и блокировкам таблиц. С другой стороны, создание кастомных таблиц вручную без системы версионирования и миграций ломает обновление плагина на проде.

---

## Когда использовать Custom Tables вместо PostMeta
- **Объем данных:** более 10 000 – 50 000 записей, которые быстро растут.
- **Сложная фильтрация:** требуются выборки по 3+ полям с индексами (в `postmeta` поиск по нескольким ключам делает тяжелые `JOIN`).
- **Транзакционность:** критичны внешние ключи или строгие типы данных (BIGINT, DATETIME).

---

## Архитектура миграций

### 1. Версионирование схемы
Текущая версия схемы хранится в `wp_options` (например, `my_plugin_db_version`). При обновлении плагина запускается мигратор.

```php
<?php

declare(strict_types=1);

namespace MyPlugin\Database;

use wpdb;

final readonly class DatabaseMigrator
{
    private const DB_VERSION_OPTION = 'my_plugin_db_version';
    private const TARGET_VERSION = '1.2.0';

    public function __construct(private wpdb $wpdb) {}

    public function maybeMigrate(): void
    {
        $currentVersion = (string) get_option(self::DB_VERSION_OPTION, '0.0.0');

        if (version_compare($currentVersion, self::TARGET_VERSION, '>=')) {
            return;
        }

        $this->runMigrations($currentVersion);
        update_option(self::DB_VERSION_OPTION, self::TARGET_VERSION);
    }

    private function runMigrations(string $fromVersion): void
    {
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $charsetCollate = $this->wpdb->get_charset_collate();
        $table = $this->wpdb->prefix . 'my_plugin_records';

        // dbDelta требует строгий формат SQL: 2 пробела после PRIMARY KEY, строчные буквы и т.д.
        $sql = "CREATE TABLE {$table} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            event_type varchar(64) NOT NULL,
            payload longtext NULL,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY created_at (created_at)
        ) {$charsetCollate};";

        dbDelta($sql);
    }
}
```

### 2. Безопасные запросы и паттерн Репозиторий
Прямые вызовы `$wpdb->query()` запрещены в контроллерах или доменной логике. Все операции изолируются в репозитории:

```php
<?php

declare(strict_types=1);

namespace MyPlugin\Database\Repositories;

use wpdb;

final readonly class RecordRepository
{
    private string $table;

    public function __construct(private wpdb $wpdb)
    {
        $this->table = $this->wpdb->prefix . 'my_plugin_records';
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function findByUserId(int $userId, int $limit = 20): array
    {
        $query = $this->wpdb->prepare(
            "SELECT id, user_id, event_type, created_at 
             FROM {$this->table} 
             WHERE user_id = %d 
             ORDER BY created_at DESC 
             LIMIT %d",
            $userId,
            $limit
        );

        $results = $this->wpdb->get_results($query, ARRAY_A);

        return is_array($results) ? $results : [];
    }

    public function insert(int $userId, string $eventType, ?string $payload): int
    {
        $this->wpdb->insert(
            $this->table,
            [
                'user_id' => $userId,
                'event_type' => $eventType,
                'payload' => $payload,
                'created_at' => current_time('mysql'),
            ],
            ['%d', '%s', '%s', '%s']
        );

        return (int) $this->wpdb->insert_id;
    }
}
```

---

## Правила безопасности $wpdb
1. **Никакой конкатенации пользовательского ввода в SQL:** Всегда `$wpdb->prepare()`.
2. **Имена таблиц:** Имя таблицы (`$this->table`) собирается только из `$wpdb->prefix` и жестко закодированной строки.
3. **Плейсхолдеры:**
   - `%d` — для целых чисел.
   - `%f` — для чисел с плавающей точкой.
   - `%s` — для строк.
   - `IN (%s)` — не работает для списков! Для массивов используй `implode(',', array_fill(0, count($ids), '%d'))`.

## Связанные рецепты
- `security-contracts.md`
- `archetype-super-plugin.md`
- `di-container.md`
