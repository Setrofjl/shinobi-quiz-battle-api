# Changelog

All notable changes, newest first.

## [Week 14] - 2026-11-27

### Added
- Automated Jest unit and HTTP tests against a separate `<DB_NAME>_test` database.
- `npm test` and `npm run test:coverage`: 24 tests passing, 89.16% line coverage.
- CORS allow-list tests for listed and unlisted origins.
- `start:render` and `render.yaml` for migration, first-admin creation, and server startup without seeders.
- README instructions for running the tests.

### Changed
- `app.js`: added `trust proxy`, Helmet, and origin-restricted CORS.
- `env.js`: supports `DATABASE_URL` with optional SSL via `DB_SSL=true`; test mode targets a separate `_test` database.

### Security
- No secrets are stored in `render.yaml`; `JWT_SECRET` is generated and other secrets are set manually.
- CORS limits which browser origins can read responses; `/results` remains protected by the Hub key.

## [x.y.z] (Weeks 15 to 16): [Your summary]
- [Your change]

## [x.y.z] (Week 13): [Your summary]
- [Your change]

## [x.y.z] (Week 12): [Your summary]
- [Your change]

## 1.0.0 (Weeks 10 to 11): foundation
- [Your change]
