# Authentication & API Keys

## Overview

All requests to the TDP REST API must be authenticated. TDP supports two authentication mechanisms: **API Keys** (recommended for server-to-server calls) and **OAuth 2.0 / SSO** (recommended for user-facing flows).

## API Keys

### Creating an API Key

1. Open the TDP Console at `console.trifork.com`.
2. Navigate to **Project Settings → API Keys**.
3. Click **New API Key**, choose a name and an expiry (30, 90, 365 days, or no expiry).
4. Copy the key immediately — it is shown only once.

API keys are prefixed with `tdp_live_` for production and `tdp_test_` for sandbox environments.

### Using an API Key

Pass the key in the `Authorization` header:

```
Authorization: Bearer tdp_live_abc123...
```

Never embed API keys in client-side code or commit them to version control. Use environment variables or a secrets manager.

### Key Permissions (Scopes)

When creating a key you can restrict it to specific scopes:

| Scope | Description |
|---|---|
| `read` | Read-only access to all project resources |
| `write` | Create and update resources |
| `deploy` | Trigger deployments and manage services |
| `admin` | Full access including billing and team management |

If no scope is specified the key receives `read` + `write` by default.

### Rotating API Keys

Keys should be rotated every 90 days. To rotate:

1. Create a new key with the same scopes.
2. Update all services and CI/CD pipelines to use the new key.
3. Delete the old key from **Project Settings → API Keys**.

There is no automatic rotation. If a key is compromised, delete it immediately — this invalidates all active requests using that key within 60 seconds.

### Key Expiry Behaviour

When a key expires, requests using it return `HTTP 401 Unauthorized` with the error code `API_KEY_EXPIRED`. The response body includes the expiry timestamp so you can identify which key is affected.

## OAuth 2.0 / SSO

TDP supports the Authorization Code flow with PKCE for user-facing applications.

### Endpoints

- **Authorisation:** `https://auth.trifork.com/oauth2/authorize`
- **Token:** `https://auth.trifork.com/oauth2/token`
- **Revoke:** `https://auth.trifork.com/oauth2/revoke`

### Token Lifetimes

- Access tokens: 1 hour
- Refresh tokens: 30 days (sliding window)

Use `POST /oauth2/token` with `grant_type=refresh_token` to silently refresh. Refresh tokens are rotated on each use — store the new token returned in the response.

## Service-to-Service Authentication

For inter-service calls within TDP (e.g. one deployed service calling another), use **Workload Identity**. Services receive a short-lived identity token injected at runtime via the `TDP_IDENTITY_TOKEN` environment variable. This token can be passed as a Bearer token to any other TDP service in the same project without managing API keys.

## Common Errors

| Error Code | Meaning | Fix |
|---|---|---|
| `API_KEY_EXPIRED` | Key has passed its expiry date | Rotate the key |
| `API_KEY_INVALID` | Key does not exist or was deleted | Check the key value |
| `SCOPE_INSUFFICIENT` | Key lacks required scope | Create a new key with the right scopes |
| `RATE_LIMITED` | Too many requests | Back off and retry with exponential delay |
