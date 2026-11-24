# Recipe: PHP Enum + Eloquent Cast

## Source

Laravel 9+ native enum cast. Nuno coding style (no magic strings in code).

## Problem

String fields with a fixed set of values use raw strings everywhere. Typos slip through. `match` blocks grow.

## Bad signs

- `'source' => 'web_telegram'` scattered in code.
- `match` blocks that handle `'telegram' | 'web_telegram' | 'tg' | 'bot'` inconsistently.
- No autocomplete on which sources are valid.

## How to fix

```php
namespace App\Enums;

enum EntrySource: string
{
    case Web = 'web';
    case Telegram = 'telegram';
    case WebTelegram = 'web_telegram';
    case Api = 'api';

    public function label(): string
    {
        return match ($this) {
            self::Web         => 'Web',
            self::Telegram    => 'Telegram',
            self::WebTelegram => 'Telegram upload',
            self::Api         => 'API',
        };
    }
}
```

Cast in the model:

```php
protected function casts(): array
{
    return [
        'date'   => 'date',
        'source' => EntrySource::class,
    ];
}
```

Use:

```php
$entry->source === EntrySource::Telegram;   // strict, type-safe
$entry->source->label();                    // 'Telegram'
```

## When not to apply

- Open-ended string fields (free text, descriptions).
- Legacy values without a clear enum domain.

## Related recipes

- `magic-values` (Dandy Style — extra)
