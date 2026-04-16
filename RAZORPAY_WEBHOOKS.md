# Razorpay Webhook Integration

## Configuration

Set the following environment variable in your deployment environment:

```
RAZORPAY_WEBHOOK_SECRET=<your-razorpay-webhook-secret>
```

The webhook secret is available in your Razorpay Dashboard:

1. Go to Settings → Webhooks
2. Create or copy an existing webhook secret
3. The endpoint should be: `https://your-domain.com/webhooks/payments/razorpay`

## Signature Verification

All Razorpay webhooks are signed using HMAC-SHA256:

- The request body is hashed with your webhook secret
- The signature is sent in the `X-Razorpay-Signature` header
- The backend verifies this signature before processing

If the signature is invalid, the webhook returns HTTP 401 (Unauthorized).

## Event Mapping

Razorpay events are normalized to the payment webhook system:

| Razorpay Event       | Mapped To           | Action                                    |
| -------------------- | ------------------- | ----------------------------------------- |
| `payment.authorized` | `payment.succeeded` | Mark invoice paid, create/extend instance |
| `payment.captured`   | `payment.succeeded` | Mark invoice paid, create/extend instance |
| `payment.failed`     | `payment.failed`    | Log failure, do not create instance       |

## Testing Locally

### Mock Razorpay Webhook

If you don't have a Razorpay webhook secret configured, the system will log a warning but still process webhooks (useful for development).

**Example request:**

```bash
curl -X POST http://localhost:3000/webhooks/payments/razorpay \
  -H "Content-Type: application/json" \
  -d '{
    "event": "payment.authorized",
    "id": "evt_123",
    "created_at": 1234567890,
    "payload": {
      "payment": {
        "id": "pay_123",
        "receipt": "txn_001",
        "amount": 50000,
        "currency": "INR",
        "created_at": 1234567890
      }
    }
  }'
```

**Response (202 Accepted):**

```json
{
  "message": "Webhook received",
  "status": "processed",
  "transactionId": "txn_123"
}
```

### With Signature Verification

To test signature verification locally:

1. Choose a webhook secret (e.g., `test_secret_123`)
2. Set `RAZORPAY_WEBHOOK_SECRET=test_secret_123` as an environment variable
3. Sign your test payload:

```bash
# Compute HMAC-SHA256 signature
PAYLOAD='{"event":"payment.authorized","id":"evt_123",...}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "test_secret_123" | sed 's/^.* //')

# Send request with signature header
curl -X POST http://localhost:3000/webhooks/payments/razorpay \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

## Field Mapping

Razorpay webhook fields are mapped as follows:

| Field               | Source                                            | Notes                                                        |
| ------------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| `eventId`           | `webhook.id`                                      | Unique webhook event identifier                              |
| `eventType`         | `webhook.event`                                   | Normalized to "payment.succeeded" or "payment.failed"        |
| `externalReference` | `payload.payment.receipt` or `payload.payment.id` | Transaction reference for matching with pending transactions |
| `amount`            | `payload.payment.amount`                          | In smallest currency unit (paise for INR)                    |
| `currency`          | `payload.payment.currency`                        | Defaults to "INR"                                            |
| `occurredAt`        | `payload.payment.created_at`                      | Unix timestamp (converted to JS Date)                        |
| `failureReason`     | `payload.payment.error_description`               | Only present for failed payments                             |

## Idempotent Processing

All webhooks are stored in the `payment_webhook_events` table with a unique constraint on `(provider, eventId)`. This ensures:

- Duplicate webhooks (retries from Razorpay) are safely ignored
- Events can be replayed without side effects
- Complete audit trail is maintained
