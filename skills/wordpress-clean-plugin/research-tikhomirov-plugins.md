# Исследование архитектуры WordPress-репозиториев tikhomirov

**Дата исследования:** 26 сентября 2026 г.  
**Объекты анализа:** Репозитории GitHub пользователя `tikhomirov` (`rwsite`), а также локальные кодовые базы в `/home/alex/Projects/` и `/home/alex/Projects/rwsite-ru/wp-content/plugins/`.

---

## 1. Сводный реестр исследованных репозиториев

| Репозиторий | Категория / Архетип | Стек и ключевые технологии | Ключевые архитектурные паттерны |
|---|---|---|---|
| **woo2iiko** | Супер-плагин (Platform Monolith) | PHP 8.3+, WC 7.6+, `league/container` (scoped), Pest 4.2, Rector, Infection | Feature-First (40+ изолированных фичей в `src/Features`), `ModuleRegistry`, `CompositionRoot`, `ContainerFactory` |
| **iiko-core** | Выделенная чистая библиотека | PHP 8.3+, PHPUnit 12, PHPStan 2.2, Pint | Zero WP dependencies, чистый HTTP-транспорт, DTO, Token Provider, контракты |
| **wp-queue** | Платформенная подсистема (Очереди) | PHP 8.3+, Laravel Horizon API style, Pest/PHPUnit | PHP 8 Атрибуты (`#[Queue]`, `#[Schedule]`, `#[Timeout]`), Multi-driver (Redis, DB, Memcached, Sync), Batch/Chain |
| **wp-addon-plugin** | Модульный комбайн | PHP 8.2+, CodeStar Framework, Pest, Brain Monkey, PHPStan | Динамический автодискавери модулей (`ModuleInterface`), `OptionService` как фасад над CSF, 48 тогглов |
| **wp-field-plugin** | Fluent Framework полей/форм | PHP 8.3+, Pest 4.1, TypeScript/Vite admin shell, Rector | Паттерн Storage Strategy (PostMeta, TermMeta, UserMeta, Option, CustomTable), Fluent Builder, 95% test coverage |
| **wp-thumbnail-plugin** | Domain-Driven Service | PHP 8.0+, Imagick/GD, WebP, PHPStan | Clean Architecture / DDD (`Domain/`, `Application/`, `Infrastructure/`), `ServiceContainer` |
| **wp-limit-login-attempts-plugin** | Security / Utility | PHP 7.4/8.x, Transients API, 2FA, WP-Login hooks | Rate limiting на базе Transients (`_transient_auth_*`), кастомные фильтры аутентификации |
| **wp-tags-plugin** | Утилитарный плагин (Rewrite) | PHP 7.4+, WP Rewrite Rules | Иерархические теги, маппинг rewrite rules со слагов |
| **wp-toc-plugin** | Утилитарный плагин (Content) | PHP 8.0+, Regex DOM parser, Content Filter | Шорткоды `[toc]`, автоинъекция через фильтр `the_content` |
| **wp-readtime-plugin** | Утилитарный плагин (Metrics) | PHP 7.4+, расчет слов/минут | Шорткод, автоподсчет времени чтения |
| **wp-fancybox-plugin** | Фронтенд-интеграция | Assets enqueue, Fancybox.js | Условное подключение скриптов/стилей по селекторам |
| **wp-breadcrumbs-plugin** | SEO / Schema.org | Микроразметка BreadcrumbList | Построение цепочек навигации с JSON-LD Schema.org |
| **blog-theme & bagel** | Темы WordPress | Understrap, SASS, Vite/Parcel, WooCommerce | Дочерние темы Understrap, модульное разделение в `inc/`, loop-templates, WooCommerce overrides |
| **delivery** | Тема доставки ресторанов | Bulma CSS, кастомный `framework/Theme.php` | BulmaNavWalker, модульные элементы и фичи |

---

## 2. Глубокий анализ ключевых проектов

### 2.1. `woo2iiko` и `iiko-core`: Эталон супер-плагина (Platform Monolith)

`woo2iiko` — сложнейший коммерческий плагин интеграции WooCommerce и iiko RMS (версия 2.0).

#### Архитектурные особенности:
1. **Feature-First Architecture:**
   Вместо технического разделения на `Controllers/`, `Models/`, `Views/` проект организован по вертикальным доменным слайсам в `src/Features/` (более 40 фичей):
   - `ProductImport/`, `OrderExport/`, `StopList/`, `Geocoding/`, `DeliveryCalendar/`, `CheckoutForm/`, `Bonuses/` и т.д.
   - Каждая фича самодостаточна: содержит свои подписчики хуков, DTO, репозитории и бизнес-правила.
