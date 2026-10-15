-- scripts/test-gate1-blockers-fail.sql
-- Diagnostic test script demonstrating the 6 blockers on the CURRENT staging schema before migration 010.
-- Safe: executes inside a transaction and rolls back at the end.

begin;

create temp table if not exists blocker_test_results (
  id serial primary key,
  blocker text not null,
  test_name text not null,
  status text not null,
  detail text
);
truncate blocker_test_results;

do $$
declare
  v_admin_id  uuid := 'aaaaaaaa-1111-1111-1111-111111111111';
  v_viewer_id uuid := 'bbbbbbbb-2222-2222-2222-222222222222';
  v_agent_a_id uuid := 'cccccccc-3333-3333-3333-333333333333';
  v_agent_b_id uuid := 'dddddddd-4444-4444-4444-444444444444';

  v_reg_id     uuid;
  v_dist_id    uuid;
  v_vil_id     uuid;
  v_vil2_id    uuid;
  v_crop_id    uuid;
  v_stage_id   uuid;
  v_farmer_a_id uuid;
  v_farmer_b_id uuid;
  v_visit_id   uuid;

  v_leak_count integer;
  v_phone_read text;
  v_crop_count_before integer;
  v_crop_count_after  integer;
  v_err text;
begin
  -- 1. Setup Auth Users & Profiles
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    (v_admin_id,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin_diag@test.local',   'dummy', now(), '{"provider":"email"}', '{}', now(), now()),
    (v_viewer_id,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'viewer_diag@test.local',  'dummy', now(), '{"provider":"email"}', '{}', now(), now()),
    (v_agent_a_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'agent_a_diag@test.local', 'dummy', now(), '{"provider":"email"}', '{}', now(), now()),
    (v_agent_b_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'agent_b_diag@test.local', 'dummy', now(), '{"provider":"email"}', '{}', now(), now())
  on conflict (id) do nothing;

  insert into public.profiles (id, role, full_name, username, is_active)
  values
    (v_admin_id,   'admin',         'Admin Diag',   'admin_diag',   true),
    (v_viewer_id,  'client_viewer', 'Viewer Diag',  'viewer_diag',  true),
    (v_agent_a_id, 'agent',         'Agent A Diag', 'agent_a_diag', true),
    (v_agent_b_id, 'agent',         'Agent B Diag', 'agent_b_diag', true)
  on conflict (id) do update set role = excluded.role, is_active = excluded.is_active;

  -- 2. Setup Base Fixtures as postgres (admin context)
  insert into public.regions (name) values ('Diag Region') returning id into v_reg_id;
  insert into public.districts (region_id, name) values (v_reg_id, 'Diag District') returning id into v_dist_id;
  insert into public.villages (district_id, name) values (v_dist_id, 'Diag Village 1') returning id into v_vil_id;
  insert into public.villages (district_id, name) values (v_dist_id, 'Diag Village 2') returning id into v_vil2_id;

  select id into v_crop_id from public.crops limit 1;
  select id into v_stage_id from public.crop_stages where crop_id = v_crop_id limit 1;

  -- Create Farmer A
  insert into public.farmers (
    farmer_code, full_name, phone, village_id, farm_lat, farm_lng, farm_accuracy_m, consent_status, onboarded_by
  ) values (
    'DIAG-0001', 'Farmer Alpha', '9876543210', v_vil_id, 16.5000000, 80.6000000, 5.0, 'granted', v_agent_a_id
  ) returning id into v_farmer_a_id;

  -- Assign Farmer A to Agent A only
  insert into public.farmer_assignments (farmer_id, agent_id, assigned_by)
  values (v_farmer_a_id, v_agent_a_id, v_admin_id);

  -- -------------------------------------------------------------------------
  -- B1: Views bypass RLS test
  -- Querying farmers_full as Agent B (unassigned agent)
  -- -------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_agent_b_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_agent_b_id::text, 'role', 'authenticated')::text, true);

  select count(*) into v_leak_count from public.farmers_full where id = v_farmer_a_id;

  if v_leak_count > 0 then
    insert into blocker_test_results (blocker, test_name, status, detail)
    values ('B1', 'Views RLS bypass (farmers_full)', 'FAIL', 'Agent B can see Farmer A through view (security_invoker is false)');
  else
    insert into blocker_test_results (blocker, test_name, status, detail)
    values ('B1', 'Views RLS bypass (farmers_full)', 'PASS', 'View enforced base table RLS');
  end if;

  -- -------------------------------------------------------------------------
  -- B2: Visit times server-authoritative
  -- Agent inserting completed visit with self-chosen times directly
  -- -------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_agent_a_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_agent_a_id::text, 'role', 'authenticated')::text, true);

  begin
    insert into public.farm_visits (
      client_uuid, farmer_id, agent_id, status, started_at, ended_at, duration_seconds, time_source, no_services_chosen
    ) values (
      gen_random_uuid(), v_farmer_a_id, v_agent_a_id, 'completed',
      now() - interval '7 days', now() - interval '7 days' + interval '30 minutes', 1800, 'client', false
    ) returning id into v_visit_id;

    insert into blocker_test_results (blocker, test_name, status, detail)
    values ('B2', 'Server authoritative times', 'FAIL', 'Agent bypassed server time: inserted completed visit with self-chosen started_at and ended_at');
  exception when others then
    insert into blocker_test_results (blocker, test_name, status, detail)
    values ('B2', 'Server authoritative times', 'PASS', 'Rejected self-chosen visit insert: ' || sqlerrm);
  end;

  -- -------------------------------------------------------------------------
  -- B3: Consent bypass
  -- Agent directly inserting a farmer into public.farmers
  -- -------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_agent_a_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_agent_a_id::text, 'role', 'authenticated')::text, true);

  begin
    insert into public.farmers (
      farmer_code, full_name, phone, village_id, farm_lat, farm_lng, farm_accuracy_m, onboarded_by
    ) values (
      'DIAG-0002', 'Bypass Farmer', '9111122222', v_vil_id, 16.5, 80.6, 5.0, v_agent_a_id
    ) returning id into v_farmer_b_id;

    insert into blocker_test_results (blocker, test_name, status, detail)
    values ('B3', 'Consent bypass (direct farmer insert)', 'FAIL', 'Agent directly inserted farmer with default consent_status granted');
  exception when others then
    insert into blocker_test_results (blocker, test_name, status, detail)
    values ('B3', 'Consent bypass (direct farmer insert)', 'PASS', 'Direct farmer insert rejected: ' || sqlerrm);
  end;

  -- -------------------------------------------------------------------------
  -- B4: Client-viewer phone masking
  -- Viewer selecting raw phone directly from base table public.farmers
  -- -------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_viewer_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_viewer_id::text, 'role', 'authenticated')::text, true);

  select phone into v_phone_read from public.farmers where id = v_farmer_a_id;

  if v_phone_read = '9876543210' then
    insert into blocker_test_results (blocker, test_name, status, detail)
    values ('B4', 'Client viewer phone masking', 'FAIL', 'Viewer was able to read raw unmasked phone (9876543210) from base table farmers');
  elsif v_phone_read is null then
    insert into blocker_test_results (blocker, test_name, status, detail)
    values ('B4', 'Client viewer phone masking', 'PASS', 'Base table inaccessible to viewer (returned 0 rows / null)');
  else
    insert into blocker_test_results (blocker, test_name, status, detail)
    values ('B4', 'Client viewer phone masking', 'PASS', 'Phone was masked: ' || v_phone_read);
  end if;

  -- -------------------------------------------------------------------------
  -- B5: admin_merge_location with farmers fixture
  -- Admin merging village 1 into village 2 when village 1 has farmers
  -- -------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);

  begin
    perform public.admin_merge_location('village', v_vil_id, v_vil2_id);
    insert into blocker_test_results (blocker, test_name, status, detail)
    values ('B5', 'Location merge with farmers', 'PASS', 'Village merge successfully repointed farmers');
  exception when others then
    insert into blocker_test_results (blocker, test_name, status, detail)
    values ('B5', 'Location merge with farmers', 'FAIL', 'Village merge crashed due to unrepointed farmers: ' || sqlerrm);
  end;

  -- -------------------------------------------------------------------------
  -- B6: Seeds idempotency
  -- Re-inserting existing crop
  -- -------------------------------------------------------------------------
  select count(*) into v_crop_count_before from public.crops;

  -- Run duplicate seed insert without unique index on lower(name_en)
  insert into public.crops (name_en, name_te, is_active)
  values ('Paddy', 'వరి', true)
  on conflict do nothing;

  select count(*) into v_crop_count_after from public.crops;

  if v_crop_count_after > v_crop_count_before then
    insert into blocker_test_results (blocker, test_name, status, detail)
    values ('B6', 'Seed idempotency (crops duplicate)', 'FAIL', 'Duplicate crop inserted; row count increased from ' || v_crop_count_before || ' to ' || v_crop_count_after);
  else
    insert into blocker_test_results (blocker, test_name, status, detail)
    values ('B6', 'Seed idempotency (crops duplicate)', 'PASS', 'Row count unchanged (' || v_crop_count_before || ')');
  end if;

end $$;

select
  id,
  blocker,
  test_name,
  status,
  detail
from blocker_test_results
order by id;

rollback;
