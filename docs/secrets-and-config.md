# Secrets & Configuration

## Overview

TDP provides two mechanisms for passing configuration to your services: **Secrets** (for sensitive values) and **Config Vars** (for non-sensitive settings). Both are injected as environment variables at deploy time.

## Secrets

Secrets are encrypted at rest with AES-256-GCM and only decrypted in memory at deploy time. They are never logged, never returned by the API after creation, and never written to disk on TDP infrastructure.

### Creating Secrets

Via CLI:

```bash
tdp secret set DATABASE_URL "postgres://user:pass@host/db" --env production
tdp secret set STRIPE_KEY "sk_live_..." --env production
```

Via API:

```
PUT /projects/{projectId}/secrets/{name}
```

```json
{ "value": "the-secret-value", "environment": "production" }
```

Secret names must be uppercase with underscores only (`[A-Z0-9_]+`). Names starting with `TDP_` are reserved.

### Viewing Secrets

You can list secret names but never retrieve their values:

```bash
tdp secret list --env production
```

Output:

```
DATABASE_URL     last updated 2024-01-10  by rdr@trifork.com
STRIPE_KEY       last updated 2024-01-08  by rdr@trifork.com
```

If you need to check a secret's value, you must overwrite it. Plan accordingly during key rotation.

### Deleting Secrets

```bash
tdp secret delete STRIPE_KEY --env production
```

Deleting a secret does not affect running service instances — the old value remains in memory until the next deployment. After deletion, the next deployment will fail if the service still references the deleted secret unless you remove the reference first.

### Secrets Across Environments

Secrets are scoped per environment. A secret named `DATABASE_URL` in `production` is entirely separate from one named `DATABASE_URL` in `staging`. You must set secrets in each environment independently.

### Secret Rotation Best Practice

1. Create the new credential in your external service.
2. Set the new value: `tdp secret set DATABASE_URL "new-value" --env production`
3. Redeploy the service: `tdp deploy --env production`
4. Verify the service is healthy.
5. Revoke the old credential in the external service.

Never delete the old secret before the service has been redeployed with the new value.

## Config Vars

Config vars are plain-text, non-sensitive environment variables. Unlike secrets, they are stored unencrypted and are visible in the Console and API.

```bash
tdp config set LOG_LEVEL "info" --env production
tdp config set FEATURE_FLAG_NEW_UI "true" --env staging
```

Via API:

```
PATCH /projects/{projectId}/config
```

```json
{
  "environment": "production",
  "vars": {
    "LOG_LEVEL": "info",
    "MAX_CONNECTIONS": "50"
  }
}
```

Config var changes require a redeployment to take effect, just like secrets.

## tdp.yaml vs Runtime Config

Values set in `tdp.yaml` under `env:` are baked into the deployment at build time. Values set via `tdp secret set` or `tdp config set` override `tdp.yaml` values at deploy time. Runtime config always wins.

This means you can define sensible defaults in `tdp.yaml` and override them per environment without changing your source code.

## Referencing Secrets in tdp.yaml

Reference secrets in your `tdp.yaml` using the `${SECRET_NAME}` syntax:

```yaml
env:
  DATABASE_URL: ${DATABASE_URL}
  LOG_LEVEL: info
```

If the referenced secret does not exist in the target environment at deploy time, the deployment fails with a clear error message.
