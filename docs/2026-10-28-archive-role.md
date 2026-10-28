# Роль статуса archive в obsidian-project-framework

## Резюме
В talasus `_statuses.md` есть строка `archive | Архив | archive`. CLI принимал только роли backlog/active/done, поэтому любая команда по проекту падала с `Invalid status row`. Теперь archive — законная необязательная роль, проекты без неё работают как раньше.

## План
1. Парсер статусов: разрешить роль archive (необязательную).
2. Задачи: archive считается завершённой (зависимости, STATE, отчёт не сбрасывается); перевод в archive только из завершённой задачи; перенос на доске сохраняется `task sync`.
3. `task archive`: из done ставит статус роли archive, restore возвращает первый статус done; без роли archive статус не меняется.
4. Доска: колонка archive идёт по порядку из `_statuses.md` (как остальные).
5. Тесты (3 новых, 31/31), скил и рецепты обновлены.
6. Проверка на talasus только чтением: doctor без `Invalid status row`, status, context, `task sync --dry-run`.

## Коммит
29ee8ca
