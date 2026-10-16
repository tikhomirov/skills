# Recipe: Comprehensive WordPress Project Security Audit

Методология и инструментарий глубокого аудита защищенности WordPress проекта. Рецепт применяется для выявления уязвимостей, защиты от брутфорса, спама, утечек метаданных, проверки плагинов по базам CVE, контроля исходящей телеметрии и поиска скрытых бэкдоров/обфусцированного кода.

---

## Чек-лист 7 направлений аудита

```text
[1] Периметр и брутфорс      ──> Обязательная 2FA, wp-login.php, xmlrpc.php, Ограничение REST API, User Enum, Спам
[2] Утечки метаданных        ──> Версии WP/плагинов, readme.html, debug.log, git, source maps
[3] CVE плагинов и тем       ──> Сверка версий с базами WPScan / Wordfence / NVD
[4] Аудит исходящей сети     ──> Поиск телеметрии, "phone-home" и утечек данных (Supply Chain)
[5] Бэкдоры и обфускация     ──> eval, base64_decode, скрытые админы, вебшеллы в uploads
[6] Код кастомных тем        ──> XSS, SQLi, CSRF, отсутствие current_user_can()
[7] Конфигурация и права     ──> wp-config.php, DISALLOW_FILE_EDIT, права 600/755, Nginx
```

---

## 1. Периметр и защита от брутфорса (Brute-Force & Enumeration)

### Проверка 1.1: Доступность `xmlrpc.php`
XML-RPC часто используется для обхода лимитов авторизации (метод `system.multicall` позволяет проверить сотни паролей в одном HTTP-запросе) и DDoS-атак:
```bash
# Тест доступности XML-RPC
curl -s -X POST -d "<methodCall><methodName>system.listMethods</methodName></methodCall>" https://example.com/xmlrpc.php | grep -q "methodResponse" && echo "[!] XML-RPC ОТКРЫТ" || echo "[+] XML-RPC заблокирован"
```
**Устранение:**
В Nginx: `location = /xmlrpc.php { deny all; return 403; }` или в PHP:
```php
add_filter('xmlrpc_enabled', '__return_false');
add_filter('xmlrpc_methods', static fn (): array => []);
```

### Проверка 1.2: Перечисление пользователей (User Enumeration)
Атакующие собирают логины авторов и администраторов для последующего брутфорса:
```bash
# Тест 1: Перечисление через автора в URL
curl -sI "https://example.com/?author=1" | grep -i "location:"
# Тест 2: Перечисление через REST API
curl -s "https://example.com/wp-json/wp/v2/users" | grep -o '"slug":"[^"]*"'
```
**Устранение:**
```php
// 1. Блокировка сканирования автора через URL
if (! is_admin() && isset($_REQUEST['author'])) {
    wp_die('Author scanning disabled.', '', ['response' => 403]);
}

// 2. Закрытие эндпоинта пользователей в REST API для неавторизованных
add_filter('rest_endpoints', static function (array $endpoints): array {
    if (! is_user_logged_in() && isset($endpoints['/wp/v2/users'])) {
        unset($endpoints['/wp/v2/users'], $endpoints['/wp/v2/users/(?P<id>[\d]+)']);
    }
    return $endpoints;
});
```

### Проверка 1.3: Обязательное наличие 2FA и защита входа (`wp-login.php`)

Наличие двухфакторной аутентификации (2FA) является **строгим обязательным требованием** безопасности. Простой пароль, даже сложный, уязвим к перехвату, фишингу или компрометации клиентского устройства.

1. **Проверка статуса 2FA на сайте:**
   - Проверь установленные плагины: активен ли модуль 2FA.
   - Если 2FA отсутствует — помечать статус в аудите как **[HIGH / CRITICAL RISK]**.

