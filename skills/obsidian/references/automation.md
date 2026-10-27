# Автоматизация

Без CLI редактируй Markdown и YAML адресно, сохраняя неизвестные поля. После переименования проверь ссылки.

URI obsidian:// открывает заметки; кодируй параметры. API и eval выполняют код: только по согласованной задаче. Не читай секреты и конфиги плагинов без необходимости.

```sh
obsidian help
obsidian vault="Work" search query="task" limit=10
obsidian vault="Work" read path="Tasks/Example.md"
```

Через help проверяй команды files, search, links, backlinks, properties, tasks, bases, commands и developer tools. Не выдумывай подкоманды и флаги.

CLI требует installer 1.12.7+, включения Command line interface в Settings → General и работающего приложения. Может запустить приложение; это не headless-режим.

Сначала obsidian help. Указывай vault явно первым параметром и path от корня vault. file разрешается как wikilink и может быть неоднозначным.
