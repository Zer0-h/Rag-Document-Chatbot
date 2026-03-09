# API Reference

## Base URL

```
https://api.trifork.com/v1
```

All endpoints require authentication. See [Authentication](./authentication.md) for details.

## Rate Limits

| Plan | Requests / minute | Requests / day |
|---|---|---|
| Free | 60 | 10,000 |
| Starter | 300 | 100,000 |
| Pro | 1,000 | unlimited |
| Enterprise | custom | custom |

Rate limit headers are returned on every response:

```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 287
X-RateLimit-Reset: 1704067260
```

When the limit is exceeded the API returns `HTTP 429 Too Many Requests`. The `Retry-After` header indicates how many seconds to wait.

## Projects

### List projects
`GET /projects`

Returns all projects in your organisation.

### Create a project
`POST /projects`

```json
{
  "name": "my-app",
  "region": "eu-west-1",
  "runtime": "node18"
}
```

### Get a project
`GET /projects/{projectId}`

### Delete a project
`DELETE /projects/{projectId}`

Deleting a project is irreversible. All services, deployments, secrets, and logs are permanently removed. A project cannot be deleted if it has active deployments — scale them down first.

## Services

### List services
`GET /projects/{projectId}/services`

### Deploy a service
`POST /projects/{projectId}/services/{serviceId}/deploy`

```json
{
  "image": "registry.trifork.com/my-app:v1.2.3",
  "env": {
    "DATABASE_URL": "postgres://..."
  },
  "resources": {
    "memory": "512Mi",
    "cpu": "0.5"
  }
}
```

### Get deployment status
`GET /projects/{projectId}/deployments/{deploymentId}`

Response includes a `status` field: `pending`, `building`, `deploying`, `running`, `failed`, or `rolled_back`.

### Rollback a deployment
`POST /projects/{projectId}/deployments/{deploymentId}/rollback`

Rolls back to the previous successful deployment. Rollback is instant (traffic is rerouted) — the previous image is not rebuilt.

## Secrets

Secrets are encrypted at rest using AES-256 and injected as environment variables at deploy time.

### Set a secret
`PUT /projects/{projectId}/secrets/{name}`

```json
{ "value": "my-secret-value" }
```

Secret names must match `[A-Z0-9_]+`. Values are write-only — once set, the value cannot be read back through the API, only overwritten or deleted.

### Delete a secret
`DELETE /projects/{projectId}/secrets/{name}`

Deleting a secret does not affect running services until they are redeployed.

## Webhooks

`POST /projects/{projectId}/webhooks`

See [Webhooks](./webhooks.md) for payload format and event types.

## Pagination

List endpoints return paginated results. Use the `cursor` parameter to page through results:

```
GET /projects/{projectId}/services?limit=20&cursor=eyJpZCI6IjEyMyJ9
```

Responses include a `next_cursor` field. When `next_cursor` is `null`, you have reached the last page.

## Error Format

All errors follow the same structure:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Project 'xyz' does not exist",
    "request_id": "req_01HJ3K..."
  }
}
```

Always include `request_id` when contacting support.
