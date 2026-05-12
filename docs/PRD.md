# Product Requirements Document
## Church Management Platform — [Name TBD]
### Version 1.0 — Discovery Complete

---

## 1. Problem Statement

Small-to-medium churches (<500 weekly attendees) operating with volunteer staff, limited budgets, and manual workflows lack a self-hosted, operationally simple church management platform. Existing solutions are either expensive SaaS with lock-in, legacy PHP/LAMP software with poor UX, or enterprise tools built for megachurch complexity. The result: deacons manually texting volunteer rosters, childcare on paper check-in sheets, no member directory anyone actually uses.

---

## 2. Target User

**Primary operator:** A volunteer-level technical person (may be shared across multiple churches in a presbytery or association). Capable of running Docker Compose, editing a `.env` file, not necessarily a professional engineer.

**Daily users:**
- Church secretary (primary data entry, member management)
- Deacons/officers (volunteer scheduling, pastoral notes, incident escalation)
- Children's coordinator (check-in, classroom management)
- Pastor (visibility, bulletin boards, prayer requests)

**Future users (Phase 2+):**
- Congregation members (directory, bulletin boards, events, giving history)

**Not targeted:**
- Megachurches (500+ weekly)
- Multi-campus operations
- Churches requiring denominational governance workflows

---

## 3. Design Philosophy

**Give primitives, don't enforce policy.** The software records facts, surfaces information to the right people, and provides tools. It does not decide what the church should do with that information. Different traditions, polities, and cultures will use the same tools differently.

**Operational simplicity over features.** A feature that creates ongoing operational burden for a volunteer operator should not exist. If it can break at 3am and require an engineer to fix it, it should not be in the default configuration.

**Security without friction.** Sensitive data (child records, medical notes, pastoral care, incident reports) must be protected by default. Visibility should require explicit grant, not explicit restriction.

---

## 4. Non-Goals (Explicit)

- Worship presentation / slides / media projection
- Live streaming
- Full accounting suite
- Multi-campus orchestration
- Denominational governance workflows
- Social network / member-generated feed
- Kubernetes or cloud-native infrastructure
- MFA (deferred indefinitely — email + password only)
- In-app giving ledger (MVP: external link/QR only)
- Custom scripting engine
- AI features in MVP

---

## 5. Core Concepts

### 5.1 People and Households

**Person** is always an individual record. Minimum required: name + (email OR phone). All other fields optional.

**Household** is a first-class entity. Persons belong to households. Children are persons attached to a household, not standalone records. Household represents a family unit — flexible for blended families, single adults, shared households.

**Church Status** (separate from system permissions):
- `visitor` — regular attender, not formally received
- `member` — formally received communicant member
- `officer` — pastor, ruling elder, deacon, or equivalent in any tradition

Officer title is a free-text field (not hardcoded denominations). Officer status in the church and system permission level are explicitly decoupled — the IT volunteer in the last pew may have admin access while the pastor has read-only.

### 5.2 System Permissions

Hierarchical role system, independent of church status:
- `super_admin` — full system access, typically the technical operator
- `admin` — full data access, user management, settings
- `staff` — operational access (check-in, scheduling, member management)
- `member` — self-service access (own profile, directory, public boards, events)

### 5.3 Field-Level Visibility

Person fields have visibility settings:
- `public` — visible to all logged-in members
- `staff_only` — visible to staff/admin/officers only
- `self_only` — visible only to the person and staff

Required fields (e.g., emergency contact) can be marked `staff_only` — hidden from directory but accessible to authorized staff.

### 5.4 Bulletin Boards (Not a Social Feed)

Named boards with configurable posting permissions. Members can read; posting requires explicit permission grant (by system role, officer status, or individual). Forum-style, not algorithmic feed. Examples: "General Announcements," "AV Team," "Prayer Requests."

### 5.5 Child Check-In Philosophy

The system owns: who the child is, family associations, authorized contacts, drop-off timestamp, who dropped off, room assignment, claim-check code, allergy/medical flags. The church owns: what they do with that information, how strict pickup enforcement is. The system provides the tools; the church builds their process on top.

---

## 6. Feature Requirements by Phase

### Phase 1 — MVP ("Show the Pastor")

**P1.1 — Foundation**
- Docker Compose deployment (Next.js app + PostgreSQL)
- Email + password authentication
- Session management with secure cookies
- System role-based access control (super_admin, admin, staff)
- Audit logging for all data mutations
- Basic application settings (church name, contact info)

**P1.2 — People & Household Management**
- Create/edit/deactivate Person records
- Household creation and person-to-household assignment
- Household roles (head, spouse, child, other)
- Church status assignment (visitor, member, officer + title)
- All profile fields with field-level visibility controls
- Emergency contacts (per person)
- Allergy/medical notes (staff-only visibility, flagged at check-in)
- Soft delete (deactivate, never hard delete)

**P1.3 — Member Directory**
- Staff-searchable full directory
- Field-level visibility enforcement
- Basic search/filter (name, status, household)

