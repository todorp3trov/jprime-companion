# JPrime Companion

JPrime Companion is a local conference companion app for JPrime, a Java and JVM ecosystem conference. It includes a React frontend, a Spring Boot REST API, and a PostgreSQL database seeded with conference data. The app can show sessions, speakers, notifications, maps, and per-device notes, ratings, and saved sessions.

## Requirements

- Node.js 20.19+ or 22.12+ with npm.
- Docker with Docker Compose for PostgreSQL.
- JDK 25 for the Spring Boot backend. Install it normally for your OS; Gradle uses its Java toolchain support to find it from `JAVA_HOME` or standard local installations.
- Optional: [Graphify CLI](https://github.com/safishamsi/graphify), only if you want to refresh or query the project knowledge graph locally.

## Start

Install the frontend dependencies once:

```sh
npm install --prefix frontend
```

Then start the full local stack:

```sh
npm start
```

This starts PostgreSQL, waits for it to become healthy, then starts the API on `http://localhost:8080` and the Vite app on `http://127.0.0.1:5173`. Stop everything with `Ctrl+C`.

## Project Graph

The repo includes a generated Graphify knowledge graph snapshot in `graphify-out/`. It is there to help contributors and AI agents understand how the frontend, backend, data model, and tests connect without having to rediscover the whole codebase from scratch.

You do not need Graphify to run the app. Install it only when you want to refresh the tracked snapshot after code changes or explore the graph locally:

```sh
graphify update .
```
