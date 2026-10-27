---
name: ai-docs-setup
description: Организовать AI-документацию проекта: режим Obsidian Project OS (по умолчанию) или legacy in-repo (.ai/).
---

# AI Docs Setup
Скилл поддерживает два режима организации документации:
1. **Obsidian Project OS (рекомендуемый)**: рабочая память, задачи, архитектура и ADR хранятся в Obsidian Vault (`Projects/<id>/`), в репозитории остается только компактный `AGENTS.md`.
   Запуск: `project init`.
2. **Legacy in-repo (.ai/)**: классическая структура `.ai/` внутри репозитория для проектов без внешнего Vault.
   Запуск: создание `AGENTS.md` + `.ai/MEMORY.md` + `.ai/project-rules.md`.
