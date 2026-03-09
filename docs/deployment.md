# Deployment

## Environments

Every TDP project has three built-in environments:

| Environment | URL pattern | Purpose |
|---|---|---|
| `development` | `dev-<project>.tdp.app` | Local iteration, CI feature branches |
| `staging` | `staging-<project>.tdp.app` | Pre-production testing, QA |
| `production` | `<project>.tdp.app` | Live traffic |

Environments are isolated: each has its own secrets, environment variables, and scaling settings. A deployment to `staging` does not affect `production`.

## Deploying via CLI

```bash
# Deploy to staging
tdp deploy --env staging

# Deploy to production
tdp deploy --env production --confirm
```

The `--confirm` flag is required for production deployments to prevent accidents.

## Deploying via CI/CD

Add the following GitHub Actions step to your workflow:

```yaml
- name: Deploy to TDP
  uses: trifork/tdp-deploy-action@v2
  with:
    api_key: ${{ secrets.TDP_API_KEY }}
    project: my-app
    environment: production
```

The API key used in CI/CD must have the `deploy` scope. Create a dedicated key for CI — never use a personal admin key.

## Build Process

TDP uses a Dockerfile if one is present in the project root. If no Dockerfile is found, TDP auto-detects the runtime and applies a default buildpack:

- **Node.js**: runs `npm ci` then `npm run build`
- **Python**: runs `pip install -r requirements.txt`
- **Go**: runs `go build -o app .`

Build logs are available via `tdp logs --build` or in the Console under the deployment detail view.

Build artefacts are cached per project. Clear the cache with `tdp cache clear` if you encounter stale dependency issues.

## Zero-Downtime Deployments

TDP uses a rolling deployment strategy by default:

1. A new instance of the service is started with the new image.
2. Health checks must pass (see below) before traffic is shifted.
3. Old instances are terminated after a 30-second drain period.

This means there is always at least one instance running during deployment. Rollout time depends on your health check timeout — the default is 15 seconds.

## Health Checks

TDP expects your service to expose a `GET /health` endpoint that returns `HTTP 200`. You can customise this:

```yaml
# tdp.yaml
healthCheck:
  path: /ready
  intervalSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

If health checks fail three consecutive times during deployment, TDP automatically triggers a rollback to the last known-good deployment. An alert is sent to all project admins.

## Rollbacks

To manually roll back:

```bash
tdp rollback --env production
```

This immediately routes traffic back to the previous deployment. The failed deployment is kept in the deployment history for 7 days for debugging. You can roll back at most 5 versions deep.

## Scaling

```yaml
# tdp.yaml
scaling:
  min: 1
  max: 10
  targetCPU: 70   # scale up when average CPU exceeds 70%
```

The free tier is limited to 1 instance. Autoscaling requires a Starter plan or higher.

## Deployment Slots (Blue/Green)

Pro and Enterprise plans support blue/green deployments. Use `--strategy blue-green` to deploy to a staging slot and then promote without downtime:

```bash
tdp deploy --env production --strategy blue-green
tdp promote --env production
```
