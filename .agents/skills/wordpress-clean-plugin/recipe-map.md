# WordPress Clean Architecture: Recipe Map

Используй эту таблицу перед загрузкой любых рецептов. Загружай только те рецепты, которые соответствуют текущей задаче.

---

## 1. Выбор архитектурного архетипа

| Задача или контекст | Рецепт |
|---|---|
| Мелкий хук, отключение фичи ядра, редирект, сниппет в `mu-plugins/`, 1 файл без вендоров | `recipes/archetype-micro-plugin.md` |
| Плагин средней сложности с несколькими независимыми фичами (SEO, шорткоды, оптимизации, кастомные типы), модульная структура | `recipes/archetype-combine-plugin.md` |
| Платформенный плагин уровня WooCommerce/LMS/CRM: доменная модель, кастомные таблицы, собственная экосистема хуков, фоновые очереди | `recipes/archetype-super-plugin.md` |

---

## 2. Архитектурные задачи и симптомы (Code Smells)

| Симптом или задача | Загрузить рецепт |
|---|---|
| Использование `global $my_plugin_service`, синглтонов `getInstance()` везде, сложности с тестированием и зависимостями | `recipes/di-container.md` |
| `add_action` / `add_filter` разбросаны по всему коду, анонимные функции невозможно отвязать, логика перемешана с хуками | `recipes/hook-architecture.md` |
| Нужна собственная таблица в БД, версионирование схемы, миграции, сложные запросы вместо перегрузки `wp_postmeta` | `recipes/database-and-migrations.md` |
| Работа с опциями через нетипизированный `get_option()`, интеграция с CodeStar/Carbon Fields/ACF или создание страниц настроек | `recipes/options-and-config.md` |
| Тяжелые задачи при сохранении постов или AJAX (синхронизация с API, рассылки, импорт), зависание запросов | `recipes/background-processing.md` (на базе `wp-queue`) |
| Создание метабоксов, кастомных полей (Post, Term, User, Option) без жесткой привязки к типу хранилища | `recipes/fields-and-metaboxes.md` (паттерн Storage Strategy из `wp-field-plugin`) |
| Вынос чистого домена и HTTP-клиентов интеграций в независимую от WordPress библиотеку | `recipes/core-library-extraction.md` (паттерн `iiko-core`) |
| Конфликты версий Composer зависимостей (`Guzzle`, `League\Container`, `Psr`) с другими плагинами | `recipes/scoped-dependencies.md` (PHP-Scoper) |
| Уязвимости XSS, CSRF, SQL Injection, отсутствие проверки прав пользователей (`current_user_can`), прямой доступ к PHP файлам | `recipes/security-contracts.md` |
| Полный аудит безопасности сайта: обязательная 2FA, брутфорс, спам, утечка версий, CVE плагинов, исходящая телеметрия/exfiltration, бэкдоры, eval/base64, права файлов | `recipes/project-security-audit.md` |
| Оптимизация `WP_Query` (no_found_rows), разгрузка `wp_head`, удаление лишних размеров картинок, honeypot без капчи, транслитерация слагов | `recipes/kama-snippets-and-hacks.md` (база wp-kama.ru) |
| Организация тестов: Pest WP, PHPUnit, моки ядра WordPress через Brain Monkey / Mockery без запуска полной БД | `recipes/testing-and-qa.md` |

---

## 3. Рекомендуемые комбинации рецептов

- **Для нового комбайна:** `archetype-combine-plugin.md` + `di-container.md` + `hook-architecture.md`.
- **Для нового супер-плагина:** `archetype-super-plugin.md` + `di-container.md` + `database-and-migrations.md` + `background-processing.md`.
- **Для микро-плагина:** `archetype-micro-plugin.md` + `security-contracts.md`.
- **Для аудита безопасности проекта:** `project-security-audit.md` + `security-contracts.md`.
- **Для оптимизации скорости и медиа:** `kama-snippets-and-hacks.md`.
- **Для рефакторинга существующего плагина:** `hook-architecture.md` + `di-container.md`.
