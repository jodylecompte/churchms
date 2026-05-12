# Database Schema
## Church Management Platform — [Name TBD]

All tables use `uuid` primary keys. All timestamps are `timestamptz`. Soft deletes via `deleted_at` nullable column — nothing is hard deleted except where explicitly noted.

---

## Core Domain

### `households`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
name            text NOT NULL                    -- "The Smith Family"
address_line1   text
address_line2   text
city            text
state           text
zip             text
country         text DEFAULT 'US'
anniversary_date date
notes           text                             -- staff only
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()
deleted_at      timestamptz
```

### `people`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
household_id    uuid REFERENCES households(id)
household_role  text                             -- 'head' | 'spouse' | 'child' | 'other'

-- Identity
first_name      text NOT NULL
last_name       text NOT NULL
preferred_name  text
suffix          text

-- Church status
church_status   text NOT NULL DEFAULT 'visitor'  -- 'visitor' | 'member' | 'officer'
officer_title   text                             -- free text, e.g. "Senior Pastor", "Deacon"
membership_date date
received_from   text                             -- previous church name

-- Contact (at least one required)
email           text
phone           text
phone_type      text                             -- 'mobile' | 'home' | 'work'

-- Personal
birth_date      date
is_minor        boolean NOT NULL DEFAULT false   -- explicit flag, not just derived from birth_date
gender          text                             -- optional, no enum enforcement
marital_status  text

-- Address (if different from household)
address_line1   text
address_line2   text
city            text
state           text
zip             text

-- Staff-only fields
allergy_notes   text                             -- PROMINENTLY displayed at check-in
medical_notes   text                             -- general medical, also staff-only
internal_notes  text                             -- general staff notes
baptism_date    date
baptism_type    text

-- System
profile_photo_key  text                          -- StorageService key
directory_visible  boolean NOT NULL DEFAULT true
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()
deleted_at      timestamptz
```

### `person_field_visibility`
Per-field override for directory visibility. Absence = use default (public for most fields, staff_only for sensitive fields).
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
person_id   uuid NOT NULL REFERENCES people(id)
field_name  text NOT NULL                        -- e.g. 'email', 'phone', 'birth_date'
visibility  text NOT NULL                        -- 'public' | 'staff_only' | 'self_only'
UNIQUE(person_id, field_name)
```

### `emergency_contacts`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
person_id   uuid NOT NULL REFERENCES people(id)
name        text NOT NULL
relationship text
phone       text NOT NULL
email       text
priority    int NOT NULL DEFAULT 1
notes       text
```

### `authorized_pickups`
People authorized to pick up a specific child. Absence of a record does not mean unauthorized — small churches know each other. But an explicit DENY can be recorded.
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
child_person_id uuid NOT NULL REFERENCES people(id)
authorized_person_id uuid REFERENCES people(id)  -- null if external person
external_name   text                              -- if not in system
external_phone  text
relationship    text
is_denied       boolean NOT NULL DEFAULT false    -- explicit "never allow"
notes           text
created_by      uuid NOT NULL REFERENCES users(id)
created_at      timestamptz NOT NULL DEFAULT now()
```

---

## Users and Auth

### `users`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
person_id       uuid UNIQUE REFERENCES people(id)  -- nullable only for system accounts
email           text NOT NULL UNIQUE
password_hash   text NOT NULL
system_role     text NOT NULL DEFAULT 'member'     -- 'super_admin' | 'admin' | 'staff' | 'member'
account_status  text NOT NULL DEFAULT 'invited'    -- 'active' | 'invited' | 'suspended'
invitation_token text UNIQUE
invitation_expires_at timestamptz
last_login_at   timestamptz
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()
```

---

## Child Check-In

### `checkin_rooms`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
name        text NOT NULL
description text
capacity    int
age_min     int                          -- months
age_max     int                          -- months
is_active   boolean NOT NULL DEFAULT true
sort_order  int NOT NULL DEFAULT 0
created_at  timestamptz NOT NULL DEFAULT now()
deleted_at  timestamptz
```

### `checkin_sessions`
One record per child per service. The complete check-in/check-out record.
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
child_person_id     uuid NOT NULL REFERENCES people(id)
room_id             uuid NOT NULL REFERENCES checkin_rooms(id)

-- Drop-off
checked_in_at       timestamptz NOT NULL DEFAULT now()
checked_in_by_person_id uuid REFERENCES people(id)
checked_in_by_user_id   uuid REFERENCES users(id)

-- Claim check
child_claim_code    text NOT NULL                -- e.g. "A147"
parent_claim_code   text NOT NULL                -- same base, different display

-- Pick-up
checked_out_at      timestamptz
checked_out_by_person_id uuid REFERENCES people(id)
checked_out_by_user_id   uuid REFERENCES users(id)
checkout_override_reason text                    -- if code not verified

-- State
status              text NOT NULL DEFAULT 'checked_in'  -- 'checked_in' | 'checked_out'
notes               text                         -- session-specific notes
allergy_snapshot    text                         -- copied from person at check-in time

created_at          timestamptz NOT NULL DEFAULT now()
```

