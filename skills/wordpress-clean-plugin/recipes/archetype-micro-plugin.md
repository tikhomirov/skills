# Recipe: Micro-plugin (Однофайловый плагин / mu-plugin)

## Назначение
Изолированная функциональность, твик, переопределение хука или утилита, умещающаяся в один файл (до 1000 строк кода). Идеально подходит для `wp-content/mu-plugins/` или `wp-content/plugins/my-snippet-plugin.php`.

## Когда применять
- Мелкие SEO-твики (например, удаление canonical или добавление meta).
- Отключение неиспользуемого функционала ядра (XML-RPC, REST API endpoints, emojis, feeds).
- Регистрация одного Custom Post Type или таксономии без сложной логики.
- Простые редиректы или фильтры контента.

## Когда НЕ применять
- Требуются сторонние библиотеки Composer.
- Есть зависимости между несколькими сервисами (нужен DI).
- Плагин содержит админку с множеством настроек, кастомные таблицы и JS/CSS сборку.

---

## Архитектура и структура
Всего один файл. Никакого `vendor/`, никаких подпапок.
```text
wp-content/mu-plugins/disable-emojis.php
# или
wp-content/plugins/custom-redirects/custom-redirects.php
```

---

## Эталонная реализация (PHP 8.3+)

### Вариант А: Изолированный неймспейс и чистые типизированные функции
```php
<?php
/**
 * Plugin Name: Disable Emojis & XML-RPC
 * Description: Lightweight performance tweak to disable unused core endpoints and scripts.
 * Version:     1.0.0
 * Requires at least: 6.6
 * Tested up to: 6.7
 * Requires PHP: 8.3
 * License:     GPL-2.0-or-later
 */

declare(strict_types=1);

namespace Site\Micro\Performance;

if (! defined('ABSPATH')) {
    exit;
}

add_action('init', static function (): void {
    remove_action('wp_head', 'print_emoji_detection_script', 7);
    remove_action('admin_print_scripts', 'print_emoji_detection_script');
    remove_action('wp_print_styles', 'print_emoji_styles');
    remove_action('admin_print_styles', 'print_emoji_styles');
    remove_filter('the_content_feed', 'wp_staticize_emoji');
    remove_filter('comment_text_rss', 'wp_staticize_emoji');
    remove_filter('wp_mail', 'wp_staticize_emoji_for_email');

    add_filter('tiny_mce_plugins', static fn (array $plugins): array => array_diff($plugins, ['wpemoji']));
    add_filter('xmlrpc_enabled', '__return_false');
});
```

### Вариант Б: Анонимный класс с автоматической инкапсуляцией
```php
<?php
/**
 * Plugin Name: Custom Order Number Formatter
 * Description: Formats WooCommerce order numbers without global footprint.
 * Version:     1.0.0
 * Requires at least: 6.6
 * Tested up to: 6.7
 * Requires PHP: 8.3
 */

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

(new class {
    public function __construct()
    {
        add_filter('woocommerce_order_number', [$this, 'formatNumber'], 10, 2);
    }

    public function formatNumber(string|int $orderId, \WC_Order $order): string
    {
        $created = $order->get_date_created();
        $prefix = $created ? $created->format('Ym') : 'ORD';

        return sprintf('%s-%05d', $prefix, (int) $orderId);
    }
});
```

---

## Плохие знаки (Anti-patterns)
- Использование Composer `vendor/autoload.php` для плагина из 30 строк.
- Объявление функций в глобальной области видимости без неймспейса (`function my_helper()`).
- Хранение глобальных переменных через `global $my_var;`.
- Использование `include` или `require` относительных путей — микро-плагин должен быть самодостаточным.

## Хорошие знаки (Checklist)
- [ ] Присутствует `declare(strict_types=1);`.
- [ ] Проверка `defined('ABSPATH') || exit;`.
- [ ] Код либо в изолированном `namespace`, либо в анонимном/final классе.
- [ ] Отсутствие побочных эффектов при загрузке файла кроме вызова `add_action` / `add_filter`.

## Связанные рецепты
- `security-contracts.md`
- `hook-architecture.md`
