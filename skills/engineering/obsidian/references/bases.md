# Bases и задачи

## Координация

- Одна карточка на задачу: id, status, owner, priority, updated. По необходимости branch, session, dependencies.
- Статус документа canonical/draft не равен статусу задачи. Схему согласуй.
- Owner не блокировка. Для параллельного захвата нужен согласованный lock или диспетчер. Sync не даёт транзакций.

Перетаскивание меняет свойство заметки. Группировка по file.folder перемещает файл. groupOrder скрывает не перечисленные значения; null показывает пустые. Проверь все статусы, чтобы не спрятать задачи.

Пример адаптируй к схеме vault. Добавь table-представление той же выборки для реестра.

```yaml
filters:
  and:
    - 'file.inFolder("Tasks")'
views:
  - type: kanban
    name: Board
    groupBy:
      property: note.status
      direction: ASC
    groupOrder:
      - Todo
      - Doing
      - Review
      - Done
      - null
    order:
      - file.name
      - note.owner
```

Bases — представления Markdown-файлов и их свойств. YAML-файл .base хранит фильтры и настройки, не копии задач. По умолчанию охватывает весь vault: всегда ограничивай выборку.

Встроенный Kanban требует Obsidian 1.14+. Используй type: kanban и groupBy по редактируемому свойству заметки, не формуле.
