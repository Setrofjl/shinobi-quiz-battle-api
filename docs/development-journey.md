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
- Dates worked: Nov 27, 2026 · Time spent: not tracked
- Goal: Add paginated question-set and question lists, nested choices, frozen-set rules and safe cover uploads.
- What I built: A Choice model and migration, transaction-backed question endpoints, allow-listed search/sorting, and PNG/JPEG cover storage.
- Evidence: Focused question-bank API tests passed; the Question bank Postman folder covers pagination, nested content, validation and uploads.
- Problem I hit: Existing questions had no choice model or generated IDs, while gameplay relies on the existing `correctIndex`.
- How I solved it: Added normalized choices and database sequences/positions, and derive `correctIndex` from the single correct choice to preserve gameplay compatibility.
- Decision I made and why: Keep choices normalized in their own table and save them in the same transaction as the question; this adds a migration but prevents partial question records.
- Changes to my design set: Added question positions, a Choice table, and nullable question-set cover URL; no relationship changes outside the question bank.
- What I would explain to a classmate: A joined eager load reads questions and choices together, avoiding one extra query per question.

## M3 · Gameplay

## M4 · Automated tests and server preparation

## M5 · API documentation and deployment

## M6 · The SE1 portfolio and the release

## M7 · The Test Report
