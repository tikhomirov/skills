export function generateTasksBase(projectId) {
  return `filters:
  and:
    - 'file.inFolder("Projects/${projectId}/tasks")'
    - 'type == "task"'
properties:
  status:
    displayName: "Статус"
  priority:
    displayName: "Приоритет"
  knowledge_sync:
    displayName: "Синхронизация знаний"
  assignee:
    displayName: "Исполнитель"
views:
  - type: table
    name: "Все задачи"
    order:
      - file.name
      - status
      - priority
      - knowledge_sync
      - assignee
  - type: cards
    name: "Канбан задач"
    groupBy: status
    order:
      - file.name
      - priority
      - knowledge_sync
`;
}
export function generateProjectMd(projectId) {
  return `# Project: ${projectId}

## Описание проекта
Основная информация о проекте, назначение и ключевые компоненты.
`;
}
export function generateNowMd(projectId) {
  const now = new Date().toISOString();
  return `# NOW (Оперативный фокус)

**Текущая задача:** (нет активной задачи)
**Статус:** idle
**Последнее обновление:** ${now}
`;
}
export function generateStateMd(projectId) {
  return `# STATE (Состояние проекта и спринта)

## Активные задачи
- Нет запущенных задач
`;
}
export function generateIndexMd(projectId) {
  return `# Навигатор базы знаний: ${projectId}

- [[architecture/|Архитектура системы]]
- [[features/|Модули и функциональность]]
- [[decisions/|Архитектурные решения (ADR)]]
- [[glossary/|Глоссарий терминов]]
`;
}
export function generateTaskTemplate(id, title, options = {}) {
  const now = new Date().toISOString();
  const priority = options.priority || "medium";
  const assignee = options.assignee || "agent";
  return `---
id: ${id}
type: task
status: backlog
priority: ${priority}
assignee: ${assignee}
knowledge_sync: pending
created: ${now}
updated: ${now}
---

# [${id}] ${title}

## Описание
Цель и контекст задачи.

## Критерии готовности
- [ ] Критерий 1

## Журнал реализации
- ${now}: Создана задача

## Решения и проверки
- Архитектурные решения:
- Тесты:

## Результат
- Итог выполнения:
`;
}
