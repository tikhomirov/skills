---
name: laraway
description: Инструкции и стандарты разработки на Laravel. Use for any Laravel project.
argument-hint: [task description]
---

# LaraWay

## 1. Баланс: нативный PHP против избыточной магии
- Не оборачивай массивы в `collect()` ради 1–2 операций — используй `[]`, `in_array`, `array_map`, `count`.
- Заменяй `Arr::get($data, 'key')` на нативный `$data['key'] ?? null`.
- Не используй `tap()`, `transform()`, `app()`, если линейный код проще.
- Не копируй метапрограммирование из `vendor/` в прикладной код.

---

## 2. Конвенции именования

| Сущность | Формат | Пример (Правильно) | Антипример (Ломает магию) |
| :--- | :--- | :--- | :--- |
| **Model** | PascalCase, ед. ч. | `Flight`, `PostComment` | `Flights`, `flight_comment` |
| **Table** | snake_case, множ. ч. | `flights`, `post_comments` | `flight`, `Flights` |
| **Pivot Table** | snake_case, ед. ч., алфавитный порядок | `flight_user`, `post_tag` | `user_flight`, `flights_users` |
| **Primary Key** | `id` | `id` | `flight_id`, `id_flight` |
| **Foreign Key** | `{singular_table}_id` | `user_id`, `flight_id` | `users_id`, `user` |
| **HasOne / BelongsTo** | camelCase, ед. ч. | `$flight->destination()`, `$ticket->user()` | `$flight->destinations()` |
| **HasMany / BelongsToMany**| camelCase, множ. ч. | `$user->flights()`, `$post->tags()` | `$user->flight()` |
| **Route Names** | dot-notation, ресурс во множ. ч. + действие | `flights.index`, `flights.store` | `flight.create`, `get_flights` |

---

## 3. Архитектурные правила

- **Без репозиториев-пустышек:** Не оборачивай Eloquent в классы с `find()` и `all()`. Специфичные выборки выноси в Local Scopes (`scopePublished`) или кастомный Builder. Репозиторий создавай только при смене источника данных (API/Elasticsearch).
- **Eloquent по умолчанию:** `DB::table()` используй только для пакетной вставки/обновления сотен тысяч строк и сырых аналитических агрегатов.
- **Границы контроллера:** Контроллер валидирует вход через `FormRequest`, передает чистые данные в Action/Service и явно отдает Response/Resource со статус-кодом. Не пробрасывай объект `$request` целиком внутрь сервисов.
- **Авторизация через Gate/Policy:** Запрещены ручные проверки ролей в коде (`if ($user->role ...)`). Используй `$this->authorize('update', $post)` или `Gate::authorize(...)`.
- **Сериализация через API Resources:** Запрещено засорять модели атрибутами `$hidden` и `$appends` ради API. Трансформацию данных делай только в `JsonResource`.

---

## 4. Специфичные ловушки и ограничения

- **Route Model Binding:** Принимай `show(Post $post)` вместо `show($id)`. Для кастомных колонок используй скоупинг в роуте: `{post:slug}` или метод `getRouteKeyName()`.
- **Байпас событий при batch-операциях:** `Post::where(...)->update(...)` и `->delete()` идут в обход событий моделей (`saving`, `deleted`) и Observers. Если сайд-эффекты важны — обновляй инстансы моделей.
- **`prepareForValidation` vs `passedValidation`:** Поля, добавленные в `passedValidation()`, не попадают в `$request->validated()`, если их нет в `rules()`.
- **`env()` только в `config/`:** При выполнении `config:cache` прямые вызовы `env()` возвращают `null`. В приложении вызывай строго `config(...)`.
- **Именованные роуты:** Запрещен хардкод URL-строк в шаблонах и редиректах — только `route('posts.show', $post)`.
- **Медиафайлы:** Запрещено сохранять файлы напрямую в `public/` — используй `Storage::disk('public')` и `storage:link`.
- **Mass Assignment:** Всегда определяй `$fillable` в моделях и передавай в `create()`/`update()` только `$request->validated()`.