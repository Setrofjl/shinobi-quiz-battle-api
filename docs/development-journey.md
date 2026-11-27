# Development journey: [SHINOBI-QUIZ-BATTLE] API

Student: [Gipanao John Lawrenze Fortes] · Section: [BSCS-3-1] · Group: [group-3]

One entry per milestone, written the week you did it. Newest at the bottom.

## M1 · Accounts, passwords and tokens
- Dates worked: Nov 27, 2026 · Time spent: 5 hours
- Goal: Add password registration/login, JWT authentication and admin-only account management.
- What I built: `/auth/register`, `/auth/login`, `/auth/me`, `/users`, and `/users/:id/role`, plus the password migration and demo-password seeder.
- Evidence: 5 focused auth API tests passed; Postman collection has 52 requests and passed the Week 12 check.
- Problem I hit: The existing auth helpers expected JWT/bcrypt config exports, and the User model expected timestamp columns that the migration did not create.
- How I solved it: Exported the existing JWT settings and cost 10, disabled nonexistent User timestamps, and normalized seeded role casing when authenticating.
- Decision I made and why: Store bcrypt hashes only, use a dummy hash for unknown IDs, and make registration always create PLAYER accounts; this avoids password leaks, account enumeration and self-assigned privileges.
- Changes to my design set: Added nullable `password_hash` to users and documented the account endpoints; no relationship changes.
- What I would explain to a classmate: 401 means the request is unauthenticated; 403 means the authenticated account lacks permission.

## M2 · The question bank
- Dates worked: Nov 27, 2026 · Time spent: 5 hours
- Goal: Add paginated question-set and question lists, nested choices, frozen-set rules and safe cover uploads.
- What I built: A Choice model and migration, transaction-backed question endpoints, allow-listed search/sorting, and PNG/JPEG cover storage.
- Evidence: Focused question-bank API tests passed; the Question bank Postman folder covers pagination, nested content, validation and uploads.
- Problem I hit: Existing questions had no choice model or generated IDs, while gameplay relies on the existing `correctIndex`.
- How I solved it: Added normalized choices and database sequences/positions, and derive `correctIndex` from the single correct choice to preserve gameplay compatibility.
- Decision I made and why: Keep choices normalized in their own table and save them in the same transaction as the question; this adds a migration but prevents partial question records.
- Changes to my design set: Added question positions, a Choice table, and nullable question-set cover URL; no relationship changes outside the question bank.
- What I would explain to a classmate: A joined eager load reads questions and choices together, avoiding one extra query per question.

## M3 · Gameplay
- Dates worked: Nov 27, 2026 · Time spent: 5 hours
- Goal: Implement the ten-minute Chakra/Ninja Rank game loop with server-owned questions, answers, rewards and leaderboard state.
- What I built: Timed session start/expiry, individual question positions and repeat rounds, unique per-round answers, randomized five-second rewards, atomic Chakra changes, paginated leaderboard ranks, and updated Hub completion results.
- Evidence: Gameplay API and Chakra unit tests cover timer checks, private correctness, progress, reward expiry/floor, concurrency, leaderboard and result completion; the Postman “Play a whole game” folder exercises the end-to-end flow.
- Problem I hit: The project already had legacy `Answer` and `RewardRound` tables and session endpoints, so replacing them would have broken seeded Hub results and the Week 7 API contract.
- How I solved it: Extended the existing tables and kept the existing session CRUD, join/rejoin, and player-list routes; added game endpoints without removing the legacy `/game-session` listing.
- Decision I made and why: Keep `timeLimit` accepted on session creation for old clients but have the server always run for ten minutes; cap Chakra at zero; define completion as a seated player having submitted at least one answer.
- Changes to my design set: Added session deadlines, player question/round state, answer round uniqueness, and reward claim JSON/timestamps. No Week 7 endpoints were dropped. Joining now supports `display_name` plus a unique per-session `avatar` while retaining `nickname` as an alias; `timeLimit` is compatibility-only, and Hub completion now follows the new one-answer rule.
- What I would explain to a classmate: A transaction and row lock serialize a player's answer/reward updates; an atomic increment prevents concurrent claims from overwriting Chakra.

## M4 · Automated tests and server preparation
- Dates worked: Nov 27, 2026 · Time spent: not tracked
- Goal: Prepare a safe production start, isolate automated tests from development data, and verify CORS and test coverage.
- What I built: Added proxy-aware Helmet/CORS middleware, `DATABASE_URL`/SSL support, `_test` database isolation, Render migration/admin startup, and Jest coverage scripts.
- Evidence: `npm test` and `npm run test:coverage` pass all 24 tests across 8 suites with 89.16% line coverage; the CORS allow-list tests pass. Production rehearsal with a disposable `DATABASE_URL` returned HTTP 200 from health and logged in as the throwaway admin.
- Problem I hit: The test configuration had described a separate database but was actually using the development database; URL-based setups also need to suffix the database named in the URL.
- How I solved it: Made both connection modes select a suffixed test database when `NODE_ENV=test`; Jest setup rebuilds and seeds only that database.
- Decision I made and why: Production startup runs migrations and creates the first admin, but never runs demo seeders; secrets stay in Render's environment settings.
- Changes to my design set: Production connects through `DATABASE_URL`; `DB_SSL=true` enables TLS. CORS allows only configured origins, while `/results` continues to use its Hub key.
- What I would explain to a classmate: CORS controls browser access, not curl/Postman access; it does not replace authentication or the Hub key.

## M5 · API documentation and deployment

## M6 · The SE1 portfolio and the release

## M7 · The Test Report