2. **Дефолтное рекомендуемое решение:**
   В качестве стандарта проекта использовать **[tikhomirov/wp-limit-login-attempts-plugin](https://github.com/tikhomirov/wp-limit-login-attempts-plugin)**:
   - Включает аппаратную/приложенческую двухфакторную аутентификацию (2FA / TOTP).
   - Ограничивает количество неудачных попыток входа с одного IP (Rate-limiting на базе Transients API).
   - Блокирует ботнеты по маске IP и сохраняет журнал попыток взлома.
   - Не перегружает базу лишними таблицами.

3. **Проверка защиты форм от спама:**
   - Проверь защиту форм от спама (Honeypot-метод без капчи из `kama-snippets-and-hacks.md` или плагины спам-фильтрации).

### Проверка 1.4: Ограничение публичного WP REST API

По умолчанию WP REST API доступен любому неавторизованному посетителю и отдает структуру сайта, посты, медиафайлы, таксономии и схемы данных. 

**Принцип: Публичный доступ к REST API должен быть закрыт по умолчанию и открываться только осознанно для конкретных маршрутов.**

1. **Тест открытости REST API для гостей:**
   ```bash
   curl -sI "https://example.com/wp-json/" | head -n 5
   curl -s "https://example.com/wp-json/wp/v2/types" | grep -q "post" && echo "[!] REST API полностью открыт публично" || echo "[+] REST API ограничен"
   ```

2. **Эталонная реализация блокировки REST API для неавторизованных с белым списком:**
   ```php
   add_filter('rest_authentication_errors', static function ($result) {
       // Если уже есть ошибка авторизации (например, от другого плагина/токена)
       if (true === $result || is_wp_error($result)) {
           return $result;
       }

       // Разрешаем авторизованным пользователям
       if (is_user_logged_in()) {
           return $result;
       }

       // Осознанный белый список публичных маршрутов (например, вебхуки или контактные формы)
       $currentRoute = untrailingslashit($GLOBALS['wp']->query_vars['rest_route'] ?? '');
       $publicWhitelist = apply_filters('site_public_rest_whitelist', [
           '/contact-form-7/v1/contact-forms',
           // Добавлять маршруты только при явной необходимости!
       ]);

       foreach ($publicWhitelist as $allowedRoute) {
           if (str_starts_with($currentRoute, untrailingslashit($allowedRoute))) {
               return $result;
           }
       }

       return new \WP_Error(
           'rest_cannot_access',
           __('REST API доступен только для авторизованных пользователей.', 'my-plugin'),
           ['status' => rest_authorization_required_code()]
       );
   });
   ```

3. **Удаление ссылки на REST API из заголовков страниц:**
   ```php
   remove_action('wp_head', 'rest_output_link_wp_head', 10);
   remove_action('template_redirect', 'rest_output_link_header', 11);
   ```

---

## 2. Утечки метаданных и версий (Information Leakage)

Хакеры и автоматические сканеры (WPScan, Nuclei) определяют точные версии ядра и плагинов для подбора эксплойтов.

### Проверка 2.1: Системные файлы и дампы
```bash
# Проверка опасных файлов, доступных публично:
for path in "/readme.html" "/license.txt" "/wp-config.php.bak" "/.env" "/.git/HEAD" "/debug.log" "/wp-content/debug.log" "/dump.sql"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "https://example.com$path")
  if [ "$status" = "200" ]; then
    echo "[!] КРИТИЧНО: Публично доступен файл: $path (HTTP $status)"
  fi
done
```

### Проверка 2.2: Версия WordPress в коде
```bash
# Поиск генератора в HTML
curl -s "https://example.com" | grep -i '<meta name="generator"'
# Поиск версий в подключаемых скриптах (?ver=)
curl -s "https://example.com" | grep -o 'wp-includes/js/[^"]*ver=[0-9.]*' | head -n 5
```
**Устранение:**
```php
// Скрытие версии WP
remove_action('wp_head', 'wp_generator');
add_filter('the_generator', '__return_empty_string');

// Удаление параметра ver= из скриптов и стилей
add_filter('style_loader_src', 'strip_asset_version', 9999);
add_filter('script_loader_src', 'strip_asset_version', 9999);

function strip_asset_version(string $src): string {
    return str_contains($src, 'ver=') ? remove_query_arg('ver', $src) : $src;
}
```

---

## 3. Сверка установленных плагинов с базами CVE

### Шаг 3.1: Сбор реестра плагинов и их версий
С помощью WP-CLI или скрипта просканируй заголовки плагинов:
```bash
# Через WP-CLI:
wp plugin list --fields=name,status,version,update --format=json

# Или через Bash в wp-content/plugins:
for f in wp-content/plugins/*/*.php; do
  if grep -q "Plugin Name:" "$f" 2>/dev/null; then
    name=$(grep "Plugin Name:" "$f" | head -1 | cut -d: -f2- | xargs)
    ver=$(grep "Version:" "$f" | head -1 | cut -d: -f2- | xargs)
    echo "$name | $ver | $f"
  fi
done
```

### Шаг 3.2: Проверка по базам уязвимостей
1. Сверь слаги плагинов и версии со списком известных уязвимостей через WPScan API / Wordfence Database:
   ```bash
   # Проверка ядра и плагинов через WP-CLI (при наличии пакета)
   wp core check-update
   wp plugin check-update
   ```
2. **Проверка брошенных плагинов (Abandonware):** проверь, не удален ли плагин из каталога `wordpress.org` (плагины, удаленные из каталога безопасности, часто имеют незакрытые 0-day дыры).

---

## 4. Аудит исходящего трафика (Supply Chain & Data Exfiltration)

Внедренные зловреды или недобросовестные плагины могут отправлять пользовательские данные, пароли или токены на сторонние серверы («phone-home»).

### Поиск всех внешних сетевых вызовов в кодовой базе:
```bash
# Поиск исходящих сетевых функций в plugins и themes:
rg --type php "(wp_remote_get|wp_remote_post|wp_safe_remote_get|wp_safe_remote_post|curl_exec|file_get_contents\s*\(\s*['\"]https?:\/\/|fsockopen)" wp-content/plugins/ wp-content/themes/
```

### Чек-лист анализа найденных URL:
- Является ли домен назначения официальным (например, `api.wordpress.org`, `fonts.googleapis.com`, доверенный платежный шлюз)?
- Нет ли вызовов к «сырым» IP-адресам (`http://194.x.x.x/...`) или подозрительным доменам?
- Не передаются ли в теле запроса дамп `$_POST`, `$_SERVER` или данные пользователей из базы?

---

## 5. Статический анализ на бэкдоры, малварь и обфускацию

Вредоносный код всегда пытается скрыть свое присутствие с помощью кодирования или динамического исполнения.

### Шаг 5.1: Поиск обфускации и опасных функций
Запусти поиск по регулярным выражениям в `wp-content/`:
```bash
# 1. Запуск динамического кода и распаковка
rg --type php "(eval\s*\(|assert\s*\(|create_function\s*\(|passthru\s*\(|shell_exec\s*\(|system\s*\(|proc_open\s*\(|popen\s*\()" wp-content/

# 2. Обфусцированные строки и декодирование
rg --type php "(base64_decode\s*\(|gzinflate\s*\(|gzuncompress\s*\(|str_rot13\s*\(|hex2bin\s*\(|pack\s*\(\s*['\"]H\*['\"])" wp-content/

# 3. Скрытые инъекции и глобалки в неожиданных местах
rg --type php "(\$_REQUEST|\$_POST|\$_GET)\s*\[\s*['\"][a-zA-Z0-9_\-]+['\"]\s*\]\s*\(" wp-content/
```

### Шаг 5.2: Поиск скрытого создания администраторов
```bash
# Поиск несанкционированного создания пользователей
rg --type php "(wp_create_user|wp_insert_user|add_user_to_blog)" wp-content/plugins/ wp-content/themes/
```
Любой вызов создания пользователя в кастомном плагине или теме должен быть тщательно проверен на предмет роли `administrator`.

### Шаг 5.3: Проверка директории `uploads/` на наличие исполняемого кода
Директория `wp-content/uploads/` предназначена **только для статики** (картинки, pdf, видео). В ней не должно быть ни одного исполняемого скрипта!
```bash
# Поиск PHP файлов в uploads:
find wp-content/uploads/ -type f -name "*.php*" -o -name "*.phtml" -o -name "*.phar"
```
Если найден хоть один `.php` файл в `uploads/` — это с вероятностью 99% вебшелл или бэкдор.

**Блокировка исполнения PHP в uploads на уровне Nginx:**
```nginx
location ~* ^/wp-content/uploads/.*\.php$ {
    deny all;
    return 403;
}
```

---

## 6. Аудит уязвимостей в коде кастомных тем и плагинов

При анализе кастомных файлов темы и проектных плагинов проверяй:

1. **SQL Injection:**
   ```bash
   # Поиск небезопасных запросов без prepare
   rg --type php '\$wpdb->(query|get_results|get_row|get_var)\s*\(\s*["'\''].*\$[a-zA-Z0-9_]+' wp-content/
   ```
2. **Cross-Site Scripting (XSS):**
   Поиск прямого `echo $_GET`, `echo $_POST`, `echo $param` без `esc_html()`, `esc_attr()` или `wp_kses_post()`.
3. **Отсутствие проверки прав доступа (Broken Access Control):**
   Все обработчики админки, сохранения опций и AJAX (`wp_ajax_*`) обязаны содержать:
   ```php
   if (! current_user_can('manage_options')) {
       wp_die('Forbidden', '', ['response' => 403]);
   }
   check_admin_referer('my_action_nonce');
   ```

---

## 7. Конфигурация и права доступа (Hardening)

### 7.1. Аудит `wp-config.php`
Проверь ключевые директивы:
```php
// Запрет вывода ошибок на проде (только запись в закрытый лог):
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
@ini_set('display_errors', '0');

// Запрет редактирования файлов плагинов и тем из админки WordPress:
define('DISALLOW_FILE_EDIT', true);

// Запрет прямой установки и обновления плагинов через веб-интерфейс (для Git/CI деплоя):
define('DISALLOW_FILE_MODS', true);
```

### 7.2. Права на файловую систему
```bash
# Права на wp-config.php (только чтение владельцем/веб-сервером)
chmod 600 wp-config.php # или 640

# Права на каталоги
find . -type d -exec chmod 755 {} \;

# Права на файлы
find . -type f -exec chmod 644 {} \;
```

---

## Шаблон отчета об аудите безопасности (Audit Deliverable)

По результатам проверки формируется отчет:
```markdown
# Отчет об аудите безопасности проекта [Имя проекта]

## 1. Резюме рисков (Executive Summary)
- Критичные уязвимости (Critical/High): N
- Предупреждения (Medium/Low): N
- Общая оценка защищенности: [Высокая / Удовлетворительная / Критичная]

## 2. Найденные уязвимости и дефекты
### [CRITICAL] Публичный доступ к debug.log
- Описание: Лог содержит дампы запросов и токены авторизации.
- Доказательство: HTTP 200 на /wp-content/debug.log.
- Решение: Закрыть доступ в Nginx/Apache или удалить лог.

### [HIGH] Устаревший плагин с известной уязвимостью
- Плагин: woocommerce-old-gateway v1.2 (CVE-2023-XXXX).
- Решение: Обновить до версии >= 1.5.0 или удалить.

### [MEDIUM] Открыт xmlrpc.php
- Риск: Возможность брутфорса паролей через multicall.
- Решение: Применить правило блокировки в Nginx / functions.php.

## 3. План устранения (Action Plan)
1. Немедленно: заблокировать доступ к системным файлам и xmlrpc.
2. В течение 24ч: обновить уязвимые плагины.
3. Внедрить мониторинг и регулярный аудит.
```

## Связанные рецепты
- `security-contracts.md`
- `kama-snippets-and-hacks.md`
- `archetype-combine-plugin.md`
