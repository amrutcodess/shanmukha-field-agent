-- Migration: 001_init.sql
-- Shanmukha Agritech: Field Agent Tracking Database Schema (Idempotent)

-- Enable Extensions
create extension if not exists "pgcrypto";

-- Helper Function: Check if current user is active admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() 
      and role = 'admin' 
      and is_active = true
  );
end;
$$ language plpgsql security definer set search_path = public;

-- Profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'agent')),
  full_name text not null,
  username text not null unique,
  phone text,
  is_active boolean not null default true,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'te')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Location Hierarchy
create table if not exists public.regions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists regions_lower_name_idx on public.regions (lower(btrim(name)));

create table if not exists public.districts (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.regions(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists districts_region_lower_name_idx on public.districts (region_id, lower(btrim(name)));

create table if not exists public.villages (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references public.districts(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists villages_district_lower_name_idx on public.villages (district_id, lower(btrim(name)));

-- Crops & Products Catalogs
create table if not exists public.crops (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_te text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_te text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Visits Table
create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  client_uuid uuid unique default gen_random_uuid(),
  agent_id uuid not null references public.profiles(id),
  village_id uuid not null references public.villages(id),
  visited_at timestamptz not null default now(),
  duration_minutes integer not null check (duration_minutes > 0),
  farmer_name text not null,
  farmer_phone text,
  crop_id uuid references public.crops(id),
  crop_other text,
  diagnosis text not null,
  prescription text not null,
  product_id uuid references public.products(id),
  product_other text,
  purchased boolean not null default false,
  purchase_amount numeric(10, 2),
  purchase_image_path text,
  status text not null default 'pending' check (status in ('pending', 'final', 'closed')),
  finalized_at timestamptz,
  latitude numeric,
  longitude numeric,
  diagnosis_en text,
  prescription_en text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint check_final_visit check (
    status <> 'final' or (purchased = true and purchase_image_path is not null)
  )
);

-- Visit Audit Table
create table if not exists public.visit_audit (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id) on delete cascade,
  changed_by uuid references public.profiles(id),
  action text not null,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

-- Indexing for performance
create index if not exists idx_visits_agent_id on public.visits(agent_id);
create index if not exists idx_visits_visited_at on public.visits(visited_at desc);
create index if not exists idx_visits_village_id on public.visits(village_id);
create index if not exists idx_visits_status on public.visits(status);
create index if not exists idx_visits_purchased on public.visits(purchased);
create index if not exists idx_visits_deleted_at on public.visits(deleted_at);

-- Updated_at auto-trigger function
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_profiles_updated_at on public.profiles;
create trigger tr_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists tr_regions_updated_at on public.regions;
create trigger tr_regions_updated_at before update on public.regions for each row execute function public.set_updated_at();

drop trigger if exists tr_districts_updated_at on public.districts;
create trigger tr_districts_updated_at before update on public.districts for each row execute function public.set_updated_at();

drop trigger if exists tr_villages_updated_at on public.villages;
create trigger tr_villages_updated_at before update on public.villages for each row execute function public.set_updated_at();

drop trigger if exists tr_crops_updated_at on public.crops;
create trigger tr_crops_updated_at before update on public.crops for each row execute function public.set_updated_at();

drop trigger if exists tr_products_updated_at on public.products;
create trigger tr_products_updated_at before update on public.products for each row execute function public.set_updated_at();

drop trigger if exists tr_visits_updated_at on public.visits;
create trigger tr_visits_updated_at before update on public.visits for each row execute function public.set_updated_at();

-- Visit Audit trigger
create or replace function public.audit_visit_changes()
returns trigger as $$
begin
  insert into public.visit_audit (visit_id, changed_by, action, old_values, new_values)
  values (
    new.id,
    auth.uid(),
    case 
      when TG_OP = 'INSERT' then 'CREATE'
      when new.deleted_at is not null and old.deleted_at is null then 'SOFT_DELETE'
      when new.status = 'final' and old.status <> 'final' then 'MARK_FINAL'
      when new.status = 'closed' and old.status <> 'closed' then 'MARK_CLOSED'
      else 'UPDATE'
    end,
    to_jsonb(old),
    to_jsonb(new)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_visits_audit on public.visits;
create trigger tr_visits_audit after update on public.visits for each row execute function public.audit_visit_changes();

-- Helper function to format Title Case for location names
create or replace function public.to_title_case(p_text text)
returns text as $$
begin
  return initcap(lower(regexp_replace(btrim(p_text), '\s+', ' ', 'g')));
end;
$$ language plpgsql immutable;

-- Location RPC get_or_create_location
create or replace function public.get_or_create_location(
  p_region text,
  p_district text,
  p_village text
)
returns table (
  village_id uuid,
  district_id uuid,
  region_id uuid
) as $$
declare
  v_reg_name text;
  v_dist_name text;
  v_vil_name text;
  v_reg_id uuid;
  v_dist_id uuid;
  v_vil_id uuid;
begin
  v_reg_name := public.to_title_case(p_region);
  v_dist_name := public.to_title_case(p_district);
  v_vil_name := public.to_title_case(p_village);

  if v_reg_name = '' or v_dist_name = '' or v_vil_name = '' then
    raise exception 'Region, District, and Village names cannot be empty';
  end if;

  -- 1. Region
  select r.id into v_reg_id
  from public.regions r
  where lower(btrim(r.name)) = lower(v_reg_name)
  limit 1;

  if v_reg_id is null then
    insert into public.regions (name)
    values (v_reg_name)
    returning id into v_reg_id;
  end if;

  -- 2. District
  select d.id into v_dist_id
  from public.districts d
  where d.region_id = v_reg_id and lower(btrim(d.name)) = lower(v_dist_name)
  limit 1;

  if v_dist_id is null then
    insert into public.districts (region_id, name)
    values (v_reg_id, v_dist_name)
    returning id into v_dist_id;
  end if;

  -- 3. Village
  select vil.id into v_vil_id
  from public.villages vil
  where vil.district_id = v_dist_id and lower(btrim(vil.name)) = lower(v_vil_name)
  limit 1;

  if v_vil_id is null then
    insert into public.villages (district_id, name)
    values (v_dist_id, v_vil_name)
    returning id into v_vil_id;
  end if;

  return query select v_vil_id, v_dist_id, v_reg_id;
end;
$$ language plpgsql security definer set search_path = public;

-- Admin Location Management RPCs: Rename & Merge
create or replace function public.admin_rename_location(
  p_type text, -- 'region', 'district', 'village'
  p_id uuid,
  p_new_name text
)
returns void as $$
declare
  v_name text;
begin
  if not public.is_admin() then
    raise exception 'Permission denied';
  end if;

  v_name := public.to_title_case(p_new_name);

  if p_type = 'region' then
    update public.regions set name = v_name where id = p_id;
  elsif p_type = 'district' then
    update public.districts set name = v_name where id = p_id;
  elsif p_type = 'village' then
    update public.villages set name = v_name where id = p_id;
  else
    raise exception 'Invalid location type';
  end if;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.admin_merge_location(
  p_type text, -- 'district' or 'village'
  p_source_id uuid,
  p_target_id uuid
)
returns void as $$
begin
  if not public.is_admin() then
    raise exception 'Permission denied';
  end if;

  if p_source_id = p_target_id then
    raise exception 'Cannot merge a location into itself';
  end if;

  if p_type = 'district' then
    -- Repoint all villages from source district to target district
    update public.villages set district_id = p_target_id where district_id = p_source_id;
    -- Delete source district
    delete from public.districts where id = p_source_id;

  elsif p_type = 'village' then
    -- Repoint all visits from source village to target village
    update public.visits set village_id = p_target_id where village_id = p_source_id;
    -- Delete source village
    delete from public.villages where id = p_source_id;
  else
    raise exception 'Merge supported for district and village only';
  end if;
end;
$$ language plpgsql security definer set search_path = public;

-- Full Visits View for reporting, admin, and filtering
create or replace view public.visits_full as
select 
  v.id,
  v.client_uuid,
  v.agent_id,
  p.full_name as agent_name,
  p.username as agent_username,
  p.phone as agent_phone,
  v.village_id,
  vil.name as village_name,
  dis.id as district_id,
  dis.name as district_name,
  reg.id as region_id,
  reg.name as region_name,
  v.visited_at,
  v.duration_minutes,
  v.farmer_name,
  v.farmer_phone,
  v.crop_id,
  c.name_en as crop_name_en,
  c.name_te as crop_name_te,
  v.crop_other,
  v.diagnosis,
  v.prescription,
  v.product_id,
  pr.name_en as product_name_en,
  pr.name_te as product_name_te,
  v.product_other,
  v.purchased,
  v.purchase_amount,
  v.purchase_image_path,
  v.status,
  v.finalized_at,
  v.latitude,
  v.longitude,
  v.diagnosis_en,
  v.prescription_en,
  v.deleted_at,
  v.created_at,
  v.updated_at
from public.visits v
left join public.profiles p on v.agent_id = p.id
left join public.villages vil on v.village_id = vil.id
left join public.districts dis on vil.district_id = dis.id
left join public.regions reg on dis.region_id = reg.id
left join public.crops c on v.crop_id = c.id
left join public.products pr on v.product_id = pr.id;

-- ROW LEVEL SECURITY (RLS) POLICIES

alter table public.profiles enable row level security;
alter table public.regions enable row level security;
alter table public.districts enable row level security;
alter table public.villages enable row level security;
alter table public.crops enable row level security;
alter table public.products enable row level security;
alter table public.visits enable row level security;
alter table public.visit_audit enable row level security;

-- Profiles Policies
drop policy if exists "Read profiles: self or admin" on public.profiles;
create policy "Read profiles: self or admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists "Insert profiles: admin only" on public.profiles;
create policy "Insert profiles: admin only"
  on public.profiles for insert
  with check (public.is_admin());

drop policy if exists "Update profiles: admin only" on public.profiles;
create policy "Update profiles: admin only"
  on public.profiles for update
  using (public.is_admin());

-- Locations Policies
drop policy if exists "Read regions: authenticated" on public.regions;
create policy "Read regions: authenticated"
  on public.regions for select
  using (auth.role() = 'authenticated');

drop policy if exists "Write regions: admin only" on public.regions;
create policy "Write regions: admin only"
  on public.regions for all
  using (public.is_admin());

drop policy if exists "Read districts: authenticated" on public.districts;
create policy "Read districts: authenticated"
  on public.districts for select
  using (auth.role() = 'authenticated');

drop policy if exists "Write districts: admin only" on public.districts;
create policy "Write districts: admin only"
  on public.districts for all
  using (public.is_admin());

drop policy if exists "Read villages: authenticated" on public.villages;
create policy "Read villages: authenticated"
  on public.villages for select
  using (auth.role() = 'authenticated');

drop policy if exists "Write villages: admin only" on public.villages;
create policy "Write villages: admin only"
  on public.villages for all
  using (public.is_admin());

-- Crops & Products Policies
drop policy if exists "Read crops: authenticated" on public.crops;
create policy "Read crops: authenticated"
  on public.crops for select
  using (auth.role() = 'authenticated');

drop policy if exists "Write crops: admin only" on public.crops;
create policy "Write crops: admin only"
  on public.crops for all
  using (public.is_admin());

drop policy if exists "Read products: authenticated" on public.products;
create policy "Read products: authenticated"
  on public.products for select
  using (auth.role() = 'authenticated');

drop policy if exists "Write products: admin only" on public.products;
create policy "Write products: admin only"
  on public.products for all
  using (public.is_admin());

-- Visits Policies
drop policy if exists "Read visits: own or admin" on public.visits;
create policy "Read visits: own or admin"
  on public.visits for select
  using (
    public.is_admin() 
    or (agent_id = auth.uid() and deleted_at is null)
  );

drop policy if exists "Insert visits: active agent or admin" on public.visits;
create policy "Insert visits: active agent or admin"
  on public.visits for insert
  with check (
    public.is_admin()
    or (
      agent_id = auth.uid() 
      and exists (
        select 1 from public.profiles 
        where id = auth.uid() and is_active = true
      )
    )
  );

drop policy if exists "Update visits: pending own or admin" on public.visits;
create policy "Update visits: pending own or admin"
  on public.visits for update
  using (
    public.is_admin()
    or (
      agent_id = auth.uid() 
      and status = 'pending' 
      and deleted_at is null
    )
  );

-- Audit log policies
drop policy if exists "Read audit log: admin only" on public.visit_audit;
create policy "Read audit log: admin only"
  on public.visit_audit for select
  using (public.is_admin());

-- STORAGE BUCKET & STORAGE POLICIES

insert into storage.buckets (id, name, public)
values ('purchase-photos', 'purchase-photos', false)
on conflict (id) do nothing;

drop policy if exists "Upload photos: agent into own folder or admin" on storage.objects;
create policy "Upload photos: agent into own folder or admin"
  on storage.objects for insert
  with check (
    bucket_id = 'purchase-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

drop policy if exists "Read photos: own folder or admin" on storage.objects;
create policy "Read photos: own folder or admin"
  on storage.objects for select
  using (
    bucket_id = 'purchase-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

drop policy if exists "Manage photos: admin only" on storage.objects;
create policy "Manage photos: admin only"
  on storage.objects for update
  using (
    bucket_id = 'purchase-photos' and public.is_admin()
  );

drop policy if exists "Delete photos: admin only" on storage.objects;
create policy "Delete photos: admin only"
  on storage.objects for delete
  using (
    bucket_id = 'purchase-photos' and public.is_admin()
  );
