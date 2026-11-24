# Контекст под задачу

```bash
obsidian-project-framework context --mode brief
obsidian-project-framework context --mode task --task TASK-001 --token-budget 8000
obsidian-project-framework context --mode topic --topic авторизация
obsidian-project-framework context --mode full
```

- brief: AGENTS репозитория, AGENTS базы, `_agents/Memory/NOW.md`.
- task: правила, подробная архитектура (если есть), STATE и карточка по стабильному id.
- topic: дополнительно заметки из существующих Модули/ и корневых 01_…/, Решения/ и `_agents/Knowledge/`. Чтение не означает разрешение изменить модуль.
- full: правила, NOW, STATE, подробная архитектура и последняя передача контекста; не весь Vault.

API не выделяется автоматически: это пользовательский модуль, если пользователь его подтвердил. Карта — `_agents/Knowledge/Карта проекта.md`.
Бюджет приблизительный. При усечении увеличить --token-budget или отдельно прочитать обязательные правила. Команда только читает файлы. За синтаксисом инструментов/форматов обращаться к скиллу obsidian.
