-- ====================================================================
-- KaamSetu v2 — On-demand service requests, employment listings,
-- conversations and price negotiation
-- ====================================================================

-- ---------- A. On-demand requests (plumber / electrician etc.) ----------
CREATE TABLE IF NOT EXISTS public.service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_number VARCHAR(30) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.users(id),
    category_slug VARCHAR(50) NOT NULL REFERENCES public.service_categories(slug),
    problem TEXT NOT NULL CHECK (char_length(problem) BETWEEN 5 AND 2000),
    locality_id UUID REFERENCES public.localities(id),
    locality_text VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    -- Full address is disclosed only to the worker who is finally booked.
    address_house VARCHAR(200) NOT NULL,
    address_pincode VARCHAR(10),
    address_landmark VARCHAR(200),
    preferred_start TIMESTAMPTZ NOT NULL,
    preferred_end TIMESTAMPTZ NOT NULL,
    preferred_price_type VARCHAR(10) CHECK (preferred_price_type IN ('hourly', 'visit', 'fixed')),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'booked', 'cancelled', 'expired')),
    booking_id UUID REFERENCES public.bookings(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (preferred_end > preferred_start)
);
CREATE INDEX IF NOT EXISTS idx_requests_customer ON public.service_requests(customer_id, created_at DESC);

DO $$ BEGIN
  ALTER TABLE public.bookings ADD CONSTRAINT bookings_service_request_fk
    FOREIGN KEY (service_request_id) REFERENCES public.service_requests(id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Optional photos, stored in the database with strict size/type limits
-- and served only to authorised participants.
CREATE TABLE IF NOT EXISTS public.service_request_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
    mime_type VARCHAR(30) NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
    size_bytes INT NOT NULL CHECK (size_bytes BETWEEN 1 AND 2097152),
    data BYTEA NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Which workers were alerted for a request and how they responded
CREATE TABLE IF NOT EXISTS public.service_request_workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'notified'
      CHECK (status IN ('notified', 'interested', 'declined', 'selected', 'not_selected')),
    distance_km DOUBLE PRECISION,
    quote_price_type VARCHAR(10) CHECK (quote_price_type IN ('hourly', 'visit', 'fixed')),
    quote_amount DECIMAL(10, 2) CHECK (quote_amount IS NULL OR quote_amount > 0),
    note VARCHAR(500),
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (request_id, worker_id)
);
CREATE INDEX IF NOT EXISTS idx_request_workers_worker ON public.service_request_workers(worker_id, created_at DESC);

-- ---------- B. Employment listings (construction & longer-term) ----------
CREATE TABLE IF NOT EXISTS public.job_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID NOT NULL REFERENCES public.users(id),
    business_account_id UUID REFERENCES public.business_accounts(id),
    organisation_name VARCHAR(150) NOT NULL,
    title VARCHAR(150) NOT NULL,
    duties TEXT NOT NULL,
    trade_slug VARCHAR(50) REFERENCES public.service_categories(slug),
    locality_id UUID REFERENCES public.localities(id),
    locality_text VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    required_skills TEXT[] NOT NULL DEFAULT '{}',
    employment_type VARCHAR(20) NOT NULL
      CHECK (employment_type IN ('full_time', 'part_time', 'temporary', 'contract', 'daily_wage')),
    pay_min DECIMAL(10, 2) CHECK (pay_min IS NULL OR pay_min >= 0),
    pay_max DECIMAL(10, 2),
    pay_period VARCHAR(10) NOT NULL CHECK (pay_period IN ('hour', 'day', 'week', 'month')),
    schedule VARCHAR(300) NOT NULL,
    openings INT NOT NULL DEFAULT 1 CHECK (openings BETWEEN 1 AND 500),
    application_method VARCHAR(10) NOT NULL DEFAULT 'in_app' CHECK (application_method IN ('in_app', 'phone', 'email')),
    contact_value VARCHAR(150),
    status VARCHAR(10) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paused', 'closed')),
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    closes_on DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (pay_max IS NULL OR pay_min IS NULL OR pay_max >= pay_min)
);
CREATE INDEX IF NOT EXISTS idx_jobs_status_city ON public.job_listings(status, city);
CREATE INDEX IF NOT EXISTS idx_jobs_employer ON public.job_listings(employer_id);

CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
    applicant_user_id UUID NOT NULL REFERENCES public.users(id),
    cover_note VARCHAR(1000),
    status VARCHAR(20) NOT NULL DEFAULT 'submitted'
      CHECK (status IN ('submitted', 'viewed', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'withdrawn')),
    employer_note VARCHAR(1000),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (job_id, applicant_user_id)
);
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON public.job_applications(applicant_user_id);

CREATE TABLE IF NOT EXISTS public.job_application_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    changed_by_user_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saved_jobs (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, job_id)
);

-- ---------- C. Conversations ----------
-- Every conversation is tied to a request match, a booking or a job application.
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
    request_match_id UUID UNIQUE REFERENCES public.service_request_workers(id) ON DELETE CASCADE,
    job_application_id UUID UNIQUE REFERENCES public.job_applications(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (num_nonnulls(booking_id, request_match_id, job_application_id) >= 1)
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ,
    PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_participants_user ON public.conversation_participants(user_id);

CREATE TABLE IF NOT EXISTS public.price_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    proposed_by UUID NOT NULL REFERENCES public.users(id),
    price_type VARCHAR(10) NOT NULL CHECK (price_type IN ('hourly', 'visit', 'fixed')),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0 AND amount <= 1000000),
    note VARCHAR(300),
    status VARCHAR(12) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'rejected', 'superseded', 'withdrawn')),
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- At most one live offer per booking; a counteroffer supersedes the previous one.
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_offer ON public.price_offers(booking_id) WHERE status = 'open';

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id),              -- NULL for system events
    kind VARCHAR(10) NOT NULL DEFAULT 'text' CHECK (kind IN ('text', 'system', 'offer')),
    body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
    params JSONB,
    offer_id UUID REFERENCES public.price_offers(id),
    client_id VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_client_id
  ON public.messages(conversation_id, sender_id, client_id) WHERE client_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.user_blocks (
    blocker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id),
    CHECK (blocker_id <> blocked_id)
);

CREATE TABLE IF NOT EXISTS public.abuse_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES public.users(id),
    reported_user_id UUID NOT NULL REFERENCES public.users(id),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    reason VARCHAR(30) NOT NULL CHECK (reason IN ('harassment', 'threat', 'fraud', 'inappropriate', 'spam', 'other')),
    details VARCHAR(1000),
    status VARCHAR(15) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'actioned', 'dismissed')),
    admin_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
