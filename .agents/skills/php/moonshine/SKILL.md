---
name: moonshine
description: Use when building, configuring, or refactoring Laravel MoonShine admin panel resources, custom pages, CRUD operations, fields, form builders, table builders, relationships, menus, and UI components.
argument-hint: [task description]
---

# MoonShine Admin Panel Skill

Comprehensive guide for developing, configuring, and extending Laravel admin panels using the **MoonShine** framework (with focus on MoonShine 4.x and compatibility with MoonShine 3.x).

---

## Quick Reference to Deep Dive Guides

Detailed references are available in the `references/` directory of this skill:
- `references/model-resources.md` — ModelResource structure, lifecycle, query modification, buttons, pagination, modals.
- `references/fields-guide.md` — Field modes (default/preview/raw), lifecycle, `changeFill`, `afterFill`, `onApply`, `showWhen`, reactivity.
- `references/relationships.md` — `BelongsTo`, `BelongsToMany`, `HasMany`, `HasOne`, async search, creatable mode.
- `references/blade-components.md` — Complete catalog of MoonShine UI components (Layout, Box, Card, Modal, Form, Table, Grid, Flex, etc.).
- `references/common-patterns.md` — Search scopes, filters, import/export, file uploads, JSON fields, validation.

---

## 1. Core Architecture & Concepts (MoonShine 4.x)

In MoonShine 4.x:
- **Namespaces:**
  - `MoonShine\Laravel\Resources\ModelResource`
  - `MoonShine\Laravel\Pages\Crud\IndexPage`
  - `MoonShine\Laravel\Pages\Crud\FormPage`
  - `MoonShine\Laravel\Pages\Crud\DetailPage`
  - `MoonShine\Laravel\Pages\Page` (for standalone custom pages)
  - `MoonShine\Laravel\Fields\Relationships\...` (`BelongsTo`, `HasMany`, etc.)
  - `MoonShine\UI\Fields\...` (`ID`, `Text`, `Number`, `Select`, `Switcher`, etc.)
  - `MoonShine\UI\Components\...` (`FormBuilder`, `TableBuilder`, `Layout\Box`, `Layout\Flex`, `Layout\Grid`, `Modal`, etc.)
  - `MoonShine\MenuManager\MenuGroup`, `MoonShine\MenuManager\MenuItem`
  - `MoonShine\Support\Attributes\Icon`, `MoonShine\Support\Attributes\AsyncMethod`
- **Page-based Resource Structure:** Resources delegate their UI to individual page classes (`IndexPage`, `FormPage`, `DetailPage`).

---

## 2. Resource & Page Structure

### ModelResource Definition

```php
<?php

declare(strict_types=1);

namespace App\MoonShine\Resources\Product;

use App\Models\Product;
use App\MoonShine\Resources\Product\Pages\ProductFormPage;
use App\MoonShine\Resources\Product\Pages\ProductIndexPage;
use App\MoonShine\Resources\Product\Pages\ProductDetailPage;
use MoonShine\Laravel\Resources\ModelResource;
use MoonShine\Support\Attributes\Icon;
use MoonShine\Support\Enums\SortDirection;

/**
 * @extends ModelResource<Product, ProductIndexPage, ProductFormPage, ProductDetailPage>
 */
#[Icon('shopping-bag')]
final class ProductResource extends ModelResource
{
    protected string $model = Product::class;
    protected string $title = 'Products';
    protected string $column = 'name'; // Display column for relationships/breadcrumbs
    protected array $with = ['category']; // Eager loading

    protected string $sortColumn = 'id';
    protected SortDirection $sortDirection = SortDirection::DESC;

    protected function pages(): array
    {
        return [
            ProductIndexPage::class,
            ProductFormPage::class,
            ProductDetailPage::class, // Omit or set to null if detail page is not needed
        ];
    }

    protected function search(): array
    {
        return ['id', 'name', 'slug', 'category.name'];
    }
}
```

### IndexPage

```php
<?php

declare(strict_types=1);

namespace App\MoonShine\Resources\Product\Pages;

use App\MoonShine\Resources\Category\CategoryResource;
use App\MoonShine\Resources\Product\ProductResource;
use MoonShine\Contracts\UI\FieldContract;
use MoonShine\Laravel\Fields\Relationships\BelongsTo;
use MoonShine\Laravel\Pages\Crud\IndexPage;
use MoonShine\UI\Fields\ID;
use MoonShine\UI\Fields\Number;
use MoonShine\UI\Fields\Switcher;
use MoonShine\UI\Fields\Text;

/**
 * @extends IndexPage<ProductResource>
 */
final class ProductIndexPage extends IndexPage
{
    /**
     * @return list<FieldContract>
     */
    protected function fields(): iterable
    {
        return [
            ID::make()->sortable(),
            Text::make('Name', 'name')->sortable(),
            BelongsTo::make('Category', 'category', resource: CategoryResource::class),
            Number::make('Price', 'price')->sortable(),
            Switcher::make('Active', 'is_active'),
        ];
    }
}
```

### FormPage

