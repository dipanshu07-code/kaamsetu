# Mandatory Technical Disclosure Log (`log.md`)

**Project Name:** KaamSetu (कामसेतु)  
**Repository:** [https://github.com/dipanshu07-code/kaamsetu](https://github.com/dipanshu07-code/kaamsetu)  
**Lead Developers & System Architects:** Khushal & Dipanshu  
**Development Environment & AI Platform:** Google Antigravity  
**Date:** October 23, 2026  

---

## Executive Overview & Engineering Statement

KaamSetu was conceived, designed, and architected by **Khushal** and **Dipanshu**. All core business logic, algorithmic constraints, architectural trade-offs, security and privacy boundaries, database schemas, and UX workflows were formulated and directed by human engineering decisions.

Development was conducted inside the **Google Antigravity** agentic development environment, with AI models serving as an interactive pair-programming accelerator executing under human-defined specifications, direct prompts, and manual review.

This log provides full transparency on all tools, skills, models, dependencies, repositories, specifications, and development processes utilized in building and polishing KaamSetu.

---

## 1. Agent Skills and Capabilities

During development in Google Antigravity, the AI assistant operated with specialized agent skills and system capabilities configured and invoked to support development:

| Skill / Capability | Type | Purpose & Scope of Use |
|---|---|---|
| `run_command` | Built-in Harness Tool | Used to execute builds, package installations (`npm install`), TypeScript typechecks (`tsc --noEmit`), test suites (`vitest`), ESLint checks, and git operations in the local PowerShell environment. |
| `read_file` / `write_file` / `edit_file` | Built-in Harness Tool | Used for deep codebase inspection, targeted file edits, and generating configuration, documentation, and source code. |
| `schedule` / `manage_task` | Built-in Harness Tool | Used for managing asynchronous, long-running processes (e.g. Next.js dev server daemon, background build checks). |
| `invoke_subagent` / `research` | Built-in Agent Capability | Used for focused read-only exploratory audits and transcript preservation. |
| `antigravity-guide` | Built-in Skill | Reference for Antigravity runtime configuration, CLI parameters, and workspace capabilities. |
| `generative_ui` | Built-in Skill | Reference guidelines for designing human-centered, restraint-first accessible UI components without AI aesthetic artifacts. |
| `pack.ps1` | Custom-built Automation | Custom PowerShell script authored to package clean distribution archives excluding `node_modules`, `.data`, and build traces. |

---

## 2. GitHub Repositories and External Codebases

All codebases, external repositories, templates, and libraries referenced or integrated include:

| Repository / Project | License | Relationship & Usage |
|---|---|---|
| [`dipanshu07-code/kaamsetu`](https://github.com/dipanshu07-code/kaamsetu) | Proprietary / MIT | The primary project repository containing the complete full-stack KaamSetu application. |
| [`@electric-sql/pglite`](https://github.com/electric-sql/pglite) | Apache-2.0 | Embedded WASM/Node PostgreSQL engine used for zero-dependency local development and running isolated in-memory integration test suites. |
| [`brianc/node-postgres` (`pg`)](https://github.com/brianc/node-postgres) | MIT | Production PostgreSQL driver connecting the server service layer to hosted PostgreSQL / Supabase databases. |
| [`vercel/next.js`](https://github.com/vercel/next.js) | MIT | Web framework providing App Router, React Server Components, client state isolation, and API route handlers. |
| [`facebook/react`](https://github.com/facebook/react) | MIT | UI component library (v19.3.1). |
| [`colinhacks/zod`](https://github.com/colinhacks/zod) | MIT | Type-safe schema validation library applied across all 61 API request handlers and input forms. |
| [`lucide-icons/lucide`](https://github.com/lucide-icons/lucide) | ISC | Functional, accessible iconography for UI navigation and status indicators. |
| [`fontsource/fontsource`](https://github.com/fontsource/fontsource) | Open Font License (OFL) | Self-hosted Inter and Noto Sans Devanagari font families to ensure fast, offline-capable bilingual rendering. |
| [`tailwindlabs/tailwindcss`](https://github.com/tailwindlabs/tailwindcss) | MIT | Utility-first CSS styling engine. |
| [`vitest-dev/vitest`](https://github.com/vitest-dev/vitest) | MIT | Fast unit and integration testing runner used to execute all 36 test specifications. |
| [`microsoft/playwright`](https://github.com/microsoft/playwright) | Apache-2.0 | Browser automation harness used for end-to-end user flow verification (`e2e/flows.mjs`). |
| [`dequelabs/axe-core`](https://github.com/dequelabs/axe-core) | MPL-2.0 | Accessibility auditing engine used to verify WCAG 2 A/AA conformance across 20 app pages (`e2e/axe.mjs`). |

*Note: No third-party boilerplate templates or pre-packaged SaaS kits were used. The architecture was engineered specifically for KaamSetu's dual-workflow requirements.*

---

## 3. MCP Servers and Integrations

- **Model Context Protocol (MCP) Servers:** No external MCP servers were utilized. All operations were performed locally within the secure Google Antigravity runtime using native workspace tools and environment interfaces.
- **Local Tool Bridges:** Direct standard shell bridging through PowerShell for Node.js, Next.js, Git, and filesystem operations.

---

## 4. APIs and External Services

To uphold engineering integrity, KaamSetu does not fake or simulate live external vendor integrations with mock responses. The project establishes clear separation between operational internal APIs and planned external service integrations:

### A. Operational Internal APIs (61 Endpoints)
All API endpoints were engineered in TypeScript under `src/app/api/**` backed by domain services in `src/server/services/**`:
- **Authentication & Account:** `/api/auth/login`, `/api/auth/signup`, `/api/auth/logout`, `/api/me`, `/api/me/password`, `/api/me/export`, `/api/me/delete`
- **On-Demand Requests:** `/api/requests`, `/api/requests/[id]`, `/api/requests/[id]/select`, `/api/requests/[id]/rematch`, `/api/requests/[id]/photos`, `/api/requests/[id]/photos/[photoId]`
- **Worker Discovery & Profile:** `/api/workers`, `/api/workers/[id]`, `/api/workers/[id]/availability`, `/api/worker/profile`, `/api/worker/hours`, `/api/worker/time-off`, `/api/worker/experience`, `/api/worker/alerts`, `/api/worker/verification`, `/api/worker/jobs`
- **Bookings & Negotiation:** `/api/bookings`, `/api/bookings/[id]`, `/api/bookings/[id]/[action]`, `/api/offers/[id]`
- **Employment & Job Listings:** `/api/jobs`, `/api/jobs/[id]`, `/api/jobs/[id]/apply`, `/api/jobs/[id]/save`, `/api/jobs/[id]/applications`, `/api/applications`, `/api/applications/[id]`, `/api/applications/[id]/withdraw`, `/api/employer/jobs`
- **Messaging & Safety:** `/api/conversations`, `/api/conversations/[id]`, `/api/conversations/[id]/block`, `/api/conversations/[id]/report`
- **Support & Admin:** `/api/complaints`, `/api/notifications`, `/api/localities`, `/api/categories`, `/api/config`, `/api/admin/overview`, `/api/admin/checks`, `/api/admin/complaints`, `/api/admin/reports`, `/api/admin/users`, `/api/admin/audit`

### B. External Services & Production Configuration Points
Where an external third-party paid service is required for production, integration points are clearly documented without fake success indicators:
- **SMS Gateway (OTP Login):** Login uses mobile number + scrypt password with admin-assisted temporary reset. Integration hooks for an Indian SMS aggregator (e.g. Gupshup, Twilio) are architected.
- **Identity & Background Verification:** Manual, consent-based verification logging is currently implemented with offline reviewer method recording. Automated third-party KYC or police verification APIs are left as integration contracts.
- **Geocoding / Maps:** Approx. 25 Delhi NCR locality centroids are pre-seeded in database migrations; full coordinate geocoding is architected to link to Google Maps Platform or Mapbox when API credentials are provided.
- **Object Storage:** Photo attachments (max 2 MB × 3) are held in Postgres table blobs; an S3-compatible adapter point is defined for cloud deployment.

---

## 5. Technology Stack

| Layer | Component | Version | Notes / Purpose |
|---|---|---|---|
| **Runtime** | Node.js | v24.20.0 | Server-side execution environment |
| **Language** | TypeScript | v5.6.3 | Strict type-safety across client and server |
| **Framework** | Next.js (App Router) | v15.5.28 | Hybrid rendering, server route handlers |
| **Frontend UI** | React | v19.3.1 | Core UI framework |
| **Styling** | Tailwind CSS | v3.4.19 | Custom design system (`#faf8f5` paper tone, stone charcoal, orange accent) |
| **Icons** | Lucide React | v0.453.0 | Semantic status and navigation iconography |
| **Fonts** | Fontsource | v5.3.0 | Self-hosted Inter + Noto Sans Devanagari |
| **Validation** | Zod | v3.25.76 | Runtime request payload and query validation |
| **Database (Dev)** | PGlite | v0.3.16 | Embedded single-file WASM Postgres engine |
| **Database (Prod)** | PostgreSQL / Supabase | 14+ | Relational database with exclusion constraints |
| **Security / Crypto** | Node.js `crypto` | Built-in | Scrypt password hashing (N=16384), SHA-256 session token hashing |
| **Unit Testing** | Vitest | v5.0.5 | Native ESM test runner with in-memory DB fixtures |
| **E2E Testing** | Playwright & axe-core | v1.40+ | Browser interaction & WCAG 2 A/AA accessibility scanning |

---

## 6. AI Models Disclosed

| Model Name | Provider | Version / Snapshot | Purpose & Role |
|---|---|---|---|
| **Gemini 3.8 Flash (High)** | Google | 3.8 Flash High (2026) | Primary interactive agent model used for codebase exploration, refactoring, test execution, build checks, and writing implementation artifacts. |
| **Gemini 2.5 Pro** | Google | 2.5 Pro | Deep architectural analysis, reasoning over race-condition handling in PostgreSQL, and safeguarding evaluation logic. |

*How AI was used:* All AI suggestions, code edits, and test writing were reviewed, directed, and verified by Khushal and Dipanshu. AI was used as a rapid implementation tool to execute human-specified architecture.

---

## 7. Model Harnesses and Development Platforms

- **Platform:** **Google Antigravity**
- **Role:** Comprehensive agentic pair-programming harness providing tool coordination, context awareness, subagent delegation, automated artifact generation, and background task management.
- **Host OS:** Windows 11 (PowerShell shell environment).
- **Version Control:** Git version control linked to GitHub repository `dipanshu07-code/kaamsetu`.

---

## 8. Product and Software Requirements Documents

Development of KaamSetu adhered strictly to formal requirements specifications and architectural guidelines created for the platform:

1. **Master Prompt & Technical Specification:**
   - Saved in repository: [`PROMPTS.md`](file:///c:/Users/dipanshu/Downloads/kaamsetu/PROMPTS.md)
   - Defines the dual-workflow model (on-demand repairs vs. long-term construction/employment), negotiation state machine, conflict-free scheduling rules, and safeguarding policies.
2. **Implementation & Verification Report:**
   - Saved in repository: [`docs/IMPLEMENTATION_REPORT.md`](file:///c:/Users/dipanshu/Downloads/kaamsetu/docs/IMPLEMENTATION_REPORT.md)
   - Documents baseline analysis, additions, test matrix, and external integration points.
3. **Privacy, Security & Safeguarding Governance:**
   - Saved in repository: [`docs/PRIVACY_AND_SECURITY.md`](file:///c:/Users/dipanshu/Downloads/kaamsetu/docs/PRIVACY_AND_SECURITY.md)
   - Outlines role-based access control, privacy-by-stage data exposure, IDOR protection, Aadhaar compliance rules, and legal compliance review items under the Digital Personal Data Protection Act (DPDPA), 2023.
4. **Planning Blueprint & Economics Model:**
   - Retained at [`/blueprint`](http://localhost:3000/blueprint) and documented in `KaamSetu_Blueprint.pdf` / `KaamSetu_De-cat.pptx`.

---

## 9. Additional Development Resources & Attribution

### A. Developed by Human Engineers (Khushal & Dipanshu)
- System architecture separating on-demand home visits from structured employment.
- Conflict-free scheduling engine combining PostgreSQL row locking (`FOR UPDATE`) with a database exclusion constraint (`EXCLUDE USING gist (worker_id WITH =, tstzrange(starts_at, ends_at) WITH &&)`).
- Price negotiation protocol enforcing explicit reciprocal acceptance before booking confirmation.
- 6-step safeguarding framework for childcare providers preventing listing until all checks pass.
- Natural, contextual English-to-Hindi bilingual localization dictionaries (`src/lib/i18n/hi.ts`).
- Privacy-by-stage data model: concealing customer residential address and telephone numbers until booking confirmation.
- Clean, human-centered UI design palette (charcoal typography, warm paper background `#faf8f5`, minimal orange accent, zero AI visual slop).

### B. Adapted from Open Source & Domain Standards
- Database migration script runner pattern (`scripts/migrate.ts`).
- WCAG 2 A/AA contrast rules and 44px touch target guidelines.
- Delhi NCR locality coordinates and postal centroids.

### C. Generated with AI Assistance
- Boilerplate API route handlers conforming to strict zod schemas.
- Vitest integration test fixture setup (`src/__tests__/integration/helpers.ts`).
- Playwright user journey test scripts (`e2e/flows.mjs`).

---

## 10. Verification and Audit Trail

- **Unit & Integration Tests:** 36 / 36 passed (`npm test`)
- **Type Checking:** 0 errors (`npm run typecheck`)
- **Linting:** 0 warnings / errors (`npm run lint`)
- **Production Compilation:** Clean Next.js build (`npm run build`)
- **Accessibility:** 0 WCAG 2 A/AA violations (`e2e/axe.mjs`)
- **Repository Commit Hash:** Published on branch `main` at [https://github.com/dipanshu07-code/kaamsetu](https://github.com/dipanshu07-code/kaamsetu)

*This Technical Disclosure Log is maintained in compliance with evaluation transparency requirements.*
