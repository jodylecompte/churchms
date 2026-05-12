# Church Management Platform — [Name TBD]

## Project Overview

Self-hosted church management platform for small-to-medium single-campus churches. Built for operational simplicity, strong security, and volunteer-level operators. Not a SaaS product. Not a megachurch tool.

Design philosophy: **give primitives, don't enforce policy.** The software records facts and provides tools. Churches build their own workflows on top.

## Tech Stack

- **Framework:** Next.js 14+ (App Router, TypeScript)
- **Database:** PostgreSQL 16
- **ORM:** Drizzle ORM
- **Background jobs:** pg-boss (Postgres-backed, no Redis)
- **Styling:** Tailwind CSS + shadcn/ui
- **File storage:** Local filesystem via Docker volume, behind a `StorageService` abstraction
- **Notifications:** Pluggable provider (Twilio SMS, Brevo email) via adapter pattern
- **Auth:** Custom sessions via iron-session, email + password only, no MFA
- **Testing:** Vitest (unit + integration) + Playwright (E2E)
- **Deployment:** Docker Compose (single server)

## Repository Structure

```
src/
  app/              # Next.js App Router — pages and API route handlers
    (auth)/         # Login, invite flows
    (admin)/        # Staff-facing routes
    (portal)/       # Member self-service (Phase 2)
    api/            # API route handlers
  domain/           # Business logic, framework-agnostic, one folder per module
  db/
    schema/         # Drizzle table definitions, one file per domain
    migrations/     # Drizzle-generated migration SQL — never hand-edit
    client.ts       # Drizzle singleton
    seed.ts         # Dev/demo seed data
  jobs/             # pg-boss job definitions
  storage/          # StorageService abstraction + local implementation
  auth/             # Session management, RBAC helpers, middleware
  notifications/    # Provider interface + Twilio and Brevo adapters
  lib/              # Shared utilities (audit log, validation, errors)
  components/
    ui/             # shadcn/ui base components
    features/       # Feature-specific React components
docs/               # PRD, architecture, schema, roadmap, security model, workflow
```

## Domain Modules

Each module lives in `src/domain/<name>/` and contains:
- `<name>.service.ts` — business logic
- `<name>.types.ts` — TypeScript types
- `<name>.test.ts` — unit/integration tests

Modules: `people`, `households`, `users`, `check-in`, `volunteers`, `boards`, `events`, `groups`, `prayer`, `care`, `incidents`, `notifications`

## Key Architecture Decisions

- **Modular monolith** — one deployable, one database, no microservices
- **No Redis** — pg-boss handles job queue via Postgres
- **No object storage** — local filesystem with Docker volume; `StorageService` abstraction makes it swappable later
- **No GraphQL** — REST route handlers are sufficient
- **No plugin system** — modular code yes, plugin ecosystem no
- **Permissions checked in domain layer**, not only in route handlers
- **Audit log is append-only** — never delete from it, never hard-delete anything else
- Files served through authenticated route handler, never from public static path

## Data Model Highlights

- `Person` is always an individual record; minimum required: name + (email OR phone)
- `Household` is a first-class entity; children are persons attached to a household
- `church_status` (visitor/member/officer) is **separate** from `system_role` — they do not imply each other
- System roles: `super_admin > admin > staff > member`
- Officer-status users get elevated visibility for pastoral notes and officers-only prayer requests regardless of system role
- Field-level visibility per person field: `public | staff_only | self_only`
- All tables use UUID primary keys and `deleted_at` soft deletes — nothing is hard deleted except audit logs (which are never deleted at all)

## Child Check-In — Safety Rules

These are non-negotiable regardless of what else changes:
1. Allergy/medical notes displayed at every check-in, unconditionally
2. Unauthorized pickup flag shown prominently — normal checkout UI blocked when set
3. Checkout override requires a reason, always audit-logged
4. Incident reports are never soft-deleted — permanent records
5. Incident escalation notifies all officer-status users

## Feature Phases

**Phase 1 (MVP):** Foundation + auth → People & households → Child check-in → Volunteer scheduling → Bulletin boards → Docker packaging

**Phase 2:** Member self-service accounts → Events → Small groups → Prayer requests → Pastoral care notes → Giving link/QR

**Phase 3:** Reporting → Setup wizard → Advanced volunteer features → API access → Giving records

## Development Rules

1. Schema changes always come with a Drizzle migration file — committed together, never separately
2. Never edit a migration file after it has run against any database
3. Input validation via Zod on every API route before reaching domain layer
4. Every data mutation writes an audit log record
5. Permission checks live in domain services, not just route handlers
6. No `console.log` with PII — sensitive data goes to audit table only
7. New env vars must be added to `.env.example` with documentation
8. Feature development order: schema → migration → types → service → API route → UI → E2E test

## Testing Requirements

- **Unit:** Domain service functions with meaningful logic; all branches covered
- **Integration:** Every API route — real Postgres test DB, happy path + auth failure minimum
- **E2E (Playwright):** Critical journeys — login, create person, check-in/check-out, publish volunteer schedule, post to board
- Tests committed with the feature, not separately

## Security Baseline

- bcrypt cost 12 for password hashing
- Secure, HttpOnly, SameSite=Lax cookies
- Rate limiting on auth endpoints (10 attempts / 15 min / IP)
- CSRF: SameSite=Lax + Content-Type: application/json on all mutation routes
- No sensitive data in URL params, query strings, or stdout logs
- Invitation tokens: cryptographically random, 48h TTL, single-use

## Notification Architecture

Notifications are always enqueued as pg-boss jobs — never sent synchronously in a request handler. Provider selected via env var (`NOTIFICATION_SMS_PROVIDER`, `NOTIFICATION_EMAIL_PROVIDER`). Adapters in `src/notifications/providers/`.

## Environment Variables (Required)

```
DATABASE_URL=
SESSION_SECRET=        # 32+ byte random string
NOTIFICATION_SMS_PROVIDER=      # twilio | (future options)
NOTIFICATION_EMAIL_PROVIDER=    # brevo | (future options)
TWILIO_ACCOUNT_SID=             # if using Twilio
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
BREVO_API_KEY=                  # if using Brevo
INITIAL_ADMIN_EMAIL=            # seeds first super_admin on first run
INITIAL_ADMIN_PASSWORD=
```

## Reference Docs

All in `docs/`:
- `PRD.md` — full product requirements and feature scope by phase
- `ARCHITECTURE.md` — stack decisions, app structure, data flow diagrams
- `DATABASE_SCHEMA.md` — every table, column, type, and index
- `ROADMAP.md` — milestone breakdown with checkbox tasks
- `SECURITY_MODEL.md` — threat model, RBAC table, child safety controls
- `DEVELOPMENT_WORKFLOW.md` — task anatomy, feature order, testing strategy, done checklist
