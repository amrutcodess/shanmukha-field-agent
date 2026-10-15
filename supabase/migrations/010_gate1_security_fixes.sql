-- Migration: 010_gate1_security_fixes.sql
-- Resolves all Gate 1 Blockers (B1-B6) and Small Fixes forward-only.

-- =============================================================================
-- B1. LOCK DOWN VIEWS WITH security_invoker = true
-- =============================================================================
alter view if exists public.visits_full set (security_invoker = true);
alter view if exists public.farm_visits_full set (security_invoker = true);
alter view if exists public.farmers_full set (security_invoker = true);

revoke all on public.visits_full from anon, public;
revoke all on public.farm_visits_full from anon, public;
revoke all on public.farmers_full from anon, public;

grant select on public.visits_full to authenticated;
grant select on public.farm_visits_full to authenticated;
grant select on public.farmers_full to authenticated;

-- =============================================================================
-- B2. SERVER-AUTHORITATIVE VISIT TIMES & COMPLETION TRIGGER
-- =============================================================================
-- Ensure completion validation trigger fires BEFORE INSERT as well as BEFORE UPDATE
drop trigger if exists tr_validate_farm_visit_completion on public.farm_visits;
create trigger tr_validate_farm_visit_completion
  before insert or update on public.farm_visits
  for each row execute function public.validate_farm_visit_completion();

-- Enforce server-authoritative times trigger
create or replace function public.enforce_farm_visit_authoritative_times()
returns trigger as $$
begin
  if not public.is_admin() then
    if TG_OP = 'INSERT' then
      if new.status <> 'in_progress' then
        raise exception 'Non-admins can only insert visits with status in_progress';
      end if;
      if new.ended_at is not null then
        raise exception 'Non-admins cannot specify ended_at on visit insert';
      end if;
      if new.duration_seconds is not null then
        raise exception 'Non-admins cannot specify duration_seconds on visit insert';
      end if;
      if new.time_source is distinct from 'server' then
        raise exception 'Non-admins must use time_source server';
      end if;
      -- started_at must not be self-chosen in past or future (> 10s difference from server now)
      if new.started_at is not null and abs(extract(epoch from (new.started_at - now()))) > 10 then
        raise exception 'Non-admins cannot supply self-chosen started_at; must be server-authoritative now()';
      end if;
      new.started_at := coalesce(new.started_at, now());
      new.time_source := 'server';
    elsif TG_OP = 'UPDATE' then
      if new.started_at <> old.started_at then
        raise exception 'started_at is immutable and cannot be changed';
      end if;
      if new.time_source <> old.time_source then
        raise exception 'time_source is immutable and cannot be changed';
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists tr_enforce_farm_visit_authoritative_times on public.farm_visits;
create trigger tr_enforce_farm_visit_authoritative_times
  before insert or update on public.farm_visits
  for each row execute function public.enforce_farm_visit_authoritative_times();

-- Drop generated default on client_uuid so missing value fails loudly
alter table public.farm_visits alter column client_uuid drop default;

-- =============================================================================
-- B3. CONSENT BYPASS CLOSURE
-- Remove INSERT policies on farmers and farmer_consents for authenticated roles
-- =============================================================================
drop policy if exists "Insert farmers: admin or active agent" on public.farmers;
drop policy if exists "Insert farmer_consents: admin or active agent" on public.farmer_consents;

-- Remove default on farmers.consent_status so it must be set explicitly
alter table public.farmers alter column consent_status drop default;

-- Ensure farmer_code sequence is usable by service_role and postgres
create sequence if not exists public.farmer_code_seq start with 1;
grant usage, select on sequence public.farmer_code_seq to service_role, postgres;

create or replace function public.set_farmer_code()
returns trigger as $$
begin
  if new.farmer_code is null or btrim(new.farmer_code) = '' then
    new.farmer_code := 'SA-' || lpad(nextval('public.farmer_code_seq')::text, 6, '0');
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- =============================================================================
-- B4. CLIENT-VIEWER PHONE MASKING IN THE DATABASE
-- =============================================================================
-- 1. Disallow client_viewer from reading base table public.farmers directly
drop policy if exists "Read farmers: admin, viewer, or assigned active agent" on public.farmers;
create policy "Read farmers: admin or assigned active agent"
  on public.farmers for select
  using (
    public.is_admin()
    or (
      public.is_active_agent() 
      and public.is_assigned_to_farmer(id) 
      and deleted_at is null
    )
  );

