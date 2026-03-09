# Troubleshooting

## Deployment Issues

### Deployment stuck in "building"

Builds time out after 15 minutes. If your build is taking longer:
- Check build logs with `tdp logs --build` — look for slow dependency installs
- Clear the build cache with `tdp cache clear` and redeploy
- On the Free tier, builds are queued — wait times can be up to 5 minutes during peak hours

### Deployment fails with "health check timeout"

Your service did not pass the `/health` endpoint check within the timeout window (default: 15 seconds).

- Ensure `GET /health` returns `HTTP 200` within 5 seconds
- Check if the service crashes on startup: `tdp logs --env production --since 10m`
- Verify the port in `tdp.yaml` matches the port your server listens on
- If your service takes longer to boot (e.g. loading a large ML model), increase the health check timeout in `tdp.yaml`:

```yaml
healthCheck:
  timeoutSeconds: 60
  failureThreshold: 5
```

### "RESOURCE_LIMIT_EXCEEDED" during deployment

Your service is requesting more CPU or memory than your plan allows. Either reduce your resource request in `tdp.yaml` or upgrade your plan. On the Free tier, services are limited to 512 MB RAM and 0.5 vCPU.

### Deployment succeeds but traffic is not switching over

This can happen if the old instances are still draining. Traffic switches after a 30-second drain period. If traffic has not switched after 2 minutes, check for active long-running connections (WebSockets, SSE) on the old instances that are preventing shutdown.

## Runtime Issues

### Service keeps restarting ("CrashLoopBackOff")

1. Check logs immediately after startup: `tdp logs --env production --since 5m`
2. Look for unhandled exceptions or missing environment variables
3. Verify all referenced secrets exist: `tdp secret list --env production`
4. Check memory usage — if the process is killed with exit code 137, it was OOM-killed; increase the memory limit

### "Connection refused" between services

- Services within the same project communicate via their internal hostname: `http://<service-name>.internal`
- Ensure both services are in the same project and environment
- Internal traffic does not go through the public internet and is not rate-limited

### API returns 401 after key rotation

After rotating an API key, invalidation of the old key takes up to 60 seconds to propagate globally. If requests are still failing after 60 seconds, verify the new key is being sent correctly in the `Authorization: Bearer` header.

### Logs show correct responses but the Console shows errors

The error rate metric in the Console is based on HTTP status codes from the load balancer, not your application logs. If your service returns `5xx` but logs show success, check:
- Middleware that might be overriding your response code
- Proxy configuration mismatches

## Database & Storage Issues

### "Too many connections" on database

Each service instance opens its own connection pool. If you are running multiple instances (autoscaling), multiply your per-instance pool size by the number of instances. Either reduce the pool size or use a connection pooler like PgBouncer.

### Secrets not available after rotation

If you rotated a secret but the service is still using the old value, you need to redeploy — secrets are injected at deploy time, not at runtime. Running `tdp deploy --env production` will pick up the new value.

## Billing Issues

### Unexpected charge on invoice

1. Go to **Billing → Usage** and filter by the billing period in question
2. Check per-project and per-service breakdowns for unusually high compute or transfer
3. Common causes: a service left running after a demo, autoscaling to many instances due to a traffic spike, or large log export volumes
4. If you believe there is an error, contact support with the `request_id` from your invoice

### Cannot downgrade plan

Downgrade is blocked if your current resource usage exceeds the target plan's limits:
- Scale down or stop services with `tdp service scale <name> --instances 0`
- Remove projects over the target plan's project limit
- Wait for transfer usage to fall below the limit (usage resets monthly)

## Getting Help

- **Documentation:** docs.trifork.com
- **Community forum:** community.trifork.com
- **Support email:** support@trifork.com (include your `request_id` and project ID)
- **Status page:** status.trifork.com

When contacting support, always include:
1. Your project ID (found in **Project Settings → General**)
2. The `request_id` from the failing API response, or the deployment ID
3. The approximate time the issue occurred (with timezone)
