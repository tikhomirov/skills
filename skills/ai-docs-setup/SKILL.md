---
name: ai-docs-setup
description: Организовать AI-документацию проекта по модели .ai/. Для новых проектов или миграции разрозненных инструкций.
---

# AI Docs Setup

## Структура

```
project-root/
├── AGENTS.md              ← Entry point для любого агента (20-80 строк, identity + pointers)
├── CLAUDE.md              ← Thin adapter для Claude Code (3-8 строк)
├── .ai/
│   ├── MEMORY.md          ← Роутинг: task type → секция project-rules.md
│   ├── project-rules.md   ← Все детальные правила (консолидированные)
│   └── glossary.md        ← Доменная терминология
├── .agents/skills/*/SKILL.md  ← Процедурные скиллы
└── .claude/
    ├── skills → symlink ../.agents/skills
    ├── agent-memory/project-rules-enforcer → symlink ../../.ai
    ├── settings.json       ← Базовый allowlist (закоммичен)
    └── settings.local.json ← Per-developer (gitignored)
```

## Принципы

1. **AGENTS.md** — только identity + pointers. Никаких детальных правил.
2. **CLAUDE.md** — только pointer на AGENTS.md. Не дублирует правила.
3. **project-rules.md** — единый файл с правилами. Версия стека указана один раз в документе. Нумерованные секции для роутинга из MEMORY.md.
4. **MEMORY.md** — таблица `task type → секция rules`. Агент читает только релевантное.
5. **glossary.md** — справочник терминов. Не правила, а определения.
6. **Скиллы** — процедуры (steps), не справочники. Живут в `.agents/skills/`, подключаются через симлинки.
7. **settings.json** — проектный baseline (закоммичен). **settings.local.json** — личное расширение (gitignored).

## Миграция (пошагово)

1. **Аудит** — собрать все AI-файлы, найти дубли, сломанные ссылки, устаревшие версии.
2. **Создать .ai/** — glossary.md (термины), project-rules.md (консолидировать уникальный контент), MEMORY.md (роутинг).
3. **Обновить entrypoints** — AGENTS.md до 20-80 строк, CLAUDE.md slim до 3-8 строк.
4. **Симлинки** — `.claude/skills → ../.agents/skills`, `.claude/agent-memory/project-rules-enforcer → ../../.ai`.
5. **Обновить конфиги** — opencode.json, boost.json, README.md (версии, AI-секция).
6. **Очистка** — архивировать старые планы, удалить устаревшие каталоги (.windsurf/, docs/agent-guides/).
7. **Верификация** — симлинки резолвятся, grep на сломанные ссылки = 0, версии консистентны.

## Чеклист качества

- [ ] AGENTS.md ≤ 80 строк (identity + pointers)
- [ ] CLAUDE.md ≤ 8 строк (thin adapter)
- [ ] MEMORY.md — роутинг task → секция
- [ ] project-rules.md — версия один раз, нет дублей
- [ ] glossary.md — доменная терминология
- [ ] Симлинки резолвятся
- [ ] Нет сломанных ссылок на несуществующие скиллы
- [ ] Версии стека консистентны во всех файлах