### `checkin_incidents`
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
session_id          uuid REFERENCES checkin_sessions(id)
child_person_id     uuid NOT NULL REFERENCES people(id)
reported_by_user_id uuid NOT NULL REFERENCES users(id)
incident_type       text NOT NULL                -- 'injury' | 'behavioral' | 'safeguarding' | 'other'
description         text NOT NULL
occurred_at         timestamptz NOT NULL
escalated           boolean NOT NULL DEFAULT false
escalation_notes    text
created_at          timestamptz NOT NULL DEFAULT now()
updated_at          timestamptz NOT NULL DEFAULT now()
```

### `checkin_incident_notifications`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
incident_id     uuid NOT NULL REFERENCES checkin_incidents(id)
notified_user_id uuid NOT NULL REFERENCES users(id)
notified_at     timestamptz NOT NULL DEFAULT now()
channel         text NOT NULL                    -- 'email' | 'sms'
```

---

## Volunteer Scheduling

### `volunteer_roles`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
name        text NOT NULL                        -- "AV", "Offering", "Greeting"
description text
is_active   boolean NOT NULL DEFAULT true
sort_order  int NOT NULL DEFAULT 0
created_at  timestamptz NOT NULL DEFAULT now()
deleted_at  timestamptz
```

### `volunteer_assignments`
Person → Role membership (who is on which team).
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
person_id           uuid NOT NULL REFERENCES people(id)
volunteer_role_id   uuid NOT NULL REFERENCES volunteer_roles(id)
availability_notes  text
is_active           boolean NOT NULL DEFAULT true
assigned_by_user_id uuid REFERENCES users(id)
assigned_at         timestamptz NOT NULL DEFAULT now()
UNIQUE(person_id, volunteer_role_id)
```

### `schedules`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
name            text NOT NULL                    -- "October 2025 Sunday Volunteers"
description     text
date_start      date NOT NULL
date_end        date NOT NULL
status          text NOT NULL DEFAULT 'draft'    -- 'draft' | 'published'
published_at    timestamptz
published_by_user_id uuid REFERENCES users(id)
created_by_user_id   uuid NOT NULL REFERENCES users(id)
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()
deleted_at      timestamptz
```

### `schedule_slots`
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
schedule_id         uuid NOT NULL REFERENCES schedules(id)
volunteer_role_id   uuid NOT NULL REFERENCES volunteer_roles(id)
slot_date           date NOT NULL
slot_label          text                         -- "Morning Service", "Evening Service"
assigned_person_id  uuid REFERENCES people(id)
status              text NOT NULL DEFAULT 'open' -- 'open' | 'assigned' | 'confirmed' | 'declined'
confirmed_at        timestamptz
declined_at         timestamptz
decline_reason      text
created_at          timestamptz NOT NULL DEFAULT now()
updated_at          timestamptz NOT NULL DEFAULT now()
```

### `volunteer_swap_requests`
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
slot_id             uuid NOT NULL REFERENCES schedule_slots(id)
requester_person_id uuid NOT NULL REFERENCES people(id)
swap_type           text NOT NULL                -- 'direct' | 'broadcast'
target_person_id    uuid REFERENCES people(id)  -- null if broadcast
status              text NOT NULL DEFAULT 'pending' -- 'pending' | 'accepted' | 'declined' | 'expired'
resolved_by_person_id uuid REFERENCES people(id)
resolved_at         timestamptz
created_at          timestamptz NOT NULL DEFAULT now()
expires_at          timestamptz
```

---

## Bulletin Boards

### `boards`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
name        text NOT NULL
description text
is_public   boolean NOT NULL DEFAULT true        -- visible to member-role users
sort_order  int NOT NULL DEFAULT 0
created_at  timestamptz NOT NULL DEFAULT now()
deleted_at  timestamptz
```

### `board_post_permissions`
Who can post to a board. Checked at post-creation time.
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
board_id        uuid NOT NULL REFERENCES boards(id)
subject_type    text NOT NULL                    -- 'system_role' | 'church_status' | 'person'
subject_value   text NOT NULL                    -- 'admin', 'officer', person_id, etc.
granted_by_user_id uuid NOT NULL REFERENCES users(id)
granted_at      timestamptz NOT NULL DEFAULT now()
UNIQUE(board_id, subject_type, subject_value)
```

### `board_posts`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
board_id        uuid NOT NULL REFERENCES boards(id)
author_person_id uuid NOT NULL REFERENCES people(id)
title           text NOT NULL
body            text NOT NULL                    -- stored as HTML (sanitized on input)
is_pinned       boolean NOT NULL DEFAULT false
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()
deleted_at      timestamptz
```

---

## Events

### `event_series`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
name        text NOT NULL
description text
created_at  timestamptz NOT NULL DEFAULT now()
deleted_at  timestamptz
```

### `events`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
series_id       uuid REFERENCES event_series(id)
name            text NOT NULL
description     text
location        text
start_at        timestamptz NOT NULL
end_at          timestamptz NOT NULL
all_day         boolean NOT NULL DEFAULT false
rsvp_enabled    boolean NOT NULL DEFAULT false
rsvp_deadline   timestamptz

-- Recurrence
is_recurring    boolean NOT NULL DEFAULT false
recurrence_rule text                             -- iCal RRULE string
recurrence_ends_at timestamptz

-- Room booking
room_id         uuid REFERENCES checkin_rooms(id)  -- reuse room table

created_by_user_id uuid NOT NULL REFERENCES users(id)
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()
deleted_at      timestamptz
```

