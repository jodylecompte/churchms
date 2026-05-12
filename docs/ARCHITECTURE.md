# Architecture Proposal
## Church Management Platform — [Name TBD]

---

## 1. Guiding Principles

1. **Modular monolith, not microservices.** One deployable unit. One database. One process (plus pg-boss workers, same process). No service mesh, no inter-service calls, no distributed tracing.
2. **No unnecessary infrastructure.** The only required services are the application and PostgreSQL. File storage is a mounted Docker volume. Job processing runs in Postgres. No Redis, no Kafka, no object storage service.
3. **Typed end-to-end.** TypeScript throughout. Database schema types flow directly into API types into UI components.
4. **Explicit domain boundaries.** Modules communicate through well-defined interfaces, not direct database cross-references. This makes the monolith refactorable if a module ever needs to be extracted.
5. **Self-contained deployment.** `docker compose up` should be the entire deployment story for Phase 1.

---

## 2. Technology Stack

| Concern | Choice | Rationale |
|---|---|---|
| Language | TypeScript | Type safety end-to-end, excellent AI tooling, ecosystem depth |
| Framework | Next.js 14+ (App Router) | SSR/hybrid rendering, co-located API, single deployable, strong TS support |
| Database | PostgreSQL 16 | Proven, feature-rich, excellent JSON support, Drizzle compatibility |
| ORM | Drizzle ORM | Lightweight, SQL-close, excellent migration tooling, TypeScript-first |
| Background jobs | pg-boss | Postgres-backed, no extra infrastructure, reliable at this scale |
| Authentication | Custom sessions (iron-session or lucia-auth) | No vendor lock-in, full control, simple cookie-based sessions |
| File storage | Local filesystem (Docker volume) behind StorageService abstraction | Zero extra infrastructure, trivial to back up, easily swappable |
| Notifications | Pluggable provider (Twilio SMS, Brevo email) via adapter pattern | Churches choose their provider via env config, easy to add adapters |
| Styling | Tailwind CSS + shadcn/ui | Utility-first, accessible components, fast iteration |
| Testing | Vitest (unit/integration) + Playwright (E2E) | Fast, TypeScript-native, excellent DX |
| Container | Docker + Docker Compose | Single-server deployment, no orchestration complexity |
| CI | GitHub Actions | Free for open source, excellent ecosystem |

---

## 3. Application Structure

```
/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Unauthenticated routes
│   │   │   ├── login/
│   │   │   └── invite/[token]/
│   │   ├── (portal)/                 # Member-facing routes (Phase 2)
│   │   │   ├── directory/
│   │   │   ├── events/
│   │   │   └── boards/
│   │   ├── (admin)/                  # Staff-facing routes
│   │   │   ├── people/
│   │   │   ├── households/
│   │   │   ├── check-in/
│   │   │   ├── volunteers/
│   │   │   ├── boards/
│   │   │   ├── events/
│   │   │   ├── groups/
│   │   │   ├── prayer/
│   │   │   ├── care/
│   │   │   ├── incidents/
│   │   │   └── settings/
│   │   └── api/                      # API route handlers
│   │       ├── auth/
│   │       ├── people/
│   │       ├── households/
│   │       ├── check-in/
│   │       ├── volunteers/
│   │       ├── boards/
│   │       ├── events/
│   │       ├── groups/
│   │       ├── prayer/
│   │       ├── care/
│   │       ├── incidents/
│   │       └── notifications/
│   │
│   ├── domain/                       # Business logic (framework-agnostic)
│   │   ├── people/
│   │   │   ├── people.service.ts
│   │   │   ├── people.types.ts
│   │   │   └── people.test.ts
│   │   ├── households/
│   │   ├── check-in/
│   │   │   ├── check-in.service.ts
│   │   │   ├── claim-check.ts        # Code generation logic
│   │   │   └── check-in.types.ts
│   │   ├── volunteers/
│   │   │   ├── scheduling.service.ts
│   │   │   ├── auto-scheduler.ts     # Round-robin generation algorithm
│   │   │   └── volunteers.types.ts
│   │   ├── boards/
│   │   ├── events/
│   │   ├── groups/
│   │   ├── prayer/
│   │   ├── care/
│   │   ├── incidents/
│   │   └── notifications/
│   │       ├── notification.service.ts
│   │       └── providers/
│   │           ├── provider.interface.ts
│   │           ├── twilio.provider.ts
│   │           └── brevo.provider.ts
│   │
│   ├── db/                           # Database layer
│   │   ├── schema/                   # Drizzle table definitions
│   │   │   ├── people.ts
│   │   │   ├── households.ts
│   │   │   ├── users.ts
│   │   │   ├── check-in.ts
│   │   │   ├── volunteers.ts
│   │   │   ├── boards.ts
│   │   │   ├── events.ts
│   │   │   ├── groups.ts
│   │   │   ├── prayer.ts
│   │   │   ├── care.ts
│   │   │   ├── incidents.ts
│   │   │   ├── audit.ts
│   │   │   └── index.ts
│   │   ├── migrations/               # Drizzle generated migrations
│   │   ├── client.ts                 # Drizzle client singleton
│   │   └── seed.ts                   # Dev/demo seed data
│   │
│   ├── jobs/                         # pg-boss job definitions
│   │   ├── jobs.client.ts
│   │   ├── send-notification.job.ts
│   │   ├── schedule-reminder.job.ts
│   │   └── index.ts
│   │
│   ├── storage/                      # File storage abstraction
│   │   ├── storage.interface.ts
│   │   ├── local.storage.ts
│   │   └── index.ts
│   │
│   ├── auth/                         # Auth utilities
│   │   ├── session.ts
│   │   ├── rbac.ts                   # Permission checking
│   │   └── middleware.ts
│   │
│   ├── lib/                          # Shared utilities
│   │   ├── audit.ts                  # Audit log helpers
│   │   ├── validation.ts             # Zod schemas
│   │   └── errors.ts
│   │
│   └── components/                   # React components
│       ├── ui/                       # shadcn/ui base components
│       └── features/                 # Feature-specific components
│           ├── check-in/
│           ├── volunteers/
│           ├── people/
│           └── ...
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── Dockerfile
├── .env.example
├── drizzle.config.ts
└── vitest.config.ts
```

