-- Migration: 003_hotfix_v1.sql
-- Covers defects F1, F2, F3, F4, and F9 identified in docs/MASTER_PROMPT.md.

-- 1. Helper function: is_active_agent()
create or replace function public.is_active_agent()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'agent'
      and is_active = true
  );
end;
$$ language plpgsql security definer set search_path = public;

-- 2. Security definer search_path fix on audit_visit_changes (F9)
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
$$ language plpgsql security definer set search_path = public;

-- 3. Prevent agents from tampering with immutable visit audit columns (F3/F4)
create or replace function public.prevent_visit_tampering()
returns trigger as $$
begin
  if not public.is_admin() then
    if new.agent_id <> old.agent_id then
      raise exception 'Cannot change agent_id on an existing visit';
    end if;
    if new.client_uuid <> old.client_uuid then
      raise exception 'Cannot change client_uuid on an existing visit';
    end if;
    if new.created_at <> old.created_at then
      raise exception 'Cannot change created_at on an existing visit';
    end if;
    if new.deleted_at is distinct from old.deleted_at then
      raise exception 'Only administrators can soft-delete visits';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists tr_prevent_visit_tampering on public.visits;
create trigger tr_prevent_visit_tampering
  before update on public.visits
  for each row execute function public.prevent_visit_tampering();

-- 4. Visits RLS updates: separate USING and WITH CHECK, check is_active_agent (F3, F4)
drop policy if exists "Update visits: own or admin" on public.visits;
drop policy if exists "Update visits: pending own or admin" on public.visits;
create policy "Update visits: own or admin"
  on public.visits for update
  using (
    public.is_admin() 
    or (
      agent_id = auth.uid() 
      and public.is_active_agent()
      and status = 'pending' 
      and deleted_at is null
    )
  )
  with check (
    public.is_admin() 
    or (
      agent_id = auth.uid() 
      and public.is_active_agent()
      and status in ('pending', 'final', 'closed')
      and deleted_at is null
    )
  );

drop policy if exists "Insert visits: active agent or admin" on public.visits;
create policy "Insert visits: active agent or admin"
  on public.visits for insert
  with check (
    public.is_admin()
    or (
      agent_id = auth.uid() 
      and public.is_active_agent()
    )
  );

drop policy if exists "Read visits: own or admin" on public.visits;
create policy "Read visits: own or admin"
  on public.visits for select
  using (
    public.is_admin() 
    or (
      agent_id = auth.uid() 
      and public.is_active_agent()
      and deleted_at is null
    )
  );

-- 5. Storage policies for purchase-photos: support {uid}/... and {uid}/prescriptions/... (F2)
drop policy if exists "Upload photos: agent into own folder or admin" on storage.objects;
create policy "Upload photos: agent into own folder or admin"
  on storage.objects for insert
  with check (
    bucket_id = 'purchase-photos'
    and (
      public.is_admin()
      or (
        public.is_active_agent()
        and (
          (storage.foldername(name))[1] = auth.uid()::text
          or (
            (storage.foldername(name))[1] = 'prescriptions'
            and (storage.foldername(name))[2] = auth.uid()::text
          )
        )
      )
    )
  );

drop policy if exists "Read photos: own folder or admin" on storage.objects;
create policy "Read photos: own folder or admin"
  on storage.objects for select
  using (
    bucket_id = 'purchase-photos'
    and (
      public.is_admin()
      or (
        public.is_active_agent()
        and (
          (storage.foldername(name))[1] = auth.uid()::text
          or (
            (storage.foldername(name))[1] = 'prescriptions'
            and (storage.foldername(name))[2] = auth.uid()::text
          )
        )
      )
    )
  );

-- 6. Enforce active check inside get_or_create_location (F4)
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
  if not (public.is_admin() or public.is_active_agent()) then
    raise exception 'Permission denied: inactive user or insufficient role';
  end if;

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

-- 7. Fix collision handling in admin_merge_location (F9)
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

  if p_type = 'district' then
    -- Handle colliding villages that have identical lower(name) in both source and target districts
    for r_colliding in (
      select s.id as source_vil_id, t.id as target_vil_id
      from public.villages s
      join public.villages t on lower(btrim(s.name)) = lower(btrim(t.name))
      where s.district_id = p_source_id
        and t.district_id = p_target_id
    ) loop
      -- Repoint visits from colliding village to the existing target village
      update public.visits set village_id = r_colliding.target_vil_id where village_id = r_colliding.source_vil_id;
      -- Delete the duplicate source village
      delete from public.villages where id = r_colliding.source_vil_id;
    end loop;

    -- Repoint all remaining non-colliding villages to target district
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
