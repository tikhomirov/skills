---
name: obsidian-project
description: Управление проектами в Obsidian (Obsidian Project OS): задачи, память, контекст, синхронизация знаний и архитектура Human/Agent.
---

# Obsidian Project Skill
Единая система управления проектами, задачами, памятью и документацией на базе Obsidian Vault.

## Принцип владения: Human-owned Knowledge / Agent-owned Runtime
- **HUMAN/**: нормативные цели, правила, архитектура и решения. Агенту категорически запрещено менять эти файлы (только чтение).
- **AGENT/**: операционная среда агента — канбан-доска (TASKS.base), карточки задач, память (NOW/STATE), наблюдения за кодом и предложения человеку (proposals).

## Карта рецептов (Recipe Map)
| Задача / Модуль | Рецепт | CLI команда |
|---|---|---|
| Инициализация проекта в Vault | `recipes/init.md` | `project init` |
| Жизненный цикл задач и Kanban | `recipes/tasks.md` | `project task create|start|complete` |
| Оперативная память и чекпоинты | `recipes/memory.md` | `project memory checkpoint` |
| Маршрутизация контекста и токены | `recipes/context.md` | `project context brief|task|topic|resume` |
| Поиск по базе знаний | `recipes/knowledge.md` | `project knowledge search` |
| Синхронизация кода и предложений | `recipes/knowledge-sync.md` | `project knowledge sync` |
| Безопасная миграция документов | `recipes/migrate.md` | `project migrate` |
| Диагностика и аудит целостности | `recipes/doctor.md` | `project doctor` |

## Взаимодействие со скиллом obsidian
Низкоуровневые возможности Obsidian (синтаксис формул .base, встраивание, CLI команды приложения) описаны в скилле `obsidian`. Данный скилл управляет архитектурным уровнем проекта.
