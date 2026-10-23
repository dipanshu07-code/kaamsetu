-- ====================================================================
-- KaamSetu v2 — Category-specific verification checks, safety escalation,
-- and hardened access control for the Supabase Data API.
-- ====================================================================

-- One row per check. No identity numbers or document copies are stored:
-- `method` records HOW the check was done (e.g. original sighted in person).
CREATE TABLE IF NOT EXISTS public.verification_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
    check_type VARCHAR(30) NOT NULL CHECK (check_type IN
      ('phone', 'identity', 'address', 'reference', 'skill', 'first_aid', 'police', 'safeguarding_training')),
    slot SMALLINT NOT NULL DEFAULT 1 CHECK (slot BETWEEN 1 AND 3),
    status VARCHAR(15) NOT NULL DEFAULT 'not_started'
      CHECK (status IN ('not_started', 'pending', 'passed', 'failed', 'expired')),
    consent_given_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    -- Referee contact details (reference checks only). Visible to admins only;
    -- deleted when the check is decided or the account is deleted.
    reference_details JSONB,
    worker_note VARCHAR(500),
    method VARCHAR(60),
    provider VARCHAR(60),
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    reviewer_notes VARCHAR(1000),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (worker_id, check_type, slot)
);
CREATE INDEX IF NOT EXISTS idx_verification_status ON public.verification_checks(status);

-- Complaints can target a worker profile directly (for safety escalation)
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS accused_worker_id UUID REFERENCES public.worker_profiles(id);

-- Seed approximate locality centroids for the pilot cities.
INSERT INTO public.localities (name, name_hi, city, lat, lng) VALUES
  ('Lajpat Nagar', 'लाजपत नगर', 'Delhi NCR', 28.5677, 77.2433),
  ('Greater Kailash', 'ग्रेटर कैलाश', 'Delhi NCR', 28.5482, 77.2380),
  ('Saket', 'साकेत', 'Delhi NCR', 28.5245, 77.2066),
  ('Karol Bagh', 'करोल बाग', 'Delhi NCR', 28.6519, 77.1909),
  ('Dwarka', 'द्वारका', 'Delhi NCR', 28.5921, 77.0460),
  ('Rohini', 'रोहिणी', 'Delhi NCR', 28.7495, 77.0565),
  ('Mayur Vihar', 'मयूर विहार', 'Delhi NCR', 28.6045, 77.2950),
  ('Noida Sector 62', 'नोएडा सेक्टर 62', 'Delhi NCR', 28.6270, 77.3650),
  ('Gurugram Sector 43', 'गुरुग्राम सेक्टर 43', 'Delhi NCR', 28.4600, 77.0780),
  ('Koramangala', 'कोरमंगला', 'Bengaluru', 12.9352, 77.6245),
  ('HSR Layout', 'एचएसआर लेआउट', 'Bengaluru', 12.9116, 77.6474),
  ('Indiranagar', 'इंदिरानगर', 'Bengaluru', 12.9784, 77.6408),
  ('BTM Layout', 'बीटीएम लेआउट', 'Bengaluru', 12.9166, 77.6101),
  ('Jayanagar', 'जयनगर', 'Bengaluru', 12.9250, 77.5938),
  ('Whitefield', 'व्हाइटफ़ील्ड', 'Bengaluru', 12.9698, 77.7500),
  ('Andheri West', 'अंधेरी पश्चिम', 'Mumbai', 19.1364, 72.8296),
  ('Bandra West', 'बांद्रा पश्चिम', 'Mumbai', 19.0596, 72.8295),
  ('Powai', 'पवई', 'Mumbai', 19.1176, 72.9060),
  ('Goregaon', 'गोरेगांव', 'Mumbai', 19.1663, 72.8526),
  ('Dadar', 'दादर', 'Mumbai', 19.0178, 72.8478),
  ('Kothrud', 'कोथरूड', 'Pune', 18.5074, 73.8077),
  ('Baner', 'बानेर', 'Pune', 18.5590, 73.7868),
  ('Hinjewadi', 'हिंजवडी', 'Pune', 18.5913, 73.7389),
  ('Viman Nagar', 'विमान नगर', 'Pune', 18.5679, 73.9143),
  ('Hadapsar', 'हडपसर', 'Pune', 18.5089, 73.9260)
ON CONFLICT (name, city) DO NOTHING;

-- --------------------------------------------------------------------
-- Access control hardening
-- The application reads and writes Postgres only from its server, after
-- checking the session and role. The public Supabase Data API (anon key)
-- is therefore closed for every table: the original "public read" policy
-- on worker_profiles exposed phone numbers to anyone holding the anon key.
-- RLS stays enabled on every table as a second line of defence.
-- --------------------------------------------------------------------
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      EXECUTE format('REVOKE ALL ON public.%I FROM authenticated', t);
    END IF;
  END LOOP;
END $$;
