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
| `NODE_ENV` | `development` | Application environment. |
| `PORT` | `3001` | HTTP port |
| `DB_HOST` | `127.0.0.1` | PostgreSQL host |
| `DB_PORT` | `5433` | PostgreSQL port |
| `DB_NAME` | `shinobi_quiz_battle` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | (local password) | PostgreSQL password |
| `HUB_API_KEY` | `dev-hub-key` | Required by the Library Game Hub to read results |
| `JWT_SECRET` | (64 random characters) | Secret used to sign login tokens |
| `JWT_EXPIRES_IN` | `1h` | Login token lifetime |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed browser origins |

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

### Demo accounts

The seeded accounts all use the demo password `Aklat-Demo-2026`.

| Role | Demo user |
|---|---|
| Host | `24179712` |
| Second host | `24179713` |
| Admin | `24179001` |
| Players | `24179723`, `24179795`, `24179111` |

Log in with `POST /api/v1/auth/login` using a `school_id` and password. Send the returned token on protected requests as `Authorization: Bearer <token>`. Missing or invalid credentials receive `401`; an authenticated account without the required role receives `403`.

Hosts can manage their own question sets and sessions. Admins can manage all question sets and sessions. Any known account can join a session; reading session details and player lists is public by join code.

## API endpoints

Base URL: `http://localhost:3001/api/v1`

| Method | Path | Access | Success |
|---|---|---|---|
| GET | `/health` | Public | 200 |
| GET | `/game-info` | Public | 200 |
| GET | `/results` | `X-Hub-Key` required | 200 |
| POST | `/auth/register` | Public | 201 |
| POST | `/auth/login` | Public | 200 |
| GET | `/auth/me` | Any authenticated user | 200 |
| GET | `/users` | Admin | 200 |
| PATCH | `/users/:id/role` | Admin | 200 |
| GET | `/game-session` | Public (legacy session listing) | 200 |
| GET | `/question-sets` | Host or admin | 200 |
| POST | `/question-sets` | Host or admin | 201 |
| GET | `/question-sets/:id` | Host or admin | 200 |
| PATCH | `/question-sets/:id` | Owner or admin | 200 |
| DELETE | `/question-sets/:id` | Owner or admin | 204 |
| GET | `/question-sets/:id/questions` | Question-set owner | 200 |
| POST | `/question-sets/:id/questions` | Question-set owner | 201 |
| PATCH | `/question-sets/:id/questions/:questionId` | Question-set owner | 200 |
| DELETE | `/question-sets/:id/questions/:questionId` | Question-set owner | 204 |
| PUT | `/question-sets/:id/cover` | Question-set owner or admin | 200 |
| POST | `/sessions` | Host or admin | 201 |
| GET | `/sessions/:code` | Public | 200 |
| PATCH | `/sessions/:code` | Session host or admin | 200 |
| POST | `/sessions/:code/players` | Any known user | 201 new seat; 200 rejoin |
| GET | `/sessions/:code/players` | Public | 200 |
| GET | `/sessions/:code/question` | Seated player | 200 |
| POST | `/sessions/:code/answers` | Seated player | 200 |
| POST | `/sessions/:code/rewards` | Reward owner | 200 |
| GET | `/sessions/:code/leaderboard?limit=10` | Public | 200 |

### Question sets

```http
POST /api/v1/question-sets
Authorization: Bearer <hostToken>
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
The list accepts `page`, `limit`, `sort`, `order`, and `q`; it responds with `{ "data": [], "meta": { "page": 1, "limit": 10, "total": 0, "pages": 0 } }`. `sort` is restricted to `questionSetId`, `title`, or `subject`. A set used by a game cannot be changed or deleted and returns `409 QUESTION_SET_IN_USE`.

Read a set and its nested questions and choices with `GET /question-sets/:id?include=questions`. Add a question with a `choices` array; exactly one item must have `"isCorrect": true`. The server assigns question and choice positions and ignores client-supplied positions. Question writes and choice writes share one database transaction.

Upload one PNG or JPEG as form-data field `cover` to `/question-sets/:id/cover`. Files are limited to 1 MB, saved under a generated server filename, and served from `/uploads`. The response includes the public `cover_url`.

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
Authorization: Bearer <hostToken>
Content-Type: application/json
```

