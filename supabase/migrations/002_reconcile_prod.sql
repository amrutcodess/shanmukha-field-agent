-- Migration: 002_reconcile_prod.sql
-- Reconciles repository migrations with audited production database state.
-- Idempotent: safe to run on existing production or fresh staging database.

-- 1. Ensure prescription_image_path exists on public.visits
alter table public.visits 
  add column if not exists prescription_image_path text;

-- 2. Update visits_full view to include prescription_image_path
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
  v.prescription_image_path,
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

-- 3. Sync update policy name to match production
drop policy if exists "Update visits: pending own or admin" on public.visits;
drop policy if exists "Update visits: own or admin" on public.visits;
create policy "Update visits: own or admin"
  on public.visits for update
  using (
    public.is_admin() 
    or (agent_id = auth.uid() and deleted_at is null)
  );
