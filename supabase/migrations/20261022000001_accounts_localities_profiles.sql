-- ====================================================================
-- KaamSetu v2 — Accounts, sessions, localities, professional profiles
-- Backward compatible: only ADDs columns/tables; existing data is kept.
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Roles: add 'employer' (contractors / businesses posting longer-term jobs)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role IN ('customer', 'worker', 'employer', 'admin'));

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(2) NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS locality_id UUID,
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_preferred_language_check;
ALTER TABLE public.users ADD CONSTRAINT users_preferred_language_check
  CHECK (preferred_language IN ('en', 'hi'));

-- Server-side sessions. Only a SHA-256 hash of the session token is stored.
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token_hash CHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.user_sessions(user_id);

-- Localities with APPROXIMATE centroids (never a person's address).
-- lat/lng may be NULL; distance is then not calculated.
CREATE TABLE IF NOT EXISTS public.localities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    name_hi VARCHAR(150),
    city VARCHAR(100) NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    UNIQUE (name, city)
);

DO $$ BEGIN
  ALTER TABLE public.users ADD CONSTRAINT users_locality_fk
    FOREIGN KEY (locality_id) REFERENCES public.localities(id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Great-circle distance in km between two points.
CREATE OR REPLACE FUNCTION public.km_between(lat1 DOUBLE PRECISION, lng1 DOUBLE PRECISION,
                                             lat2 DOUBLE PRECISION, lng2 DOUBLE PRECISION)
RETURNS DOUBLE PRECISION AS $$
  SELECT CASE WHEN lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN NULL
  ELSE 6371 * 2 * asin(sqrt(
      power(sin(radians(lat2 - lat1) / 2), 2) +
      cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)))
  END
$$ LANGUAGE sql IMMUTABLE;

-- Worker profile extensions (service_radius_km is reused as max travel distance)
ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS locality_id UUID REFERENCES public.localities(id),
  ADD COLUMN IF NOT EXISTS preferred_locality_ids UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS accepts_on_demand BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS open_to_jobs BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS headline VARCHAR(160),
  ADD COLUMN IF NOT EXISTS skills TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS subcategories TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS visit_charge DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS safeguarding_hold BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS profile_assisted_by VARCHAR(150);

-- Ratings must come from real reviews only: new profiles start at 0, not 5.
ALTER TABLE public.worker_profiles ALTER COLUMN rating SET DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_worker_profiles_user ON public.worker_profiles(user_id);

-- Self-reported work history for the professional profile
CREATE TABLE IF NOT EXISTS public.worker_experience (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
    role_title VARCHAR(120) NOT NULL,
    employer_name VARCHAR(150),
    locality VARCHAR(150),
    start_month DATE NOT NULL,
    end_month DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (end_month IS NULL OR end_month >= start_month)
);
CREATE INDEX IF NOT EXISTS idx_worker_experience_worker ON public.worker_experience(worker_id);

-- New category for construction / site work profiles
INSERT INTO public.service_categories (slug, name, name_hi, icon_name, description, description_hi, starting_price, price_unit, is_enabled)
VALUES ('construction', 'Construction & Site Work', 'निर्माण और साइट का काम', 'HardHat',
        'Masons, helpers, painters and site workers for construction projects.',
        'निर्माण कार्य के लिए राजमिस्त्री, हेल्पर, पेंटर और साइट कामगार।', 700.00, 'per-day', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- In-app notifications. Text is rendered from (type, params) in the reader's language.
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(60) NOT NULL,
    params JSONB NOT NULL DEFAULT '{}',
    link VARCHAR(300),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
