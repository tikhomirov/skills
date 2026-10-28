import { updateNote } from './utils.mjs';
import { DEFAULT_STATUSES } from './constants.mjs';
import { parse as parseYaml } from 'yaml';

export function generateAgentsMd(projectId) {
  return `# AGENTS.md — ${projectId}

## Начало
Читать AGENTS репозитория, _statuses.md, _agents/Memory/NOW.md и нужные карточки. Перед работой task sync. Архитектуру и пути к коду заполнить только проверенными фактами; подробности — в карте Knowledge.

## Структура и права
- Tasks/ (или существующая Задачи/): карточки и _Задачи.base — native Kanban Obsidian 1.14+. Активного индекса нет.
- Tasks/_archive/<год> — архив; _Архив.base и _INDEX.md только архива. Archive/restore — по явной команде, ID/отчёты сохранять.
- _agents/Memory, Knowledge, Reports — рабочая зона; дополнительные материалы допустимы. NOW — фокус, STATE — сводка, sessions — передача контекста.
- _шаблоны, _вложения, _служебное — шаблоны, вложения, инструменты. Не запускать неизвестные скрипты автоматически.
- Модули определяет пользователь; API — возможный модуль. Названия/размещение подтвердить до создания. Документацию модулей и существующие правила менять только по явной просьбе.
- Решения/ — только добавление подтверждённых событий: дата, источник, task_ids. Исправление — новое событие с supersedes; оригинал не менять. Текущие ссылки/таймлайн — в Knowledge.

## Задачи
- _statuses.md — только заголовок и таблица; читать перед операциями. Значения, роли и порядок колонок определяет пользователь.
- Markdown хранит данные; доска меняет status. Ручной status приоритетнее имени/тегов/памяти; sync согласует их без отката человека.
- Имя TASK-NNN_<status>_<YYYY-MM-DD>.md; дата UTC смены статуса. Обязательны описание, критерии, результат, id, title, summary, status, status_changed, created/updated, tags, related, depends_on, sources.
- Теги задачи: задачи, статус/<status>. Ссылки чинить только в разрешённой зоне; неизменяемые документы используют стабильные task_ids.
- Done с доски без доказательств — user-marked-review-required, не успех тестов. Агентское complete требует актуальный отчёт; повторное открытие сбрасывает готовность старого.

## Работа
Код — фактическое поведение, решения пользователя — требования; конфликт сообщать. Один факт — один источник. Выводы/sources писать в Knowledge, результаты/реальные проверки/ограничения — в Reports; правки модулей сначала согласовать.
Применять improvement до/после правок. Инструменты — obsidian, процесс — obsidian-project-framework, диалог — project-workshop. Не выдумывать факты, согласования и проверки.
Повтор команд — no-op; dry-run не пишет даже каталоги. Секреты не копировать, границы симлинками не обходить. Миграция — с резервной копией, без удаления истории. Коммит/push/публикация — по разрешению.
`;
}

// Obsidian may save `status` instead of `note.status`; both group by the same note property.
export const KANBAN_STATUS_PROPERTIES = ['note.status', 'status'];
export function tasksBaseIsCurrent(text, folder, statuses = DEFAULT_STATUSES) {
  try {
    const board = parseYaml(text);
    const view = board?.views?.find(item => item.type === 'kanban');
    return KANBAN_STATUS_PROPERTIES.includes(view?.groupBy?.property)
      && JSON.stringify(view?.groupOrder) === JSON.stringify(statuses.map(status => status.id))
      && Array.isArray(board?.filters?.and) && board.filters.and.includes('type == "task"')
      && board.filters.and.includes(`file.inFolder(${JSON.stringify(folder)})`);
  } catch { return false; }
}
export function generateTasksBase(projectId, folder, statuses = DEFAULT_STATUSES) {
  return `filters:
  and:
    - 'file.inFolder(${JSON.stringify(folder)})'
    - 'type == "task"'
    - 'archived != true'
properties:
  title:
    displayName: "Задача"
  summary:
    displayName: "Описание"
  status:
    displayName: "Статус"
  status_changed:
    displayName: "Дата статуса"
views:
  - type: kanban
    name: "Канбан задач"
    groupBy:
      property: note.status
      direction: ASC
    groupOrder:
${statuses.map(status => `      - ${status.id}`).join('\n')}
    order:
      - title
      - summary
      - id
      - tags
`;
}
export function generateNowMd() {
  return '# NOW — оперативный фокус\n\n**Текущая задача:** нет\n**Статус:** idle\n\n## Следующий шаг\nВыбрать задачу из Tasks/_Задачи.base (или существующей Задачи/_Задачи.base).\n\n## Ограничения и блокеры\nНет зафиксированных.\n';
}
export function generateStateMd() {
  return '# STATE — состояние проекта\n\n## Задачи\nНет задач.\n\n## Передача контекста\nТекущий фокус и следующий шаг — в [[NOW]]. История сессий — sessions/.\n';
}
export function generateTaskTemplate(id, title, options = {}) {
  const status = options.status || 'backlog';
  const now = options.now || new Date().toISOString();
  return updateNote(`\n# ${id} — ${title}\n
## Запрос пользователя
${title}

## Описание
${options.summary || title}

## Критерии готовности
- [ ] Реализация соответствует запросу.
- [ ] Выполнены проверки и приложен отчёт в _agents/Reports.
- [ ] Нужные изменения модульной документации перечислены; выполнены только явно запрошенные пользователем.

## Связанные задачи и зависимости
См. related и depends_on в свойствах; ссылки должны вести на актуальные карточки.

## План
- [ ] Уточнить затронутые компоненты и выполнить задачу.

## Результат
Не выполнено.

## Предложения пользователю
Нет. Не переносить в Решения/ до явного согласования.

## Журнал выполнения
- ${now}: задача создана.
`, {
    id, type: 'task', title, summary: options.summary || title, status,
    status_changed: now.slice(0, 10), created: now, updated: now,
    priority: options.priority || 'medium', assignee: options.assignee || 'agent',
    tags: ['задачи', `статус/${status}`, ...(options.tags || [])],
    related: options.related || [], depends_on: options.dependsOn || [],
    sources: [], review: 'pending', git_baseline: null,
    knowledge_sync: 'pending', report: null,
  });
}
export function generateDocumentTemplate(type) {
  const bodies = {
    message: '# Шаблон сообщения\n\n## Компонент и назначение\n\n## Получатель / канал\n\n## Переменные\n\n## Текст\n\n## Пример\n',
    module: '# Компонент\n\n## Назначение\n\n## Где искать код\n\n## Связи и зависимости\n\n## Проверки\n',
    api: '# API / событие\n\n## Контракт\n\n## Авторизация\n\n## Запрос и ответ\n\n## Ошибки и проверки\n',
    decision: '# Решение\n\n## Контекст\n\n## Принятое пользователем решение\n\n## Источник и дата согласования\n\n## Последствия и связанные задачи\n',
    report: '# Отчёт по задаче\n\n## Что сделано\n\n## Проверки и результаты\n\n## Коммиты и документация\n\n## Ограничения и следующий шаг\n',
  };
  return updateNote('\n' + bodies[type], {
    type, summary: 'Заполнить', status: 'draft', updated: null,
    tags: [type], sources: [], review: 'pending',
    ...(type === 'decision' ? { decided_at: null, task_ids: [], supersedes: null, approved_by: null, approved_at: null, approval_source: null } : {}),
  });
}
