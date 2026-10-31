# Shinobi Quiz Battle API

Backend API for Shinobi Quiz Battle, a tournament game for the SorSU Bulan Campus library. This repository uses Node.js 22, Express 5, PostgreSQL, Sequelize 6, and the Sequelize CLI.

Developer: Gipanao John Lawrenze Fortes (Setrofjl), BSCS 3-1 · Game concept: Group 2.

## Setup

Install Node.js 22 or newer and PostgreSQL. From the repository root:

```powershell
npm install
Copy-Item .env.example .env
```

Edit `.env` with the local PostgreSQL connection values. Do not commit `.env`.

```powershell
npm run db:create       # first setup only
npm run db:migrate
npm run db:seed
npm run db:check
npm run dev
```

The API listens at `http://localhost:3001/api/v1` by default.

> **Warning:** `npm run db:reset` and `npm run check` drop and rebuild the schema of the database configured in `.env`. Use a disposable development database or back up important data first.

## Environment

| Key | Example | Purpose |
|---|---|---|
| `NODE_ENV` | `development` | Application environment. The temporary demo-user middleware refuses to start in production. |
| `PORT` | `3001` | HTTP port |
| `DB_HOST` | `127.0.0.1` | PostgreSQL host |
| `DB_PORT` | `5433` | PostgreSQL port |
| `DB_NAME` | `shinobi_quiz_battle` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | (local password) | PostgreSQL password |
| `HUB_API_KEY` | `dev-hub-key` | Required by the Library Game Hub to read results |

## Database scripts

| Command | Purpose |
|---|---|
| `npm run db:create` | Create the configured PostgreSQL database |
| `npm run db:migrate` | Apply pending Sequelize CLI migrations |
| `npm run db:migrate:status` | Show migration status |
| `npm run db:migrate:undo` | Undo the most recent migration |
| `npm run db:seed` | Load demo accounts and the finished demo game |
| `npm run db:seed:undo` | Undo seed data |
| `npm run db:check` | Count rows in each table |
| `npm run db:reset` | **Destructive:** empty schema, migrate, and reload seed data |
| `npm run check` | **Destructive:** rebuilds the configured database and runs the Hub Contract checks |

## Authentication and permissions

Week 11 uses a temporary `X-Demo-User` header in place of real login. Use a seeded `school_id`:

| Role | Demo user |
|---|---|
| Host | `24179712` |
| Second host | `24179713` |
| Admin | `24179001` |
| Players | `24179723`, `24179795`, `24179111` |

Send `X-Demo-User: 24179712` on protected requests. Known users with the wrong role receive `403`; missing or unknown users receive `401`. This header is not authentication and is only suitable for development. Replace the middleware before production.

Hosts can manage their own question sets and sessions. Admins can manage all question sets and sessions. Any known account can join a session; reading session details and player lists is public by join code.

## API endpoints

Base URL: `http://localhost:3001/api/v1`

| Method | Path | Access | Success |
|---|---|---|---|
| GET | `/health` | Public | 200 |
| GET | `/game-info` | Public | 200 |
| GET | `/results` | `X-Hub-Key` required | 200 |
| GET | `/game-session` | Public (legacy session listing) | 200 |
| GET | `/question-sets` | Host or admin | 200 |
| POST | `/question-sets` | Host or admin | 201 |
| GET | `/question-sets/:id` | Host or admin | 200 |
| PATCH | `/question-sets/:id` | Owner or admin | 200 |
| DELETE | `/question-sets/:id` | Owner or admin | 204 |
| POST | `/sessions` | Host or admin | 201 |
| GET | `/sessions/:code` | Public | 200 |
| PATCH | `/sessions/:code` | Session host or admin | 200 |
| POST | `/sessions/:code/players` | Any known user | 201 new seat; 200 rejoin |
| GET | `/sessions/:code/players` | Public | 200 |

### Question sets

```http
POST /api/v1/question-sets
X-Demo-User: 24179712
Content-Type: application/json
```

```json
{
  "title": "Shinobi Basics",
  "subject": "General Knowledge",
  "hostId": 999
}
```

`hostId` is ignored; the server always assigns the authenticated user's ID. Titles are 3–100 characters. `subject` is required on creation by the existing database schema and is limited to 60 characters by the API. PATCH accepts either field.
Deleting a question set that is referenced by any session returns `409 QUESTION_SET_IN_USE`.

The existing `QuestionSet` migration has a required subject column, a 100-character title column, and no `is_public` or creation-timestamp column. The API therefore does not accept or return `is_public` or `created_at`; the migration was preserved rather than silently changing the existing data model.

Example success response:

```json
{
  "id": 2,
  "title": "Shinobi Basics",
  "subject": "General Knowledge",
  "host_id": 1
}
```

### Sessions and players

Create a session with an existing question set:

```http
POST /api/v1/sessions
X-Demo-User: 24179712
Content-Type: application/json
```

```json
{
  "questionSetId": 1,
  "timeLimit": 600
}
```

The server creates a six-digit join code and starts the session in `WAITING`. To start or close it, send `{"status":"RUNNING"}` or `{"status":"CLOSED"}` to `PATCH /sessions/:code`. Closing records `endTime`, which makes the game available from `/results`.

Join or rejoin:

```http
POST /api/v1/sessions/123456/players
X-Demo-User: 24179723
Content-Type: application/json
```

```json
{ "nickname": "Kushina" }
```

New seats start with score 0 and the schema-required avatar value `default`. A returning account gets its original seat and score. New seats are accepted only in `WAITING` sessions, subject to the 30-player game limit and the one-running-game rule.

### Hub Contract results

```http
GET /api/v1/results
X-Hub-Key: <the configured HUB_API_KEY>
```

Only closed sessions with an end time appear in results. Missing or incorrect Hub keys receive 401.

### Errors

Errors use one response shape:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "nickname must be 2 to 24 characters long",
    "details": [
      { "field": "nickname", "message": "nickname must be 2 to 24 characters long" }
    ]
  }
}
```

Validation errors and malformed JSON return 400; missing identity returns 401; role or ownership violations return 403; missing resources return 404; database constraints and game-state conflicts return 409; unexpected failures return a generic 500 response.

## Postman

Import [`postman/CS313 Week 11.postman_collection.json`](./postman/CS313%20Week%2011.postman_collection.json) into Postman. Set `baseUrl` if needed. The collection covers CRUD, authentication/ownership, invalid JSON, joining/rejoining, status transitions, capacity conflict, duplicate nickname mapping, and results.

The capacity-full request is a manual-precondition case: populate its session with 30 distinct accounts before enabling it. For a fresh demo database, duplicate nickname is exercised with two different seeded players.

## Existing game rules and tables

A player completes a game after answering every question in its question set, whether answers are correct or incorrect. Final score is the player's Chakra total.

Database tables are defined by the Sequelize CLI migrations: `users`, `QuestionSet`, `GameSession`, `Player`, `Question`, `Answer`, `RewardRound`, and `RewardObject`. Sessions and players use the existing camel-case column names; the API maps those names into client-facing JSON.
