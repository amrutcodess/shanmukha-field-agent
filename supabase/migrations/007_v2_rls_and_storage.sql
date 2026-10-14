-- Migration: 007_v2_rls_and_storage.sql
-- Part of Phase 1: Foundation
-- RLS policies on all v2 tables, private storage bucket visit-photos, and reporting views.

-- 1. Helper function: is_assigned_to_farmer(p_farmer_id)
create or replace function public.is_assigned_to_farmer(p_farmer_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.farmer_assignments
    where farmer_id = p_farmer_id
      and agent_id = auth.uid()
      and unassigned_at is null
  );
end;
$$ language plpgsql security definer set search_path = public;

-- 2. Enable RLS on all v2 tables
alter table public.app_config enable row level security;
alter table public.audit_log enable row level security;
alter table public.crop_stages enable row level security;
alter table public.product_sizes enable row level security;
alter table public.value_added_services enable row level security;
alter table public.farmers enable row level security;
alter table public.farmer_assignments enable row level security;
alter table public.consent_otps enable row level security;
alter table public.farmer_consents enable row level security;
alter table public.crop_cycles enable row level security;
alter table public.farm_visits enable row level security;
alter table public.visit_services enable row level security;
alter table public.visit_purchase_items enable row level security;
alter table public.visit_photos enable row level security;
alter table public.visit_track_points enable row level security;
alter table public.app_events enable row level security;

-- 3. app_config policies
drop policy if exists "Read app_config: authenticated users" on public.app_config;
create policy "Read app_config: authenticated users"
  on public.app_config for select
  using (public.is_admin() or public.is_active_agent() or public.is_client_viewer());

drop policy if exists "Manage app_config: admin only" on public.app_config;
create policy "Manage app_config: admin only"
  on public.app_config for all
  using (public.is_admin())
  with check (public.is_admin());

-- 4. audit_log policies (admin can read; actors can insert; no updates or deletes)
drop policy if exists "Read audit_log: admin only" on public.audit_log;
create policy "Read audit_log: admin only"
  on public.audit_log for select
  using (public.is_admin());

drop policy if exists "Insert audit_log: authenticated" on public.audit_log;
create policy "Insert audit_log: authenticated"
  on public.audit_log for insert
  with check (public.is_admin() or public.is_active_agent() or public.is_client_viewer());

-- 5. Catalogs policies (crop_stages, product_sizes, value_added_services)
drop policy if exists "Read crop_stages: authenticated" on public.crop_stages;
create policy "Read crop_stages: authenticated"
  on public.crop_stages for select
  using (public.is_admin() or public.is_active_agent() or public.is_client_viewer());

drop policy if exists "Manage crop_stages: admin only" on public.crop_stages;
create policy "Manage crop_stages: admin only"
  on public.crop_stages for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Read product_sizes: authenticated" on public.product_sizes;
create policy "Read product_sizes: authenticated"
  on public.product_sizes for select
  using (public.is_admin() or public.is_active_agent() or public.is_client_viewer());

drop policy if exists "Manage product_sizes: admin only" on public.product_sizes;
create policy "Manage product_sizes: admin only"
  on public.product_sizes for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Read value_added_services: authenticated" on public.value_added_services;
create policy "Read value_added_services: authenticated"
  on public.value_added_services for select
  using (public.is_admin() or public.is_active_agent() or public.is_client_viewer());

drop policy if exists "Manage value_added_services: admin only" on public.value_added_services;
create policy "Manage value_added_services: admin only"
  on public.value_added_services for all
  using (public.is_admin())
  with check (public.is_admin());

-- 6. Farmers policies
drop policy if exists "Read farmers: admin, viewer, or assigned active agent" on public.farmers;
create policy "Read farmers: admin, viewer, or assigned active agent"
  on public.farmers for select
  using (
    public.is_admin()
    or public.is_client_viewer()
    or (
      public.is_active_agent() 
      and public.is_assigned_to_farmer(id) 
      and deleted_at is null
    )
  );