---

## 4. Data Flow

```
Browser Request
     │
     ▼
Next.js Middleware (auth check, role check)
     │
     ▼
Route Handler (app/api/...)
     │
     ├── Validates input (Zod)
     ├── Calls domain service
     │       │
     │       ├── Business logic
     │       ├── Drizzle queries (db/)
     │       ├── Writes audit log
     │       └── Enqueues jobs (pg-boss) for async work
     │
     └── Returns typed response
           │
           ▼
      pg-boss worker (same process, separate thread)
           │
           ├── send-notification → NotificationService → Twilio/Brevo
           └── other async jobs
```

---

## 5. Authentication and Session Model

- Email + password login
- Password hashed with bcrypt (cost 12)
- Session stored as encrypted, signed cookie (iron-session)
- Session contains: `userId`, `systemRole`, `personId`
- Session TTL: 7 days, sliding expiration on activity
- Rate limiting on `/api/auth/login`: 10 attempts per 15 minutes per IP
- Invitation flow: time-limited token (48h), sent via email, links to account setup

---

## 6. Permission Model

```typescript
type SystemRole = 'super_admin' | 'admin' | 'staff' | 'member'

// Permission check utility
function can(user: SessionUser, action: Action, resource: Resource): boolean

// Actions defined per domain module
// Examples:
// can(user, 'read', 'person')           → staff+ or own record
// can(user, 'write', 'person')          → staff+
// can(user, 'read', 'incident')         → staff+
// can(user, 'escalate', 'incident')     → staff+
// can(user, 'read', 'pastoral_note')    → admin+ or officer status
// can(user, 'post', board)              → board-level permission check
```

Permissions are checked in domain service layer, not just in route handlers. This prevents accidental bypass when calling services from jobs or other services.

---

## 7. Notification Architecture

```typescript
interface NotificationProvider {
  sendSMS(to: string, body: string): Promise<void>
  sendEmail(to: string, subject: string, html: string): Promise<void>
}

// Configured via environment:
// NOTIFICATION_SMS_PROVIDER=twilio
// NOTIFICATION_EMAIL_PROVIDER=brevo
```

Notifications are always enqueued as jobs (pg-boss), never sent synchronously in request handlers. This prevents slow provider APIs from degrading UX and allows retry on failure.

---

## 8. File Storage Architecture

```typescript
interface StorageService {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<string>
  getUrl(key: string): string
  delete(key: string): Promise<void>
}

// Default implementation: LocalStorage
// Writes to /data/uploads/ (Docker volume mount)
// Files served via Next.js route handler with auth check
```

Files are never served from a public static path. All file access goes through an authenticated route handler that checks permissions before returning the file.

---

## 9. Audit Logging

Every data mutation (create, update, delete) writes an audit record:

```
actor_user_id | action | entity_type | entity_id | old_value | new_value | ip_address | timestamp
```

`old_value` and `new_value` are JSONB columns. PII in audit logs is acceptable (this is an internal system), but audit logs are only readable by `admin` and `super_admin`.

Audit log is append-only. No record is ever deleted from it (soft-delete everything else; the audit log is sacred).

---

## 10. Background Job Architecture

pg-boss runs as a job queue backed by a PostgreSQL table in the same database. Workers run in the same Node.js process as the Next.js app (initialized in a startup module).

Job types:
- `send-notification` — fire a single SMS or email via configured provider
- `schedule-reminder` — send volunteer schedule reminders (published on a cron)
- `swap-broadcast` — send swap request to eligible volunteers
- (Phase 2+) `event-reminder`, `report-generation`

Jobs are idempotent where possible. Retry policy: 3 attempts with exponential backoff.

---

## 11. Deployment Model (Phase 1)

```yaml
# docker-compose.yml (production)
services:
  app:
    image: church-cms:latest
    env_file: .env
    ports:
      - "3000:3000"
    volumes:
      - uploads:/data/uploads
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    env_file: .env
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  uploads:
  pgdata:
```

Database migrations run automatically on app startup via `drizzle-kit migrate` called from the app's startup sequence. If migration fails, app fails to start (intentional — prevents running stale schema).

Operator responsibility: reverse proxy (Caddy recommended for automatic TLS), `.env` file, Docker Compose.

---

## 12. Development Environment

```yaml
# docker-compose.dev.yml
services:
  app:
    build: .
    command: npm run dev
    volumes:
      - .:/app                        # Hot reload
      - uploads:/data/uploads
    env_file: .env.local

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"                   # Exposed for local tooling
```

`npm run dev` starts Next.js dev server. pg-boss workers start automatically. No separate worker process to manage.

---

## 13. What is Explicitly NOT in This Architecture

- Redis (pg-boss covers job queue; no caching layer needed at this scale)
- Kubernetes or any orchestration
- Object storage service (MinIO, S3)
- Message broker (RabbitMQ, SQS, Kafka)
- Separate API service
- GraphQL (REST route handlers are sufficient and simpler)
- Separate admin/frontend apps
- Plugin system (deferred indefinitely — modular code yes, plugin ecosystem no)
