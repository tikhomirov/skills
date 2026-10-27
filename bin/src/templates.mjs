export function generateTasksBase(projectId) {
  return `filters:
  and:
    - 'file.inFolder("Projects/${projectId}/AGENT/tasks")'
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
export function generateProjectBase(projectId) {
  return `filters:
  and:
    - 'file.inFolder("Projects/${projectId}")'
views:
  - type: table
    name: "Файлы проекта"
    order:
      - file.name
      - file.folder
`;
}
export function generateNowMd(projectId) {
  const now = new Date().toISOString();
  return `# NOW (Оперативный фокус)\\n\\n**Текущая задача:** (нет активной задачи)\\n**Статус:** idle\\n**Git baseline:** none\\n**Последнее обновление:** ${now}\\n`;
}
export function generateStateMd(projectId) {
  return `# STATE (Состояние проекта и спринта)\\n\\n## Активные задачи\\n- Нет запущенных задач\\n\\n## Открытые предложения (Proposals)\\n- Нет открытых предложений\\n`;
}
export function generateAgentIndexMd(projectId) {
  return `# AGENT Knowledge Index: ${projectId}\\n\\n## Машинные наблюдения и факты кода\\n- [[knowledge/|База знаний кода]]\\n- [[proposals/|Предложения человеку (Human Change Proposals)]]\\n- [[reports/|Отчеты о расхождениях (Discrepancies)]]\\n`;
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
knowledge_sync: pending-review
git_baseline: none
created: ${now}
updated: ${now}
---

# [${id}] ${title}

## Контекст и требования
- Нормативные ссылки HUMAN: [[HUMAN/RULES.md]], [[HUMAN/ARCHITECTURE.md]]
- Машинные знания AGENT: [[AGENT/knowledge/INDEX.md]]

## Критерии готовности
- [ ] Критерий 1

## Журнал реализации
- ${now}: Создана задача

## Решения и проверки
- Принятые технические решения:
- Результаты тестов:
- Связанные Human Proposals: none

## Итог выполнения
- Результат:
`;
}
