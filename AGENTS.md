# AGENTS

Directory map for AI agents and human readers working on this project. Real content lives in the files linked below — keep this file shallow.

## Overview
- `README.md` — one-paragraph project overview
- `package.json` — root scripts for frontend and backend workflows
- `phase-artifacts/docs/` — placeholder for future phase exports
- `frontend/` — standalone runnable frontend package
- `backend/` — Spring Boot REST API and local database setup
- `graphify-out/` — generated project knowledge graph snapshot; report, HTML, and JSON are tracked, while local cache/metadata is ignored

## Phase Docs
- _(none yet — final Brainstorming documents land here after all active features complete)_

## Frontend
- `frontend/` — standalone React + TypeScript frontend package
- `frontend/src/App.tsx` — generated application component root
- `frontend/src/App.css`
- `frontend/src/global.css`
- `frontend/src/main.tsx`
- `frontend/src/vite-env.d.ts`
- `frontend/src/api/` — REST client: `device.ts` (anonymous X-Device-Id), `client.ts` (fetch wrappers), `conference.ts` (typed endpoints). App loads live data from the API and falls back to bundled data if the API is unreachable.
- Dev proxy: `vite.config.ts` forwards `/api` → `http://localhost:8080`.

## Backend
- `backend/` — Java 25 + Spring Boot + PostgreSQL REST API (Gradle Kotlin DSL).
- `backend/docker-compose.yml` — Postgres 17 for local dev.
- `backend/src/main/resources/db/migration/` — Flyway: `V1` schema, `V2` seed (all conference data ported from `App.tsx`).
- `backend/src/main/java/com/jprime/companion/` — `domain/` (JPA entities), `repo/`, `service/`, `web/` (controllers + DTOs), `config/`.
- `backend/src/test/java/com/jprime/companion/` — integration tests for the REST API.
- Run the full local stack with `npm start`. It starts the compose Postgres service, waits for it to become healthy, then starts the Spring Boot API and Vite frontend. Backend-only workflows still use `npm run backend:up` then `npm run backend:run` (needs JDK 25 installed normally for the host OS). Tests (`npm run backend:test`) run against the compose Postgres.
- API: static reads (`/api/days`, `/api/sessions`, `/api/speakers`, `/api/notifications`, `/api/map-spots`, `/api/rating-criteria`, `/api/tracks`) and per-device user data (`/api/sessions/{id}/saved|note|rating`, `/api/sessions/{id}/note/attachments`, `/api/attachments/{id}`, `/api/me/saved`) keyed by the `X-Device-Id` header.

## Graphify
- `graphify-out/GRAPH_REPORT.md` — generated graph summary and suggested questions.
- `graphify-out/graph.html` — interactive graph visualization.
- `graphify-out/graph.json` — GraphRAG-ready graph export.
- `graphify-out/cache/`, `graphify-out/manifest.json`, and `graphify-out/.graphify_root` are local/generated and not tracked.
- Refresh the tracked snapshot after code changes with `graphify update .`.
