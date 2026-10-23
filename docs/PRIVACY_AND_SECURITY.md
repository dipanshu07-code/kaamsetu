# Privacy, security and safeguarding

This describes what the code does today. It is **not** a legal opinion, and items marked "Needs legal review" must be checked by a qualified Indian lawyer before public launch.

## Access control (server-side)

- Every API route resolves the session on the server and checks the role (`requireActor`, `requireWorker`).
- Every record lookup checks ownership or participation. Non-participants get `404`, so they can't learn whether an ID exists (IDOR protection; covered by tests).
- Admins cannot self-register. They are created with `npm run create-admin`.
- Admins **cannot** confirm bookings or mark verification checks passed without a method and notes, and every admin action is written to `admin_audit_logs`.
- Admins can read a private conversation **only through an abuse report**, and that access is audit-logged.
- Mass assignment: profile updates use explicit field whitelists (zod schemas → named columns).
- SQL: parameterised queries only. `ILIKE` input is escaped.
- The Supabase Data API (anon key) is closed for all tables, and RLS stays enabled as defence in depth.

## Authentication and sessions

- Passwords are hashed with scrypt (N=16384) and a per-user salt.
- Sessions use a random 256-bit token in an httpOnly, SameSite=Lax cookie (Secure in production). Only its SHA-256 hash is stored. Sessions expire after 30 days and are revoked on password change, suspension and account deletion.
- Writes are refused when the `Origin` header doesn't match the host (CSRF defence alongside SameSite).
- Rate limits cover login (per phone and per IP), signup, messages, bookings, requests, offers, photo uploads, reports and exports. **They are in-memory and per server instance**; use a shared store (e.g. Redis) when running more than one instance.
- Login errors don't reveal whether a number is registered.
- **Not implemented:** SMS OTP login and self-service password reset, because no SMS provider is configured. Instead, an admin can reset a password from Admin → Users after confirming the person's identity by phone. This generates a one-time temporary password, revokes all sessions and writes an audit-log entry. The public support contact this relies on must be published before launch.

## Data handling

| Data | Stored | Who can see it |
| --- | --- | --- |
| Customer address | On request / booking | The customer; the worker **after accepting**; admins |
| Phone numbers | Users, worker profile | The other party **only while a booking is confirmed / in progress**; admins. Never in public profiles, search, or to employers |
| Location | Locality centroid only (approximate) | Public at area level. Browser geolocation is rounded to ~1 km, used for that search, never stored |
| Messages | `messages` | Conversation participants; admins only via an abuse report (logged) |
| Request photos | `service_request_photos` (≤2 MB, JPEG/PNG/WebP by magic bytes, ≤3) | The customer, the workers alerted for that request, admins. Served with `nosniff` and a restrictive CSP |
| Verification | Check type, status, method, reviewer, dates | Status is public; notes and referee details are admin-only. Referee details are deleted once the check is decided |
| Identity numbers / document copies | **Never collected** | — |

Logging: unexpected errors log only the error class, code and a truncated message, never request bodies, passwords, tokens or personal data.

**Account deletion** (`/account`):
- Removes the name, phone, profile, skills, work history, time off, saved jobs, notifications and sessions.
- Cancels upcoming bookings, notifying the other party.
- Closes job posts and withdraws applications.
- Keeps booking, review and complaint rows without the person's name.

**Data export:** a JSON file of the user's own records.

## Safeguarding (childcare)

- Policy lives in `src/lib/domain.ts` (`verificationPolicy`) and is enforced on the server in search, direct booking, booking acceptance, offer acceptance, request matching and worker selection.
- Required checks: identity, reference ×2, police verification, first aid, safeguarding training. Police, first aid, training and references need an expiry date when passed, and expired checks stop eligibility automatically.
- The worker must give consent before a check can be recorded.
- A `safety_concern` complaint against a worker sets `safeguarding_hold`, which makes them ineligible for any category with mandatory checks until an admin lifts it with a recorded note.
- **No automated verification provider is integrated.** `VERIFICATION_PROVIDER` is a placeholder; the UI tells workers and admins this. A real integration must be lawful and consent-based. In particular, do **not** use Aadhaar authentication unless the platform is legally permitted to.

## Needs legal review (not claimed as compliant)

- **Digital Personal Data Protection Act, 2023 and its Rules:** notice content, consent records, retention periods for bookings and complaints (marked "to be finalised" in the privacy notice), grievance officer appointment, breach notification process, and children's data (relevant once childcare is enabled).
- **Aadhaar Act / UIDAI rules:** whether any Aadhaar-based verification is permitted at all for this platform.
- **Police verification:** the lawful process in each state for domestic workers and childcare providers, and how certificates may be recorded.
- **Consumer Protection (E-Commerce) Rules, 2020:** marketplace disclosures, grievance officer details (placeholder text exists), and display of seller (worker) information.
- **Labour law:** minimum wages for posted jobs (employers are reminded; nothing is enforced), the Code on Social Security 2020 provisions on gig and platform workers, and contractor obligations for construction (BOCW).
- **Payments:** none are processed. Any future gateway needs server-side webhook signature verification and idempotency, and RBI guidelines apply.
- **Childcare:** safeguarding standards and liability before enabling the category.

## Remaining dependency advisories

`npm audit --omit=dev` reports 0 vulnerabilities. Dev-only advisories remain in Tailwind CSS 3's file-watching dependencies (`braces`, `micromatch`, `postcss-selector-parser`). They affect only the build tool processing untrusted glob patterns, which this project never does. Migrating to Tailwind 4 removes them.
