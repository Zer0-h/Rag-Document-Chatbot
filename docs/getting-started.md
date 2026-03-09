# Getting Started with the Trifork Developer Platform

## What is the Trifork Developer Platform?

The Trifork Developer Platform (TDP) is a managed cloud environment for building, deploying, and observing data-intensive and AI-powered applications. It provides a unified API, a web console, and a CLI tool (`tdp`) to manage your workloads from development to production.

## Prerequisites

- A Trifork account (sign up at platform.trifork.com)
- Node.js 18+ or Python 3.10+ depending on your stack
- The `tdp` CLI: install with `npm install -g @trifork/tdp-cli` or `pip install tdp-cli`

## Your First Project

### 1. Authenticate the CLI

```bash
tdp login
```

This opens a browser window for SSO authentication. Once complete, a token is stored at `~/.tdp/credentials`. Tokens expire after 8 hours; run `tdp login --refresh` to extend without re-opening the browser.

### 2. Create a project

```bash
tdp project create my-first-app --region eu-west-1
```

Projects are the top-level resource in TDP. All services, secrets, and deployments live inside a project. Project names must be globally unique within your organisation.

### 3. Deploy your first service

Place a `tdp.yaml` file in your project root:

```yaml
name: my-first-app
runtime: node18
entrypoint: src/index.js
port: 3000
env:
  NODE_ENV: production
```

Then deploy:

```bash
tdp deploy
```

TDP builds a container image, pushes it to the internal registry, and assigns a public HTTPS endpoint under `<project>.tdp.app`.

### 4. View logs

```bash
tdp logs --tail
```

Logs are streamed in real time. To query historical logs use `tdp logs --since 1h` or open the Observability tab in the console.

## Regions

TDP is available in three regions: `eu-west-1` (Dublin), `us-east-1` (Virginia), and `ap-southeast-1` (Singapore). Data residency and pricing vary by region. Free-tier projects are limited to `eu-west-1`.

## Free Tier Limits

The free tier includes:
- 1 active project
- 512 MB RAM per service
- 5 GB outbound transfer per month
- 10,000 API calls per day to the TDP management API
- Logs retained for 3 days

Upgrading to a paid plan removes these limits. See the Billing documentation for details.

## Next Steps

- [Authentication & API Keys](./authentication.md) — secure your project and generate API keys
- [Deploying to Production](./deployment.md) — environments, rollbacks, and CI/CD
- [Billing & Plans](./billing.md) — understand usage and costs