drop policy if exists "Insert farmers: admin or active agent" on public.farmers;
create policy "Insert farmers: admin or active agent"
  on public.farmers for insert
  with check (public.is_admin() or public.is_active_agent());

drop policy if exists "Update farmers: admin or assigned agent" on public.farmers;
create policy "Update farmers: admin or assigned agent"
  on public.farmers for update
  using (
    public.is_admin() 
    or (
      public.is_active_agent() 
      and public.is_assigned_to_farmer(id) 
      and deleted_at is null
    )
  )
  with check (
    public.is_admin() 
    or (
      public.is_active_agent() 
      and public.is_assigned_to_farmer(id) 
      and deleted_at is null
    )
  );

-- 7. Farmer assignments policies
drop policy if exists "Read farmer_assignments: admin, viewer, or assigned agent" on public.farmer_assignments;
create policy "Read farmer_assignments: admin, viewer, or assigned agent"
  on public.farmer_assignments for select
  using (
    public.is_admin() 
    or public.is_client_viewer() 
    or (public.is_active_agent() and agent_id = auth.uid())
  );

drop policy if exists "Manage farmer_assignments: admin only" on public.farmer_assignments;
create policy "Manage farmer_assignments: admin only"
  on public.farmer_assignments for all
  using (public.is_admin())
  with check (public.is_admin());

-- 8. Farmer consents policies (Append-only; Section B4.5)
drop policy if exists "Read farmer_consents: admin, viewer, or assigned agent" on public.farmer_consents;
create policy "Read farmer_consents: admin, viewer, or assigned agent"
  on public.farmer_consents for select
  using (
    public.is_admin()
    or public.is_client_viewer()
    or (public.is_active_agent() and public.is_assigned_to_farmer(farmer_id))
  );

drop policy if exists "Insert farmer_consents: admin or active agent" on public.farmer_consents;
create policy "Insert farmer_consents: admin or active agent"
  on public.farmer_consents for insert
  with check (
    public.is_admin()
    or (public.is_active_agent() and agent_id = auth.uid())
  );

-- 9. Crop cycles policies
drop policy if exists "Read crop_cycles: admin, viewer, or assigned agent" on public.crop_cycles;
create policy "Read crop_cycles: admin, viewer, or assigned agent"
  on public.crop_cycles for select
  using (
    public.is_admin()
    or public.is_client_viewer()
    or (public.is_active_agent() and public.is_assigned_to_farmer(farmer_id))
  );

drop policy if exists "Insert crop_cycles: admin or assigned agent" on public.crop_cycles;
create policy "Insert crop_cycles: admin or assigned agent"
  on public.crop_cycles for insert
  with check (
    public.is_admin()
    or (public.is_active_agent() and public.is_assigned_to_farmer(farmer_id))
  );

drop policy if exists "Update crop_cycles: admin or assigned agent" on public.crop_cycles;
create policy "Update crop_cycles: admin or assigned agent"
  on public.crop_cycles for update
  using (
    public.is_admin()
    or (public.is_active_agent() and public.is_assigned_to_farmer(farmer_id))
  )
  with check (
    public.is_admin()
    or (public.is_active_agent() and public.is_assigned_to_farmer(farmer_id))
  );

-- 10. Farm visits policies
drop policy if exists "Read farm_visits: admin, viewer, or own active agent" on public.farm_visits;
create policy "Read farm_visits: admin, viewer, or own active agent"
  on public.farm_visits for select
  using (
    public.is_admin()
    or public.is_client_viewer()
    or (public.is_active_agent() and agent_id = auth.uid())
  );

drop policy if exists "Insert farm_visits: active agent or admin" on public.farm_visits;
create policy "Insert farm_visits: active agent or admin"
  on public.farm_visits for insert
  with check (
    public.is_admin()
    or (
      public.is_active_agent()
      and agent_id = auth.uid()
      and public.is_assigned_to_farmer(farmer_id)
    )
  );

