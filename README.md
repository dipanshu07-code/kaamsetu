# KaamSetu (कामसेतु)

A local-work platform for India with two separate workflows:

1. **Repairs and home visits** (plumbers, electricians, maids and other helpers). A customer posts a problem, the nearby workers who are free at that time get an alert, the customer compares replies, chats, and agrees a price. Customers can also book a specific worker directly.
2. **Longer-term jobs** (construction and other trades). Employers post full-time, part-time, temporary, contract or daily-wage jobs, and workers apply with a professional profile.

The interface is available in **English and Hindi**. Customers pay workers directly in cash or by UPI, and KaamSetu takes no commission.

> **Status:** pilot-quality software. It has automated and end-to-end tests (see [docs/IMPLEMENTATION_REPORT.md](docs/IMPLEMENTATION_REPORT.md)) but has **not** had a professional security audit or legal review. Do not describe it as production-ready, fully secure or legally compliant.

---

## Architecture

| Layer | Technology |
| --- | --- |
| App framework | Next.js 15 (App Router), React 19, TypeScript |
| UI | Tailwind CSS, lucide-react icons, self-hosted Inter + Noto Sans Devanagari fonts |
| API | Next.js route handlers under `src/app/api/**` (thin), with business logic in `src/server/services/**` |
| Database | PostgreSQL. Production uses `pg` and `DATABASE_URL` (e.g. Supabase Postgres). Local dev and tests use **PGlite**, an embedded Postgres running the same SQL |
| Auth | Mobile number + password (scrypt), opaque session token in an httpOnly SameSite=Lax cookie; only a SHA-256 hash is stored server-side |
| Validation | zod on every request body and query |
| i18n | `src/lib/i18n/{en,hi}.ts` flat dictionaries. TypeScript fails the build if a Hindi key is missing |
| Realtime | Polling (chat every 4 s, unread counts every 30 s). No realtime provider is configured |

```
src/
  app/                  pages (client components) and app/api route handlers
  components/           ui.tsx (design system), domain.tsx, ChatPanel, forms/…
  lib/                  domain.ts (shared rules), i18n/, api.ts, session.tsx, mock-data.ts (demo seed source)
  server/
    db.ts               pg / PGlite driver, migration runner
    auth.ts http.ts     sessions, roles, origin check, rate limiting, error handling
    seed.ts             labelled demo data
    services/           accounts, workers, bookings, requests, chat, jobs, verification, support, admin
supabase/migrations/    SQL migrations (the 3 original files + 4 new ones)
scripts/                migrate.ts, create-admin.ts
```

## Running locally

```bash
npm install
npm run dev            # http://localhost:3000
```

With no `DATABASE_URL`, an embedded Postgres is created in `.data/pglite`, migrations run automatically, and **labelled demo data** is seeded. The demo accounts all use the password `demo-pass-123` (override with `KAAMSETU_DEMO_PASSWORD`), and the login page shows one-tap buttons for them:

| Role | Mobile |
| --- | --- |
| Customer (Priya) | 9812345678 |
| Electrician (Rameshwar) | 9810123456 |
| Plumber (Arjun) | 9811122233 |
| Employer (Malhotra Constructions) | 9800000002 |
| Admin | 9800000001 |

Demo workers carry a "Demo profile" label and demo jobs a "Demo listing" label. **No ratings, reviews or passed verification checks are seeded**; those only come from real activity.

To reset local data, stop the server and delete `.data/`.

## Commands

```bash
npm test               # unit + integration tests (in-memory Postgres)
npm run typecheck
npm run build && npm start
npm run db:migrate     # apply migrations to DATABASE_URL (or local PGlite)
ADMIN_PHONE=… ADMIN_NAME=… ADMIN_PASSWORD=… npm run create-admin
```

## Deploying with Supabase / Postgres

1. Create a Supabase project, or any Postgres 14+ with the `btree_gist` and `uuid-ossp` extensions available.
2. Set `DATABASE_URL` to the **server-side** connection string. Keep it secret: it is never sent to the browser.
3. Run `npm run db:migrate`.
   - On a database where the original three SQL files were already pasted into the SQL editor, the runner detects the existing tables and marks those three as applied.
   - If `bookings_no_overlap` fails to apply, the database already contains overlapping bookings. Resolve them first.
4. Create an admin: `npm run create-admin`.
5. Leave `KAAMSETU_DEMO_SEED` unset or `false`.
6. Deploy (`npm run build && npm start`, or a Node host).

PGlite stores data on local disk, so **serverless hosts need `DATABASE_URL`**.

Migration `20261022000004` **revokes all anon/authenticated access** to public tables through the Supabase Data API, because the app reads and writes only from its server. It also keeps RLS enabled as a second layer. If you later want to query Supabase directly from the browser, you must design and grant those policies deliberately.

## Key behaviours

- **Conflict-free scheduling.** A worker's time is reserved from *accepted* through *in progress*. Overlaps are refused by the service layer (row lock, plus working hours, time off and existing bookings) **and** by a Postgres exclusion constraint, so simultaneous attempts cannot double-book. Cancelling, declining or expiry releases the time. Other users only ever see "Unavailable at this time".
- **Price agreement.** A booking becomes *confirmed* only when one party accepts the other's price offer. Chat messages never confirm anything.
- **Privacy by stage.**
  - Workers see only the locality until they accept a booking.
  - Phone numbers are exchanged only once a booking is confirmed.
  - Workers are shown publicly at area level only, never their home address.
- **Childcare safeguarding.** The category is paused by default. Even when enabled, a worker is listed and bookable only once identity, two references, police verification, first aid and child-safety training checks have all passed and are unexpired. A safety complaint puts the worker on hold immediately.
- **No identity documents are stored.** Checks record *how* they were done (e.g. "original document seen in person"), never an Aadhaar number or a copy.

See [docs/PRIVACY_AND_SECURITY.md](docs/PRIVACY_AND_SECURITY.md) for controls and open legal questions, and [docs/IMPLEMENTATION_REPORT.md](docs/IMPLEMENTATION_REPORT.md) for what was changed, what was tested and the known limitations.
