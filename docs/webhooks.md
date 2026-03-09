# Webhooks

## Overview

Webhooks let you receive real-time notifications when events occur in your TDP project. TDP sends an HTTP POST request to your configured URL whenever a subscribed event fires.

## Creating a Webhook

In the Console: **Project Settings → Webhooks → New Webhook**.

Via API:

```
POST /projects/{projectId}/webhooks
```

```json
{
  "url": "https://your-service.example.com/webhooks/tdp",
  "events": ["deployment.succeeded", "deployment.failed", "service.health_check_failed"],
  "secret": "your-signing-secret"
}
```

The `secret` is optional but strongly recommended — use it to verify that incoming requests genuinely come from TDP (see Signature Verification below).

## Event Types

| Event | Fired when |
|---|---|
| `deployment.started` | A deployment begins building |
| `deployment.succeeded` | A deployment completes and is serving traffic |
| `deployment.failed` | A deployment fails or is automatically rolled back |
| `deployment.rolled_back` | A deployment is manually rolled back |
| `service.scaled_up` | Autoscaler adds a new instance |
| `service.scaled_down` | Autoscaler removes an instance |
| `service.health_check_failed` | Health check fails on a running service |
| `secret.expiring` | An API key or secret will expire within 7 days |
| `billing.threshold_reached` | Spend alert threshold crossed |
| `team.member_added` | A new member joins the project |
| `team.member_removed` | A member is removed from the project |

You can subscribe to all events with the wildcard `"*"`.

## Payload Format

Every webhook delivery shares the same envelope:

```json
{
  "id": "evt_01HJ3K...",
  "type": "deployment.succeeded",
  "created_at": "2024-01-15T10:32:00Z",
  "project_id": "proj_abc123",
  "data": {
    "deployment_id": "dep_xyz789",
    "service_id": "svc_456",
    "environment": "production",
    "image": "registry.trifork.com/my-app:v1.2.3",
    "duration_seconds": 47
  }
}
```

The structure of `data` varies by event type. Full schemas for each event are in the API Reference.

## Signature Verification

TDP signs each webhook delivery with HMAC-SHA256 using your secret. The signature is in the `TDP-Signature` header:

```
TDP-Signature: t=1704067200,v1=abc123def456...
```

To verify (Node.js example):

```javascript
const crypto = require('crypto');

function verifySignature(payload, header, secret) {
  const [tPart, vPart] = header.split(',');
  const timestamp = tPart.split('=')[1];
  const signature = vPart.split('=')[1];
  const signed = `${timestamp}.${payload}`;
  const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

Always verify signatures in production. Reject requests where verification fails with `HTTP 403`.

Reject deliveries where the timestamp is more than 300 seconds old — this prevents replay attacks.

## Retries

If your endpoint returns anything other than a `2xx` status, TDP retries the delivery with exponential backoff:

| Attempt | Delay |
|---|---|
| 1 | Immediate |
| 2 | 5 seconds |
| 3 | 30 seconds |
| 4 | 5 minutes |
| 5 | 30 minutes |

After 5 failed attempts, the delivery is marked as `failed` and no further retries occur. You can manually redeliver failed events from **Project Settings → Webhooks → [webhook name] → Delivery Log**.

## Delivery Timeouts

Your endpoint must respond within 10 seconds. If it does not, TDP treats the attempt as failed and retries. For long-running processing, respond immediately with `HTTP 200` and process the event asynchronously.

## Delivery Log

Every delivery attempt is logged for 7 days and visible in the Console under **Project Settings → Webhooks → [webhook name] → Delivery Log**. The log includes the request headers, body, your response status, and response body (truncated to 1 KB).
