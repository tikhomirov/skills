# Recipe: WP-Kama Snippets & Performance Lifehacks

Концентрированная база проверенных инженерных сниппетов, твиков производительности и архитектурных лайфхаков с портала **wp-kama.ru** (Тимур Камаев), адаптированных под строгий PHP 8.3+.

---

## 1. Турбо-оптимизация `WP_Query`

### Проблема:
По умолчанию `WP_Query` выполняет тяжелый подсчет строк через `SQL_CALC_FOUND_ROWS` и автоматически подтягивает в память всю `postmeta` и термины всех найденных записей, даже если нужен только ID или 3 последних заголовка.

### Эталонный код (PHP 8.3+):
```php
<?php

declare(strict_types=1);

namespace MyPlugin\Queries;

use WP_Query;

final class OptimizedPostQuery
{
    /**
     * @return list<int>
     */
    public static function getRecentIds(int $limit = 10): array
    {
        $query = new WP_Query([
            'post_type'              => 'post',
            'post_status'            => 'publish',
            'posts_per_page'         => $limit,
            // 1. Отключает SQL_CALC_FOUND_ROWS (огромный прирост скорости при больших БД, если нет пагинации)
            'no_found_rows'          => true,
            // 2. Не загружает postmeta для всех постов пачкой
            'update_post_meta_cache' => false,
            // 3. Не загружает таксономии и термины
            'update_post_term_cache' => false,
            // 4. Возвращает только массив целых ID вместо тяжелых объектов WP_Post
            'fields'                 => 'ids',
        ]);

        return array_map('intval', $query->posts);
    }
}
```

---

## 2. Разгрузка фронтенда и очистка `wp_head`

Удаление мусорных тегов, блокирующих скриптов и стилей Гутенберга на страницах, где они не нужны:

```php
<?php

declare(strict_types=1);

namespace MyPlugin\Optimization;

final readonly class HeadCleanOptimizer
{
    public static function boot(): void
    {
        add_action('init', [self::class, 'cleanHead']);
        add_action('wp_enqueue_scripts', [self::class, 'dequeueBloatScripts'], 100);
    }

    public static function cleanHead(): void
    {
        // Удаление информации о версии WordPress
        remove_action('wp_head', 'wp_generator');
        // Удаление ссылок на RSD и Windows Live Writer
        remove_action('wp_head', 'rsd_link');
        remove_action('wp_head', 'wlwmanifest_link');
        // Удаление коротких ссылок
        remove_action('wp_head', 'wp_shortlink_wp_head', 10);
        // Удаление ссылок на RSS ленты комментариев
        remove_action('wp_head', 'feed_links_extra', 3);
        // Удаление oEmbed ссылок и скрипта
        remove_action('wp_head', 'wp_oembed_add_discovery_links');
        remove_action('wp_head', 'wp_oembed_add_host_js');
        // Удаление REST API тега из заголовка (сам API остается доступен)
        remove_action('wp_head', 'rest_output_link_wp_head', 10);
    }

    public static function dequeueBloatScripts(): void
    {
        // Отключение стилей Gutenberg на страницах без блоков
        if (! is_admin() && ! has_blocks()) {
            wp_dequeue_style('wp-block-library');
            wp_dequeue_style('wp-block-library-theme');
            wp_dequeue_style('global-styles'); // Стили theme.json
        }

        // Отключение wp-embed
        wp_deregister_script('wp-embed');
    }
}
```

---

## 3. Антиспам без капчи (Метод Kama Honeypot)

### Принцип:
Боты отправляют формы автоматически, заполняя все поля без задержки и не исполняя хитрый JS. Настоящий человек заполняет форму минимум 3–5 секунд и оставляет скрытые ловушки пустыми.

