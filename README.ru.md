# Скиллы и Obsidian Project Framework

Коллекция инструкций для AI-агентов и фреймворк проектной документации Obsidian.

```bash
npm ci
./bin/skills-install --help
./bin/skills-install obsidian obsidian-project-framework project-workshop improvement --global
```

## Фреймворк
```bash
mkdir -p ~/Obsidian
./bin/obsidian-project-framework init --vault ~/Obsidian --project demo
./bin/obsidian-project-framework --help
```

- Obsidian 1.14+: `Tasks/_Задачи.base` — канбан; данные — Markdown-карточки.
- `_statuses.md` — короткий пользовательский реестр; после переноса на доске — `task sync`.
- `_agents/` — память, знания и отчёты; модули менять только по явной просьбе.
- `Решения/` — неизменяемая история; архив — `task archive/restore` с БД и индексом.
- `project-workshop` помогает согласовать документы; `improvement` — проверить пользу и безопасность правок.

Проверки: `make check && make test`. Node.js 20+. [Подробности](README.md).
