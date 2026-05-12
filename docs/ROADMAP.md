# Implementation Roadmap
## Church Management Platform — [Name TBD]

Designed for AI-assisted solo development. Milestones are sized for fast iteration, not waterfall delivery. Each milestone produces something demoable or usable.

---

## Phase 1 — MVP ("Show the Pastor")

Goal: A working system that eliminates the paper check-in sheet and the deacon's text message chain. Demo-ready for pastor review.

---

### Milestone 1: Foundation
**Output:** Running app with auth, RBAC, blank slate, and the ability to create a person record.

- [ ] Repo setup (Next.js 14, TypeScript, Tailwind, shadcn/ui, Drizzle, PostgreSQL)
- [ ] Docker Compose (app + db, dev and prod configs)
- [ ] Drizzle schema: `users`, `people`, `households`, `audit_logs`, `app_settings`
- [ ] Auto-migration on startup
- [ ] Email + password authentication (login, logout)
- [ ] Session management (iron-session, secure cookie)
- [ ] Middleware: route protection by system role
- [ ] Audit log: all mutations logged
- [ ] Basic app settings page (church name, logo)
- [ ] First super_admin account seeded via env var on first run
- [ ] Basic layout shell (sidebar nav, top bar, responsive)

**Done when:** You can log in, see a dashboard, and create a person record.

---

### Milestone 2: People & Household Management
**Output:** Full member directory — staff can manage everyone in the church.

- [ ] Person CRUD (create, view, edit, soft-delete)
- [ ] Household CRUD and person-to-household assignment
- [ ] All profile fields with field-level visibility controls
- [ ] Emergency contacts sub-form
- [ ] Allergy/medical notes (staff-only, visually distinct)
- [ ] Church status (visitor / member / officer + title)
- [ ] Authorized pickup management per child
- [ ] Profile photo upload (StorageService, local filesystem)
- [ ] Member directory view (search by name, filter by status)
- [ ] Field-level visibility enforcement in directory
- [ ] CSV export of person list
- [ ] Basic CSV import (name + email/phone minimum)

**Done when:** Secretary can enter the whole church roster and it looks correct in the directory.

---

### Milestone 3: Child Check-In
**Output:** Digital check-in that replaces the paper sheet. Safety-critical, polish this one.

- [ ] Room/classroom setup (CRUD, capacity, age range)
- [ ] Check-in flow: search child → confirm household/allergies → assign room → generate claim-check code
- [ ] Claim-check code generation (short alphanumeric, collision-resistant per session)
- [ ] Check-in receipt UI (child code + parent code, printable/displayable)
- [ ] Allergy/medical flag: prominently displayed at check-in, impossible to miss
- [ ] Unauthorized pickup flag: displayed prominently, blocks normal checkout UI
- [ ] Active check-in dashboard: who is currently checked in, by room
- [ ] Check-out flow: enter code → verify → confirm checkout
- [ ] Staff override checkout (with required reason, logged)
- [ ] Check-in history log per child
- [ ] Incident reporting: form (type, description, occurred_at), saved to db, escalated to officer-role users via notification
- [ ] `checkin_sessions` and `checkin_incidents` schema

**Done when:** Children's coordinator can run an entire Sunday morning on this system without touching paper.

---

### Milestone 4: Volunteer Scheduling
**Output:** Deacon can generate, fine-tune, and publish a monthly volunteer schedule. Volunteers get notified.

- [ ] Volunteer role CRUD (AV, Offering, Greeting, etc.)
- [ ] Volunteer assignment: person → role(s), with availability notes
- [ ] Schedule CRUD (name, date range, draft/published)
- [ ] Schedule slot management (date × role × person)
- [ ] Auto-generate schedule (round-robin by role, respecting availability notes as soft constraint)
- [ ] Manual slot override (drag-replace or dropdown)
- [ ] Publish schedule → triggers notifications to all assigned volunteers
- [ ] Volunteer notification: email and/or SMS (pluggable provider, configured via env)
- [ ] Swap request: volunteer can flag slot as needing swap (broadcast mode: notify all eligible)
- [ ] Swap acceptance: first eligible volunteer to accept claims the slot
- [ ] Notification log (what was sent, when, to whom, status)
- [ ] Pluggable provider: Twilio (SMS) + Brevo (email) adapters, selected via env var

