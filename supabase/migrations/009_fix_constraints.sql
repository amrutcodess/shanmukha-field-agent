-- Migration: 009_fix_constraints.sql
-- Part of Phase 1: Foundation Fixes
-- Enhances append-only security on farmer_consents to block TRUNCATE operations,
-- and adds anti-tampering trigger on farm_visits to prevent changing agent_id or farmer_id.

-- 1. Extend consent ledger immutable trigger to prevent TRUNCATE
create or replace function public.prevent_consent_truncate()
returns trigger as $$
begin
  raise exception 'farmer_consents is an immutable append-only ledger: TRUNCATE is forbidden for all roles.';
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists tr_prevent_consent_truncate on public.farmer_consents;
create trigger tr_prevent_consent_truncate
  before truncate on public.farmer_consents
  for each statement execute function public.prevent_consent_truncate();

-- 2. Anti-tampering trigger on farm_visits: prevent changing agent_id or farmer_id
create or replace function public.prevent_farm_visit_tampering()
returns trigger as $$
begin
  if not public.is_admin() then
    if new.agent_id <> old.agent_id then
      raise exception 'Cannot change agent_id on an existing farm_visit';
    end if;
    if new.farmer_id <> old.farmer_id then
      raise exception 'Cannot change farmer_id on an existing farm_visit';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists tr_prevent_farm_visit_tampering on public.farm_visits;
create trigger tr_prevent_farm_visit_tampering
  before update on public.farm_visits
  for each row execute function public.prevent_farm_visit_tampering();
