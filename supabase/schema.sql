-- ====================================================================
-- SHANMUKHA AGRITECH - SUPABASE SCHEMA FOR DEMO & PRODUCTION
-- ====================================================================

-- 1. Farmers Table (with Geotag and farm details)
CREATE TABLE IF NOT EXISTS public.farmers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_te TEXT,
    phone TEXT NOT NULL UNIQUE,
    village TEXT NOT NULL,
    village_te TEXT,
    district TEXT,
    district_te TEXT,
    mandal TEXT,
    state TEXT DEFAULT 'Telangana',
    crop TEXT NOT NULL,
    crop_te TEXT,
    acres NUMERIC NOT NULL DEFAULT 1.0,
    irrigation_type TEXT DEFAULT 'Borewell', -- 'Borewell' | 'Canal' | 'Rain-fed'
    season TEXT DEFAULT 'Kharif', -- 'Kharif' | 'Rabi' | 'Summer'
    lat NUMERIC,
    lng NUMERIC,
    accuracy NUMERIC,
    geotag_captured_at TEXT,
    avatar TEXT DEFAULT '👨‍🌾',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Partner Consents Table
CREATE TABLE IF NOT EXISTS public.consents (
    id TEXT PRIMARY KEY,
    farmer_id TEXT NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
    farmer_name TEXT NOT NULL,
    farmer_phone TEXT NOT NULL,
    farmer_village TEXT NOT NULL,
    vendor_id TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'withdrawn'
    consented_at TEXT NOT NULL,
    withdrawn_at TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY,
    farmer_id TEXT NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
    vendor_id TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    title TEXT NOT NULL,
    title_te TEXT,
    date TEXT NOT NULL,
    summary TEXT NOT NULL,
    summary_te TEXT,
    key_values JSONB NOT NULL DEFAULT '[]'::jsonb,
    advice TEXT NOT NULL,
    advice_te TEXT,
    is_new BOOLEAN NOT NULL DEFAULT true,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Alerts & Notifications Table
CREATE TABLE IF NOT EXISTS public.alerts (
    id TEXT PRIMARY KEY,
    farmer_id TEXT NOT NULL, -- farmer id or 'all'
    title TEXT NOT NULL,
    title_te TEXT,
    message TEXT NOT NULL,
    message_te TEXT,
    vendor_id TEXT,
    vendor_name TEXT,
    type TEXT NOT NULL DEFAULT 'admin', -- 'weather' | 'insurance' | 'loan' | 'soil' | 'admin'
    date TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Vendor Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    farmer_name TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Field Visit Requests Table
CREATE TABLE IF NOT EXISTS public.help_requests (
    id TEXT PRIMARY KEY,
    farmer_id TEXT,
    farmer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    village TEXT NOT NULL,
    crop TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) - OPEN POLICIES FOR DEMO SIMPLICITY
-- ====================================================================

ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open access to farmers" ON public.farmers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open access to consents" ON public.consents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open access to reports" ON public.reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open access to alerts" ON public.alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open access to activity_logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open access to help_requests" ON public.help_requests FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- REALTIME SUBSCRIPTIONS PUBLICATION
-- ====================================================================

-- Add tables to the supabase_realtime publication so mobile phones receive live updates!
ALTER PUBLICATION supabase_realtime ADD TABLE public.farmers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
