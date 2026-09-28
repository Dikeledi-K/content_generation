# CreateAI

CreateAI is a local content and code generation workspace. It combines a React single-page application with an Express API, supports OpenRouter or OpenAI for generation, and stores saved outputs and browser history in localStorage.

## Contents

- [Project overview](#project-overview)
- [Features](#features)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Run locally](#run-locally)
- [Configure AI generation](#configure-ai-generation)
- [Generator attachments](#generator-attachments)
- [Pages](#pages)
- [API reference](#api-reference)
- [Data and persistence](#data-and-persistence)
- [Testing and builds](#testing-and-builds)
- [Troubleshooting](#troubleshooting)
- [Project structure](#project-structure)

## Project overview

CreateAI helps an individual or team draft marketing content, generate code, refine prompts, run example workflows, and review generated results. The application is designed for local development and does not require a database. An AI provider key is optional for starting the app, but required for prompt-specific content and code generation.

| Area | Implementation |
|---|---|
| Frontend | React 18, React Router 6, Fluent UI, Vite |
| Backend | Node.js, Express |
| AI providers | OpenRouter or OpenAI Chat Completions-compatible APIs |
| Document parsing | `officeparser` for PDF and supported office and document formats |
| Browser persistence | localStorage for generated history and saved outputs |
| API history | In-memory for the lifetime of the backend process |

## Features

- Generate content such as landing pages, blog posts, emails, social posts, and X posts.
- Generate code in JavaScript, Python, Java, or SQL.
- Attach documents and images to content or code generation.
- Search the built-in prompt template library.
- Optimize a prompt for a specified goal, audience, and tone.
- Browse sample workflows and run their demo execution endpoint.
- Review generation history, view saved outputs, delete one history item, or clear all history.
- Save generated outputs separately from history.

## Architecture

The Vite development server runs on port `5173`. It proxies `/api` requests to the Express API on port `3001`. The frontend is a single-page application and uses browser localStorage for user-generated history and saved output. The backend contains generation, prompt, workflow, and history endpoints.

```text
Browser
  | http://localhost:5173
  v
React + Vite frontend -- /api proxy --> Express API :3001
                                             |
                                             +--> OpenRouter (if configured)
                                             +--> OpenAI (if configured)
```

There is no database service or database migration step.

## Requirements

- Node.js `22.13` or later. `officeparser` 8 requires Node.js `22.13+`.
- npm.
- An OpenRouter or OpenAI API key for real AI generation.
- Docker Desktop only if using the optional Compose setup.

## Run locally

Install dependencies from the repository root:

```powershell
npm install
```

Start the API in one terminal:

```powershell
npm --prefix backend run dev
```

Start the frontend in another terminal:

```powershell
npm --prefix frontend run dev
```

Open [http://localhost:5173](http://localhost:5173). The API health endpoint is [http://localhost:3001/api/health](http://localhost:3001/api/health).

The frontend Vite proxy expects the API at `http://localhost:3001`. Set `PORT=3001` in `backend/.env` if needed. Keep both development terminals open while using the app; use `Ctrl+C` in each terminal to stop its server.

### Run with Docker Compose

With Docker Desktop running, start the frontend and API from the repository root:

```powershell
docker compose up
```

Open [http://localhost:5173](http://localhost:5173). Stop the Compose services with `Ctrl+C`, or run `docker compose down` from another terminal.

## Configure AI generation

The backend loads environment variables from `backend/.env`. A placeholder template is provided at `backend/.env.example`.

1. Create the local environment file:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   ```

2. Add either OpenRouter settings:

   ```dotenv
   OPENROUTER_API_KEY=your-openrouter-api-key
   OPENROUTER_MODEL=provider/model-id
   PORT=3001
   ```

   Or configure OpenAI directly:

   ```dotenv
   OPENAI_API_KEY=your-openai-api-key
   OPENAI_MODEL=gpt-4o-mini
   PORT=3001
   ```

3. Restart the backend after changing `.env`.

If both provider keys are present, OpenRouter is selected. The API key stays on the backend and is never sent to the browser. `.env` files are ignored by Git; do not commit real credentials.

When no provider key is configured, text-only requests return an explicitly marked demo response. Attachments require a configured provider. Provider errors are returned to the Generator as API errors rather than replaced with demo output.

## Generator attachments

Attachments can be used for content or code generation. The UI accepts up to five files, with a 10 MB per-file limit and 20 MB total.

| Attachment | Handling |
|---|---|
| JPEG, PNG, WEBP, GIF | Sent to the model as image inputs; the selected model must support image input |
| PDF | Text is extracted with `officeparser` |
| DOCX, PPTX, XLSX, ODT, ODP, ODS, ODG | Text is extracted with `officeparser` |
| RTF, EPUB, CSV, Markdown, HTML | Parsed as document text |
| TXT, JSON, XML, common source files | Decoded as UTF-8 text |

Supported source extensions include JS/JSX, TS/TSX, Python, Java, CSS, SQL, YAML, and log files. The backend limits extracted document context to 40,000 characters before sending it to the model. Unsupported, unreadable, invalid, or oversized files return an error. Image understanding depends on the configured model; a text-only model can process document text but cannot interpret image contents.

An attachment does not have to be accompanied by a prompt, but adding a clear instruction (for example, “Summarize this brief” or “Write a caption for this image”) usually produces more useful output.

## Pages

| Route | Page | Purpose |
|---|---|---|
| `/dashboard` | Dashboard | Generation counts, recent generation records, and available workflows |
| `/generator` | Generator | Generate content or code, attach supporting media, preview and save output |
| `/prompts` | Prompt Library | Search built-in prompt templates |
| `/optimizer` | Prompt Optimizer | Rewrite a draft prompt using goal, audience, and tone fields |
| `/workflows` | Workflow Builder | Browse example workflows and run the demo execution endpoint |
| `/history` | History | View available outputs, delete an entry, or clear history |
| `/saved` | Saved Content | Review outputs explicitly saved from the Generator |
| `/about` | About | Product and responsible-use information |

The root route `/` redirects to `/dashboard`.

## API reference

All endpoints are served from the backend origin `http://localhost:3001`; the frontend calls them through the `/api` Vite proxy.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | API health status |
| `POST` | `/api/content/generate` | Generate content |
| `POST` | `/api/code/generate` | Generate code |
| `POST` | `/api/prompts/optimize` | Optimize a prompt (currently deterministic demo behavior) |
| `GET` | `/api/prompts/templates` | List built-in prompt templates |
| `GET` | `/api/workflows` | List built-in example workflows |
| `POST` | `/api/workflows/execute` | Run the workflow demo endpoint |
| `GET` | `/api/history` | List history held by the current backend process |
| `DELETE` | `/api/history/:id` | Delete one server-side history item |
| `DELETE` | `/api/history` | Clear server-side history |

### Content generation

`POST /api/content/generate`

```json
{
  "prompt": "Write an upbeat launch email for a new running shoe",
  "tone": "Upbeat",
  "format": "Email",
  "attachments": []
}
```

`prompt` may be empty when at least one attachment is supplied. `tone` and `format` are optional. Attachment objects contain `name`, `type`, and base64-encoded `data`.

### Code generation

`POST /api/code/generate`

```json
{
  "prompt": "Write a function that validates an email address",
  "language": "JavaScript",
  "attachments": []
}
```

### Prompt optimization

`POST /api/prompts/optimize`

```json
{
  "prompt": "Write a product announcement",
  "goal": "Drive trial sign-ups",
  "audience": "Small business owners",
  "tone": "Clear and confident"
}
```

### Workflow execution

`POST /api/workflows/execute`

```json
{
  "workflowId": "content-pipeline",
  "inputs": {}
}
```

The prompt optimizer and workflow endpoints currently return deterministic scaffold/demo responses; they do not call the configured AI provider.

## Data and persistence

- Generator history and saved outputs are stored in browser localStorage under `createai.history` and `createai.saved`.
- The History page merges browser-local entries with entries returned by the API, matching duplicate IDs.
- The API history array is in memory only. It is lost whenever the backend process restarts; it is not a durable server-side archive.
- Older server history records created before output storage was added may have no `content` field. Their generated output cannot be displayed if it was not saved in browser localStorage.
- Clearing history removes local browser history and asks the API to clear its in-memory entries. Saved outputs are separate and are not deleted by Clear history.

## Testing and builds

Run backend tests:

```powershell
npm --prefix backend test
```

Build the frontend:

```powershell
npm --prefix frontend run build
```

Run the repository-level build and test scripts:

```powershell
npm test
npm run build
```

The backend suite uses Vitest and Supertest. AI provider requests are mocked in tests; tests do not need a paid API key. The frontend build uses Vite.


## Troubleshooting

| Symptom | Check |
|---|---|
| Frontend cannot reach the API | Confirm the backend is listening on port `3001`; check `GET http://localhost:3001/api/health` |
| API does not start on port `3001` | Check for another process already using the port and set `PORT=3001` in `backend/.env` |
| Output says `Demo output only` | Configure `OPENROUTER_API_KEY` or `OPENAI_API_KEY`, then restart the backend |
| Image attachment is rejected or misunderstood | Use a model that accepts image inputs; the current model may be text-only |
| Document attachment is unreadable | Check the file type, file size, and whether it is password-protected or scanned without selectable text |
| History is empty after an API restart | API history is in-memory; browser-local history persists only in the same browser origin/profile |
| Compose cannot start | Start Docker Desktop before running `docker compose up` |

## Project structure

```text
.
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── src/server.js
│   └── tests/api.test.js
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       ├── components/AppShell.jsx
│       ├── routes/
│       ├── storage.js
│       └── styles/global.css
├── .azure/
├── docker-compose.yml
├── package.json
└── package-lock.json
```