# Recipe: Security Contracts & Data Integrity

## Проблема
Более 90% уязвимостей в плагинах WordPress происходят из-за отсутствия проверки прав (Broken Access Control), отсутствия проверки Nonce (CSRF), прямой вставки переменных в SQL (SQLi) или неэкранированного вывода (XSS).

---

## 6 Непреложных Правил Безопасности (Security Contracts)

### 1. Защита от прямого вызова файлов (Direct Access Prevention)
В первой строке каждого исполняемого PHP-файла:
```php
if (! defined('ABSPATH')) {
    exit;
}
```

### 2. Авторизация и проверка прав (Capabilities)
Никогда не полагайся на то, что пользователь находится в админке (`is_admin()` проверяет только URL, а НЕ права пользователя!).
```php
if (! current_user_can('manage_options')) {
    wp_die(esc_html__('Insufficient permissions', 'my-plugin'), '', ['response' => 403]);
}
```

В WP REST API маршрутах:
```php
register_rest_route('my-plugin/v1', '/settings', [
    'methods' => 'POST',
    'callback' => [$this, 'saveSettings'],
    'permission_callback' => static function (): bool {
        return current_user_can('manage_options');
    },
]);
```
*Внимание:* `permission_callback => '__return_true'` допустим только для строго публичных эндпоинтов только для чтения!

### 3. Защита от CSRF (Nonces)
Каждая форма или AJAX-запрос обязаны передавать и валидировать nonce:

```php
// Генерация в форме:
wp_nonce_field('my_plugin_save_action', 'my_plugin_nonce');

// Проверка в обработчике POST:
if (! isset($_POST['my_plugin_nonce']) || ! wp_verify_nonce((string) $_POST['my_plugin_nonce'], 'my_plugin_save_action')) {
    wp_die(esc_html__('Security check failed', 'my-plugin'), '', ['response' => 403]);
}

// Или для AJAX:
check_ajax_referer('my_plugin_ajax_action', 'security');
```

### 4. Очистка на входе (Input Sanitization)
Все входящие данные (`$_POST`, `$_GET`, `$_REQUEST`, query params) должны очищаться перед сохранением:
- Строка: `sanitize_text_field(wp_unslash($_POST['title'] ?? ''))`
- Ключ/слаг: `sanitize_key($_POST['key'] ?? '')`
- Целое число: `absint($_POST['item_id'] ?? 0)`
- Массив строк: `array_map('sanitize_text_field', wp_unslash((array) ($_POST['tags'] ?? [])))`
- Email: `sanitize_email($_POST['email'] ?? '')`
- URL: `esc_url_raw($_POST['url'] ?? '')`

### 5. Контекстное экранирование на выходе (Output Escaping)
Никогда не выводи переменные напрямую (`echo $var`). Экранируй строго по контексту:
- Текст внутри HTML-тегов: `echo esc_html($title);`
- Внутри атрибутов тега: `<input value="<?php echo esc_attr($val); ?>">`
- Ссылки в `href` или `src`: `<a href="<?php echo esc_url($link); ?>">`
- Богатый HTML (с разрешенными тегами): `echo wp_kses_post($content);`
- Внутри inline JS: `let config = <?php echo wp_json_encode($data); ?>;`

### 6. Защита от SQL-инъекций (Prepared Statements)
Запрещено:
```php
// УЯЗВИМО:
$wpdb->query("SELECT * FROM {$table} WHERE email = '{$email}'");
```
Обязательно:
```php
// БЕЗОПАСНО:
$wpdb->get_results(
    $wpdb->prepare("SELECT * FROM {$table} WHERE email = %s AND status = %d", $email, $status)
);
```

### 7. Осознанный и закрытый по умолчанию WP REST API
Публичный REST API ядра WordPress не должен быть открыт «настежь».
1. Любой кастомный маршрут должен иметь надежный `permission_callback`:
   ```php
   // Запрещено без жесткой необходимости:
   'permission_callback' => '__return_true', // УЯЗВИМО для изменения данных или приватной информации

   // Обязательно:
   'permission_callback' => static fn (): bool => current_user_can('edit_posts'),
   ```
2. Если сайту не нужен публичный headless-фронтенд, REST API закрывается для гостей через хук `rest_authentication_errors` (разрешая доступ только авторизованным или конкретным белым спискам вебхуков).

---

## Чек-лист безопасности для любого PR / Ревью
- [ ] Все PHP файлы имеют `defined('ABSPATH') || exit;`.
- [ ] Все обработчики форм и AJAX имеют проверку nonce и `current_user_can()`.
- [ ] Все вызовы `$wpdb` используют `$wpdb->prepare()`.
- [ ] В REST API указан строгий `permission_callback` (открытие наружу только осознанно).
- [ ] Данные санитизируются перед записью и экранируются перед выводом.

## Связанные рецепты
- `database-and-migrations.md`
- `options-and-config.md`
- `hook-architecture.md`
