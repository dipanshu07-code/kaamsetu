-- ====================================================================
-- KaamSetu Row Level Security (RLS) Policies
-- Ensures customer privacy, worker data protection, and admin isolation
-- ====================================================================

-- Enable RLS on core tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current authenticated user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. SERVICE CATEGORIES: Public can read enabled categories; Admins full control
CREATE POLICY "Public read enabled categories"
  ON public.service_categories FOR SELECT
  USING (is_enabled = TRUE OR public.is_admin());

CREATE POLICY "Admin manage categories"
  ON public.service_categories FOR ALL
  TO authenticated
  USING (public.is_admin());

-- 2. WORKER PROFILES: Public read; Worker update self; Admin full control
CREATE POLICY "Public read worker profiles"
  ON public.worker_profiles FOR SELECT
  USING (TRUE);

CREATE POLICY "Workers update own profile"
  ON public.worker_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin manage workers"
  ON public.worker_profiles FOR ALL
  TO authenticated
  USING (public.is_admin());

-- 3. RATE CARDS: Public read; Worker edit own cards
CREATE POLICY "Public read rate cards"
  ON public.rate_cards FOR SELECT
  USING (TRUE);

CREATE POLICY "Worker manage own rate cards"
  ON public.rate_cards FOR ALL
  TO authenticated
  USING (worker_id IN (SELECT id FROM public.worker_profiles WHERE user_id = auth.uid()));

-- 4. BOOKINGS: Customers see own; Workers see assigned; Admins see all
CREATE POLICY "Customers view own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid() OR public.is_admin());

CREATE POLICY "Workers view assigned bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (worker_id IN (SELECT id FROM public.worker_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Customers insert bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers cancel own pending bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Workers update status of assigned bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (worker_id IN (SELECT id FROM public.worker_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admin manage all bookings"
  ON public.bookings FOR ALL
  TO authenticated
  USING (public.is_admin());

-- 5. REVIEWS: Public can read; Only customers with completed bookings can insert
CREATE POLICY "Public read reviews"
  ON public.reviews FOR SELECT
  USING (TRUE);

CREATE POLICY "Customers post reviews for completed bookings"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = reviews.booking_id
        AND bookings.customer_id = auth.uid()
        AND bookings.status = 'completed'
    )
  );

-- 6. COMPLAINTS: Users see their own complaints; Admins manage all
CREATE POLICY "Users view own complaints"
  ON public.complaints FOR SELECT
  TO authenticated
  USING (raised_by_user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users submit complaints"
  ON public.complaints FOR INSERT
  TO authenticated
  WITH CHECK (raised_by_user_id = auth.uid());

CREATE POLICY "Admin manage complaints"
  ON public.complaints FOR ALL
  TO authenticated
  USING (public.is_admin());

-- 7. AUDIT LOGS: Only Admins can view and write
CREATE POLICY "Admin access audit logs"
  ON public.admin_audit_logs FOR ALL
  TO authenticated
  USING (public.is_admin());
