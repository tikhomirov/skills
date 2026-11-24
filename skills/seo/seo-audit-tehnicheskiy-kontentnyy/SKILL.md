---
name: seo-audit-tehnicheskiy-kontentnyy
description: >-
  Используй для технического и контентного SEO-аудита сайта (в т.ч. WordPress)
  под Яндекс и Google: индексация, robots, sitemap, canonical, CWV, разметка,
  контент. Без доступа к кабинетам помечай пробелы.
---
# Технический и контентный SEO-аудит

Сначала наблюдаемые факты (HTTP, HTML, robots, sitemap, кабинеты), потом оценка. Нет данных кабинетов — не заполняй вымыслом.

## Объём
Домен, шаблоны страниц (главная, рубрика, запись, товар, служебные), мобильная и десктопная версия. Для WordPress — служебные URL, SEO-плагин, реальная карта сайта. Не выдумывай API плагинов.

## Технический слой
1. Доступность: HTTPS, http→https и www/без www в одну сторону, без длинных цепочек и циклов; коды 200/301/404/410/5xx.
2. robots.txt: синтаксис, нет случайного `Disallow: /`, нужные боты разрешены, указан Sitemap. Проверять инструментами Вебмастера/GSC.
3. Sitemap: доступен, только канонические URL с 200, актуальный lastmod, без noindex и служебных.
4. Индексация: meta robots и X-Robots-Tag, пагинация, поиск, теги, параметры URL. В WordPress часто мешают превью, вложения, авторские архивы, тестовые страницы, конфликт canonical темы и плагина.
5. Canonical: один URL, согласован с редиректом и sitemap.
6. Core Web Vitals (полевые GSC/CrUX, лабораторный PSI помечать отдельно): LCP ≤ 2,5 с, INP < 200 мс, CLS < 0,1.
7. Мобильная версия, viewport, паритет контента.
8. Разметка JSON-LD совпадает с видимым текстом; валидация Rich Results / валидатором Яндекса; не добавлять типы «на всякий случай».

## Контентный слой
- Уникальные title и description, понятный H1, иерархия заголовков.
- Страница отвечает на запрос; тонкие дубли и каннибализация — по данным запросов/URL, не по догадке.
- Внутренние ссылки, сироты, битые ссылки — по краулу, с указанием охвата.
- Польза, оригинальность, прозрачность автора — по рекомендациям Яндекса о качестве и Google helpful content.
- Изображения: alt, вес.

## WordPress
- Какая карта сайта в robots (`/wp-sitemap.xml` или плагина), нет ли двух конфликтующих.
- Не включено ли «Попросить поисковые системы не индексировать сайт».
- Кто ставит canonical и noindex: тема, плагин или оба.
- `/wp-json/`, preview, `?p=`, `page_id`, фиды не должны подменять канонические URL в индексе.

## Отчёт
Критично / важно / позже; доказательство; как проверить после правки; отдельно — не проверено. Реклама — только по запросу: Google Ads (цель, тип, бюджет, ставки, объекты, группы, таргетинг, конверсии), Директ (параметры кампании, модерация, правила объявлений).

## Источники
- https://developers.google.com/crawling/docs/robots-txt/create-robots-txt
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://developers.google.com/search/docs/appearance/core-web-vitals
- https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- https://yandex.ru/support/webmaster/ru/controlling-robot/robots-txt.html
- https://yandex.ru/support/webmaster/ru/yandex-indexing/webmaster-advice
- https://support.google.com/google-ads/answer/10498850?hl=ru
- https://yandex.ru/support/direct/ru/campaigns/campaign-settings
