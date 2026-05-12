# Development Workflow
## AI-Assisted Solo Development Guide

---

## 1. The Model

You are the architect, QA lead, and human-in-the-loop. The AI is the implementation pair. This workflow is designed to keep that division clean and productive.

---

## 2. Task Anatomy

Every implementation task should be structured as:

```
## Task: [Short Name]

### Context
What module/feature this belongs to. What already exists that this builds on.

### Goal
One clear sentence of what "done" looks like.

### Schema Changes (if any)
Exact column additions/changes with types. New tables with full definitions.
Don't leave types ambiguous.

### API Contract (if any)
Request shape (with Zod schema) and response shape.
Defined before implementation starts.

### UI Behavior (if any)
What the user sees. What happens on interaction. What error states exist.
Reference specific shadcn/ui components where known.

### Acceptance Criteria
- [ ] Specific, testable statements
- [ ] Each one is independently verifiable
- [ ] Includes the error cases, not just the happy path

### Out of Scope
Explicit list of what this task does NOT include.
Prevents scope creep from bleeding into implementation.
```

---

## 3. Feature Development Order

For every new domain module, always in this sequence:

1. **Schema** — Drizzle table definition reviewed and approved before any code
2. **Migration** — `drizzle-kit generate` run, migration file committed
3. **Types** — TypeScript types derived from schema (Drizzle inference)
4. **Domain service** — Business logic, pure functions where possible, unit-tested
5. **API routes** — Route handlers with Zod validation calling domain services
6. **UI components** — Feature components calling API routes
7. **E2E test** — Playwright test for the critical happy path

Never skip steps. Never write UI before the API contract is defined. Never write the API before the schema is finalized.

---

## 4. Testing Strategy

### Unit Tests (Vitest)
- Domain service functions that have meaningful logic
- Utility functions (claim-check code generation, schedule auto-generation algorithm, permission checks)
- Target: every function with a branch has a test

### Integration Tests (Vitest + test database)
- API route handlers with a real PostgreSQL test database
- Spin up via Docker in CI, run migrations before tests
- Test the full request → service → database → response cycle
- Target: every API route has at least happy path + auth failure tests

### E2E Tests (Playwright)
- Critical user journeys only:
  - Log in
  - Create a person + household
  - Check in a child, verify claim-check, check out
  - Generate and publish a volunteer schedule
  - Post to a bulletin board
- Not exhaustive — just enough to catch regressions in core flows

### What We Don't Test
- shadcn/ui component internals
- Database query syntax (Drizzle handles this)
- Provider API responses (mock the provider interface, not the HTTP call)

---

## 5. Schema Change Protocol

1. Edit Drizzle schema file in `src/db/schema/`
2. Run `npx drizzle-kit generate` to create migration file
3. Review the generated SQL — understand what it does
4. Run `npx drizzle-kit migrate` against dev database to verify
5. Commit schema file + migration file together, never separately
6. Never edit a migration file after it has been run against any database

---

## 6. AI Tasking Anti-Patterns to Avoid

**Don't ask for "the whole feature at once."**
Break it down. A task should be completable in one context window with review possible before the next step.

**Don't describe UI without describing the API it calls.**
Ambiguous API contracts produce ambiguous implementations that need rework.

**Don't skip the acceptance criteria.**
"Build the check-in form" is not a task. "Build the check-in form that accepts a child name search, displays allergy notes prominently, generates a claim-check code, and shows an error if the child has an unauthorized pickup flag" is a task.

**Don't let schema decisions happen inside implementation tasks.**
Schema decisions are their own step. Once approved, they don't change mid-implementation.

**Don't add dependencies without a task that justifies them.**
Every new `package.json` entry should have a named reason.

---

## 7. Commit Discipline

- One logical change per commit
- Schema changes + migration in the same commit, never split
- Tests committed with the feature they test, not separately
- No "WIP" commits pushed to main (use branches)
- Commit messages: imperative mood, describe what changes and why if non-obvious

---

## 8. Branch Strategy

Simple. Solo project:
- `main` — always deployable
- `feature/milestone-N-description` — active work
- Merge via PR even when solo (gives a review point before merging)

---

## 9. Environment Variables Discipline

- All config via environment variables, never hardcoded
- `.env.example` always up to date with every new variable
- `.env` and `.env.local` never committed
- New env vars documented with: name, required/optional, example value, what breaks if missing

---

## 10. The "Done" Check

Before closing any task, verify:
- [ ] Schema migration exists and runs cleanly
- [ ] Audit log records the mutation (if the task modifies data)
- [ ] Permission check exists in the domain service (not just the route handler)
- [ ] Input validated with Zod
- [ ] Error states handled (not just happy path)
- [ ] Mobile layout works (open in devtools responsive mode at 375px)
- [ ] No new `console.log` statements with PII
- [ ] `.env.example` updated if new env vars added