### `event_rsvps`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
event_id        uuid NOT NULL REFERENCES events(id)
person_id       uuid NOT NULL REFERENCES people(id)
response        text NOT NULL                    -- 'yes' | 'no' | 'maybe'
guest_count     int NOT NULL DEFAULT 0
notes           text
responded_at    timestamptz NOT NULL DEFAULT now()
UNIQUE(event_id, person_id)
```

---

## Small Groups

### `groups`
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
name                text NOT NULL
description         text
leader_person_id    uuid REFERENCES people(id)
meeting_schedule    text                         -- human-readable, e.g. "Sundays at 9am"
board_id            uuid REFERENCES boards(id)  -- optional linked bulletin board
is_active           boolean NOT NULL DEFAULT true
created_at          timestamptz NOT NULL DEFAULT now()
deleted_at          timestamptz
```

### `group_members`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
group_id    uuid NOT NULL REFERENCES groups(id)
person_id   uuid NOT NULL REFERENCES people(id)
role        text NOT NULL DEFAULT 'member'       -- 'leader' | 'member'
joined_at   timestamptz NOT NULL DEFAULT now()
left_at     timestamptz
UNIQUE(group_id, person_id)
```

---

## Prayer Requests

### `prayer_requests`
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
submitter_person_id uuid REFERENCES people(id)  -- null if truly anonymous
content             text NOT NULL
visibility          text NOT NULL DEFAULT 'public' -- 'public' | 'officers_only' | 'unspoken'
-- 'unspoken': content visible, submitter_person_id hidden from non-staff

status              text NOT NULL DEFAULT 'active'  -- 'active' | 'answered' | 'archived'
answered_at         timestamptz
officer_notes       text                         -- staff/officer-only, never shown to submitter
created_at          timestamptz NOT NULL DEFAULT now()
updated_at          timestamptz NOT NULL DEFAULT now()
deleted_at          timestamptz
```

---

## Pastoral Care

### `pastoral_notes`
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
subject_person_id   uuid NOT NULL REFERENCES people(id)
author_user_id      uuid NOT NULL REFERENCES users(id)
content             text NOT NULL
note_date           date NOT NULL DEFAULT CURRENT_DATE
created_at          timestamptz NOT NULL DEFAULT now()
updated_at          timestamptz NOT NULL DEFAULT now()
deleted_at          timestamptz
```
Access: `admin`, `super_admin`, or any user with `church_status = 'officer'`.

---

## Settings

### `app_settings`
Key-value store for church configuration.
```sql
key         text PRIMARY KEY
value       text NOT NULL
updated_at  timestamptz NOT NULL DEFAULT now()
updated_by_user_id uuid REFERENCES users(id)
```
Example keys: `church_name`, `church_email`, `church_phone`, `giving_url`, `notification_sms_provider`, `notification_email_provider`

---

## Audit Log

### `audit_logs`
Append-only. Never deleted.
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
actor_user_id   uuid REFERENCES users(id)        -- null for system actions
action          text NOT NULL                    -- 'create' | 'update' | 'delete' | 'login' | 'logout'
entity_type     text NOT NULL                    -- 'person' | 'checkin_session' | etc.
entity_id       uuid
old_value       jsonb
new_value       jsonb
ip_address      inet
user_agent      text
created_at      timestamptz NOT NULL DEFAULT now()
```

---

## Notifications

### `notification_log`
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
recipient_person_id uuid REFERENCES people(id)
channel             text NOT NULL                -- 'email' | 'sms'
template_key        text                         -- e.g. 'volunteer_schedule_published'
subject             text
body                text
status              text NOT NULL DEFAULT 'queued' -- 'queued' | 'sent' | 'failed'
provider            text                         -- 'twilio' | 'brevo'
provider_message_id text
error_message       text
sent_at             timestamptz
created_at          timestamptz NOT NULL DEFAULT now()
```

---

## Key Indexes

```sql
-- People lookups
CREATE INDEX idx_people_household ON people(household_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_people_status ON people(church_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_people_name ON people(last_name, first_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_people_email ON people(email) WHERE deleted_at IS NULL AND email IS NOT NULL;

-- Check-in active sessions
CREATE INDEX idx_checkin_active ON checkin_sessions(status, room_id) WHERE status = 'checked_in';
CREATE INDEX idx_checkin_child ON checkin_sessions(child_person_id);

-- Schedule slots
CREATE INDEX idx_slots_schedule ON schedule_slots(schedule_id);
CREATE INDEX idx_slots_person ON schedule_slots(assigned_person_id);
CREATE INDEX idx_slots_date ON schedule_slots(slot_date);

-- Audit log
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- Prayer requests
CREATE INDEX idx_prayer_visibility ON prayer_requests(visibility, status) WHERE deleted_at IS NULL;
```