drop policy if exists "Update farm_visits: admin or own in_progress visit" on public.farm_visits;
create policy "Update farm_visits: admin or own in_progress visit"
  on public.farm_visits for update
  using (
    public.is_admin()
    or (
      public.is_active_agent()
      and agent_id = auth.uid()
      and status = 'in_progress'
    )
  )
  with check (
    public.is_admin()
    or (
      public.is_active_agent()
      and agent_id = auth.uid()
      and status in ('in_progress', 'completed', 'cancelled')
    )
  );

-- 11. Visit Children policies (services, purchase items, photos, track points, app_events)
-- Visit services
drop policy if exists "Read visit_services: admin, viewer, or own visit" on public.visit_services;
create policy "Read visit_services: admin, viewer, or own visit"
  on public.visit_services for select
  using (
    public.is_admin()
    or public.is_client_viewer()
    or exists (
      select 1 from public.farm_visits v
      where v.id = visit_id and v.agent_id = auth.uid() and public.is_active_agent()
    )
  );

drop policy if exists "Manage visit_services: admin or own in_progress visit" on public.visit_services;
create policy "Manage visit_services: admin or own in_progress visit"
  on public.visit_services for all
  using (
    public.is_admin()
    or exists (
      select 1 from public.farm_visits v
      where v.id = visit_id and v.agent_id = auth.uid() and v.status = 'in_progress' and public.is_active_agent()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.farm_visits v
      where v.id = visit_id and v.agent_id = auth.uid() and v.status = 'in_progress' and public.is_active_agent()
    )
  );

-- Visit purchase items
drop policy if exists "Read visit_purchase_items: admin, viewer, or own visit" on public.visit_purchase_items;
create policy "Read visit_purchase_items: admin, viewer, or own visit"
  on public.visit_purchase_items for select
  using (
    public.is_admin()
    or public.is_client_viewer()
    or exists (
      select 1 from public.farm_visits v
      where v.id = visit_id and v.agent_id = auth.uid() and public.is_active_agent()
    )
  );

drop policy if exists "Manage visit_purchase_items: admin or own in_progress visit" on public.visit_purchase_items;
create policy "Manage visit_purchase_items: admin or own in_progress visit"
  on public.visit_purchase_items for all
  using (
    public.is_admin()
    or exists (
      select 1 from public.farm_visits v
      where v.id = visit_id and v.agent_id = auth.uid() and v.status = 'in_progress' and public.is_active_agent()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.farm_visits v
      where v.id = visit_id and v.agent_id = auth.uid() and v.status = 'in_progress' and public.is_active_agent()
    )
  );

-- Visit photos
drop policy if exists "Read visit_photos: admin, viewer, or own visit" on public.visit_photos;
create policy "Read visit_photos: admin, viewer, or own visit"
  on public.visit_photos for select
  using (
    public.is_admin()
    or public.is_client_viewer()
    or exists (
      select 1 from public.farm_visits v
      where v.id = visit_id and v.agent_id = auth.uid() and public.is_active_agent()
    )
  );

drop policy if exists "Manage visit_photos: admin or own in_progress visit" on public.visit_photos;
create policy "Manage visit_photos: admin or own in_progress visit"
  on public.visit_photos for all
  using (
    public.is_admin()
    or exists (
      select 1 from public.farm_visits v
      where v.id = visit_id and v.agent_id = auth.uid() and v.status = 'in_progress' and public.is_active_agent()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.farm_visits v
      where v.id = visit_id and v.agent_id = auth.uid() and v.status = 'in_progress' and public.is_active_agent()
    )
  );

-- Visit track points
drop policy if exists "Read visit_track_points: admin, viewer, or own" on public.visit_track_points;
create policy "Read visit_track_points: admin, viewer, or own"
  on public.visit_track_points for select
  using (
    public.is_admin()
    or public.is_client_viewer()
    or (agent_id = auth.uid() and public.is_active_agent())
  );

drop policy if exists "Insert visit_track_points: own in_progress visit" on public.visit_track_points;
create policy "Insert visit_track_points: own in_progress visit"
  on public.visit_track_points for insert
  with check (
    public.is_admin()
    or (
      agent_id = auth.uid()
      and public.is_active_agent()
      and exists (
        select 1 from public.farm_visits v
        where v.id = visit_id and v.agent_id = auth.uid() and v.status = 'in_progress'
      )
    )
  );

