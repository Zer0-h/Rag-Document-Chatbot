# Observability

## Overview

TDP provides three pillars of observability out of the box: **logs**, **metrics**, and **traces**. All data is automatically collected from your deployed services — no instrumentation required for basic observability. For advanced tracing, a lightweight SDK is available.

## Logs

### Viewing Logs

Logs are captured from `stdout` and `stderr` of every container. Access them via:

```bash
tdp logs --env production --tail          # stream live
tdp logs --env production --since 2h      # last 2 hours
tdp logs --env production --since 2024-01-15T10:00:00Z  # since timestamp
```

In the Console: **Services → [service name] → Logs**.

### Log Levels

TDP parses log lines that follow the structured JSON format:

```json
{ "level": "error", "message": "DB connection failed", "ts": 1704067200, "trace_id": "abc123" }
```

Lines that are not valid JSON are ingested as plain text with level `info`. Structured logs allow filtering by level in the Console.

### Log Retention

Log retention depends on your plan (3 days on Free, 14 on Starter, 90 on Pro). Logs beyond the retention window are permanently deleted. If you need longer retention, configure a **Log Export** to push logs to an external destination (S3, Datadog, or any HTTP endpoint).

### Log Export

```yaml
# tdp.yaml
logExport:
  destination: https://your-log-aggregator.example.com/ingest
  headers:
    Authorization: Bearer ${LOG_EXPORT_TOKEN}
  batchSize: 100
  flushIntervalMs: 5000
```

## Metrics

TDP automatically collects the following metrics per service:

- **Request rate** (req/s)
- **Error rate** (% 5xx responses)
- **P50 / P95 / P99 latency** (ms)
- **CPU usage** (%)
- **Memory usage** (MB)
- **Active instances**

Metrics are available in the Console under **Services → [service name] → Metrics** and via the API:

```
GET /projects/{projectId}/services/{serviceId}/metrics?period=1h&resolution=1m
```

### Custom Metrics

Emit custom metrics from your code using the TDP metrics SDK:

```javascript
import { metrics } from '@trifork/tdp-sdk';

metrics.increment('orders.processed');
metrics.gauge('queue.depth', queueLength);
metrics.histogram('payment.duration_ms', durationMs);
```

Custom metrics are visible in the Console alongside system metrics and can be used to trigger autoscaling rules.

### Alerting

Create alerts in **Observability → Alerts**:

- **Threshold alerts:** notify when a metric crosses a fixed value (e.g. error rate > 5%)
- **Anomaly alerts:** notify when a metric deviates significantly from its historical baseline

Alerts can notify via email, Slack webhook, or PagerDuty.

## Distributed Tracing

For tracing across multiple services, instrument your code with OpenTelemetry. TDP auto-ingests OTLP trace data sent to:

```
http://localhost:4318/v1/traces   (within TDP network)
```

No API key is required for trace ingestion from within TDP — the Workload Identity token is used automatically.

Traces are visible in **Observability → Traces**, where you can search by `trace_id`, `service`, or `status`.

### Sampling

Default sampling rate is 5% of traces. Increase it per service in `tdp.yaml`:

```yaml
tracing:
  samplingRate: 1.0   # 100% — use only in development
```

High sampling rates significantly increase storage costs on the Starter plan.

## Uptime Monitoring

TDP pings your service's `/health` endpoint every 60 seconds from two external regions. If the endpoint fails three consecutive checks, an incident is created and all project admins are notified. Uptime history is displayed in **Observability → Uptime**.