2. **Внедрение зависимостей (DI Container):**
   - Используется `league/container: ^4.2`.
   - **Защита зависимостей (PHP-Scoper):** Контейнер изолирован в неймспейс `Woo2IikoVendor\League\Container`, что исключает конфликты с другими плагинами WordPress.
   - `ContainerFactory`: явная регистрация сервисов через фабрики и биндинги без неявного reflection-автовайринга на проде (для максимальной производительности).
   - `CompositionRoot`: центральная точка связывания графа приложения.
3. **Жизненный цикл и безопасность инициализации:**
   - `ModuleRegistry` и `ModuleInterface` со строгой идемпотентностью (`ModuleBootIdempotencyGuard`), исключающей повторную регистрацию хуков.
4. **Вынесение ядра в независимую библиотеку (`iiko-core`):**
   - HTTP-клиенты, генерация и хранение токенов, контракты API вынесены в чистый Composer-пакет `tikhomirov/iiko-core` (PHP 8.3+).
   - В `iiko-core` нет ни одной функции WordPress (`get_option`, `add_action`). Он может использоваться в консольных демонах, микросервисах или Laravel-приложениях (`RestoHub`).

---

### 2.2. `wp-queue` / `wp-queue-plugin`: Фоновые очереди нового поколения

Вдохновлен Laravel Horizon и очередями Laravel, перенесенными в WordPress.

#### Архитектурные особенности:
1. **Атрибуты PHP 8:**
   ```php
   #[Queue('imports')]
   #[Timeout(120)]
   #[Retries(5)]
   #[Schedule('hourly')]
   class ImportProductsJob extends Job { ... }
   ```
2. **Мультидрайверное хранилище:**
   - `RedisStorage` (высокая производительность с автодетектом Redis).
   - `DatabaseStorage` (надежное хранение в БД WordPress с локами строк).
   - `MemcachedStorage`, `SyncStorage` (синхронный запуск для тестов/CLI).
3. **Fluent API диспетчера:**
   - Цепочки: `WPQueue::chain([...])->dispatch();`
   - Батчи: `WPQueue::batch([...])->dispatch();`
   - Задержки: `WPQueue::dispatch($job)->delay(60);`
4. **Встроенный планировщик (Scheduler):**
   - Хук `wp_queue_schedule` с поддержкой fluent-интервалов (`->hourly()`, `->everyMinutes(15)`, `->when(fn() => ...)`).

---

### 2.3. `wp-addon-plugin`: Эталон модульного комбайна

Главный плагин сайта rwsite.ru, объединяющий 48+ различных опций оптимизации, безопасности и функционала.

#### Архитектурные особенности:
1. **Динамический модуль-лоадер (`Plugin::loadModules`):**
   - Сканирует `functions/` и поддиректории (`functions/*/*.php`).
   - Находит классы, реализующие `WpAddon\Interfaces\ModuleInterface`.
   - Автоматически инстанциирует их и вызывает `$module->init()`.
2. **Фасад настроек (`OptionService`):**
   - Инкапсулирует CodeStar Framework (CSF).
   - Бизнес-код модулей не читает напрямую глобальные опции CSF, а работает через типизированный сервис с дефолтными значениями и миграциями.
3. **Качественный тулинг:**
   - Pest PHP + Brain Monkey для тестирования модулей в изоляции.
   - Laravel Pint (`pint.json`) для код-стайла.
   - PHPStan на уровне wordpress-stubs.

---

### 2.4. `wp-field-plugin`: Универсальная архитектура полей и форм

Библиотека полей v4 со fluent-интерфейсом и поддержкой 52 типов полей.

#### Архитектурные особенности:
1. **Паттерн Storage Strategy:**
   Поле абстрагировано от места своего физического хранения:
   - `PostMetaStorage`, `TermMetaStorage`, `UserMetaStorage`, `OptionStorage`, `CustomTableStorage`.
   - Один и тот же класс поля может сохраняться в мета-данные поста, опцию или кастомную таблицу простым переключением адаптера.
2. **Интеграция современного фронтенда:**
   - Админский интерфейс собирается через Vite (`vite.admin-shell.config.js`).
   - Поддерживает как чистый Vanilla JS, так и React-компоненты.
3. **Экстремальный уровень тестирования:**
   - 95% минимальный порог покрытия тестами (`pest --coverage --min=95`).
   - Автоматический рефакторинг через Rector (`rector.php`).

---

### 2.5. `wp-thumbnail-plugin`: Чистая архитектура (DDD)

Плагин генерации миниатюр на лету с кэшированием и поддержкой WebP.

