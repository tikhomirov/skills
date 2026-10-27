# Отчёт: reader extensions + just-in-case (2026-10-06)

## Резюме

«Временное хранилище» пользовательского рецепта оказалось самим каноном скилла:
`recipes/just-in-case.md` + вымышленная строка `content/021-just-in-case.md` в `source-map.md`.
Главы книги с таким именем **нет** (`dandy-code/content/` заканчивается на `020-copilot.md`;
в `draft/` номер `021` занят `021-string.md`).

Сделано постоянное расширение внутри `dandy-style`: раздел **Скиллы / главы от читателей**
(`extensions/`), явный маркер «не официальная глава книги», доработан рецепт под AI,
обновлены карты и `SKILL.md` (v1.2.0 — living reinterpretation, не 1:1 книга).

## Что нашли

| Место | Роль |
|---|---|
| `/home/alex/Projects/skills/skills/dandy-style/` | Канон скилла (symlink `~/.claude/skills/dandy-style`) |
| `recipes/just-in-case.md` (было) | Temp-размещение user-рецепта среди канона |
| `source-map.md` → fake `021` | Ложная регистрация как глава автора |
| `/home/alex/Projects/dandy-code/` | Книга; `021-just-in-case.md` отсутствует |
| `dandy-code-skills`, `.agents` mirror | Отдельные копии; в эту задачу не синхронизировались |

## План → факт

1. Вынести user-рецепты из `recipes/` в `extensions/`.
2. README + отдельная карта со статусом «читательское дополнение».
3. Переписать `just-in-case` с акцентом на AI / один источник правды; упростить пример.
4. Убрать fake `021` из `source-map`; в корневом `recipe-map` оставить путь на extension.
5. Обновить `SKILL.md` (не 1:1 книга, living version, extensions растут).
6. Коммит только правок dandy-style.

## Структура после

```text
skills/dandy-style/
  SKILL.md                          # v1.2.0
  recipe-map.md                     # канон + указатель на extensions
  source-map.md                     # только реальные главы книги
  recipes/                          # официальные, от глав
  extensions/
    README.md                       # статус: не глава книги
    recipe-map.md
    recipes/just-in-case.md
  docs/2026-10-06-reader-extensions.md
```

## Изменения в just-in-case

- Маркер статуса (reader/author extension).
- Акцент: AI не знает правды → угадывает → дублирует логику (в т.ч. camelCase) → лишний код / риски.
- Сохранена идея «один источник правды».
- Пример `is_file`: один before (три пути) / after (один путь), без запутанного config+route дубля.

## Коммит

- Repo: `/home/alex/Projects/skills`
- Hash: `6361513c03f18b985aeb4d53aa4a71d676075c2b`
- Не включено: грязные `README.md`, `skills/iiko-docs/`
