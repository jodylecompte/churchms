# Security Model
## Church Management Platform — [Name TBD]

---

## 1. Threat Model

This is a church management system, not a bank. But it holds PII, medical notes, child records, incident reports, and pastoral care data. The threat model is:

- **Opportunistic external attackers** — brute force, credential stuffing, common web vulnerabilities
- **Disgruntled former members** — ex-staff attempting to access data they no longer have rights to
- **Internal privilege escalation** — a member attempting to see staff-only data
- **Accidental data exposure** — a staff user sharing a link that bypasses auth
- **Child safety violations** — unauthorized pickup, suppressed incident records

We are NOT in the threat model of nation-state actors, sophisticated persistent threats, or financial fraud at scale.

---

## 2. Authentication

| Control | Implementation |
|---|---|
| Password hashing | bcrypt, cost factor 12 |
| Session storage | Encrypted, signed cookie (iron-session) |
| Session TTL | 7 days, sliding expiration |
| Login rate limiting | 10 attempts / 15 min / IP (in-memory or pg-backed) |
| Invitation tokens | Cryptographically random, 48h TTL, single-use |
| Logout | Server-side session invalidation |
| Account lockout | After 20 failed attempts, require admin reset |

No MFA. This is a deliberate, explicit decision for this audience.

---

## 3. Authorization (RBAC)

### System Roles

```
super_admin > admin > staff > member
```

Each role inherits downward permissions are additive, never subtractive at the role level. Individual permissions can be granted explicitly (e.g., board posting).

### Permission Rules by Resource

| Resource | member | staff | admin | super_admin |
|---|---|---|---|---|
| Own profile | R/W | R/W | R/W | R/W |
| Other person profiles | R (visible fields only) | R/W | R/W | R/W |
| Person allergy/medical notes | — | R/W | R/W | R/W |
| Pastoral care notes | — | — | R/W | R/W |
| Officer-status users only | — | — | R/W | R/W |
| Incident reports | — | R/W | R/W | R/W |
| Authorized pickups / denied list | — | R/W | R/W | R/W |
| Check-in / check-out | — | R/W | R/W | R/W |
| Check-in override | — | R/W | R/W | R/W |
| Schedule management | — | R/W | R/W | R/W |
| Publish schedules | — | R/W | R/W | R/W |
| Board posts (public boards) | R/W* | R/W | R/W | R/W |
| Board posts (officers-only boards) | — | — | R/W | R/W |
| Prayer requests (public) | R/W | R/W | R/W | R/W |
| Prayer requests (officers-only) | — | R/W | R/W | R/W |
| Prayer request officer notes | — | R/W | R/W | R/W |
| User management | — | — | R/W | R/W |
| System settings | — | — | R/W | R/W |
| Audit logs | — | — | R | R/W |

*Board posting additionally gated by board-level permission grants.

### Officer-Status Access

Users whose linked Person record has `church_status = 'officer'` receive elevated visibility for:
- Pastoral care notes
- Officers-only prayer requests
- Incident escalation notifications

This is NOT a system role — it's a separate access layer. An officer may have `system_role = 'member'` but still receive pastoral-care visibility.

### Permission Enforcement

Permissions are checked in **domain service layer**, not only in route handlers. This ensures permission enforcement applies even when services call each other directly or when jobs invoke services.

---

## 4. Data Protection

### Sensitive Fields — Default Visibility

These fields are `staff_only` by default and never appear in member-facing directory or API responses:
- `allergy_notes`
- `medical_notes`
- `internal_notes`
- `emergency_contacts`
- `authorized_pickups` / `denied_pickups`
- Pastoral care notes
- Incident reports
- Prayer requests (officers-only)
- Audit logs

### Field-Level Visibility

Members control their own public-facing fields via visibility toggles. Staff can override to `staff_only` for any field. Principle: if it's not explicitly `public`, it's not public.

### File Storage

- Files never served from a public static path
- All file access goes through an authenticated route handler
- Route handler verifies permission before returning file stream
- File keys are not guessable (UUID-based)
- Upload validation: MIME type check, file size limit (configurable, default 10MB), no executable types

---

## 5. Child Safety Controls

These controls are intentionally stricter than the rest of the system:

1. **Allergy/medical notes** displayed at every check-in, unconditionally. Cannot be hidden from check-in staff.
2. **Unauthorized pickup flag** displayed prominently at check-in and checkout. The UI does not allow a normal checkout flow if this flag is set — staff must explicitly acknowledge and provide a reason.
3. **Checkout override** requires a reason field. Always logged to audit log with actor and reason.
4. **Incident reports** are never soft-deleted. Once created, they are permanent records.
5. **Incident escalation** sends notifications to all users with officer status in the system. The church decides what to do with that information.
6. **Claim-check codes** are short enough to be practical but collision-resistant within a single session window (generated fresh per check-in event, expired after checkout or end of day).

---

## 6. Input Validation and Injection Prevention

- All API inputs validated with Zod before reaching domain layer
- All database queries via Drizzle ORM (parameterized, no string interpolation)
- Rich text (bulletin board posts, prayer requests) sanitized with DOMPurify server-side before storage
- File upload MIME type validated against allowed list, not user-provided Content-Type
- No `eval`, no dynamic SQL construction

---

## 7. Transport Security

- HTTPS enforced via reverse proxy (Caddy recommended)
- All cookies: `Secure`, `HttpOnly`, `SameSite=Lax`
- HSTS header set by reverse proxy
- No sensitive data in URL parameters or query strings
- No sensitive data in application logs (PII is logged to audit table, not stdout)

---

## 8. CSRF Protection

All state-mutating API routes (POST, PUT, PATCH, DELETE) require:
- Valid session cookie (httpOnly, SameSite=Lax)
- `Content-Type: application/json` (rejects form submissions from other origins)
- For any routes that accept multipart form: explicit CSRF token

SameSite=Lax provides the primary CSRF defense for the majority of flows.

---

## 9. Audit Log

The audit log is the single most important security control in this system after authentication. It answers: "who did what to whom, when, and from where."

- Every create, update, delete mutation writes an audit record
- Auth events (login, logout, failed login, invitation sent) are logged
- Incident report creation and escalation are logged
- Checkout overrides are logged with reason
- Audit records are append-only (no delete, no update)
- Audit log is only readable by `admin` and `super_admin`
- Old/new values stored as JSONB (with PII present — access controlled by role)

---

## 10. Secrets Management

Secrets live in environment variables, sourced from a `.env` file on the host. Never committed to source control.

Required secrets:
```
SESSION_SECRET=        # 32+ byte random string for iron-session
DATABASE_URL=          # postgres connection string
TWILIO_ACCOUNT_SID=    # optional, if using Twilio
TWILIO_AUTH_TOKEN=     # optional
BREVO_API_KEY=         # optional, if using Brevo
```

`.env.example` documents all variables with descriptions. Operator fills in values before first run. No secrets auto-generated at runtime (no secret-zero problem for the operator to manage).

---

## 11. What This System Intentionally Does NOT Do

- Store payment card data (giving is an external link)
- Provide public-facing APIs without authentication
- Allow unauthenticated file access
- Log sensitive fields to stdout
- Allow members to escalate their own permissions
- Allow hard-deletion of incident reports or audit logs
- Generate or store background check results (external service only)