#### Архитектурные особенности:
- **`Domain/`**: Чистые сущности и Value Objects (`ThumbnailProfile`, `ImageSource`), интерфейсы `ImageProcessorInterface`, `StorageInterface`.
- **`Application/`**: `ThumbnailService` (оркестрация процесса нарезки, валидации и кэша).
- **`Infrastructure/`**: Адаптеры `ImagickProcessor`, `GdProcessor`, `FileSystemStorage`, `ServiceContainer`.
- Демонстрирует, как изолировать сложную вычислительную логику от API ядра WordPress.

---

### 2.6. Утилитарные плагины и Темы

1. **`wp-limit-login-attempts-plugin`:**
   - Использование `Transients API` для распределенного rate-limiting по IP.
   - Внедрение в пайплайн авторизации ядра через фильтр `authenticate` с приоритетом 5 (до стандартной проверки пароля WP).
2. **Темы (`blog-theme`, `bagel`, `delivery`):**
   - Модульная организация PHP в `inc/` (`enqueue.php`, `setup.php`, `template-tags.php`, `woocommerce.php`).
   - Использование современных бандлеров (Vite) для сборки SASS и ES-модулей.
   - Разделение шаблонов на `loop-templates/`, `page-templates/`, `global-templates/` и оверрайды WooCommerce.

---

## 3. Общие стандарты кодовой базы tikhomirov

1. **Строгая типизация и PHP 8.3+:**
   - `declare(strict_types=1);`
   - Использование `readonly` классов, `match`, union types, first-class callables.
2. **Инженерный Toolchain:**
   - **Тестирование:** `Pest PHP` + `Brain Monkey` + `Mockery` (для модульных тестов) + `PHPUnit` (для интеграционных).
   - **Статический анализ:** `PHPStan` + `szepeviktor/phpstan-wordpress` + `php-stubs/wordpress-stubs` + `woocommerce-stubs`.
   - **Код-стайл:** `laravel/pint` для автоматического форматирования.
   - **Рефакторинг:** `Rector` для автоматического повышения версии PHP и очистки мертвого кода.
3. **Управление зависимостями:**
   - Изоляция сторонних Composer-библиотек через namespace-префиксы (scoped packages), предотвращающая конфликт версий в экосистеме WordPress.
4. **Разделение домена и WordPress API:**
   - Стремление выносить чистую бизнес-логику в независимые библиотеки (`iiko-core`) или слои (`Domain/`), оставляя WordPress только роль адаптера / системы доставки (Delivery Mechanism).

---

## 4. Рекомендуемые рецепты для скилла `wordpress-clean-plugin`

На основе проведенного анализа кодовой базы сформирован перечень рецептов, которые необходимо включить в скилл:

### 1. Рецепты архетипов (Archetypes)
- `archetype-micro-plugin.md` — 1-файловые утилиты и сниппеты (паттерны `wp-readtime`, `wp-toc`, `wp-tags`).
- `archetype-combine-plugin.md` — модульные комбайны (паттерны `wp-addon-plugin`: `ModuleInterface`, dynamic autoloader, `OptionService` поверх CSF, тумблеры).
- `archetype-super-plugin.md` — платформенные супер-плагины (паттерны `woo2iiko`: `src/Features`, `ModuleRegistry`, `CompositionRoot`, `ContainerFactory`).

### 2. Продвинутые архитектурные рецепты
- `feature-first-architecture.md` — организация супер-плагинов по вертикальным доменным слайсам (Feature-First) вместо горизонтальных технических слоев.
- `extracted-core-library.md` — паттерн выделения чистого PHP 8.3+ ядра (без зависимостей от WordPress) в отдельную библиотеку с автотестами (кейс `iiko-core`).
- `storage-strategies-and-fields.md` — паттерн Storage Strategy из `wp-field-plugin` (абстрагирование сохранения полей между PostMeta, TermMeta, UserMeta, Options и кастомными таблицами).
- `di-container.md` — внедрение PSR-11 зависимостей: легкий контейнер vs `league/container` со скоупингом неймспейсов.
- `background-processing.md` — очереди и планировщик на базе `tikhomirov/wp-queue` (атрибуты `#[Queue]`, `#[Schedule]`, Redis/DB драйверы, batched/chained jobs).
- `rate-limiting-and-transients.md` — паттерн rate limiting, блокировок и кэширования через Transients API и хук `authenticate` (кейс `wp-limit-login-attempts`).
- `clean-theme-architecture.md` — архитектура современных тем на базе Understrap/Bootstrap/Bulma, разделение на `inc/`, loop-templates, WooCommerce overrides и сборку Vite.
- `testing-and-qa.md` — современный тестовый пайплайн: Pest PHP + Brain Monkey + PHPStan WordPress + Rector + Laravel Pint.
