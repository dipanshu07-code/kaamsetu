-- ====================================================================
-- KaamSetu Marketplace Database Schema
-- Tables: 15 core entities with constraints, foreign keys, and indexes
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(15) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'worker', 'admin')),
    locality VARCHAR(150),
    city VARCHAR(100) DEFAULT 'Delhi NCR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SERVICE CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_hi VARCHAR(100),
    icon_name VARCHAR(50) NOT NULL,
    description TEXT,
    description_hi TEXT,
    starting_price DECIMAL(10, 2) DEFAULT 0.00,
    price_unit VARCHAR(30) DEFAULT 'per-visit',
    is_enabled BOOLEAN DEFAULT TRUE,
    disabled_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WORKER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.worker_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    full_name_hi VARCHAR(150),
    phone VARCHAR(15) NOT NULL,
    avatar_url TEXT,
    category_slug VARCHAR(50) NOT NULL REFERENCES public.service_categories(slug),
    experience_years INT NOT NULL DEFAULT 0,
    city VARCHAR(100) NOT NULL,
    locality VARCHAR(150) NOT NULL,
    service_radius_km INT DEFAULT 8,
    languages TEXT[] DEFAULT ARRAY['Hindi'],
    is_available_today BOOLEAN DEFAULT TRUE,
    pricing_basis VARCHAR(30) DEFAULT 'per-visit' CHECK (pricing_basis IN ('per-visit', 'per-hour', 'per-day', 'per-month', 'quoted')),
    base_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    bio TEXT,
    bio_hi TEXT,
    verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
    rating DECIMAL(3, 2) DEFAULT 5.00,
    review_count INT DEFAULT 0,
    completed_jobs_count INT DEFAULT 0,
    on_time_arrival_rate_percent INT DEFAULT 100,
    is_demo_profile BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WORKER SERVICES
CREATE TABLE IF NOT EXISTS public.worker_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
    service_category_slug VARCHAR(50) NOT NULL REFERENCES public.service_categories(slug),
    subcategory_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RATE CARDS TABLE
CREATE TABLE IF NOT EXISTS public.rate_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
    service_title VARCHAR(150) NOT NULL,
    pricing_basis VARCHAR(30) NOT NULL CHECK (pricing_basis IN ('per-visit', 'per-hour', 'per-day', 'per-month', 'quoted')),
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. WORKER AVAILABILITY TABLE
CREATE TABLE IF NOT EXISTS public.worker_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. VERIFICATION RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.verification_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
    phone_verified BOOLEAN DEFAULT FALSE,
    address_verified BOOLEAN DEFAULT FALSE,
    skills_assessed BOOLEAN DEFAULT FALSE,
    police_verification_filed BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verifier_admin_id UUID REFERENCES public.users(id),
    verifier_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number VARCHAR(30) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.users(id),
    worker_id UUID NOT NULL REFERENCES public.worker_profiles(id),
    service_category_slug VARCHAR(50) NOT NULL REFERENCES public.service_categories(slug),
    service_title VARCHAR(150) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed')),
    scheduled_date DATE NOT NULL,
    scheduled_time_slot VARCHAR(50) NOT NULL,
    address_house VARCHAR(200) NOT NULL,
    address_locality VARCHAR(150) NOT NULL,
    address_city VARCHAR(100) NOT NULL,
    address_pincode VARCHAR(10),
    job_description TEXT NOT NULL,
    pricing_basis VARCHAR(30) NOT NULL,
    agreed_price DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(30) DEFAULT 'cash_on_completion',
    payment_status VARCHAR(30) DEFAULT 'pending',
    proof_of_work_notes TEXT,
    proof_of_work_photos TEXT[],
    cancelled_by VARCHAR(20),
    cancellation_reason TEXT,
    has_review BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. BOOKING STATUS HISTORY
CREATE TABLE IF NOT EXISTS public.booking_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL,
    note TEXT,
    created_by_user_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. WORK HISTORY / DIGITAL PASSPORT ENTRIES
CREATE TABLE IF NOT EXISTS public.work_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id),
    project_title VARCHAR(150) NOT NULL,
    description TEXT,
    locality VARCHAR(100),
    completion_date DATE NOT NULL,
    customer_rating INT CHECK (customer_rating BETWEEN 1 AND 5),
    verified_by_platform BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.users(id),
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    punctuality_rating INT CHECK (punctuality_rating BETWEEN 1 AND 5),
    work_quality_rating INT CHECK (work_quality_rating BETWEEN 1 AND 5),
    politeness_rating INT CHECK (politeness_rating BETWEEN 1 AND 5),
    comment TEXT,
    is_verified_job BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.users(id),
    worker_id UUID NOT NULL REFERENCES public.worker_profiles(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    payment_mode VARCHAR(50) DEFAULT 'upi_direct' CHECK (payment_mode IN ('cash_on_completion', 'upi_direct', 'gateway_razorpay', 'pending')),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_reference VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. COMPLAINTS & GRIEVANCES TABLE
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(30) UNIQUE NOT NULL,
    booking_id UUID REFERENCES public.bookings(id),
    raised_by_user_id UUID NOT NULL REFERENCES public.users(id),
    accused_user_id UUID REFERENCES public.users(id),
    category VARCHAR(50) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'under_investigation', 'resolved', 'dismissed')),
    resolution_notes TEXT,
    resolved_by_admin_id UUID REFERENCES public.users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. BUSINESS ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.business_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name VARCHAR(150) NOT NULL,
    gstin VARCHAR(20),
    contact_person_id UUID NOT NULL REFERENCES public.users(id),
    billing_address TEXT,
    service_contract_type VARCHAR(50) DEFAULT 'residential_facility',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. ADMIN AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES public.users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR HIGH-PERFORMANCE SEARCH
CREATE INDEX IF NOT EXISTS idx_workers_category ON public.worker_profiles(category_slug);
CREATE INDEX IF NOT EXISTS idx_workers_locality ON public.worker_profiles(locality);
CREATE INDEX IF NOT EXISTS idx_workers_city ON public.worker_profiles(city);
CREATE INDEX IF NOT EXISTS idx_workers_availability ON public.worker_profiles(is_available_today);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_worker ON public.bookings(worker_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_reviews_worker ON public.reviews(worker_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
