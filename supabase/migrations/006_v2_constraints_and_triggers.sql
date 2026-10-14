-- Migration: 006_v2_constraints_and_triggers.sql
-- Part of Phase 1: Foundation
-- Enforces: btree_gist overlap exclusion, single in-progress visit, append-only consent trigger,
-- auto farmer codes, visit completion validation, and updated_at triggers.

-- 1. Enable btree_gist extension for range exclusion constraints
create extension if not exists "btree_gist";

-- 2. Farmer assignments: exactly one active assignment per farmer
create unique index if not exists unique_active_farmer_assignment 
  on public.farmer_assignments (farmer_id) 
  where unassigned_at is null;

-- 3. Farm visits: exactly one in_progress visit per agent
create unique index if not exists unique_agent_in_progress_visit 
  on public.farm_visits (agent_id) 
  where status = 'in_progress';

-- 4. Farm visits: non-overlapping time exclusion constraint per agent (Section B4.8)
-- Prevents overlapping active or completed visits for the same agent
alter table public.farm_visits drop constraint if exists no_overlapping_agent_visits;
alter table public.farm_visits add constraint no_overlapping_agent_visits 
  exclude using gist (
    agent_id with =,
    tstzrange(started_at, coalesce(ended_at, 'infinity'::timestamptz), '[)') with &&
  ) 
  where (status in ('in_progress', 'completed', 'auto_closed'));

-- 5. Farmer consents: Immutable Append-Only Trigger (Section B4.5)
create or replace function public.prevent_consent_modification()
returns trigger as $$
begin
  raise exception 'farmer_consents is an immutable append-only ledger: UPDATE and DELETE operations are forbidden for all roles.';
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists tr_prevent_consent_modification on public.farmer_consents;
create trigger tr_prevent_consent_modification
  before update or delete on public.farmer_consents
  for each row execute function public.prevent_consent_modification();

-- 6. Auto-generated Farmer Code sequence and trigger (e.g., SA-000001)
create sequence if not exists public.farmer_code_seq start with 1;

create or replace function public.set_farmer_code()
returns trigger as $$
begin
  if new.farmer_code is null or btrim(new.farmer_code) = '' then
    new.farmer_code := 'SA-' || lpad(nextval('public.farmer_code_seq')::text, 6, '0');
  end if;
  return new;
end;
$$ language plpgsql set search_path = public;

drop trigger if exists tr_set_farmer_code on public.farmers;
create trigger tr_set_farmer_code
  before insert on public.farmers
  for each row execute function public.set_farmer_code();

-- 7. Visit completion validation trigger (Section B4.9 & B6.5)
create or replace function public.validate_farm_visit_completion()
returns trigger as $$
declare
  v_service_count integer;
begin
  if new.status = 'completed' then
    if new.observations_diagnosis is null or btrim(new.observations_diagnosis) = '' then
      raise exception 'observations_diagnosis is required to complete a visit';
    end if;
    if new.crop_stage_id is null then
      raise exception 'crop_stage_id is required to complete a visit';
    end if;

    select count(*) into v_service_count from public.visit_services where visit_id = new.id;
    if new.no_services_chosen = true and v_service_count > 0 then
      raise exception 'Cannot choose value-added services when no_services_chosen is true';
    end if;
    if new.no_services_chosen = false and v_service_count = 0 then
      raise exception 'Must choose at least one value-added service or mark no_services_chosen = true';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists tr_validate_farm_visit_completion on public.farm_visits;
create trigger tr_validate_farm_visit_completion
  before update on public.farm_visits
  for each row execute function public.validate_farm_visit_completion();

-- 8. Auto updated_at triggers
drop trigger if exists tr_farmers_updated_at on public.farmers;
create trigger tr_farmers_updated_at before update on public.farmers
  for each row execute function public.set_updated_at();

drop trigger if exists tr_crop_cycles_updated_at on public.crop_cycles;
create trigger tr_crop_cycles_updated_at before update on public.crop_cycles
  for each row execute function public.set_updated_at();

drop trigger if exists tr_farm_visits_updated_at on public.farm_visits;
create trigger tr_farm_visits_updated_at before update on public.farm_visits
  for each row execute function public.set_updated_at();

drop trigger if exists tr_crop_stages_updated_at on public.crop_stages;
create trigger tr_crop_stages_updated_at before update on public.crop_stages
  for each row execute function public.set_updated_at();

drop trigger if exists tr_product_sizes_updated_at on public.product_sizes;
create trigger tr_product_sizes_updated_at before update on public.product_sizes
  for each row execute function public.set_updated_at();

drop trigger if exists tr_value_added_services_updated_at on public.value_added_services;
create trigger tr_value_added_services_updated_at before update on public.value_added_services
  for each row execute function public.set_updated_at();
