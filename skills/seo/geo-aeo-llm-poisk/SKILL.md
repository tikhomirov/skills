---
name: geo-aeo-llm-poisk
description: >-
  Используй, когда нужно подготовить сайт к ответам LLM-поиска (ChatGPT Search,
  Perplexity, Google AI Overviews, Яндекс нейроответы/Алиса): индексация,
  структура, AI-боты в robots.txt, llms.txt. Гарантий цитирования нет.
---
# Оптимизация под LLM-поиск (GEO/AEO)

Попадание в ответ ИИ не гарантируется. Google прямо пишет: для AI Overviews/AI Mode отдельные AI-файлы и особая разметка не нужны — нужны обычные условия показа в поиске. `llms.txt` — предложение сообщества, не стандарт и не требование Google.

## База
- Страница индексируется, отдаёт 200, основной текст доступен без обязательного JS, нет noindex/запрета в robots.
- Ясный структурированный текст: прямой ответ в начале, заголовки-вопросы, списки, таблицы, дата и источники фактов; разметка совпадает с видимым текстом.
- Нейроответы Яндекса строятся из проиндексированных страниц.

## Боты в robots.txt (только официальные имена)
| Токен | Назначение | Замечание |
|---|---|---|
| OAI-SearchBot | Поиск ChatGPT | Запрет убирает из ответов поиска; ~24 ч |
| GPTBot | Обучение OpenAI | Запрет ≠ скрытие из поиска ChatGPT |
| ChatGPT-User | Запрос пользователя | Может не подчиняться robots.txt |
| PerplexityBot | Поиск Perplexity | Не для обучения моделей |
| Perplexity-User | Запрос пользователя | Обычно игнорирует robots.txt |
| Google-Extended | Обучение/grounding Gemini | Не влияет на Google Search; отдельного UA нет |
| YandexAdditional | Исключение из быстрых ответов YandexGPT и Поиска с Алисой | Не индексирует; эффект 2–14 дней |

Не путай запрет обучения (GPTBot, Google-Extended) с запретом поиска (OAI-SearchBot, PerplexityBot, YandexBot, Googlebot). Что закрывать — решает владелец сайта. Проверь WAF/CDN: правило в robots бесполезно, если файрвол режет бота. Подлинность ботов — по официальным IP/rDNS.

## llms.txt (по желанию владельца)
`/llms.txt` в Markdown: H1 с именем сайта, краткое описание, ссылки на ключевые страницы. Помощь агентам, не фактор ранжирования.

## Отчёт
Сделано на сайте / не проверено / ожидание без гарантии. Долю цитирований в ChatGPT/Perplexity без замеров не выдумывать.

## Источники
- https://developers.google.com/search/docs/appearance/ai-features
- https://llmstxt.org/
- https://developers.openai.com/api/docs/bots
- https://docs.perplexity.ai/docs/resources/perplexity-crawlers
- https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers
- https://yandex.ru/support/webmaster/ru/search-appearance/fast
- https://yandex.ru/support/webmaster/ru/robot-workings/check-yandex-robots
