---
name: web-search
description: Поиск информации в интернете через Tavily API (предпочтительно) или Brave Search API (curl/bash). Используй когда нужно найти актуальную информацию, документацию, ответы на вопросы, новости или любой контент из интернета.
---

# Web Search

Поиск через Tavily API (предпочтительно) или Brave Search API (fallback). Bash + curl, без MCP.

## Когда использовать

- Нужна актуальная информация из интернета
- Поиск документации, руководств, примеров
- Поиск новостей, статей, блогов
- Проверка фактов и поиск источников
- Поиск решений проблем (StackOverflow, GitHub Issues)

## Приоритет API

1. **Tavily** — предпочтительно. Возвращает контент страниц, не нужны отдельные запросы.
2. **Brave** — fallback если Tavily не работает (429, 401).

---

## Tavily Search API (основной)

### Эндпоинт

```
POST https://api.tavily.com/search
Content-Type: application/json
```

### Body (JSON)

```json
{
  "api_key": "$TAVILY_API_KEY",
  "query": "запрос",
  "search_depth": "basic",
  "max_results": 10,
  "include_answer": true
}
```

### Параметры

| Параметр | Описание |
|---|---|
| `api_key` | API-ключ (из env `TAVILY_API_KEY`) |
| `query` | Поисковый запрос |
| `search_depth` | `basic` (быстро) или `advanced` (глубже, медленнее) |
| `max_results` | Количество результатов (1-20) |
| `include_answer` | `true` — включить AI-генерированный summary |
| `include_raw_content` | `true` — включить контент страниц (~1000 слов на страницу) |
| `days` | Ограничение по свежести (дни) |
| `topic` | Тема: `general` или `news` |

### Структура ответа

```json
{
  "query": "Laravel auth",
  "answer": "AI-generated summary",
  "results": [
    {
      "title": "Заголовок",
      "url": "https://example.com/page",
      "content": "Извлечённый контент"
    }
  ],
  "response_time": 2.5
}
```

### Квоты

- **Free**: 1000 запросов/мес
- **Pro**: $69/мес, 5000 запросов
- Регистрация без карты (только email)

---

## Brave Search API (fallback)

### Эндпоинт

```
GET https://api.search.brave.com/res/v1/web/search?q={query}&count=10
```

### Заголовки

| Заголовок | Описание |
|---|---|
| `X-Subscription-Token` | API-ключ (из env `BRAVE_API_KEY`) |
| `Accept` | `application/json` |

### Параметры

| Параметр | Описание |
|---|---|
| `q` | Поисковый запрос |
| `count` | Количество результатов (1-20) |
| `offset` | Смещение (0, 20, 40...) |
| `country` | Страна: `ru`, `us`, `de`... |
| `search_lang` | Язык поиска: `en`, `ru`... |
| `freshness` | `pd` (день), `pw` (неделя), `pm` (месяц), `py` (год) |

### Квоты

- **Бесплатно**: $5 кредитов/мес (~1000 запросов)
- **Сверх кредита**: $5/1000 запросов
- Регистрация требует карту (спишут $1)

---

## Пошаговый процесс

### Шаг 1: Поиск (Tavily, 1 вызов)

```bash
curl -s -X POST https://api.tavily.com/search \
  -H "Content-Type: application/json" \
  -d "{\"api_key\":\"$TAVILY_API_KEY\",\"query\":\"Laravel 12 authentication\",\"max_results\":10,\"include_answer\":true}" | jq -r '(.answer + "\n") // "", (.results[] | "[\(.title)](\(.url)) — \(.content[:200])")'
```

Если Tavily вернул 429 или 401 — использовать Brave:

```bash
curl -s "https://api.search.brave.com/res/v1/web/search?q=Laravel+12+authentication&count=10&country=us&search_lang=en" \
  -H "X-Subscription-Token: $BRAVE_API_KEY" \
  -H "Accept: application/json" | jq -r '.web.results[] | "[\(.title)](\(.url)) — \(.description)"'
```

### Шаг 2: Выбрать релевантные URL

Из вывода выбрать 2-4 наиболее релевантных. Критерии:
- Совпадение ключевых слов
- Авторитетность домена
- Свежесть

### Шаг 3: Загрузить контент (параллельно)

Для Tavily: если нужен подробный контент, повторить запрос с `"include_raw_content": true` — и отдельные запросы не нужны.

Для Brave: использовать WebFetch или curl:

```
WebFetch:
  url: {найденный_url}
  prompt: "Извлеки ключевую информацию по теме {тема}. Верни краткую сводку."
```

Если WebFetch недоступен:
```bash
curl -sL "https://example.com/page" | html2text 2>/dev/null | head -200
```

### Шаг 4: Представить результат

1. Краткая сводка (2-4 предложения)
2. Ключевые findings с указанием источника
3. Ссылки для дальнейшего чтения

---

## Примеры

### Техническая документация (Tavily)
```bash
curl -s -X POST https://api.tavily.com/search \
  -H "Content-Type: application/json" \
  -d "{\"api_key\":\"$TAVILY_API_KEY\",\"query\":\"Laravel 12 validation rules custom\",\"max_results\":10,\"include_answer\":true}"
```

### Свежие новости (Tavily)
```bash
curl -s -X POST https://api.tavily.com/search \
  -H "Content-Type: application/json" \
  -d "{\"api_key\":\"$TAVILY_API_KEY\",\"query\":\"PHP 9 release\",\"max_results\":10,\"topic\":\"news\",\"days\":30}"
```

### С контентом страниц (Tavily — замена WebFetch)
```bash
curl -s -X POST https://api.tavily.com/search \
  -H "Content-Type: application/json" \
  -d "{\"api_key\":\"$TAVILY_API_KEY\",\"query\":\"PostgreSQL jsonb performance\",\"max_results\":5,\"include_raw_content\":true,\"search_depth\":\"advanced\"}"
```

### Русскоязычный поиск (Brave)
```bash
curl -s "https://api.search.brave.com/res/v1/web/search?q=Laravel+авторизация+Socialite&count=10&country=ru&search_lang=ru" \
  -H "X-Subscription-Token: $BRAVE_API_KEY" | jq -r '.web.results[] | "[\(.title)](\(.url)) — \(.description)"'
```

---

## Обработка ошибок

### Tavily 401 Unauthorized
Проверить ключ: `echo $TAVILY_API_KEY` → [app.tavily.com](https://app.tavily.com/home)

### Tavily 429 Too Many Requests
Лимит исчерпан → переключиться на Brave

### Brave 401
Проверить ключ: `echo $BRAVE_API_KEY` → [api.search.brave.com](https://api.search.brave.com/app/keys)

### curl возвращает пустой результат
1. Проверить сеть: `curl -sI https://api.tavily.com | head -5`
2. Попробовать запрос на английском
3. Убрать `country`/`search_lang`

### WebFetch не может загрузить страницу
```bash
curl -sL "https://example.com/page" | html2text 2>/dev/null | head -300
```

---

## Советы

- Пиши запросы на английском для лучших результатов
- Tavily: используй `include_raw_content` чтобы получить контент страниц без отдельных запросов
- Tavily: `include_answer` даёт готовый AI-summary — можно использовать как краткий ответ
- Добавляй год к запросам для актуальности (например "2026")
- Для технических вопросов Tavily и Brave лучше чем Google Custom Search
- `max_results`/`count` по умолчанию 10, максимум 20
