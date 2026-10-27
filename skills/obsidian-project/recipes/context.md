---
name: project-context
description: Прогрессивный сбор контекста проекта по уровням (brief, task, topic, full, resume) с контролем бюджета токенов.
---

# Project Context Router
Команда: `project context [brief|task|topic|full|resume] [--token-budget 4000]`.
- brief: L0 (AGENTS.md) + L1 (NOW.md)
- task: brief + текущая активная задача
- topic: документы по ключевой теме
- resume: восстановление предыдущей сессии и фокуса
