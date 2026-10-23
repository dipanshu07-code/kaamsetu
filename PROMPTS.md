# KaamSetu — Master Prompts & Specification

This document preserves the specification and master prompt used for building and polishing **KaamSetu**.

---

## Master Prompt

```markdown
# MASTER PROMPT FOR CLAUDE — KAAMSETU FEATURE INTEGRATION & PRODUCTION-QUALITY POLISH

Act as a senior full-stack engineer, software architect, security engineer, UX designer, and QA specialist. You are working on **KaamSetu**, an existing local-services marketplace connecting customers, workers, and businesses.

I will provide a ZIP containing the existing project generated using Google Antigravity. Your job is to inspect the complete codebase, understand the current architecture, and implement the requested improvements directly in the existing project.

## 1. CRITICAL RULE: PRESERVE THE EXISTING PROJECT

Before changing code:

- Extract and inspect the ZIP, including the frontend, backend, database schema, authentication, API routes, environment configuration, and existing features.
- Identify the framework, dependencies, current architecture, database provider, and actual implementation status.
- Trace existing user flows and identify dependencies before modifying anything.
- Create a baseline of existing functionality and run the available build, type checks, and tests.
- Identify broken features separately from working features.

**Do not rebuild the project from scratch, replace the backend unnecessarily, change frameworks without a compelling technical reason, or remove working functionality.**

Reuse existing components, APIs, database tables, authentication, and design patterns wherever appropriate. Make backward-compatible, targeted changes. Do not replace real functionality with mock data or static UI.

If a required feature depends on an unavailable API key, service, or external integration, implement the appropriate integration structure and clearly document what remains to be configured. Never pretend that an integration is operational when it is not.

## 2. PRIORITY FEATURE: DIFFERENT WORK TYPES

KaamSetu must distinguish between short-term service requests and full-time employment opportunities.

### A. Plumbers and electricians: on-demand work

Create a simple request-and-discovery workflow:

1. A customer selects a service, enters the problem, location, preferred time, and optional photos.
2. The system identifies relevant nearby workers who match the service and availability requirements.
3. Eligible workers receive an in-app notification or job alert.
4. Workers can accept, decline, or express interest in the request.
5. The customer can compare relevant profiles and communicate with the selected worker.
6. The customer and worker can agree on the final price before confirming the job.

Support hourly rates, visit charges, and fixed quotes. Clearly distinguish indicative rates from a mutually agreed final amount.

### B. Construction and other full-time or longer-term jobs

Create a separate employment workflow for construction work and other longer-term roles.

- Employers, contractors, and businesses can publish job listings.
- Listings include job title, duties, location, required skills, employment type, expected pay or pay range, schedule, and contact or application method.
- Workers can browse, filter, save, and apply for jobs.
- Workers can publish a professional profile similar in purpose to a simple LinkedIn work profile, including skills, experience, preferred work locations, availability, and work history.
- Employers can view applications and manage candidates through clear application statuses.
- Support full-time, part-time, temporary, contract, and daily-wage opportunities where appropriate.

Do not mix long-term employment applications with immediate repair bookings. Keep the two workflows distinct but accessible from the same platform.

## 3. CHAT, NEGOTIATION AND BOOKING CONFIRMATION

Add or improve a secure customer-worker messaging system.

- Enable conversations related to a specific service request, booking, or job application.
- Allow customers and workers to discuss the issue, timing, scope, and price.
- Support a proposed amount, counteroffer, acceptance, and rejection where appropriate.
- Record the agreed price and booking terms in the relevant booking record.
- A booking must not be treated as confirmed merely because someone sends a chat message.
- Provide message timestamps, loading states, delivery/error feedback, and a way to report or block abusive users.
- Restrict conversations to authorised participants and authorised administrators where applicable.

Use the existing real-time messaging infrastructure if available. Otherwise, implement a suitable solution compatible with the existing stack. Never expose private messages through public endpoints.

## 4. AVAILABILITY AND CONFLICT-FREE SCHEDULING

This feature is essential.

When a worker accepts or confirms a booking for a specific time range, that period must be reflected in their availability.

- Show unavailable periods on the worker's calendar and relevant customer-facing profile.
- Prevent customers from booking a worker during confirmed, conflicting appointments.
- Let workers manage their regular working hours, breaks, blocked time, and time off.
- Support booking statuses such as requested, accepted, confirmed, in progress, completed, cancelled, and disputed where appropriate.
- Release reserved availability correctly when a booking is cancelled or expires.
- Handle overlapping requests and simultaneous booking attempts safely.
- Use backend/database constraints or transactions to prevent double-booking. Frontend checks alone are insufficient.
- Display only the minimum necessary availability information to other users. Never reveal another customer's identity or booking details to explain that a worker is occupied.

Use clear language such as “Unavailable at this time” rather than exposing private appointment information.

## 5. LOCATION-BASED DISCOVERY AND JOB SEARCH

Implement useful locality-based discovery for both customers and workers.

### Customer experience

- Prioritise relevant plumbers, electricians, maids, and other service providers near the customer's selected area.
- Support locality, distance, service category, availability, rate type, and relevant experience filters.
- Allow manual location or locality entry; location permission must not be mandatory.
- Use distance only when reliable location data is available.
- Rank results using relevance, proximity, availability, and applicable service filters, not fabricated ratings.

### Worker experience

- Let workers select preferred localities, a maximum practical travel distance, and areas where they are willing to work.
- Show relevant open jobs nearby, including location, job type, schedule, expected pay or pay range, and requirements.
- Let workers filter and apply for suitable opportunities.
- Avoid exposing a worker's exact home address publicly. Show approximate locality or a suitably generalised location until disclosure is necessary and consented to.

Use the existing maps or geolocation provider where configured. If it is unavailable, provide a reliable locality-based search fallback. Do not invent map results or pretend to calculate precise distances from missing coordinates.

## 6. ENGLISH AND HINDI LANGUAGE SUPPORT

Add a proper English/Hindi language switch.

- English remains the default language.
- When Hindi is selected, all user-facing interface text must change to Hindi, including navigation, buttons, labels, forms, validation errors, booking statuses, notifications, empty states, and help text.
- Include the customer, worker, employer, and administrator interfaces where applicable.
- Keep user-generated content, such as messages and job descriptions, in the language written by its author unless a genuine translation feature is implemented.
- Store language resources centrally using the existing internationalisation approach or an appropriate lightweight solution.
- Persist the user's language preference across navigation and future sessions where the existing architecture allows it.
- Use natural, understandable Hindi rather than awkward literal translations.
- Ensure Hindi text displays correctly and does not overflow layouts.
- Avoid duplicating entire pages merely to support a second language.

Do not claim that all text is translated if some interface strings remain in English.

## 7. DIFFERENTIATED VERIFICATION AND SAFETY

Verification requirements must be appropriate to the service category and risk level.

### General workers and technicians

Use proportionate, consent-based verification and clearly display verification status. Do not imply that identity verification proves competence, reliability, or safety.

### Domestic workers and maids

Support identity and reference checks where appropriate, with informed consent and secure handling of information. Do not expose personal documents to customers.

### Babysitters and childcare providers

Require a stronger safeguarding workflow before a profile can be marked as eligible for childcare work. Depending on legal requirements and available services, this may include:

- Identity verification using an authorised method.
- Consent-based document checks where legally permitted.
- References and relevant experience checks.
- Relevant qualifications or first-aid credentials where applicable.
- Appropriate background or police verification only through lawful, authorised processes.
- Clear review status, expiry or re-verification handling, and an escalation process for safety concerns.

**Aadhaar and other sensitive identity documents require special care.** Do not collect, store, or display Aadhaar numbers or copies by default. Use only legally permitted, consent-based verification methods and collect the minimum information necessary. Never bypass authentication, verification, or legal restrictions. Store sensitive records securely with restricted access and defined retention and deletion policies.

A childcare profile must not appear “verified” or eligible for booking until all required checks for the configured policy have actually passed. If a real verification provider is not configured, show an honest pending or unavailable status and document the integration requirement. Never fabricate verification results.

## 8. ACCESSIBILITY AND SIMPLICITY FOR EVERY USER

The website must be usable by people with different levels of digital literacy, including users who are unfamiliar with online platforms.

- Use simple words, clear labels, familiar actions, and short forms.
- Make the primary action on every screen obvious.
- Provide step-by-step booking and job-application flows.
- Use readable text, strong contrast, clear focus indicators, keyboard accessibility, and properly labelled controls.
- Make the website responsive on mobile phones, tablets, and desktops.
- Support understandable error messages and recovery actions.
- Provide clear empty states, loading states, confirmation messages, and cancellation flows.
- Do not rely on colour alone to convey status.
- Make Hindi and English layouts equally usable.
- Avoid unnecessary steps, technical jargon, crowded dashboards, and confusing menus.
- Where useful, provide assisted onboarding for workers who need help creating profiles.

Do not introduce intrusive animations, decorative effects, or complex interactions that make the website harder to use.

## 9. SECURITY, PRIVACY AND BACKEND RELIABILITY

Treat security and data integrity as release-blocking requirements.

- Preserve the existing authentication system unless a verified issue requires a targeted change.
- Enforce role-based access on the server for customers, workers, employers, and administrators.
- Validate and authorise every sensitive operation on the backend.
- Apply appropriate database access policies, including row-level security if supported by the current database.
- Protect personal information, identity records, private conversations, booking details, and location data.
- Keep secrets and API keys in environment variables or the appropriate secret manager. Never commit secrets to source control.
- Verify payment webhooks and external callbacks server-side where applicable.
- Prevent unauthorised access, insecure direct-object references, mass assignment, injection, and privilege escalation.
- Apply input validation, output encoding, sensible rate limits, and safe error handling.
- Use transactions and idempotency where necessary for booking confirmation, payments, and concurrent operations.
- Ensure cancellation, rescheduling, negotiation, and booking status changes remain consistent across the UI, API, and database.
- Provide privacy disclosures, consent where required, data-retention rules, and account/data deletion flows appropriate to the actual implementation.
- Do not log passwords, tokens, identity documents, payment secrets, or unnecessary personal data.
- Do not expose internal errors, stack traces, secrets, or sensitive fields to users.
- Never weaken security or disable access controls just to make a feature appear to work.

Review relevant Indian privacy, consumer, employment, payment, and childcare-safeguarding obligations. Flag requirements that need professional legal review rather than claiming legal compliance without verification.

## 10. PRESERVE AND POLISH ALL EXISTING FEATURES

Inspect the current project and retain its existing working features, including applicable customer, worker, and administrator portals, profiles, search, bookings, work history, reviews, complaints, notifications, business accounts, and any existing payment or map integrations.

Do not assume every feature listed here already exists. Confirm its status from the actual source code.

Improve consistency, error handling, usability, responsiveness, and accessibility across the complete application. Avoid creating duplicate pages, duplicate database tables, competing state-management systems, or parallel APIs that perform the same task.

## 11. DESIGN DIRECTION: NO AI SLOP

Use a restrained, professional, human-designed interface:

- Warm white or neutral backgrounds, charcoal text, and carefully used orange accents.
- Consistent typography, spacing, alignment, and component behaviour.
- Practical layouts designed around real user tasks.
- Subtle borders and limited, purposeful shadows only where needed.
- Simple icons only when they improve comprehension.
- Genuine product UI, not decorative mock dashboards.

Avoid harsh gradients, neon colours, rainbow palettes, purple-black styling, liquid-glass effects, radial orbs, dot-grid backgrounds, sparkle icons, excessive emojis, excessive rounded cards, repetitive three-card layouts, unnecessary bento grids, fake terminal windows, decorative animations, fake testimonials, fabricated statistics, and generic AI-generated slogans.

Do not add a design element just because it looks fashionable. Every element must support usability or communicate meaningful information.

## 12. IMPLEMENTATION WORKFLOW

Work in this order:

1. Inspect the ZIP and document the actual architecture and feature status.
2. Run the existing project and baseline checks where possible.
3. Identify dependencies, database migrations, API contracts, and potential regressions.
4. Propose a concise implementation plan based on the real codebase.
5. Implement the new features incrementally, reusing existing components and services.
6. Apply database migrations safely and preserve existing data.
7. Connect frontend actions to real backend operations.
8. Test role permissions, validation, concurrent bookings, chat access, and verification states.
9. Test English/Hindi switching across all relevant screens.
10. Run linting, type checks, unit tests, integration tests, and production builds where supported.
11. Fix regressions and inspect the main user flows on mobile and desktop.
12. Update environment-variable examples, setup instructions, migration instructions, and documentation.

Do not stop after writing a plan or producing mock UI. Continue to implementation wherever the supplied project and available tools permit.

If something cannot be implemented or tested because a required service, credential, or environment is missing, explain exactly what is missing and leave a clearly documented integration point rather than inventing success.

## 13. FINAL ACCEPTANCE CHECKLIST

Before declaring the work complete, verify as much as the environment permits:

- Existing project structure and working features are preserved.
- On-demand repair requests reach the correct eligible workers.
- Full-time and longer-term jobs have a separate listing and application flow.
- Customer-worker chat and price negotiation are linked to the correct request or booking.
- Confirmed appointments block conflicting time slots, including concurrent attempts.
- Customers see nearby, relevant workers; workers see nearby suitable jobs.
- English/Hindi switching updates all implemented interface strings.
- Childcare verification requirements are stricter and cannot be bypassed through the UI or API.
- Private documents, messages, addresses, and bookings are protected.
- Customer, worker, employer, and administrator permissions are enforced server-side.
- The frontend connects to the real backend and handles loading, success, and error states.
- Existing features have not been silently removed.
- No obvious broken links, dead buttons, placeholder content, clipping, or overlapping UI remain.
- Builds and tests have been run, and failures are reported honestly.

## FINAL DELIVERABLE

Modify the supplied project rather than generating a disconnected replacement.

Provide:
1. The updated project ZIP.
2. A concise summary of implemented features.
3. Database migrations and configuration steps, if required.
4. The tests and builds actually run, including failures.
5. Any external credentials or provider setup still required.
6. A clear list of incomplete items and known limitations.

Never claim that the site is production-ready, fully secure, or completely tested unless the evidence supports that statement.

**Primary objective:** Deliver a coherent, reliable, accessible KaamSetu application in which the new features work with the existing frontend and backend, without breaking current functionality or introducing unnecessary complexity.
```