```php
<?php

declare(strict_types=1);

namespace MyPlugin\Security;

final readonly class HoneypotSpamBlocker
{
    private const FIELD_NAME = 'user_comment_website_trap';
    private const TIME_FIELD = 'form_submit_token_time';
    private const MIN_SECONDS = 3;

    public static function boot(): void
    {
        add_action('comment_form_after_fields', [self::class, 'renderTrapField']);
        add_filter('preprocess_comment', [self::class, 'verifySubmission']);
    }

    public static function renderTrapField(): void
    {
        $time = time();
        $hash = hash_hmac('sha256', (string) $time, wp_salt('nonce'));

        echo '<div style="display:none !important;" aria-hidden="true">';
        echo '<input type="text" name="' . self::FIELD_NAME . '" tabindex="-1" autocomplete="off" value="" />';
        echo '<input type="hidden" name="' . self::TIME_FIELD . '" value="' . esc_attr("{$time}:{$hash}") . '" />';
        echo '</div>';
    }

    /**
     * @param array<string, mixed> $commentData
     * @return array<string, mixed>
     */
    public static function verifySubmission(array $commentData): array
    {
        // Если ловушка заполнена ботом
        if (! empty($_POST[self::FIELD_NAME])) {
            wp_die('Спам-фильтр: бот обнаружен (trap).', 'Spam Blocked', ['response' => 403]);
        }

        // Проверка времени заполнения
        $timeToken = (string) ($_POST[self::TIME_FIELD] ?? '');
        if (! str_contains($timeToken, ':')) {
            wp_die('Спам-фильтр: недействительный токен времени.', 'Spam Blocked', ['response' => 403]);
        }

        [$timestamp, $hash] = explode(':', $timeToken, 2);
        $expectedHash = hash_hmac('sha256', (string) $timestamp, wp_salt('nonce'));

        if (! hash_equals($expectedHash, $hash)) {
            wp_die('Спам-фильтр: поддельный токен времени.', 'Spam Blocked', ['response' => 403]);
        }

        $elapsed = time() - (int) $timestamp;
        if ($elapsed < self::MIN_SECONDS) {
            wp_die('Спам-фильтр: форма отправлена слишком быстро (робот).', 'Spam Blocked', ['response' => 403]);
        }

        return $commentData;
    }
}
```

---

## 4. Оптимизация медиа и предотвращение раздувания диска

WordPress по умолчанию при загрузке 1 изображения генерирует до 7–10 копий (`medium_large`, `1536x1536`, `2048x2048`), что съедает дисковое пространство.

```php
<?php

declare(strict_types=1);

namespace MyPlugin\Media;

final readonly class MediaUploadOptimizer
{
    public static function boot(): void
    {
        // Отключение лишних размеров по умолчанию
        add_filter('intermediate_image_sizes_advanced', [self::class, 'filterIntermediateSizes']);
        // Ограничение максимального разрешения оригинала (2560px -> 1920px)
        add_filter('big_image_size_threshold', static fn (): int => 1920);
        // Качество сжатия JPEG по умолчанию (82% вместо 90%)
        add_filter('jpeg_quality', static fn (): int => 82);
    }

    /**
     * @param array<string, mixed> $sizes
     * @return array<string, mixed>
     */
    public static function filterIntermediateSizes(array $sizes): array
    {
        unset(
            $sizes['medium_large'], // 768px
            $sizes['1536x1536'],    // 2x medium_large
            $sizes['2048x2048']     // 2x large
        );

        return $sizes;
    }
}
```

---

## 5. Транслитерация слагов и файлов (Русский ➔ Латиница)

Исключение проблем с кодировками URL, ссылками в мессенджерах и кириллическими именами файлов на сервере:

```php
<?php

declare(strict_types=1);

namespace MyPlugin\Optimization;

final readonly class TransliterationHelper
{
    private const MAP = [
        'а'=>'a','б'=>'b','в'=>'v','г'=>'g','д'=>'d','е'=>'e','ё'=>'e','ж'=>'zh',
        'з'=>'z','и'=>'i','й'=>'y','к'=>'k','л'=>'l','м'=>'m','н'=>'n','о'=>'o',
        'п'=>'p','р'=>'r','с'=>'s','т'=>'t','у'=>'u','ф'=>'f','х'=>'h','ц'=>'ts',
        'ч'=>'ch','ш'=>'sh','щ'=>'sch','ъ'=>'','ы'=>'y','ь'=>'','э'=>'e','ю'=>'yu',
        'я'=>'ya'
    ];

    public static function boot(): void
    {
        add_filter('sanitize_file_name', [self::class, 'transliterate'], 10);
        add_filter('sanitize_title', [self::class, 'transliterate'], 0);
    }

    public static function transliterate(string $text): string
    {
        $text = mb_strtolower($text, 'UTF-8');
        $translit = strtr($text, self::MAP);

        return preg_replace('/[^a-z0-9_\-\.]+/u', '-', $translit) ?? $translit;
    }
}
```

## Связанные рецепты
- `security-contracts.md`
- `hook-architecture.md`
- `archetype-combine-plugin.md`
