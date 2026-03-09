# Data Pipelines

## Overview

TDP Pipelines let you define, schedule, and monitor data workflows without managing infrastructure. A pipeline is a directed acyclic graph (DAG) of **steps**, each of which runs a containerised task.

## Defining a Pipeline

Pipelines are defined in `pipeline.yaml`:

```yaml
name: nightly-etl
schedule: "0 2 * * *"   # cron — runs at 02:00 UTC daily
timezone: Europe/Dublin

steps:
  extract:
    image: my-app/extract:latest
    command: ["python", "extract.py"]
    env:
      SOURCE_DB: ${SOURCE_DB_URL}
    resources:
      memory: 1Gi
      cpu: 1.0

  transform:
    image: my-app/transform:latest
    dependsOn: [extract]
    env:
      RAW_BUCKET: ${RAW_BUCKET}

  load:
    image: my-app/load:latest
    dependsOn: [transform]
    retries: 3
```

Deploy the pipeline with:

```bash
tdp pipeline deploy pipeline.yaml
```

## Scheduling

Pipelines support standard cron expressions. All times are interpreted in UTC by default unless a `timezone` is specified. TDP supports any IANA timezone (e.g. `Europe/Amsterdam`, `America/New_York`).

To trigger a pipeline manually:

```bash
tdp pipeline run nightly-etl
```

Or via the API:

```
POST /projects/{projectId}/pipelines/{pipelineId}/runs
```

## Step Dependencies

Steps listed in `dependsOn` only start after all listed steps have completed successfully. If a step fails, downstream steps are skipped and the pipeline run is marked as `failed`.

Steps with no `dependsOn` run in parallel at the start of the pipeline.

## Retries and Error Handling

Set `retries: N` on any step. TDP waits 30 seconds between retry attempts. If all retries are exhausted, the step fails.

Use `continueOnFailure: true` to allow downstream steps to proceed even if an upstream step fails:

```yaml
  optional-enrichment:
    image: my-app/enrich:latest
    dependsOn: [extract]
    continueOnFailure: true
```

## Passing Data Between Steps

Steps communicate via **shared volumes** mounted at `/tdp/data`:

```python
# In extract.py
import json, pathlib
pathlib.Path("/tdp/data/raw.json").write_text(json.dumps(records))

# In transform.py
records = json.loads(pathlib.Path("/tdp/data/raw.json").read_text())
```

The volume is local to a pipeline run and is deleted after the run completes (success or failure). For persistent storage, write to an external data store.

## Run History and Logs

```bash
tdp pipeline history nightly-etl          # list recent runs
tdp pipeline logs nightly-etl --run abc123  # logs for a specific run
```

Each step's logs are available separately. Run history is retained for 30 days.

## Notifications

Configure notifications for pipeline failures in `pipeline.yaml`:

```yaml
notifications:
  onFailure:
    - type: email
      to: data-team@example.com
    - type: webhook
      url: https://hooks.slack.com/services/...
```

## Concurrency

By default, only one run of a pipeline can be active at a time. If a scheduled run is triggered while a previous run is still active, the new run is queued. To allow concurrent runs:

```yaml
concurrency: unlimited
```

Or set a maximum:

```yaml
concurrency: 3
```

## Resource Limits

Pipeline step resource limits follow the same plan-based limits as regular services. Free-tier pipelines are limited to 512 MB RAM per step. Pipelines that exceed their memory limit are killed with exit code 137 (`OOMKilled`), which counts as a failed step.