-- App events
drop policy if exists "Read app_events: admin or own" on public.app_events;
create policy "Read app_events: admin or own"
  on public.app_events for select
  using (public.is_admin() or (agent_id = auth.uid() and public.is_active_agent()));

drop policy if exists "Insert app_events: own" on public.app_events;
create policy "Insert app_events: own"
  on public.app_events for insert
  with check (public.is_admin() or (agent_id = auth.uid() and public.is_active_agent()));

-- 12. Storage bucket: visit-photos (Private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'visit-photos',
  'visit-photos',
  false,
  52428800, -- 50MB
  array['image/jpeg', 'image/png']
) on conflict (id) do nothing;

-- Storage policies for visit-photos
drop policy if exists "Read visit-photos: admin, viewer, or assigned agent" on storage.objects;
create policy "Read visit-photos: admin, viewer, or assigned agent"
  on storage.objects for select
  using (
    bucket_id = 'visit-photos'
    and (
      public.is_admin()
      or public.is_client_viewer()
      or (
        public.is_active_agent()
        and (storage.foldername(name))[1] = 'farmers'
        and public.is_assigned_to_farmer(((storage.foldername(name))[2])::uuid)
      )
    )
  );

drop policy if exists "Upload visit-photos: admin or assigned agent" on storage.objects;
create policy "Upload visit-photos: admin or assigned agent"
  on storage.objects for insert
  with check (
    bucket_id = 'visit-photos'
    and (
      public.is_admin()
      or (
        public.is_active_agent()
        and (storage.foldername(name))[1] = 'farmers'
        and public.is_assigned_to_farmer(((storage.foldername(name))[2])::uuid)
      )
    )
  );

-- 13. Reporting Views: farm_visits_full and farmers_full
drop view if exists public.farm_visits_full;
create view public.farm_visits_full as
select
  v.id,
  v.client_uuid,
  v.farmer_id,
  f.farmer_code,
  f.full_name as farmer_name,
  f.phone as farmer_phone,
  v.crop_cycle_id,
  cc.season as cycle_season,
  cc.acreage as cycle_acreage,
  c.id as crop_id,
  c.name_en as crop_name_en,
  c.name_te as crop_name_te,
  v.agent_id,
  p.full_name as agent_name,
  p.username as agent_username,
  vil.id as village_id,
  vil.name as village_name,
  dis.id as district_id,
  dis.name as district_name,
  reg.id as region_id,
  reg.name as region_name,
  v.status,
  v.started_at,
  v.ended_at,
  v.time_source,
  v.duration_seconds,
  v.start_lat,
  v.start_lng,
  v.start_accuracy_m,
  v.end_lat,
  v.end_lng,
  v.end_accuracy_m,
  v.start_distance_from_farm_m,
  v.end_distance_from_farm_m,
  v.outside_geofence,
  v.outside_geofence_reason,
  v.crop_stage_id,
  cs.name_en as crop_stage_name_en,
  cs.name_te as crop_stage_name_te,
  v.das,
  v.observations_diagnosis,
  v.prescription_given,
  v.no_services_chosen,
  v.video_link,
  v.tracking_mode,
  v.app_version,
  v.device_model,
  v.flags,
  v.created_at,
  v.updated_at
from public.farm_visits v
left join public.farmers f on v.farmer_id = f.id
left join public.crop_cycles cc on v.crop_cycle_id = cc.id
left join public.crops c on cc.crop_id = c.id
left join public.crop_stages cs on v.crop_stage_id = cs.id
left join public.profiles p on v.agent_id = p.id
left join public.villages vil on f.village_id = vil.id
left join public.districts dis on vil.district_id = dis.id
left join public.regions reg on dis.region_id = reg.id;

drop view if exists public.farmers_full;
create view public.farmers_full as
select
  f.id,
  f.farmer_code,
  f.full_name,
  f.phone,
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
left join public.profiles ap on fa.agent_id = ap.id;
