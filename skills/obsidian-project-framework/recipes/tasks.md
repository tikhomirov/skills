# Задачи и архив

```bash
obsidian-project-framework task create "Название" --key request-id --summary "Цель" --tag модуль/auth
obsidian-project-framework task start TASK-001
obsidian-project-framework task status TASK-001 review
obsidian-project-framework task complete TASK-001
obsidian-project-framework task sync
obsidian-project-framework task archive TASK-001
obsidian-project-framework task restore TASK-001
```

`review` в примере допустим только если описан в `_statuses.md`. Перед операциями прочитать реестр и выполнить sync. Дополнительные связи при create: повторяемые `--related TASK-ID`, `--depends-on TASK-ID`.

## Доска и статус
- `_Задачи.base` — native Kanban Obsidian 1.14+ (Bases), не table/cards и не сторонний плагин. Все активные карточки type: task из папки задач; archived исключены.
- Группировка note.status, порядок колонок из _statuses.md. Начально backlog/in-progress/done; заголовки — значения status, title/summary/id/tags — свойства карточки.
- Перенос человека меняет status. Sync сохраняет его, согласует имя, дату, тег, рабочие ссылки и память; модули/историю решений не переписывает. Время sync — обнаружение, не точное время переноса.
- Ручной Done без доказательств помечается completion_origin: board, verification_state: user-marked-review-required. Не возвращать карточку назад и не утверждать, что тесты прошли.
- Агентское complete требует актуальный отчёт; start проверяет зависимости. Возврат из done сбрасывает готовность отчёта; смена active→active сохраняет baseline. NOW — фокус, не запрет нескольких активных задач.

## Карточки и архив
Имя `TASK-NNN_<status>_<дата UTC>.md`. Обязательные поля/разделы — в основном скилле. Related/depends_on — точные wiki-ссылки; неизменяемые документы используют стабильный id.
Активного индекса нет. Archive переносит завершённую карточку в `_archive/<год>/`, restore возвращает её в Tasks. `_Архив.base` и `_INDEX.md` — БД/индекс только архива. Отчёты, ID и связи сохраняются; автоматической архивации нет.

## Идемпотентность
Create повторяет --key (без ключа — точное название без крайних пробелов); не переписывает ручные правки. Повтор статуса/sync/archive/restore не создаёт копии и новые даты. Dry-run не пишет ничего.
