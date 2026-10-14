-- Migration: 005_v2_tables.sql
-- Part of Phase 1: Foundation
-- Core v2 data model: farmers, assignments, consent, catalogs, cycles, and farm_visits.
-- NOTE: Never modifies or touches the legacy `visits` table.

-- 1. Farmers table
create table if not exists public.farmers (
  id uuid primary key default gen_random_uuid(),
  farmer_code text not null unique,
  full_name text not null,
  phone text not null unique,
  village_id uuid not null references public.villages(id),
  farm_lat numeric(10, 7) not null,
  farm_lng numeric(10, 7) not null,
  farm_accuracy_m numeric(8, 2),
  consent_status text not null default 'granted' check (consent_status in ('granted', 'withdrawn', 'legacy_unverified')),
  consent_verified_at timestamptz,
  onboarded_by uuid references public.profiles(id),
  deleted_at timestamptz,
  anonymized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_farmers_village_id on public.farmers (village_id);
create index if not exists idx_farmers_phone on public.farmers (phone);
create index if not exists idx_farmers_farmer_code on public.farmers (farmer_code);
create index if not exists idx_farmers_consent_status on public.farmers (consent_status);

-- 2. Farmer assignments table
create table if not exists public.farmer_assignments (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.farmers(id) on delete cascade,
  agent_id uuid not null references public.profiles(id),
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz,
  assigned_by uuid references public.profiles(id)
);

create index if not exists idx_farmer_assignments_agent on public.farmer_assignments (agent_id);
create index if not exists idx_farmer_assignments_farmer on public.farmer_assignments (farmer_id);

-- 3. Consent OTPs (service-role only; Section B4.5)
create table if not exists public.consent_otps (
  id uuid primary key default gen_random_uuid(),
  phone_hmac text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  verified_at timestamptz,
  requested_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_consent_otps_phone_hmac on public.consent_otps (phone_hmac);

-- 4. Farmer consents (Strictly Append-Only log; Section B4.5)
create table if not exists public.farmer_consents (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.farmers(id) on delete cascade,
  agent_id uuid not null references public.profiles(id),
  event text not null check (event in ('granted', 'withdrawn')),
  notice_version text not null,
  notice_language text not null check (notice_language in ('en', 'te')),
  lat numeric(10, 7),
  lng numeric(10, 7),
  accuracy_m numeric(8, 2),
  request_ip text,
  app_version text,
  created_at timestamptz not null default now()
);

create index if not exists idx_farmer_consents_farmer on public.farmer_consents (farmer_id);
create index if not exists idx_farmer_consents_created_at on public.farmer_consents (created_at desc);

-- 5. Catalogs: crop_stages, product_sizes, value_added_services
create table if not exists public.crop_stages (
  id uuid primary key default gen_random_uuid(),
  crop_id uuid not null references public.crops(id) on delete cascade,
  name_en text not null,
  name_te text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crop_stages_crop on public.crop_stages (crop_id, sort_order);

create table if not exists public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size_label text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_product_id_size_id unique (product_id, id)
);

create index if not exists idx_product_sizes_product on public.product_sizes (product_id, sort_order);

create table if not exists public.value_added_services (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_en text not null,
  name_te text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Crop cycles
create table if not exists public.crop_cycles (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.farmers(id) on delete cascade,
  crop_id uuid not null references public.crops(id),
  season text not null,
  plot_name text,
  acreage numeric(8, 2) not null check (acreage > 0),
  sowing_date date not null,
  status text not null default 'active' check (status in ('active', 'harvested', 'abandoned')),
  cohort text not null default 'advised' check (cohort in ('advised', 'comparison')),
  baseline_yield numeric(10, 2),
  baseline_yield_unit text,
  baseline_source text check (baseline_source is null or baseline_source in ('farmer_reported', 'records')),
  harvest_date date,
  harvest_total_yield numeric(10, 2),
  harvest_yield_unit text,
  yield_per_acre numeric(10, 2) generated always as (
    case when acreage > 0 and harvest_total_yield is not null 
         then round((harvest_total_yield / acreage)::numeric, 2) 
         else null end
  ) stored,
  harvest_recorded_by uuid references public.profiles(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crop_cycles_farmer on public.crop_cycles (farmer_id);
create index if not exists idx_crop_cycles_crop on public.crop_cycles (crop_id);
create index if not exists idx_crop_cycles_status on public.crop_cycles (status);

-- 7. Target visit table: farm_visits (Section B4.8)
create table if not exists public.farm_visits (
  id uuid primary key default gen_random_uuid(),
  client_uuid uuid unique not null default gen_random_uuid(),
  farmer_id uuid not null references public.farmers(id),
  crop_cycle_id uuid not null references public.crop_cycles(id),
  agent_id uuid not null references public.profiles(id),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'auto_closed', 'cancelled')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  time_source text not null default 'server' check (time_source in ('server', 'device_offline')),
  duration_seconds integer,
  start_lat numeric(10, 7) not null,
  start_lng numeric(10, 7) not null,
  start_accuracy_m numeric(8, 2),
  end_lat numeric(10, 7),
  end_lng numeric(10, 7),
  end_accuracy_m numeric(8, 2),
  start_distance_from_farm_m numeric(10, 2),
  end_distance_from_farm_m numeric(10, 2),
  outside_geofence boolean not null default false,
  outside_geofence_reason text,
  crop_stage_id uuid references public.crop_stages(id),
  das integer,
  observations_diagnosis text,
  prescription_given boolean not null default false,
  no_services_chosen boolean not null default false,
  video_link text check (video_link is null or video_link ~* '^https?://'),
  tracking_mode text not null default 'native_continuous' check (tracking_mode in ('native_continuous', 'web_basic')),
  app_version text,
  device_model text,
  cancel_reason text,
  flags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_farm_visits_farmer on public.farm_visits (farmer_id);
create index if not exists idx_farm_visits_agent on public.farm_visits (agent_id);
create index if not exists idx_farm_visits_cycle on public.farm_visits (crop_cycle_id);
create index if not exists idx_farm_visits_status on public.farm_visits (status);
create index if not exists idx_farm_visits_started_at on public.farm_visits (started_at desc);

-- 8. Visit Child Tables (Section B4.9)
create table if not exists public.visit_services (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.farm_visits(id) on delete cascade,
  service_id uuid not null references public.value_added_services(id),
  created_at timestamptz not null default now(),
  constraint unique_visit_service unique (visit_id, service_id)
);

create table if not exists public.visit_purchase_items (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.farm_visits(id) on delete cascade,
  product_id uuid not null,
  product_size_id uuid not null,
  quantity integer not null check (quantity > 0),
  product_name_snapshot text not null,
  size_label_snapshot text not null,
  created_at timestamptz not null default now(),
  constraint fk_visit_purchase_product_size 
    foreign key (product_id, product_size_id) 
    references public.product_sizes (product_id, id)
);

create table if not exists public.visit_photos (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.farm_visits(id) on delete cascade,
  kind text not null check (kind in ('field', 'prescription', 'receipt')),
  storage_path text not null,
  sha256 text not null,
  lat numeric(10, 7) not null,
  lng numeric(10, 7) not null,
  accuracy_m numeric(8, 2),
  captured_at timestamptz not null,
  uploaded_at timestamptz not null default now(),
  width integer,
  height integer
);

create index if not exists idx_visit_photos_visit on public.visit_photos (visit_id);

create table if not exists public.visit_track_points (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.farm_visits(id) on delete cascade,
  agent_id uuid not null references public.profiles(id),
  recorded_at timestamptz not null,
  received_at timestamptz not null default now(),
  lat numeric(10, 7) not null,
  lng numeric(10, 7) not null,
  accuracy_m numeric(8, 2),
  speed numeric(6, 2),
  heading numeric(6, 2),
  is_mock_location boolean default false,
  source text not null default 'fused'
);

create index if not exists idx_visit_track_points_visit on public.visit_track_points (visit_id, recorded_at);

create table if not exists public.app_events (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references public.farm_visits(id) on delete cascade,
  agent_id uuid not null references public.profiles(id),
  type text not null check (type in (
    'app_backgrounded', 'app_foregrounded',
    'gps_disabled', 'gps_enabled',
    'permission_revoked', 'network_lost', 'network_restored',
    'clock_skew_detected', 'service_restarted'
  )),
  at timestamptz not null default now(),
  details jsonb default '{}'::jsonb
);

create index if not exists idx_app_events_visit on public.app_events (visit_id);