**P1.4 — Bulletin Boards**
- Create named boards with descriptions
- Post to board (title + rich text body)
- Board-level posting permission (system role, officer status, or individual)
- Pin posts
- Staff can moderate/delete any post

**P1.5 — Child Check-In**
- Room/classroom setup (name, capacity, optional age range)
- Check-in flow: search child → confirm household → assign room → generate claim-check code
- Claim-check code display (child code + parent code, must match at pickup)
- Allergy/medical flag prominently displayed at check-in
- Check-out flow: verify claim-check code or staff override
- Active check-in dashboard (who is currently checked in, which room)
- Unauthorized pickup flag per child (staff-only, displayed prominently at check-in)
- Incident reporting (timestamped, subject, description, type, escalation to officer-role users)
- Check-in history log

**P1.6 — Volunteer Scheduling**
- Define volunteer roles (AV, Offering, Greeting, etc.)
- Assign persons to volunteer roles (many-to-many)
- Person availability notes per role
- Create schedules (named, date range, per service or per event)
- Schedule slots (date, role, assigned person)
- Auto-generate schedule (round-robin respecting availability)
- Manual override of any auto-generated slot
- Fully manual schedule creation also supported
- Publish schedule → trigger notifications
- Swap options: self-swap by agreement, broadcast-first-accept
- Notification via email and/or SMS (pluggable provider)

**P1.7 — Notifications**
- Pluggable provider architecture (Twilio for SMS, Brevo for email, configurable)
- Volunteer schedule publish notifications
- Volunteer swap request notifications
- Configuration via environment variables

---

### Phase 2 — Core Platform

**P2.1 — Member Self-Service**
- Member account invitation flow (email invite)
- Member login and profile self-edit
- Directory browsing with visibility enforcement
- Public bulletin board reading and posting (per permissions)

**P2.2 — Events**
- Create events (name, description, date/time, location, RSVP toggle)
- Recurring events (daily, weekly, monthly, custom)
- Event series (named grouping of related events)
- Room/resource booking per event
- RSVP (yes/no/maybe + guest count)
- Member-facing event list

**P2.3 — Small Groups**
- Create named groups (name, description, meeting schedule)
- Leader assignment
- Member enrollment
- Group-specific bulletin board (optional)
- Group attendance (optional)

**P2.4 — Prayer Requests**
- Submit prayer request (text content)
- Visibility: public (all members), officers-only, unspoken (anonymous — name hidden, content visible)
- Status: active, answered, archived
- Officer-only notes per request (not visible to submitter if anonymous)

**P2.5 — Pastoral Care Notes**
- Timestamped notes per person
- Author attribution
- Officer-level visibility only
- No workflow engine — just records

**P2.6 — Giving (Minimal)**
- Church configures external giving URL (Stripe, PayPal, Pushpay, etc.)
- QR code generation from that URL
- Display on member portal and printable page
- No in-app ledger, no transaction tracking in Phase 2

**P2.7 — CSV Import/Export**
- Import persons from CSV (with field mapping UI)
- Export person list, household list, attendance records
- Duplicate detection on import

---

### Phase 3 — Maturity

- Reporting dashboard (attendance trends, volunteer coverage, group growth)
- Setup wizard (first-run guided configuration)
- Demo mode with seed data
- Advanced volunteer features (backup designation, confirmation workflow)
- Background checks integration (external link/webhook)
- Facility/resource scheduling (standalone, not just event-attached)
- Giving records manual entry + giving statement generation
- API access (bearer tokens for external integrations)
- Multi-language support groundwork
- Mobile app evaluation

---

## 7. Security Requirements

- Passwords hashed with bcrypt (cost factor ≥ 12)
- Session tokens stored in secure, httpOnly cookies
- CSRF protection on all mutations
- Rate limiting on authentication endpoints
- All child records, medical notes, incident reports: staff-only by default
- Unauthorized pickup flags: displayed prominently, never suppressible by member-role users
- Audit log: all data mutations logged with actor, timestamp, before/after values
- PII never logged to application stdout
- File uploads: type validation, size limits, stored outside web root
- Incident reports: accessible only to staff+, escalation notifies officer-role users

---

## 8. Accessibility Requirements

- WCAG 2.1 AA compliance target
- Keyboard navigable throughout
- Screen reader compatible (semantic HTML, ARIA where needed)
- Sufficient color contrast
- No functionality dependent on color alone

---

## 9. Out of Scope (Forever)

- Worship presentation software
- Live streaming infrastructure
- Full accounting/bookkeeping
- Denominational governance workflows
- Multi-campus management
- Social-media-style member feed
- Custom scripting engine
- Cryptocurrency/blockchain

---

## 10. Open Questions (Deferred)

- Project name
- Upgrade/migration strategy for production deployments
- Backup management tooling (built-in vs operator responsibility)
- Giving ledger scope, compliance requirements, giving statement format
- Reporting: specific reports to build (driven by real user feedback)
- Mobile app: native vs PWA vs responsive-only
- SSO/LDAP/OIDC (Phase 3+ only)
- Federation between churches (if ever)
