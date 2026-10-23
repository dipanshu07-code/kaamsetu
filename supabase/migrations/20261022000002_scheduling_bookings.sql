-- ====================================================================
-- KaamSetu v2 — Working hours, time off and conflict-free bookings
-- ====================================================================

-- Reuse worker_availability for weekly working hours. One row = one working
-- block; several blocks on the same day express breaks (e.g. 9-13 and 14-18).
ALTER TABLE public.worker_availability
  ADD COLUMN IF NOT EXISTS weekday SMALLINT CHECK (weekday BETWEEN 0 AND 6),      -- 0 = Sunday (IST)
  ADD COLUMN IF NOT EXISTS start_minute SMALLINT CHECK (start_minute BETWEEN 0 AND 1439),
  ADD COLUMN IF NOT EXISTS end_minute SMALLINT CHECK (end_minute BETWEEN 1 AND 1440);

DO $$ BEGIN
  ALTER TABLE public.worker_availability ADD CONSTRAINT worker_availability_range_check
    CHECK (start_minute IS NULL OR end_minute > start_minute);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Blocked time, breaks and leave
CREATE TABLE IF NOT EXISTS public.worker_time_off (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    kind VARCHAR(20) NOT NULL DEFAULT 'blocked' CHECK (kind IN ('blocked', 'break', 'time_off')),
    note VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS idx_time_off_worker ON public.worker_time_off(worker_id, starts_at);

-- Bookings: exact time range, price type and negotiated terms
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS service_request_id UUID,
  ADD COLUMN IF NOT EXISTS price_type VARCHAR(10),
  ADD COLUMN IF NOT EXISTS indicative_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS terms_agreed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS address_landmark VARCHAR(200),
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(80);

-- The agreed price is unknown until both sides accept an offer.
ALTER TABLE public.bookings ALTER COLUMN agreed_price DROP NOT NULL;

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'accepted', 'declined', 'confirmed', 'in_progress',
                    'completed', 'cancelled', 'disputed', 'expired'));

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_price_type_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_price_type_check
  CHECK (price_type IS NULL OR price_type IN ('hourly', 'visit', 'fixed'));

-- Backfill legacy rows (date + slot string) with a 09:00-12:00 IST window.
UPDATE public.bookings
   SET starts_at = (scheduled_date::text || ' 09:00:00+05:30')::timestamptz,
       ends_at   = (scheduled_date::text || ' 12:00:00+05:30')::timestamptz
 WHERE starts_at IS NULL;

ALTER TABLE public.bookings ALTER COLUMN starts_at SET NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN ends_at SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE public.bookings ADD CONSTRAINT bookings_time_range_check CHECK (ends_at > starts_at);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- THE double-booking guard. A worker can never hold two overlapping bookings
-- in a reserving status, regardless of how many requests race each other.
-- (If this fails on an existing database, resolve the overlapping rows first.)
DO $$ BEGIN
  ALTER TABLE public.bookings ADD CONSTRAINT bookings_no_overlap
    EXCLUDE USING gist (worker_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&)
    WHERE (status IN ('accepted', 'confirmed', 'in_progress'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_idempotency
  ON public.bookings(customer_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_worker_time ON public.bookings(worker_id, starts_at);
