# Rag Document Chatbot

A RAG-powered documentation assistant. Ask questions in plain English and get answers grounded in the actual platform docs with streaming responses, source citations, and conversation memory.

## Prerequisites

- Node.js 20+ (Used v22.13.1)
- Angular 19
- A [Gemini API key](https://aistudio.google.com/app/apikey) (free tier)
- A [LangFuse account](https://cloud.langfuse.com) (free tier, for observability)

## Setup & Run

```bash
# 1. Install all dependencies
npm run install:all

# 2. Create the backend environment file
cp backend/.env.example backend/.env
# Edit backend/.env and fill in your keys

# 3. Start both servers
npm run dev
```

- **Frontend** → http://localhost:4200
- **Backend** → http://localhost:3000

On first start the backend will index all documents in `docs/`. Subsequent starts skip ingestion and boot instantly.

## Environment Variables

Create `backend/.env` with the following:

```env
# Gemini API (embeddings + generation)
GEMINI_API_KEY=your_key_here

# Server port
PORT=3000

# LanceDB storage path (default: ../data/lancedb)
LANCE_DB_PATH=../data/lancedb

#  LangFuse observability
# https://cloud.langfuse.com → your project → Settings → API Keys
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

## Architecture

```
docs/*.md
    ↓ chunker (paragraph-aware, 500 char chunks with 100 char overlap)
    ↓ gemini-embedding-001 (3072 dimensions)
    ↓ LanceDB (persisted to disk, skipped on restart)

POST /ask
    ↓ embed question → LanceDB vector search (top 5 chunks)
    ↓ inject chunks as context into Gemini 2.5 Flash prompt
    ↓ stream response token-by-token via SSE
    ↓ append Q&A to session history (conversation memory)
    ↓ trace latency + tokens + cost to LangFuse
```

**Backend** — Node.js + Express + TypeScript, structured as `routes → controllers → services → rag`. The vector store is LanceDB. Embeddings and generation both use the Gemini API.

**Frontend** — Angular 19 with standalone components. The `ChatService` reads the SSE stream and updates signals reactively. Markdown responses are rendered via a `marked` pipe.

**Observability** — every `/ask` request creates a LangFuse trace with three spans: `embed`, `retrieve`, and `generate`. Each span records latency, and the generate span includes input/output token estimates and a cost estimate. The cost estimate is made up since the gemini models are free tiers.

## Project Structure

```
├── docs/               # Markdown documentation files
├── data/               # LanceDB vector store
├── backend/
│   └── src/
│       ├── index.ts                        # Entry point
│       ├── server.ts                       # Express app
│       ├── routes/ask.routes.ts
│       ├── controllers/ask.controller.ts
│       ├── services/
│       │   ├── ask.service.ts              # RAG orchestration + session memory
│       │   ├── gemini.service.ts           # Embeddings + streaming generation
│       │   └── observability.service.ts    # LangFuse tracing
│       ├── rag/
│       │   ├── chunker.ts                  # Document chunking
│       │   ├── ingest.ts                   # Indexing pipeline
│       │   └── vectorStore.ts              # LanceDB wrapper
│       ├── models/                         # Shared interfaces
│       └── types/sse.ts                    # SSE event types
└── frontend/
    └── src/app/
        ├── app.component                   # Chat UI shell
        ├── components/message              # Message bubble component
        ├── services/chat.service.ts        # SSE stream handling + state
        └── pipes/markdown.pipe.ts          # Markdown rendering
```

## Documents

| File | Topics covered |
|---|---|
| `getting-started.md` | Account setup, CLI, first deployment, regions, free tier |
| `authentication.md` | API keys, scopes, key rotation, OAuth 2.0, workload identity |
| `api-reference.md` | REST endpoints, rate limits, pagination, error format |
| `deployment.md` | Environments, CI/CD, build process, health checks, rollbacks, scaling |
| `billing.md` | Plans, pricing, usage charges, invoices, cost alerts, cancellation |
| `observability.md` | Logs, metrics, tracing, alerting, uptime monitoring |
| `webhooks.md` | Event types, payload format, signature verification, retries |
| `teams-and-permissions.md` | Roles, invitations, SSO, audit log, organisation teams |
| `data-pipelines.md` | Pipeline DAGs, scheduling, retries, shared volumes, concurrency |
| `secrets-and-config.md` | Secrets, config vars, rotation, environment scoping |
| `troubleshooting.md` | Common errors, deployment failures, billing issues, getting help |

## Sample Questions to Test The RAG System

Here are example questions your pipeline should be able to answer from the documents above:

- "How do I rotate an API key?"
- "What happens if a deployment fails the health check three times?"
- "What are the rate limits for the free tier?"
- "How do I pass data between steps in a pipeline?"
- "Can I retrieve the value of a secret after it's been set?"
- "What is the difference between secrets and config vars?"
- "How do I add a team member and what roles are available?"
- "What is the retry behaviour for webhook deliveries?"
- "How do I set up autoscaling for my service?"
- "Why am I being charged more than my plan price?"

## Bonus Features Implemented

| Feature | Details |
|---|---|
| Source citations | Each answer includes the source `.md` files used for context |
| Streaming | Token-by-token SSE output, rendered progressively in the UI |
| Conversation memory | Per-session history passed to Gemini on every request |
| Observability | LangFuse traces with per-step latency, token counts, and cost estimates |

## What I'd Add With More Time

- **Re-ranking** — a cross-encoder pass between retrieval and generation to improve chunk precision, either gemini or another LLM.
- **MCP Integration** — exposing the /ask endpoint so that any MCP-compatible client can call it directly.
- **Automated tests** — a small Q&A set to evaluate retrieval quality on each code change
