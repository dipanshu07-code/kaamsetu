# KaamSetu (कामसेतु) — Local Services Marketplace

> **Tagline:** Connecting Local Workers with Trusted Opportunities.

KaamSetu is a two-sided local services marketplace designed for the Indian market. It connects urban households with verified local service workers (maids, cooks, electricians, plumbers, carpenters, general labour, shifting assistants) while giving workers digital ownership of their reputation through a portable **Digital Work Passport**, transparent rate cards, and 100% direct client payments with zero platform commission.

---

## 🌟 Key Features

### 1. For Customers & Households
- **Faceted Worker Discovery:** Filter workers by trade category, colony/locality (e.g. Lajpat Nagar, Koramangala, Kothrud, Andheri), availability ("Available Today"), experience, and pricing model.
- **Local Price Intelligence:** Transparent market rate benchmarks for visiting fees, repair jobs, and monthly domestic contracts so customers know what to expect before booking.
- **Digital Work Passport Inspection:** View authentic customer ratings, verified phone/screening badges, and before-and-after photographic proof of work.
- **Interactive Booking Flow:** Request bookings by selecting preferred dates, time windows, and addresses without any upfront payment.
- **One-Click Rehire & Replacement Assistance:** Quickly rebook previously hired workers or find alternative verified workers in your locality if a booking cancels.
- **Job-Linked Reviews & Grievance Desk:** Post reviews linked exclusively to completed jobs and track complaint tickets in real-time.

### 2. For Service Workers
- **Zero Commission Deductions:** 100% of customer payments go directly to the worker via UPI QR code or cash upon satisfactory job completion.
- **Portable Digital Work Passport:** Every completed job and customer review permanently enriches the worker’s digital credential record.
- **Duty Status Toggle:** Switch "Available Today" on or off with a single click from the mobile dashboard.
- **Full Booking Autonomy:** Accept or decline incoming requests based on schedule, locality, and job scope.
- **Proof-of-Work Logging:** Add repair notes and customer sign-off confirmations on-site.
- **Privacy-Conscious Onboarding:** Never asks for confidential Aadhaar numbers or bank passwords.

### 3. Administrator Console & Governance
- **Role-Based Governance:** Overview dashboard with live KPIs (Total Workers, Bookings, Completed Jobs, Cancellation Rate %, Grievance Rate %).
- **Verification Approvals Queue:** Inspect trade credentials, telephone verification, and colony reference checks to approve the "Verified Worker" badge.
- **Dispute & Grievance Resolution:** Investigate customer or worker dispute tickets, enter official mediation summaries, and resolve cases.
- **Service Safeguarding Controls:** Capability to pause or enable categories. (Childcare services are strictly disabled in the pilot pending enhanced safeguarding).
- **Administrative Audit Trail:** Immutable log of all sensitive verification, category, and dispute actions.

---

## 🏗️ Architecture & Tech Stack

- **Frontend & App Framework:** Next.js 14 App Router, React 18, TypeScript
- **Styling & UI:** Tailwind CSS, Lucide Icons, Mobile-first responsive layout
- **Database & Backend:** Supabase with PostgreSQL (15 relational tables with primary keys, foreign keys, constraints, and indexes)
- **Security & Authorization:** Supabase Row Level Security (RLS) policies isolating customer bookings, worker records, and admin privileges
- **Offline / Zero-Config Live Mode:** Stateful reactive client store (`src/lib/store.ts`) with pre-seeded authentic Indian profiles and bookings that runs interactively out-of-the-box without requiring remote credentials
- **Testing:** Automated Vitest test suite covering booking workflows, filters, price intelligence, and passport verifications

---

## 📂 Project Directory Structure

