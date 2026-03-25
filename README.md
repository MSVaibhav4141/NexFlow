# NexFlow

NexFlow is a modern, stateful workflow orchestration platform designed to bridge the gap between traditional logic-based automation and autonomous AI agents. Built with a visual drag-and-drop interface, it allows users to connect webhooks, logic branches, external APIs, and LLMs into resilient, real-time execution graphs.

<img width="1763" height="899" alt="Screenshot 2026-03-25 213042" src="https://github.com/user-attachments/assets/93c4df1f-ffd1-4bcb-8681-43dd3d910b48" />

## Overview

Unlike standard linear automation tools, NexFlow is built on a custom Depth-First Search (DFS) execution engine backed by PostgreSQL. It natively handles complex branching, infinite-loop prevention via circuit breakers, and long-running stateful executions. 

<img width="1731" height="838" alt="Screenshot 2026-03-25 213056" src="https://github.com/user-attachments/assets/5dffd1c1-853a-49c4-ae74-76c099352b5a" />

## Core Features

### Visual Orchestration & Dynamic Data Mapping
The core of NexFlow is a highly interactive canvas. Users can visually map workflows and seamlessly pass data between nodes. The platform features a dynamic variable system, allowing outputs from previous steps to be injected directly into downstream node parameters using a templated syntax.

<img width="1167" height="720" alt="Screenshot 2026-03-25 213915" src="https://github.com/user-attachments/assets/d823bdaa-4877-402d-a2bb-7c986ff93419" />
*Configuring an If/Else logic block with dynamic variables from a form submission.*

### Autonomous Multi-Agent System
NexFlow treats AI agents as first-class citizens within the workflow orchestration. 
* **Tool Calling:** Agents can be wired directly to action nodes (like Send Email). The system dynamically recognizes these connected nodes as tools, allowing the AI to call them autonomously during execution based on its system prompt.
* **Multi-Agent Communication:** Multiple agents can be chained together to handle complex reasoning tasks, delegating sub-tasks to specialized sub-agents.
* **Roadmap:** Dedicated persistent memory support for agents is currently in active development.

<img width="867" height="550" alt="Screenshot 2026-03-25 215230" src="https://github.com/user-attachments/assets/b184be1b-14c9-47d7-a8c1-64af42830a40" />
*An AI Agent autonomously initializing and calling the Send Email tool.*

### Human-in-the-Loop (HITL) Execution
Workflows do not have to execute in a single instant. NexFlow features specific "Send and Await" functionality for communication nodes like Email and Telegram. 

The execution engine can pause a workflow entirely, wait for a user to click an approval or rejection link delivered to their inbox or chat, and then synchronously resume the workflow down the appropriate logic branch based on that human input.

<img width="714" height="371" alt="Screenshot 2026-03-25 215303" src="https://github.com/user-attachments/assets/6146050a-0c02-4149-a725-7cacb5a97048" />
*The yellow pulsing glow indicates the engine has paused execution and is waiting for human approval.*

### Universal Triggers & Credentials
Workflows can be initiated in multiple ways, securely utilizing centralized credentials:
* **Webhooks:** Unique, tenant-specific URLs that ingest external GET/POST requests.
* **Form Submissions:** Automatically generated public web forms based on user-defined schemas.
* **Manual Execution:** Direct invocation from the canvas for testing and single-run tasks.
* **Secure Credentials:** LLM API keys (OpenAI, Gemini, Groq) and SMTP/Telegram tokens are managed securely and injected at runtime.

### Real-Time Execution Engine & Visual Feedback
The Python backend handles complex branching and tracks global state, broadcasting real-time execution statuses back to the frontend via WebSockets. The canvas provides immediate visual feedback during a run:
* **Blue Pulse:** Node is currently executing.
* **Fuchsia Pulse:** AI Agent is actively processing or utilizing tools.
* **Yellow Pulse:** Workflow is paused and awaiting human interaction.
* **Green Glow:** Node executed successfully.
* **Red Glow:** Node failed or crashed.

<img width="1380" height="542" alt="Screenshot 2026-03-25 215038" src="https://github.com/user-attachments/assets/815fedc2-1d93-4688-86d5-a6acf3ca89ea" />
*Live tracking of a workflow execution showing successful nodes (green) and actively running agents (blue).*

### User-Based Multi-Tenancy
NexFlow implements a scalable, user-based multi-tenant architecture. Instead of provisioning separate, resource-heavy Docker containers for every user, the platform utilizes logical database isolation. Webhook and form trigger URLs are scoped specifically to individual account names, ensuring secure, isolated data flow within a unified, high-performance infrastructure.

## Technical Stack

* **Frontend:** Next.js (App Router), React Flow, Tailwind CSS, Lucide Icons.
* **Backend:** FastAPI (Python), WebSockets for real-time state streaming.
* **Database:** PostgreSQL managed with SQLAlchemy and Alembic for schema migrations.
* **State Management:** Zustand (Frontend client state).
