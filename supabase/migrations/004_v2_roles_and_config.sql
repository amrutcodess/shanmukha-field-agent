-- Migration: 004_v2_roles_and_config.sql
-- Part of Phase 1: Foundation
-- Extends profiles roles, adds app_config table with defaults, and adds audit_log.

-- 1. Extend profiles.role check constraint to include 'client_viewer'
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check 
  check (role in ('admin', 'agent', 'client_viewer'));

-- 2. Add must_change_password column to profiles
alter table public.profiles 
  add column if not exists must_change_password boolean not null default false;

-- 3. Security Helper Function: is_client_viewer()
create or replace function public.is_client_viewer()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'client_viewer'
      and is_active = true
  );
end;
$$ language plpgsql security definer set search_path = public;

-- 4. app_config table
create table if not exists public.app_config (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

-- Seed defaults for app_config (idempotent upserts)
insert into public.app_config (key, value, description)
values
  ('visit_frequency_days', '7'::jsonb, 'Standard weekly visit cadence in days'),
  ('track_interval_seconds', '30'::jsonb, 'GPS tracking recording interval in seconds'),
  ('track_min_distance_m', '10'::jsonb, 'GPS tracking minimum movement threshold in meters'),
  ('gps_accuracy_max_m', '50'::jsonb, 'Maximum acceptable GPS accuracy in meters to begin visit'),
  ('geofence_radius_m', '200'::jsonb, 'Geofence radius around registered farm location in meters'),
  ('geofence_mode', '"flag"'::jsonb, 'Geofence violation behavior: "flag" (prompts reason) or "block"'),
  ('min_visit_minutes', '10'::jsonb, 'Minimum visit duration threshold for quality flagging'),
  ('max_visit_hours', '4'::jsonb, 'Maximum visit duration before auto-close'),
  ('min_app_version', '"2.0.0"'::jsonb, 'Minimum Android app version required to connect'),
  ('consent_notice_version', '"1.0"'::jsonb, 'Active DPDP consent notice version'),
  ('client_sees_phone', 'false'::jsonb, 'Whether client_viewer accounts see unmasked phone numbers'),
  ('client_can_export', 'false'::jsonb, 'Whether client_viewer accounts can download Excel/CSV reports'),
  ('sms_template_text', '"{{OTP}} is the OTP for consent form of Shanmukha Agritech. Giving this OTP to the Field Agent shows your consent to record your farm data."'::jsonb, 'DLT-registered SMS consent template text')
on conflict (key) do update set
  description = excluded.description,
  updated_at = now();

-- 5. audit_log table (Section B4.10)
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_log_created_at on public.audit_log (created_at desc);
create index if not exists idx_audit_log_actor_id on public.audit_log (actor_id);
create index if not exists idx_audit_log_entity on public.audit_log (entity, entity_id);
