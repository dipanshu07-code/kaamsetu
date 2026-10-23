# Implementation report — October 2026

## 1. Starting point (baseline)

Inspected from commit `c5cac59` on `dipanshu07-code/kaamsetu`:

- Next.js 14 App Router UI with customer, worker and admin pages, a worker directory and profile, a booking modal, reviews, complaints, an admin console, and a business blueprint page.
- **No backend.** All data lived in a client-side `localStorage` store (`src/lib/store.ts`) seeded from `mock-data.ts`.
  - "Login" was a role switcher with a fixed OTP `123456`.
  - Supabase migrations existed, but the app never called them.
- Several displayed facts were not backed by anything:
  - Ratings and review counts were seeded, not earned.
  - Admin "Approve" set identity, background and skill checks all to true in one click.
  - An admin "force confirm" button bypassed worker consent.
  - Price-guide numbers were labelled "Transparent Data".
- Baseline checks: 14/14 Vitest tests passed (they only asserted on object literals), `tsc` was clean and `next build` succeeded. `next lint` had no ESLint config.
- The ZIP link (OneDrive folder) was not downloaded. The work is based on the GitHub repository, which the request names as the existing project.

## 2. What was built

### Backend (new): `src/server`, `src/app/api`
- Postgres access through `pg` (`DATABASE_URL`) or embedded PGlite for local and tests, using the same SQL migrations.
- Server-side sessions, role checks, origin checks, zod validation, rate limits, and stable error codes (no internals leaked).
- 61 API route handlers covering accounts, discovery, availability, bookings, negotiation, requests, chat, jobs, verification, complaints, notifications and admin.
- Four new migrations, purely additive. Existing tables are reused (`worker_availability`, `bookings`, `booking_status_history`, `work_history`, `business_accounts`, `complaints`, `admin_audit_logs`, `verification_records` is kept).

### Feature checklist

| Requirement | Status |
| --- | --- |
| On-demand requests: service, problem, location, time, optional photos; nearby eligible workers alerted; accept/decline/interest with quote; compare; chat; select; agree price | Done |
| Hourly / visit / fixed price types; indicative vs agreed price shown separately | Done |
| Separate employment workflow: listings (title, duties, location, skills, type, pay range, schedule, contact/application method), browse/filter/save/apply, application statuses, employer candidate management | Done |
| Worker professional profile: skills, experience years, work history, preferred localities, travel distance, availability | Done |
| Chat tied to request match / booking / application; timestamps, sending/failed+retry states; report and block; participants only; admin only via report (logged) | Done (polling, not websockets) |
| Offers, counteroffers, accept/reject/withdraw; agreed price recorded on booking; chat never confirms | Done |
| Working hours with breaks, blocked time, leave; busy periods shown as "Unavailable at this time" without details; statuses requested → accepted → confirmed → in progress → completed / cancelled / declined / disputed / expired | Done |
| Release on cancel/decline/expiry; concurrent attempts safe (row lock + DB exclusion constraint) | Done |
| Reschedule (back to worker for re-acceptance, price kept) | Done |
| Locality/distance/availability/rate/experience filters; manual area entry; optional geolocation; distance only with coordinates; ranking by availability, locality match, distance (not ratings) | Done |
| Workers see nearby jobs matching trade/skills | Done |
| English/Hindi switch for all implemented interface text; persisted in cookie and on the account; user content untranslated | Done (see limitations for place names) |
| Category-specific verification; childcare requires 6 checks with expiry; consent; no Aadhaar storage; safety hold | Done (manual admin review; no provider) |
| Reviews only for own completed bookings; ratings computed from real reviews | Done |
| Account deletion, data export, privacy notice | Done |
| Existing features kept: directory, profiles, price guide, reviews, complaints/grievance tickets, admin console (KPIs, verification, complaints, bookings, category pause, audit log), cancellation policy, about, how-it-works, blueprint, `/worker/register` URL | Kept and rewired to the API |

### Removed or changed deliberately
- `src/lib/store.ts`, `RoleDemoToolbar`, `BookingModal`, `ReviewModal`, `ComplaintModal`, `ReplacementAssistanceModal` were replaced by API-backed equivalents: the booking form, inline review and dispute dialogs, and "Find another worker".
- `src/lib/supabase.ts` and `@supabase/supabase-js` were removed. The browser no longer talks to the database.
- Admin "force confirm booking" and one-click "verify everything" were removed. They contradicted the consent and verification rules.
- Inaccurate copy was rewritten:
  - phone, colony and skill "verification" that never happened;
  - "biometric screening";
  - an automatic replacement desk;
  - unsourced commission statistics;
  - "Transparent Data" on hand-written price ranges.
- The blueprint page is kept and labelled "English only, planning assumptions".
- Next.js was upgraded **14.2 → 15.5.28** with React 19, because Next 14 has unpatched critical advisories (including unauthenticated RCE in the image optimizer). Fonts are now self-hosted through `@fontsource`.