**Done when:** Deacon clicks "Generate October Schedule," tweaks three slots, publishes it, and everyone gets a text.

---

### Milestone 5: Bulletin Boards
**Output:** Church can post announcements to multiple boards. Staff manages permissions.

- [ ] Board CRUD (name, description, is_public)
- [ ] Board posting permission management (by system role, officer status, or individual)
- [ ] Post CRUD (title, rich text body, pin)
- [ ] Staff can delete any post
- [ ] Board list view (staff + member-facing)
- [ ] Post list and detail view

**Done when:** Pastor can post to "General Announcements" and the AV volunteer can post to "AV Team" — but not the other way around.

---

### Milestone 6: Phase 1 Polish + Docker Packaging
**Output:** A packaged, documented system someone else could run.

- [ ] Rate limiting on auth endpoints
- [ ] CSRF protection on all mutations
- [ ] Input validation (Zod) on all API routes
- [ ] Error boundaries and user-facing error pages
- [ ] Production Dockerfile (multi-stage build, non-root user)
- [ ] Production docker-compose.yml
- [ ] `.env.example` with all required variables documented
- [ ] Basic health check endpoint (`/api/health`)
- [ ] Accessibility audit of all Phase 1 screens
- [ ] Mobile responsiveness pass on all Phase 1 screens

**Done when:** You hand a `docker-compose.yml` and a `.env` template to a technical church volunteer and they can run it.

---

## Phase 2 — Core Platform

Goal: Member self-service accounts, events, groups, prayer, pastoral care.

### Milestone 7: Member Accounts
- Member invitation flow (email invite → account setup)
- Member self-service profile editing
- Directory browsing with visibility enforcement
- Session handling for member role

### Milestone 8: Events
- Event CRUD (name, date/time, location, RSVP)
- Recurring events (iCal RRULE)
- Event series
- Room booking
- RSVP (yes/no/maybe + guest count)
- Member-facing event list

### Milestone 9: Small Groups
- Group CRUD with leader assignment
- Member enrollment
- Group-linked bulletin board

### Milestone 10: Prayer Requests
- Submit with visibility selection (public / officers-only / unspoken)
- Status management (active / answered / archived)
- Officer-only notes

### Milestone 11: Pastoral Care Notes
- Timestamped notes per person
- Officer-level visibility enforcement

### Milestone 12: Giving Link + CSV Import Improvements
- Configurable giving URL → QR code generation
- Improved CSV import (field mapping UI, duplicate detection)
- CSV export improvements

---

## Phase 3 — Maturity

Goal: Reporting, polish, operational tooling.

### Milestone 13: Reporting Dashboard
- Attendance trends (check-in data over time)
- Volunteer coverage metrics
- Membership growth (status changes over time)
- Driven by real user feedback — exact reports TBD

### Milestone 14: Setup Wizard
- First-run guided configuration (church name, first admin, first rooms, first boards)
- Demo mode with seed data

### Milestone 15: Advanced Volunteer Features
- Backup volunteer designation per role
- Volunteer confirmation workflow (confirm/decline via link in notification)
- Volunteer history per person

### Milestone 16: API Access
- Bearer token management
- Basic read API for external integrations
- OpenAPI documentation

### Milestone 17: Giving Records (if/when scope is clear)
- Manual giving entry by treasurer
- Household giving history
- Annual giving statement generation

---

## Development Principles

**Each milestone:**
- Starts with database schema (Drizzle schema file)
- Continues with domain service (business logic, tests)
- Continues with API routes (route handlers, Zod validation)
- Continues with UI (components, pages)
- Ends with E2E test for the happy path

**AI-agent-friendly task structure:**
- Tasks are scoped to one domain module at a time
- Schema changes come with explicit before/after column specs
- API routes are defined with request/response types before implementation
- UI tasks reference specific shadcn/ui components and layouts
- Each task has a clear "done when" criterion

**Never:**
- Merge schema changes without migration files
- Add a dependency without a clear reason
- Build a feature before its data model is reviewed
- Skip the audit log for any mutation