-- 2. Create dedicated masked view for viewers & admins
create or replace view public.farmers_masked
with (security_barrier = true)
as
select
  f.id,
  f.farmer_code,
  f.full_name,
  case 
    when coalesce((select (value #>> '{}')::boolean from public.app_config where key = 'client_sees_phone'), false) = true 
      then f.phone
    when f.phone is null 
      then null
    when length(f.phone) >= 4 
      then repeat('X', length(f.phone) - 4) || right(f.phone, 4)
    else 'XXXX'
  end as phone,
  f.village_id,
  f.farm_lat,
  f.farm_lng,
  f.farm_accuracy_m,
  f.consent_status,
  f.consent_verified_at,
  f.onboarded_by,
  f.deleted_at,
  f.anonymized_at,
  f.created_at,
  f.updated_at
from public.farmers f
where (public.is_admin() or public.is_client_viewer())
  and f.deleted_at is null;

create or replace view public.farmers_viewer_masked as
select * from public.farmers_masked;

-- Extended masked view with locations for dashboards
create or replace view public.farmers_full_masked
with (security_barrier = true)
as
select
  f.id,
  f.farmer_code,
  f.full_name,
  case 
    when coalesce((select (value #>> '{}')::boolean from public.app_config where key = 'client_sees_phone'), false) = true 
      then f.phone
    when f.phone is null 
      then null
    when length(f.phone) >= 4 
      then repeat('X', length(f.phone) - 4) || right(f.phone, 4)
    else 'XXXX'
  end as phone,
  f.village_id,
  vil.name as village_name,
  dis.id as district_id,
  dis.name as district_name,
  reg.id as region_id,
  reg.name as region_name,
  f.farm_lat,
  f.farm_lng,
  f.farm_accuracy_m,
  f.consent_status,
  f.consent_verified_at,
  f.onboarded_by,
  fa.agent_id as current_agent_id,
  ap.full_name as current_agent_name,
  ap.username as current_agent_username,
  f.deleted_at,
  f.anonymized_at,
  f.created_at,
  f.updated_at
from public.farmers f
left join public.villages vil on f.village_id = vil.id
left join public.districts dis on vil.district_id = dis.id
left join public.regions reg on dis.region_id = reg.id
left join public.farmer_assignments fa on f.id = fa.farmer_id and fa.unassigned_at is null
left join public.profiles ap on fa.agent_id = ap.id
where (public.is_admin() or public.is_client_viewer())
  and f.deleted_at is null;

revoke all on public.farmers_masked from anon, public;
revoke all on public.farmers_viewer_masked from anon, public;
revoke all on public.farmers_full_masked from anon, public;

grant select on public.farmers_masked to authenticated;
grant select on public.farmers_viewer_masked to authenticated;
grant select on public.farmers_full_masked to authenticated;

-- =============================================================================
-- B5. LOCATION MERGE WITH FARMERS REPOINTING & CLEAN RENAME COLLISION
-- =============================================================================
create or replace function public.admin_merge_location(
  p_type text,
  p_source_id uuid,
  p_target_id uuid
)
returns void as $$
declare
  r_colliding record;
begin
  if not public.is_admin() then
    raise exception 'Permission denied';
  end if;

  if p_source_id = p_target_id then
    raise exception 'Cannot merge a location into itself';
  end if;

  if p_type = 'village' then
    -- Repoint all farmers from source village to target village
    update public.farmers set village_id = p_target_id where village_id = p_source_id;
    -- Repoint all legacy visits from source village to target village
    update public.visits set village_id = p_target_id where village_id = p_source_id;
    -- Delete source village
    delete from public.villages where id = p_source_id;

  elsif p_type = 'district' then
    -- Handle colliding villages that have identical lower(name) in both source and target districts
    for r_colliding in (
      select s.id as source_vil_id, t.id as target_vil_id
      from public.villages s
      join public.villages t on lower(btrim(s.name)) = lower(btrim(t.name))
      where s.district_id = p_source_id
        and t.district_id = p_target_id
    ) loop
      -- Repoint farmers and visits from colliding village to the existing target village
      update public.farmers set village_id = r_colliding.target_vil_id where village_id = r_colliding.source_vil_id;
      update public.visits set village_id = r_colliding.target_vil_id where village_id = r_colliding.source_vil_id;
      delete from public.villages where id = r_colliding.source_vil_id;
    end loop;

    -- Repoint all remaining non-colliding villages to target district
    update public.villages set district_id = p_target_id where district_id = p_source_id;
    -- Delete source district
    delete from public.districts where id = p_source_id;

  elsif p_type = 'region' then
    -- Handle colliding districts between source and target regions
    for r_colliding in (
      select s.id as source_dist_id, t.id as target_dist_id
      from public.districts s
      join public.districts t on lower(btrim(s.name)) = lower(btrim(t.name))
      where s.region_id = p_source_id
        and t.region_id = p_target_id
    ) loop
      perform public.admin_merge_location('district', r_colliding.source_dist_id, r_colliding.target_dist_id);
    end loop;

    -- Repoint all remaining non-colliding districts to target region
    update public.districts set region_id = p_target_id where region_id = p_source_id;
    -- Delete source region
    delete from public.regions where id = p_source_id;

  else
    raise exception 'Merge supported for region, district, and village only';
  end if;

  -- Write audit log row for merge
  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values (
    auth.uid(),
    'merge_location',
    p_type,
    p_target_id::text,
    jsonb_build_object('type', p_type, 'source_id', p_source_id, 'target_id', p_target_id)
  );
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.admin_rename_location(
  p_type text, -- 'region', 'district', 'village'
  p_id uuid,
  p_new_name text
)
returns void as $$
declare
  v_name text;
  v_parent_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Permission denied';
  end if;

  v_name := public.to_title_case(p_new_name);

  begin
    if p_type = 'region' then
      if exists (select 1 from public.regions where lower(btrim(name)) = lower(btrim(v_name)) and id <> p_id) then
        raise exception 'A location with name "%" already exists under this parent', v_name;
      end if;
      update public.regions set name = v_name where id = p_id;

    elsif p_type = 'district' then
      select region_id into v_parent_id from public.districts where id = p_id;
      if exists (select 1 from public.districts where region_id = v_parent_id and lower(btrim(name)) = lower(btrim(v_name)) and id <> p_id) then
        raise exception 'A location with name "%" already exists under this parent', v_name;
      end if;
      update public.districts set name = v_name where id = p_id;

    elsif p_type = 'village' then
      select district_id into v_parent_id from public.villages where id = p_id;
      if exists (select 1 from public.villages where district_id = v_parent_id and lower(btrim(name)) = lower(btrim(v_name)) and id <> p_id) then
        raise exception 'A location with name "%" already exists under this parent', v_name;
      end if;
      update public.villages set name = v_name where id = p_id;

    else
      raise exception 'Rename supported for region, district, and village only';
    end if;

  exception
    when unique_violation then
      raise exception 'A location with name "%" already exists under this parent', v_name;
  end;

  -- Write audit log row for rename
  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values (
    auth.uid(),
    'rename_location',
    p_type,
    p_id::text,
    jsonb_build_object('type', p_type, 'new_name', v_name)
  );
end;
$$ language plpgsql security definer set search_path = public;

-- =============================================================================
-- B6. SEED IDEMPOTENCY & UNIQUE CATALOG INDEXES
-- =============================================================================
-- Safe deduplication of crops on staging before index creation
do $$
declare
  r record;
  v_canonical_crop_id uuid;
begin
  for r in (
    select lower(btrim(name_en)) as norm_name, count(*) as cnt
    from public.crops
    group by lower(btrim(name_en))
    having count(*) > 1
  ) loop
    select id into v_canonical_crop_id
    from public.crops
    where lower(btrim(name_en)) = r.norm_name
    order by created_at asc
    limit 1;

    -- Repoint crop_stages and crop_cycles before deleting duplicates
    update public.crop_stages set crop_id = v_canonical_crop_id
    where crop_id in (select id from public.crops where lower(btrim(name_en)) = r.norm_name and id <> v_canonical_crop_id);

    update public.crop_cycles set crop_id = v_canonical_crop_id
    where crop_id in (select id from public.crops where lower(btrim(name_en)) = r.norm_name and id <> v_canonical_crop_id);

    delete from public.crops
    where lower(btrim(name_en)) = r.norm_name and id <> v_canonical_crop_id;
  end loop;
end $$;

-- Safe deduplication of products on staging before index creation
do $$
declare
  r record;
  v_canonical_prod_id uuid;
begin
  for r in (
    select lower(btrim(name_en)) as norm_name, count(*) as cnt
    from public.products
    group by lower(btrim(name_en))
    having count(*) > 1
  ) loop
    select id into v_canonical_prod_id
    from public.products
    where lower(btrim(name_en)) = r.norm_name
    order by created_at asc
    limit 1;

    -- Repoint product_sizes and visit_purchase_items before deleting duplicates
    update public.product_sizes set product_id = v_canonical_prod_id
    where product_id in (select id from public.products where lower(btrim(name_en)) = r.norm_name and id <> v_canonical_prod_id);

    update public.visit_purchase_items set product_id = v_canonical_prod_id
    where product_id in (select id from public.products where lower(btrim(name_en)) = r.norm_name and id <> v_canonical_prod_id);

    delete from public.products
    where lower(btrim(name_en)) = r.norm_name and id <> v_canonical_prod_id;
  end loop;
end $$;

create unique index if not exists idx_crops_lower_name_en on public.crops (lower(btrim(name_en)));
create unique index if not exists idx_products_lower_name_en on public.products (lower(btrim(name_en)));

-- =============================================================================
-- SMALL FIXES
-- =============================================================================
-- 1. audit_log INSERT policy must require actor_id = auth.uid()
drop policy if exists "Insert audit_log: authenticated" on public.audit_log;
create policy "Insert audit_log: authenticated"
  on public.audit_log for insert
  with check (
    actor_id = auth.uid()
    and (public.is_admin() or public.is_active_agent() or public.is_client_viewer())
  );

-- 2. app_events INSERT policy: visit_id must belong to caller
drop policy if exists "Insert app_events: own" on public.app_events;
create policy "Insert app_events: own"
  on public.app_events for insert
  with check (
    public.is_admin()
    or (
      agent_id = auth.uid()
      and public.is_active_agent()
      and (
        visit_id is null
        or exists (
          select 1 from public.farm_visits v
          where v.id = visit_id and v.agent_id = auth.uid()
        )
      )
    )
  );

-- 3. visit_track_points.is_mock_location: drop the default (nullable)
alter table public.visit_track_points alter column is_mock_location drop default;

-- 4. Server-stamp received_at, uploaded_at, and app_events.at with a trigger
create or replace function public.set_server_timestamps()
returns trigger as $$
begin
  if TG_TABLE_NAME = 'visit_photos' then
    new.uploaded_at := now();
  elsif TG_TABLE_NAME = 'visit_track_points' then
    new.received_at := now();
  elsif TG_TABLE_NAME = 'app_events' then
    new.at := now();
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists tr_set_uploaded_at on public.visit_photos;
create trigger tr_set_uploaded_at
  before insert or update on public.visit_photos
  for each row execute function public.set_server_timestamps();

drop trigger if exists tr_set_received_at on public.visit_track_points;
create trigger tr_set_received_at
  before insert or update on public.visit_track_points
  for each row execute function public.set_server_timestamps();

drop trigger if exists tr_set_app_events_at on public.app_events;
create trigger tr_set_app_events_at
  before insert or update on public.app_events
  for each row execute function public.set_server_timestamps();