### Design
- Warm white background (`#faf8f5`), charcoal text (stone scale), one orange accent (`brand-700` `#c2410c`, 5.2:1 on white).
- Removed gradients, glass blur, pulsing dots and emoji badges.
- Shared components in `src/components/ui.tsx`:
  - labelled fields with wired hints and errors;
  - 44 px touch targets;
  - status badges that pair an icon with text, never colour alone;
  - accessible tabs and modal;
  - visible focus ring;
  - reduced-motion support.
- Step-by-step forms for signup, booking, repair request and the alert reply.

## 3. Tests and checks actually run

| Check | Result |
| --- | --- |
| `npm test` (Vitest) | **36/36 passed**: 14 original + 22 new integration tests on a real in-memory Postgres |
| `npm run typecheck` | Clean |
| `npm run lint` (ESLint 9 + `next/core-web-vitals`, newly configured) | Clean |
| `npm run build` (Next 15.5.28) | Succeeds |
| `npm audit --omit=dev` | 0 vulnerabilities |
| `npm audit` (incl. dev) | 7 (5 high, 2 moderate) in Tailwind 3's build-time file-watcher chain; see PRIVACY_AND_SECURITY.md |
| `e2e/flows.mjs` (Playwright, production build, fresh DB) | **39/39 passed**: public pages on mobile in EN and HI with no horizontal overflow; request → alert → quote → chat → select → offer acceptance → confirmed; address and phone hidden then revealed; signup; busy slot rejected in UI and by direct API call (409); schedule; job apply / shortlist / post; admin tabs; role and IDOR denials; Hindi on authenticated pages and saved to account |
| `e2e/axe.mjs` (axe-core WCAG 2 A/AA) | 0 violations on 20 pages across all roles |
| `e2e/hi-scan.mjs` | Remaining Latin text on Hindi pages is user/demo content and place names only |

Integration tests cover:
- price agreement required before confirmation, and chat not confirming;
- overlapping bookings rejected (service layer, concurrent accepts, raw DB constraint);
- working hours and breaks; time off; slot released on cancel;
- IDOR on bookings and conversations; blocking; idempotent booking creation;
- reviews limited to own completed bookings, once;
- request matching by category, distance and free time; address hidden from alerted workers; quote → offer → confirm;
- childcare hidden until all six checks pass, expiry required, referee data deleted, safety hold blocks acceptance, expired checks;
- jobs workflow with role and ownership checks; generic login errors; no admin self-signup;
- phone numbers absent from public payloads; account deletion; admin password reset; distance ranking.

Not run here: tests against a hosted Supabase project (no credentials were available), load or performance testing, screen-reader testing with real assistive technology, and testing on physical phones.

## 4. Configuration and migrations

See README → "Deploying with Supabase / Postgres". In short:
1. Set `DATABASE_URL`.
2. Run `npm run db:migrate` and `npm run create-admin`.
3. Keep `KAAMSETU_DEMO_SEED` off.

New migrations:
- `20261022000001_accounts_localities_profiles.sql`
- `20261022000002_scheduling_bookings.sql`
- `20261022000003_requests_jobs_chat.sql`
- `20261022000004_verification_safety_rls.sql`

## 5. External services still required (not integrated)

| Need | Status |
| --- | --- |
| SMS OTP login / self-service password reset | Not integrated. Login uses mobile + password; admins can issue a temporary password |
| Identity / background verification provider | Not integrated. Admins record offline checks with method and notes; the UI says so |
| Maps / geocoding | Not integrated. 25 pilot localities have approximate centroids in a migration; other areas match by locality name or city |
| Realtime messaging | Polling. Supabase Realtime or websockets can replace it |
| Payments | None by design (direct cash/UPI). Any gateway needs server-side webhook verification |
| File storage | Request photos are stored in Postgres (≤2 MB × 3). Move to object storage at scale |
| Shared rate-limit store | In-memory per instance. Use Redis or similar for multiple instances |

## 6. Known limitations

- Place names (cities in lists, localities on cards), demo data and all user content appear in their original language on Hindi pages. Hindi locality names appear in the locality picker. Numbers and times use the `hi-IN` locale with Latin digits.
- The internal blueprint page is English-only (labelled).
- Matching re-runs only when the customer taps "Alert more workers". New workers are not added to old requests automatically.
- Accepted-but-unpriced holds expire after 24 hours (or at start time), checked lazily on reads and writes, not by a scheduled job.
- Distances are area-centre to area-centre approximations.
- No notifications outside the app (SMS, WhatsApp, push).
- No admin UI to edit locality centroids or verification policies (they live in a migration and in `src/lib/domain.ts`).
- Grievance-officer contact details and the support phone number are placeholders that must be published before launch. Filing a complaint requires being logged in.
- The legal items listed in `docs/PRIVACY_AND_SECURITY.md` need professional review.
