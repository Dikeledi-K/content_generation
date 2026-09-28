# Project Plan

**Status**: Integrated
**Created**: 2026-09-28
**Mode**: NEW

---

## 1. Project Overview

**Goal**: Create an AI-assisted content and code generation workspace called CreateAI that helps users generate content, optimize prompts, assemble workflows, review generation history, and produce code snippets across multiple languages. The project is designed so that every module is independently testable.

**App Type**: SPA + API

**API Login**: No

**Mode**: NEW

**Deployment Plan**: No deployment plan found

---

## 2. Backend — Azure Functions

| Component | Technology |
|-----------|-----------|
| **Language** | JavaScript |
| **Runtime** | Node |
| **Package Manager** | npm |
| **Test Runner** | vitest |
| **Mocking Library** | vi.mock |
| **Test Command** | npm test |
| **Orchestration** | docker-compose |

> **Language vs Runtime**: `Language` is the source language the user picked in this service's `language` question. `Runtime` is the execution runtime — default `Node` for TypeScript/JavaScript, `CPython` for Python, `.NET` for C#. Only deviate from the default (e.g. `Bun`, `Deno`, `PyPy`) when the user explicitly asks. **Package Manager and Test Runner are language-dependent** — match them to this service's Language (e.g. C# → `dotnet (NuGet)` + `xUnit`/`NUnit`/`MSTest`). The `Orchestration` row is recorded for the scaffold step but hidden in the plan UI — always keep it set to `docker-compose`.

---

## 3. Frontend — Web App

| Component | Technology |
|-----------|-----------|
| **Language** | JavaScript |
| **Framework** | React + Vite |
| **Package Manager** | npm |
| **Test Runner** | vitest |
| **Mocking Library** | vi.mock |
| **Test Command** | npm test |

---

## 4. Services Required

| Azure Service | Role in App | Environment Variable | Default Value (Local) | Classification |
|---------------|------------|---------------------|----------------------|----------------|
| None required | Browser localStorage stores saved prompts, generated content, and app preferences; no managed Azure datastore is required | N/A | N/A | Optional |

---

## 5. Prerequisites

Identify the required tools, then inventory them by following [prerequisites.md](../shared-references/prerequisites.md). Always produce **both** groups — `### Run` and `### Debug` — as two sub-tables under this section. The plan webview shows the Run group always and the Debug group only when the user turns on the Autopilot toggle, so do not omit either group yourself.

### Run

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Node.js | * | ✅ | v22.19.0 |
| npm | * | ✅ | 10.9.3 |
| Docker | backend, frontend | ✅ | 29.2.1 |
| Docker Compose | backend, frontend | ✅ | v5.0.2 |

### Debug

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Chrome | frontend | ✅ | detected on system path |
| Docker | backend, frontend | ✅ | 29.2.1 |
| Docker Compose | backend, frontend | ✅ | v5.0.2 |

> The project uses a browser-based frontend and local container orchestration for development. The app itself has no Azure Functions or Azure-hosted datastore dependency, so no Azure-specific runtime tools or VS Code Azure extension rows are required in this plan.

---

## 6. Design System & UI

**Component Library**: Fluent UI v9
**Style Direction**: Modern, data-dense dashboard with dark charcoal surfaces, warm gold accents, subtle elevation, and highly scannable cards for prompts, generated content, workflows, and history.
**Typography**: Segoe UI Variable

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#D4AF37` | Brand color for primary actions, nav highlights, and selected controls in the CreateAI dashboard |
| `accent`  | `#F5B700` | Secondary accent for callouts, status chips, badges, and emphasis states |
| `surface` | `#111827` | Dark app background and panel surfaces for the main workspace |
| `text`    | `#F8FAFC` | Primary body text for dashboards, forms, and generated output |
| `muted`   | `#94A3B8` | Secondary labels, metadata, timestamps, and helper text |
| `border`  | `#334155` | Dividers, input outlines, card edges, and table separators |

### Pages

| Page | Route | Purpose | Layout |
|------|-------|---------|--------|
| Dashboard | `/dashboard` | Overview of recent generation, saved content, and workflow activity | `header + nav + grid + card-list` |
| Generator | `/generator` | Create content or code from prompts and templates | `header + form + split(content|meta)` |
| Prompt Library | `/prompts` | Browse built-in and custom prompt templates | `header + list + card-list` |
| Prompt Optimizer | `/optimizer` | Improve a draft prompt for tone, clarity, and output quality | `header + form + split(content|suggestions)` |
| Workflow Builder | `/workflows` | Configure multi-step content generation chains | `header + form + list + action-bar` |
| History | `/history` | Review generation records and compare outputs | `header + table + actions` |
| Saved Content | `/saved` | Keep frequently used prompt sets and generated results | `header + card-list + actions` |
| About | `/about` | Explain responsible AI usage and platform capabilities | `header + hero + text + list` |

### Sample Content

```
Dashboard — recent generation:
| Title | Type | Model | Status |
| SEO landing page draft | Content | GPT-4o mini | Completed |
| Python ETL helper | Code | GPT-4o | Completed |
| Product launch email | Content | GPT-4o mini | In Review |
| SQL summary report | Code | GPT-4o | Draft |

Generator — prompt: "Create a landing page for a fintech app" · tone: "Confident and conversion-focused" · language: "JavaScript"
Prompt Library — template: "Blog post outline" · category: "Marketing" · usage: "Popular"
Workflow Builder — workflow: "Content pipeline" · steps: 3 · status: "Ready"
```

---

## 7. Project Structure

```
content_generation/
├── README.md
├── .azure/
│   ├── requirements.json
│   ├── project-plan.md
│   └── .preview-temp/
│       ├── manifest.json
│       └── theme.css
├── .github/
│   └── agents/
│       ├── azure-project-plan/
│       └── shared-references/
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── routes/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Generator.jsx
│   │   │   ├── Prompts.jsx
│   │   │   ├── Optimizer.jsx
│   │   │   ├── Workflows.jsx
│   │   │   ├── History.jsx
│   │   │   ├── Saved.jsx
│   │   │   └── About.jsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── data/
│   │   └── styles/
│   └── public/
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── .gitignore
│   ├── src/
│   │   ├── server.js
│   │   ├── app.js
│   │   ├── routes/
│   │   │   ├── content.js
│   │   │   ├── prompts.js
│   │   │   ├── workflows.js
│   │   │   └── health.js
│   │   ├── services/
│   │   │   ├── openai.js
│   │   │   ├── promptOptimizer.js
│   │   │   └── workflowEngine.js
│   │   └── utils/
│   │       ├── validation.js
│   │       └── mockResponses.js
│   └── tests/
│       ├── content.test.js
│       ├── prompts.test.js
│       └── workflows.test.js
├── docker-compose.yml
├── package.json
└── README.md
```

---

## 8. Route Definitions

| # | Method | Path | Description | Request Body | Response Body | Status Codes |
|---|--------|------|-------------|-------------|--------------|-------------|
| 1 | GET | `/api/health` | Health check for backend service status | — | `{ status, services }` | 200, 503 |
| 2 | POST | `/api/content/generate` | Generate content for blog, email, landing page, or social copy | `{ prompt, tone, format, language, context }` | `{ id, content, explanation, suggestions, warnings }` | 200, 400, 500 |
| 3 | POST | `/api/code/generate` | Generate code examples for Python, Java, JavaScript, HTML/CSS, or SQL | `{ prompt, language, framework, constraints }` | `{ id, code, explanation, usage, improvements }` | 200, 400, 500 |
| 4 | POST | `/api/prompts/optimize` | Refine a user prompt for stronger output quality | `{ prompt, goal, audience, tone }` | `{ optimizedPrompt, rationale, alternateVariants }` | 200, 400, 500 |
| 5 | GET | `/api/prompts/templates` | Return built-in and user-defined templates | — | `{ templates: [...] }` | 200, 500 |
| 6 | GET | `/api/workflows` | Retrieve workflow definitions and execution statuses | — | `{ workflows: [...] }` | 200, 500 |
| 7 | POST | `/api/workflows/execute` | Run a workflow with chained generation steps | `{ workflowId, inputs }` | `{ workflowId, status, outputs }` | 200, 400, 500 |
| 8 | GET | `/api/history` | Retrieve recent generations and saved runs | — | `{ history: [...] }` | 200, 500 |

---

## 9. Next Steps

1. Run **azure-project-scaffold** to execute this plan
2. Run **azure-project-integrate** to wire the frontend to live data, smoke-test the backend, and create the migrations
3. Run **azure-debug-plan** → **azure-debug-generate** for Docker emulators and VS Code debugging
4. Run the **azure-deploy** agent when ready; it uses **azure-app-onboard** for architecture, cost estimation, IaC generation, provisioning, and health verification
