# Integration Plan

## Backend
- Project folder: `backend/`
- Run command: `npm --prefix backend run dev`
- Port: `3001`
- Build command: `npm --prefix backend run build`
- Health endpoint: `/api/health`
- API routes inventory:
  - `GET /api/health`
  - `POST /api/content/generate`
  - `POST /api/code/generate`
  - `POST /api/prompts/optimize`
  - `GET /api/prompts/templates`
  - `GET /api/workflows`
  - `POST /api/workflows/execute`
  - `GET /api/history`

## Frontend
- Project folder: `frontend/`
- Build command: `npm --prefix frontend run build`
- Dev command: `npm --prefix frontend run dev -- --host 0.0.0.0 --port 5173`
- API seam to swap: `frontend/src/api/index.ts` (replace mock client with live client)
- Mock files to remove / replace:
  - `frontend/src/api/mockClient.ts`
  - `frontend/src/mocks/**`
  - `frontend/src/api/previewState.ts`
  - `frontend/src/components/MockStateSwitcher.*`
  - duplicated local-only types under `frontend/src/types/**`

## Database
- Type: none required
- Migration tool: not applicable
- Migration directory: none
- Connection env vars: none
- Note: no seed data is to be created; browser localStorage is the only persistence layer for this app

## Shared types
- Shared package/location: `frontend/src/types/` (or future shared package if added)
- Import alias: none yet; keep local typed data contracts until integration work is completed

## Services
- Essential:
  - `CreateAI` frontend web app
  - `CreateAI` backend API
- Enhancement:
  - dev preview server / local storage persistence
  - workflow and prompt templates preview data

## Verification checklist
- Smoke-test every route above with a live HTTP request
- Confirm frontend loads and renders the dashboard from real app state without mock-only imports
- Validate build and runtime output end-to-end before sign-off

## Integration results

- Database migrations: not applicable; the approved project plan specifies no database and browser localStorage as the persistence layer.
- Backend: build and test commands pass; every route above returned HTTP 200 during live smoke tests.
- Frontend: connected all listed API routes through the Vite `/api` proxy; removed hard-coded page sample data and kept saved outputs/history in localStorage as planned.
- End-to-end: dashboard loaded backend workflows and history; content generation returned live API output, workflow execution returned a successful response, and saved output appeared in Saved Content.
- Validation: `npm --prefix backend test`, `npm --prefix backend run build`, and `npm --prefix frontend run build` pass. Frontend source contains no mock/preview-state references.
