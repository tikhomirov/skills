---
name: laravel-best-practices
description: Apply modern Laravel best practices and architecture patterns when writing, reviewing, or refactoring controllers, models, queries, form requests, jobs, and services.
argument-hint: [task description]
---

# Laravel Best Practices Skill

A comprehensive guide and standard for writing modern, high-performance, maintainable, and idiomatic **Laravel (PHP 8.3+, Laravel 11/12/13)** code.

---

## 1. Architecture & Single Responsibility

### Controllers
- **Lean Controllers:** Controllers must only handle HTTP routing, delegating business logic to Action classes, Services, or Form Requests.
- **Invocable Actions (`__invoke`):** For complex operations, prefer Single Action Controllers (`OrderCheckoutController`) or Action classes (`CreateOrderAction`).
- **Standard API Envelope:** Keep JSON response structure consistent across endpoints:
  ```php
  return response()->json([
      'data' => $resource,
      'status' => 'success',
      'ok' => true,
  ], 200);
  ```

### Form Requests
- Always validate incoming HTTP payloads via dedicated `FormRequest` classes.
- Use strictly typed methods: `$request->validated()` or specific typed getters instead of `$request->all()`.
- Authorize requests in `authorize()` using Laravel Policies.

### Services & Actions
- Put reusable business workflows in `App\Actions\...` (single method `execute()` or `__invoke()`) or `App\Services\...`.
- Always wrap multi-table modifications inside `DB::transaction(fn () => ...)`.

---

## 2. Eloquent & Database Performance

### N+1 Query Prevention & Eager Loading
- Always eager load relationships used in loops or API resources:
  ```php
  $orders = Order::query()
      ->with(['items.product', 'user', 'deliveryZone'])
      ->latest()
      ->paginate(25);
  ```
- Use `Model::shouldBeStrict(! app()->isProduction())` or `Model::preventLazyLoading()`.

### Bulk Operations & Large Datasets
- Never load millions of records with `all()` or `get()`. Use `chunkById(100, ...)` or `lazyById()`.
- Use `insert()` or `upsert()` for batch record creation when model events/timestamps are not needed.

### Scopes & Queries
- Encapsulate query filters in Local Scopes or custom Eloquent Query Builders:
  ```php
  // In Model
  #[Scope]
  public function active(Builder $query): void
  {
      $query->where('is_active', true);
  }
  ```

---

## 3. Configuration & Security

- **NEVER use `env()` outside config files:** Always read environment values through `config('services.my_service.key')`. `env()` returns `null` when config is cached.
- **Strict Mass Assignment:** Use `$guarded = []` only with validated Form Requests or explicitly set `$fillable`.
- **Authorization:** Use Policies (`Gate::authorize('update', $order)`) for authorization logic instead of manual role/user checks in controllers.

---

## 4. Queues, Jobs & Events

- **Idempotent Jobs:** Queue jobs may be retried on failure; ensure `handle()` is idempotent (check state before duplicate execution).
- **Lightweight Job Payloads:** Pass Model IDs or minimal data to Job constructors rather than bloated objects.
- **Failed Job Handling:** Always implement `failed(\Throwable $exception)` for critical background tasks (e.g. notify admins, revert statuses).

---

## 5. Verification Checklist

Before finishing any Laravel backend task:
1. `composer ci:fix && composer ci` (or `pint && phpstan analyse`).
2. Run Pest/PHPUnit tests covering the feature.
3. Verify no raw SQL vulnerabilities or unsanitized inputs.
4. Check eager loading on all related Eloquent models.
