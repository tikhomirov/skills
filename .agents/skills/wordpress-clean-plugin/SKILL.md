---
name: wordpress-clean-plugin
description: Design, develop, refactor, and review modern Object-Oriented WordPress & WooCommerce plugins with PSR-4 autoloading, strict security, clean hooks, Transients caching, and zero global clutter.
argument-hint: [plugin task description]
---

# Clean OOP WordPress & WooCommerce Plugin Skill

Standards and patterns for building maintainable, modern, object-oriented WordPress and WooCommerce plugins.

---

## 1. Plugin Directory & Architecture

```text
my-clean-plugin/
├── composer.json               # PSR-4 autoloading & dependencies
├── my-clean-plugin.php         # Single entry point (Header + bootstrap)
├── src/
│   ├── Plugin.php              # Main orchestrator & hook registrar
│   ├── Admin/
│   │   └── SettingsPage.php    # Admin menus & settings
│   ├── Integrations/
│   │   └── WooCommerce/
│   │       ├── OrderSync.php   # WooCommerce hooks & sync logic
│   │       └── CheckoutFields.php
│   ├── Services/
│   │   └── ApiClient.php
│   └── Support/
│       └── Transients.php
├── assets/
│   ├── js/
│   └── css/
└── tests/
```

---

## 2. Main Entry Point (`my-clean-plugin.php`)

```php
<?php
/**
 * Plugin Name: My Clean Plugin
 * Plugin URI:  https://github.com/tikhomirov/my-clean-plugin
 * Description: Clean, modern OOP WordPress plugin.
 * Version:     1.0.0
 * Author:      Aleksei Tikhomirov
 * License:     GPL-2.0-or-later
 * Requires PHP: 8.1
 */

declare(strict_types=1);

if (! defined('ABSPATH')) {
    exit;
}

if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
}

add_action('plugins_loaded', static function (): void {
    \MyCleanPlugin\Plugin::getInstance()->boot();
});
```

---

## 3. Hook Management & Zero Global State

- **Encapsulated Hooks:** Register actions and filters inside classes rather than top-level files.
- **Dependency Injection:** Pass services via constructor.

```php
<?php

declare(strict_types=1);

namespace MyCleanPlugin\Integrations\WooCommerce;

final class OrderSync
{
    public function register(): void
    {
        add_action('woocommerce_order_status_completed', [$this, 'onOrderCompleted'], 10, 1);
        add_action('woocommerce_checkout_order_processed', [$this, 'onOrderCreated'], 10, 3);
    }

    public function onOrderCompleted(int $orderId): void
    {
        $order = wc_get_order($orderId);
        if (! $order instanceof \WC_Order) {
            return;
        }

        // Process order
    }
}
```

---

## 4. Security Musts

1. **Direct Access Protection:** `if (! defined('ABSPATH')) { exit; }` in every PHP file.
2. **Capability Checks:** Always check `current_user_can('manage_options')` before processing admin forms or settings.
3. **Nonce Verification:** Always verify nonces on form submissions and AJAX requests (`check_admin_referer()` / `check_ajax_referer()`).
4. **Input Sanitization & Output Escaping:**
   - Sanitize on save: `sanitize_text_field()`, `sanitize_key()`, `absint()`, `wp_unslash()`.
   - Escape on output: `esc_html()`, `esc_attr()`, `esc_url()`, `wp_kses_post()`.
5. **Database Queries:** Always use prepared statements (`$wpdb->prepare(...)`) - never concatenate raw variables into SQL.

---

## 5. Performance & Caching

- **Transients API:** Cache expensive remote API results or computed queries using `set_transient()` / `get_transient()`.
- **Conditional Asset Loading:** Only enqueue scripts/styles on admin pages or frontend templates where they are actually needed using `$hook_suffix`.
- **Proper Versioning:** Use plugin version constant for cache busting: `wp_enqueue_script('my-script', $url, ['jquery'], MY_PLUGIN_VERSION, true);`.
