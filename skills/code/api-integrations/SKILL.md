---
name: api-integrations
description: Design, implement, secure, and debug robust external API clients, webhook endpoints, idempotency, retry mechanisms, and third-party integrations (iiko, Telegram, payment gateways).
argument-hint: [integration task description]
---

# Robust API & Webhook Integrations Skill

Standards and best practices for building resilient, secure, and fault-tolerant external API integrations and webhook receivers in Laravel.

---

## 1. Outgoing API Client Standards

### Use Laravel `Http` Facade with Strict Defaults

```php
<?php

declare(strict_types=1);

namespace App\Services\External;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

final class ExternalApiClient
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly string $apiKey,
        private readonly int $timeoutSeconds = 10,
    ) {}

    private function client(): PendingRequest
    {
        return Http::baseUrl($this->baseUrl)
            ->timeout($this->timeoutSeconds)
            ->connectTimeout(3)
            ->retry(3, 100, throw: false) // Retry 3 times with 100ms backoff on connection drops
            ->withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Accept' => 'application/json',
            ]);
    }

    public function createResource(array $data, ?string $idempotencyKey = null): array
    {
        $request = $this->client();

        if ($idempotencyKey !== null) {
            $request = $request->withHeaders(['Idempotency-Key' => $idempotencyKey]);
        }

        $response = $request->post('/v1/resources', $data);

        if ($response->failed()) {
            Log::error('External API call failed', [
                'status' => $response->status(),
                'body' => $response->json(),
                'endpoint' => '/v1/resources',
            ]);

            throw new ApiException("External API request failed with status {$response->status()}");
        }

        return $response->json('data', []);
    }
}
```

---

## 2. Idempotency & Duplicate Prevention

1. **Idempotency Keys:** For payment captures, order creations, and balance adjustments, generate a deterministic UUID (e.g. `hash('sha256', "order_{$order->id}")`).
2. **Atomic Locks:** Use Redis/Database locks to prevent race conditions:
   ```php
   use Illuminate\Support\Facades\Cache;

   $lock = Cache::lock("process_order_{$orderId}", 10);

   if (! $lock->get()) {
       return response()->json(['message' => 'Concurrent operation in progress'], 429);
   }

   try {
       // Process payment or API call
   } finally {
       $lock->release();
   }
   ```

---

## 3. Secure Webhook Receivers

### Signature Verification (HMAC-SHA256)

```php
public function handleWebhook(Request $request): JsonResponse
{
    $signature = $request->header('X-Signature');
    $payload = $request->getContent(); // Raw body is critical for HMAC verification
    $secret = config('services.provider.webhook_secret');

    $computedSignature = hash_hmac('sha256', $payload, $secret);

    if (! hash_equals($computedSignature, (string) $signature)) {
        Log::warning('Invalid webhook signature attempt', ['ip' => $request->ip()]);
        return response()->json(['error' => 'Invalid signature'], 401);
    }

    // Acknowledge immediately, process heavy logic asynchronously
    ProcessWebhookJob::dispatch($request->all());

    return response()->json(['received' => true], 200);
}
```

### Webhook Idempotency & Deduping
- Store processed webhook IDs in a `processed_webhooks` table or Redis cache key.
- If the ID was already processed, immediately return `200 OK` without re-executing actions.

---

## 4. Logging & Sensitive Data Masking

- **NEVER** log raw credit card numbers, CVVs, passwords, or full bearer tokens.
- Mask sensitive payload parameters before logging:
  ```php
  $cleanPayload = $payload;
  if (isset($cleanPayload['card_number'])) {
      $cleanPayload['card_number'] = '****' . substr($cleanPayload['card_number'], -4);
  }
  Log::info('Outgoing payload', $cleanPayload);
  ```

---

## 5. Polling & Webhook Fallback

When relying on external status changes (e.g. iiko order progress, payment gateway confirmations):
1. Rely on Webhooks for instant push notifications.
2. Maintain a scheduled background fallback command / job to poll pending orders older than 5 minutes to recover from missed webhooks.
