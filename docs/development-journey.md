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

## M3 · Gameplay

## M4 · Automated tests and server preparation

## M5 · API documentation and deployment

## M6 · The SE1 portfolio and the release

## M7 · The Test Report