```php
<?php

declare(strict_types=1);

namespace App\MoonShine\Resources\Product\Pages;

use App\MoonShine\Resources\Category\CategoryResource;
use App\MoonShine\Resources\Product\ProductResource;
use MoonShine\Contracts\UI\ComponentContract;
use MoonShine\Laravel\Fields\Relationships\BelongsTo;
use MoonShine\Laravel\Pages\Crud\FormPage;
use MoonShine\UI\Components\Layout\Box;
use MoonShine\UI\Components\Layout\Flex;
use MoonShine\UI\Fields\ID;
use MoonShine\UI\Fields\Number;
use MoonShine\UI\Fields\Switcher;
use MoonShine\UI\Fields\Text;
use MoonShine\UI\Fields\Textarea;

/**
 * @extends FormPage<ProductResource>
 */
final class ProductFormPage extends FormPage
{
    /**
     * @return list<ComponentContract>
     */
    protected function fields(): iterable
    {
        return [
            Box::make([
                ID::make(),
                Text::make('Name', 'name')->required(),
                BelongsTo::make('Category', 'category', resource: CategoryResource::class)
                    ->searchable()
                    ->required(),
                Flex::make([
                    Number::make('Price', 'price')->step(0.01)->required(),
                    Switcher::make('Active', 'is_active')->default(true),
                ]),
                Textarea::make('Description', 'description'),
            ]),
        ];
    }

    /**
     * Validation rules for create/update.
     */
    protected function rules(mixed $item): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'exists:categories,id'],
            'price' => ['required', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }
}
```

---

## 3. ⚠️ Critical Rule: Resource Registration

Every `ModelResource` used anywhere in the admin panel or referenced by a relationship field (`BelongsTo`, `HasMany`, `BelongsToMany`) **MUST** be registered in `app/Providers/MoonShineServiceProvider.php`:

```php
// app/Providers/MoonShineServiceProvider.php
public function boot(CoreContract $core, ConfiguratorContract $config): void
{
    $core->resources([
        CategoryResource::class,
        ProductResource::class,
        OrderResource::class,
        UserResource::class,
    ]);
}
```

*Failing to register a related resource will cause 500 errors during relationship rendering.*

---

## 4. Custom Pages & Async Operations

### Standalone Page (`Page`)

```php
<?php

declare(strict_types=1);

namespace App\MoonShine\Pages;

use Illuminate\Http\Request;
use MoonShine\Contracts\UI\ComponentContract;
use MoonShine\Laravel\Pages\Page;
use MoonShine\Support\Attributes\AsyncMethod;
use MoonShine\Support\Attributes\Icon;
use MoonShine\Support\Enums\ToastType;
use MoonShine\UI\Components\FormBuilder;
use MoonShine\UI\Components\Layout\Box;
use MoonShine\UI\Fields\Text;

#[Icon('cog-6-tooth')]
final class SettingsPage extends Page
{
    public function getTitle(): string
    {
        return __('Settings');
    }

    #[AsyncMethod]
    public function saveSettings(Request $request): void
    {
        // Handle action
        toast(__('Settings saved successfully'), ToastType::SUCCESS);
    }

    /**
     * @return list<ComponentContract>
     */
    protected function components(): iterable
    {
        return [
            FormBuilder::make()
                ->asyncMethod('saveSettings', message: __('Saving...'), page: $this)
                ->fields([
                    Box::make('General', [
                        Text::make('Site Name', 'site_name'),
                    ]),
                ])
                ->submit(__('Save')),
        ];
    }
}
```

---

## 5. Navigation & Layout

Register resources and pages in `app/MoonShine/Layouts/MoonShineLayout.php`:

```php
use MoonShine\MenuManager\MenuGroup;
use MoonShine\MenuManager\MenuItem;

protected function menu(): array
{
    return [
        ...parent::menu(),
        MenuGroup::make('Catalog', [
            MenuItem::make(CategoryResource::class),
            MenuItem::make(ProductResource::class),
        ])->icon('shopping-bag'),
        MenuGroup::make('System', [
            MenuItem::make(SettingsPage::class, 'Settings'),
        ])->icon('cog-6-tooth'),
    ];
}
```

---

## 6. Relationships Checklist

| Relation Type | MoonShine Field | Key Requirements |
|---|---|---|
| `belongsTo` | `BelongsTo::make('Label', 'relation', resource: Res::class)` | Target resource must be registered in ServiceProvider. |
| `hasMany` | `HasMany::make('Label', 'relation', resource: Res::class)` | Target resource required; configure inside FormPage or DetailPage. |
| `belongsToMany` | `BelongsToMany::make('Label', 'relation', resource: Res::class)` | Supports `->select()`, `->tree('parent_id')`, `->inLine()`. |
| Async search | `->searchable()->asyncSearch('name')` | For large datasets, enables remote search. |

---

## 7. Common Pitfalls & How to Avoid Them

1. **Unregistered Resources in Relationships:** Always add all related resources to `MoonShineServiceProvider`.
2. **Missing `strict_types=1` or generics:** In projects using strict typing and Larastan/PHPStan, annotate resources with `@extends ModelResource<Model, IndexPage, FormPage, DetailPage>`.
3. **Overwriting query builder incorrectly:** Use `protected function modifyQueryBuilder(Builder $builder): Builder` or `modifyItemQueryBuilder(Builder $builder): Builder`.
4. **Hardcoded HTML inside tables/forms:** Use built-in MoonShine components (`Badge`, `Icon`, `Link`, `Modal`, `Flex`, `Grid`, `Box`) instead of inline raw HTML.
5. **Form submission feedback:** When building custom async forms, remember to return `toast(__('Message'), ToastType::SUCCESS)`.
