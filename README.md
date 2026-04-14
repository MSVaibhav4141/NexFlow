# NexFlow

NexFlow is a stateful workflow orchestration platform that bridges logic-based automation with autonomous AI agents. Built on a custom graph execution engine, it lets users compose webhooks, conditional branches, external APIs, human approvals, and LLMs into resilient real-time execution pipelines — all through a visual drag-and-drop canvas.

<img width="1763" height="899" alt="Screenshot 2026-03-25 213042" src="https://github.com/user-attachments/assets/93c4df1f-ffd1-4bcb-8681-43dd3d910b48" />

---

## The Problem It Solves

Most automation tools are either too rigid (linear pipelines that break on branching logic) or too opaque (black-box AI that can't be audited or paused). NexFlow sits in between — giving you full visual control over complex multi-step flows while natively supporting AI agents, human checkpoints, and real-time state streaming.

## Core Features

### Visual Orchestration & Dynamic Data Mapping

The canvas is built on React Flow with fully custom node types. Each node exposes typed handles — source, target, and named sub-handles for tool, memory, and chatModel slots on AI Agent nodes. Users map data between nodes using a drag-and-drop variable system: outputs from upstream nodes are inspectable in a side panel and can be dropped directly into any downstream input field as `{{nodeId.fieldName}}` template tokens.

<img width="1167" height="720" alt="Screenshot 2026-03-25 213915" src="https://github.com/user-attachments/assets/d823bdaa-4877-402d-a2bb-7c986ff93419" />

Template tokens are resolved at runtime by the execution engine using a recursive parser that walks the global state map, supports dot-notation paths, and handles nested objects and arrays.

---

### Custom DFS Execution Engine

The backend execution engine is not a job queue or a third-party orchestrator — it is a custom depth-first traversal written from scratch.

**How it works:**

1. On trigger, the engine builds an adjacency list from the workflow's edge definitions
2. A stack-based DFS loop pops node IDs, resolves the corresponding task function from a registry, and executes it
3. Each node writes its output into a `global_state` dict keyed by node ID
4. Conditional nodes (`ifElse`) return a `branch` field that the engine uses to select which outgoing edge to follow
5. A `visited_nodes` set pre-seeded with all trigger node IDs prevents cycles and cross-trigger contamination
6. The entire state is persisted to PostgreSQL after every node so executions can be resumed from any point

**Execution statuses broadcast over WebSocket in real time:**

| Status | Meaning |
|--------|---------|
| `NODE_STARTED` | Node began executing |
| `NODE_COMPLETED` | Node finished with output |
| `NODE_LOG` | Streaming log line from AI agent |
| `AI_TOOL_START` | Agent is calling a connected tool |
| `AI_TOOL_END` | Tool call completed |

---

### Human-in-the-Loop (HITL) Execution

Workflows can pause mid-run and wait for a human decision. The `sendEmail` and `sendTelegram` nodes both support a "Send and Wait" mode.

When a node enters this mode:
1. The engine sets execution status to `paused` and persists the full `global_state` to PostgreSQL
2. The background task exits completely — no thread or coroutine is held open
3. The email or Telegram message delivers approve/reject links or buttons to the recipient
4. When the recipient clicks, a `GET /execution/resume` endpoint updates the state with their action and re-launches the engine from the paused node
5. The engine reads the user's action, maps it to a branch handler (`true`/`false`), and continues down the correct path

<img width="714" height="371" alt="Screenshot 2026-03-25 215303" src="https://github.com/user-attachments/assets/6146050a-0c02-4149-a725-7cacb5a97048" />

This is fully stateless between pause and resume — the process can restart, the pod can be replaced, and the workflow will still resume correctly because all state lives in the database.

---

### Autonomous Multi-Agent System

AI agents are first-class nodes. An `agentAi` node accepts three named input handles: `chatModel` (required), `memory` (optional), and `tool` (optional, multi-connection).

**Tool Calling:** Any action node wired into the `tool` handle is dynamically converted into a callable tool at runtime. The agent receives a tool schema built from the connected node's configuration and can invoke it mid-reasoning. The execution engine intercepts these calls, runs the action node through the same task registry, and returns the result back to the agent's context window.

**Multi-Agent Delegation:** An `agentAi` node can itself be wired as a tool into another `agentAi` node. The parent agent calls the sub-agent as a tool, passing context and receiving structured output. Sub-agents expose a `tool_spec` field that lets users explicitly describe when the supervisor should delegate to them.

<img width="867" height="550" alt="Screenshot 2026-03-25 215230" src="https://github.com/user-attachments/assets/b184be1b-14c9-47d7-a8c1-64af42830a40" />

---

### Universal Triggers

| Trigger | How It Works |
|---------|-------------|
| **Manual** | Button in the canvas calls `/execution/start`, execution ID returned immediately, WebSocket connects synchronously before the first event fires (no re-render delay) |
| **Webhook** | Unique per-tenant URL scoped to `accountName.nexflow.vaibhavr.xyz`. Accepts GET or POST. On hit, creates an execution and broadcasts `EXECUTION_STARTED` on the workflow-level WebSocket channel so any open canvas tabs update automatically |
| **Form** | Users define a form schema in the node modal. Clicking "Make Live" saves the schema and generates a public URL. Submissions POST to the backend, sanitize field keys, and trigger the workflow — same real-time feedback as webhooks |

<img width="1731" height="838" alt="Screenshot 2026-03-25 213056" src="https://github.com/user-attachments/assets/5dffd1c1-853a-49c4-ae74-76c099352b5a" />

---

### Real-Time Visual Feedback

The canvas reflects execution state in real time via WebSocket without any polling. Each node reads its status from Zustand and applies CSS classes accordingly:

| Visual | Meaning |
|--------|---------|
| 🔵 Blue pulse + spinning icon | Node is executing |
| 🟣 Fuchsia glow | AI Agent is actively processing or calling a tool |
| 🟡 Yellow pulse (animated) | Workflow paused, awaiting human input |
| 🟢 Green glow + check icon | Node completed successfully |
| 🔴 Red glow + X icon | Node failed |

The AI Agent node also renders a live status ticker inside the node card itself, streaming the agent's current action (e.g. "Calling Send Email tool...") directly from `NODE_LOG` events.

<img width="1380" height="542" alt="Screenshot 2026-03-25 215038" src="https://github.com/user-attachments/assets/815fedc2-1d93-4688-86d5-a6acf3ca89ea" />

---

### Secure Credential Management

Credentials are stored in a dedicated `credentials` table, associated to a user, never exposed after creation. The list endpoint returns only `id`, `name`, and `service` — the secret `data` field is only read server-side at task execution time.

Supported credential types:

| Service | Fields Stored |
|---------|--------------|
| Telegram | `bot_token` |
| Groq | `api_key` |
| Gemini | `api_key` |
| Gmail (SMTP) | `smtp_email`, `smtp_password` |

In the node modal, a `CredentialSelector` component fetches available credentials by service type, lets the user pick one, and writes only the `credentialId` into the node config. The raw secret never touches the frontend after save.

---

### Multi-Tenancy

NexFlow uses logical multi-tenancy rather than container-per-user isolation. Each user registers with a unique `accountName`. Webhook and form URLs are scoped to that account name via subdomain (`{accountName}.nexflow.vaibhavr.xyz`), and all credential, webhook, and form records are filtered by `user_id` or `accountName` at the query level.

---

## Technical Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React Flow, Tailwind CSS, Zustand |
| Backend | FastAPI, Python asyncio, WebSockets |
| Database | PostgreSQL, SQLAlchemy (async-compatible), Alembic |
| Auth | NextAuth.js, JWT, server-side session middleware |
| HTTP Client | openapi-fetch (typed against generated OpenAPI schema) |
| AI | Groq / Gemini via LangChain tool-calling abstractions |
| Messaging | Telegram Bot API, SMTP via Python `smtplib` |
| ID Generation | CUID2 (collision-resistant, URL-safe) |


## Key Engineering Decisions

**Why a custom DFS engine instead of Celery/Temporal?**
Celery requires a broker, Temporal requires a separate cluster. The custom engine runs inside the FastAPI process as a background task, uses PostgreSQL as the only dependency for state, and can pause/resume across process restarts. For this scale of complexity it is the right tradeoff.

**Why WebSocket rooms at two levels (workflow + execution)?**
A single execution-level room would miss events if the WebSocket connects after the execution starts — which happens on external triggers (webhook, form) where the frontend has no advance notice. The workflow-level room acts as a notification channel: it receives `EXECUTION_STARTED` with the execution ID, at which point the client connects to the execution room and starts receiving node events with zero race condition.

**Why `visited_nodes` pre-seeded with all trigger nodes?**
The canvas allows free-form wiring — there is no enforcement preventing a user from connecting an action node back to a trigger. Pre-seeding all trigger types means the engine is safe regardless of how the graph is drawn, without needing a separate validation pass.
