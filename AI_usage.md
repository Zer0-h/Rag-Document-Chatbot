# AI Usage

## Tools Used

- **Claude** — primary tool throughout, used for architecture decisions, debugging, and code generation
- **GitHub Copilot** — autocomplete for boilerplate coding

---

## What I Used Claude For

**Project structure** — asked Claude to help design the folder structure before
writing any code, since I was not familiar with this stack. The `routes → controllers → services → rag` separation came from that conversation.

**LanceDB schema errors** — hit two blockers here. First, `createEmptyTable`
expected an Apache Arrow `Schema` object, not a plain JS object. Second, a
dimension mismatch at query time (768 vs 3072) because I had switched embedding
models without deleting the existing table. Claude diagnosed both.

**SSE streaming** — had not implemented Server-Sent Events before. Claude
explained the response headers, the `data: ...\n\n` wire format, and the
`res.flushHeaders()` call that prevents Express from buffering the response.

**Conversation memory + observability with streaming** — both required closing
a resource (history, LangFuse span) only after the stream ends. Claude suggested
the async generator wrapper pattern that accumulates the full answer
transparently and finalises both on stream completion.

**Angular frontend** — asked Claude to implement the chat UI, given a thoughtful
prompt explaining the two main components and how they should look.

**Markdown files** - asked Claude to review and clarify my points in the markdown
files for both README.md and AI_usage.md to make them clearer.

---

## Example Prompts

**Debugging LanceDB:**
> *"I'm getting this error when starting the backend: `Error: The schema passed
> in does not appear to be a schema (no 'fields' property)`. This happens in
> `createEmptyTable`. Here is my vectorStore.ts: [code]. What am I doing wrong?"*

**Angular components:**
> *"I have these two Angular 19 components that work but look unfinished:
> [app.component.ts/html/scss] [message.component.ts/html/scss]. And this is
> the finished ChatService they consume: [chat.service.ts]. Keep the existing
> structure and logic, but make the UI polished. Use `@if`/`@for` control flow,
> separate html/scss/ts files, and signals for state."*

---

## What Claude Got Wrong

- While debugging LanceDB schema issues, Claude suggested deprecated methods
  that made things worse before they got better. Had to go directly to the
  LangFuse and LanceDB documentation to find the correct APIs.