```json
{
  "questionSetId": 1,
  "timeLimit": 600
}
```

The server creates a six-digit join code and starts the session in `WAITING`. To start or close it, send `{"status":"RUNNING"}` or `{"status":"CLOSED"}` to `PATCH /sessions/:code`. Starting records `started_at` and `ends_at` exactly 10 minutes apart, regardless of the legacy `timeLimit` request field. Starting also sets every seated player's first question and start time. A host may close a running game early; expired games are closed lazily by gameplay, session, leaderboard, and results requests.

Join or rejoin:

```http
POST /api/v1/sessions/123456/players
Authorization: Bearer <playerToken>
Content-Type: application/json
```

```json
{ "display_name": "Kushina", "avatar": "kushina" }
```

An avatar can only be used once in a session. New seats start with 0 Chakra; a returning account gets its original seat and Chakra. The legacy `nickname` field is still accepted for existing clients and receives a unique generated default avatar when no avatar is supplied. New seats are accepted only in `WAITING` sessions, subject to the 30-player game limit and the one-running-game rule.

### Gameplay, Chakra and Ninja Ranks

After the host starts a game, each seated player uses their own `GET /sessions/:code/question` endpoint. The question and choices never include correctness. Submit only `{ "question_id": 1, "choice_id": 2 }` to `POST /sessions/:code/answers`; the server checks the current question and choice, records the answer, and advances the player's position. Skipping and answering a question twice in the same round return `409`. After the last question, the player wraps to question one in the next round.

A correct answer creates a server-timed five-second Reward Round with server-generated Balloon (+10 Chakra), Chest (+25), and Bomb (-10) objects. Claim one by sending only `reward_round_id` and `object_id` to `/sessions/:code/rewards`. A claim after five seconds is marked claimed but grants zero Chakra; an unclaimed reward never changes Chakra. Chakra cannot fall below zero. Chakra changes and the claimed state are committed transactionally, and the server never accepts correctness, time, or reward values from the client.

`GET /sessions/:code/leaderboard?limit=10` sorts by Chakra descending and returns `{ "data": [...], "meta": {...} }`. Tied positions share rank using competition ranking (1, 2, 2, 4) and the same Ninja Rank: Kage, Jonin, Chunin, then Genin. The final leaderboard remains available after the game closes.

### Hub Contract results

```http
GET /api/v1/results
X-Hub-Key: <the configured HUB_API_KEY>
```

Only closed sessions with an end time appear in results. A player counts as completed if they were seated when the game ended and answered at least one question; `/results` uses this same rule. Missing or incorrect Hub keys receive 401. The `since` parameter filters on the game's end time.

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

Import [`postman/CS313 Week 11.postman_collection.json`](./postman/CS313%20Week%2011.postman_collection.json) into Postman. Set `baseUrl` if needed and run the login folder first. The exported collection has 103 requests, including the **Play a whole game** folder for multiple players, reward claims and expiries, round wrapping, tie ranks, session closing, and Hub results.

The capacity-full request is a manual-precondition case: populate its session with 30 distinct accounts before enabling it. For a fresh demo database, duplicate nickname is exercised with two different seeded players.

## Existing game rules and tables

A player counts as completed for `/results` after answering at least one question before the game ends. Final score and leaderboard order use the player's Chakra total.

Database tables are defined by the Sequelize CLI migrations: `users`, `QuestionSet`, `GameSession`, `Player`, `Question`, `Answer`, `RewardRound`, `RewardObject`, and `reward_rounds`. Sessions and players retain existing camel-case columns where required; gameplay timing fields use snake case.
