# JPrime Companion

JPrime Companion is a local conference companion app for JPrime, a Java and JVM ecosystem conference. It includes a React frontend, a Spring Boot REST API, and a PostgreSQL database seeded with conference data. The app can show sessions, speakers, notifications, maps, and per-device notes, ratings, and saved sessions.

## Requirements

- Node.js 20.19+ or 22.12+ with npm.
- Docker with Docker Compose for PostgreSQL.
- JDK 25 for the Spring Boot backend. Gradle is configured for a Homebrew JDK location; change `org.gradle.java.installations.paths` if yours lives elsewhere.

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