```text
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Complete Homepage with Hero, Search, Categories, FAQ
│   │   ├── layout.tsx                  # Global layout with Demo Role Switcher, Navbar, Footer
│   │   ├── globals.css                 # Tailwind directives & theme styles
│   │   ├── workers/
│   │   │   ├── page.tsx                # Faceted Worker Directory & Search
│   │   │   └── [id]/page.tsx           # Worker Profile & Digital Work Passport
│   │   ├── customer/
│   │   │   └── dashboard/page.tsx      # Customer Dashboard (Bookings, Reviews, Grievance)
│   │   ├── worker/
│   │   │   ├── dashboard/page.tsx      # Worker Dashboard (Incoming Requests, Earnings, Passport)
│   │   │   └── register/page.tsx       # Privacy-conscious worker onboarding
│   │   ├── admin/
│   │   │   └── page.tsx                # Protected Admin Console & Audit Log
│   │   ├── login/page.tsx              # OTP / 1-Click Role Login
│   │   ├── signup/page.tsx             # Customer Registration
│   │   ├── how-it-works/page.tsx       # Detailed How It Works breakdown
│   │   ├── about/page.tsx              # Mission, Pilot localities & Safety standards
│   │   ├── cancellation-policy/page.tsx# Cancellation & Replacement policy
│   │   └── grievance/page.tsx          # Grievance Redressal & Ticket Tracking Desk
│   ├── components/
│   │   ├── Navbar.tsx                  # Responsive Navigation Bar
│   │   ├── Footer.tsx                  # Footer with honest trust disclaimers
│   │   ├── RoleDemoToolbar.tsx         # 1-Click Role Switcher (Customer / Worker / Admin)
│   │   ├── WorkerCard.tsx              # Worker Card with Verified / Self-Reported badges
│   │   ├── BookingModal.tsx            # End-to-end interactive booking modal
│   │   ├── ReviewModal.tsx             # Job-linked review modal (punctuality, quality, behavior)
│   │   ├── ComplaintModal.tsx          # Grievance filing modal
│   │   ├── ReplacementAssistanceModal.tsx # Alternative worker suggestion modal
│   │   └── PriceIntelligenceCard.tsx   # Local price benchmarks and disclaimers
│   ├── lib/
│   │   ├── mock-data.ts                # Authentic Indian demo dataset (Delhi, BLR, Mumbai, Pune)
│   │   ├── store.ts                    # Stateful persistent application store
│   │   ├── supabase.ts                 # Supabase client with graceful local fallback
│   │   └── utils.ts                    # INR currency formatter, Indian phone helper, dictionary
│   ├── types/
│   │   └── index.ts                    # Complete TypeScript domain contracts
│   └── __tests__/
│       ├── booking-flow.test.ts        # Booking lifecycle & review eligibility tests
│       ├── worker-filter.test.ts       # Filtering, price intelligence, safeguarding tests
│       └── passport-verification.test.ts# Passport credentials & admin governance tests
├── supabase/
│   └── migrations/
│       ├── 20261018000001_kaamsetu_schema.sql # 15 relational tables DDL
│       ├── 20261018000002_rls_policies.sql    # Row Level Security SQL policies
│       └── 20261018000003_seed_data.sql       # Initial PostgreSQL seed data
├── .env.example                        # Template environment variables
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
> **Note:** KaamSetu runs in full interactive mode out of the box with sample data without requiring any external keys. Adding Supabase keys enables cloud database synchronization.

### 3. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Running Automated Tests
```bash
npm test
```
Runs the 14 automated test suites covering booking lifecycle, review eligibility, search filters, and passport verifications.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 🗄️ Database Setup & Migrations (Supabase)

To connect your Supabase PostgreSQL instance:
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Run the migrations in order:
   - `supabase/migrations/20261018000001_kaamsetu_schema.sql` (Creates 15 tables and indexes)
   - `supabase/migrations/20261018000002_rls_policies.sql` (Applies Row Level Security)
   - `supabase/migrations/20261018000003_seed_data.sql` (Seeds initial service categories)
4. Add your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`.

---

## 🛡️ Trust & Safeguarding Policy

- **No False Safety Guarantees:** Verification badges signify verified telephone numbers, residential screening, and skill demonstrations. They do not claim 100% foolproof safety.
- **Childcare Safeguarding:** Childcare services are intentionally locked with clear notices until in-person biometric screening and emergency child welfare protocols are operational.
- **Direct Settlements:** 0% platform cuts. Customers settle directly with workers via UPI or cash upon satisfactory work inspection.

---

## 📄 License
MIT License. Built for local Indian communities and service workers.
