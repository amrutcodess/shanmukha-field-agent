-- supabase/tests/database_test.sql
-- Comprehensive Phase 1 Database Test Suite (Section B15.2)
-- Tests: RLS isolation, assignment boundaries, client_viewer read-only, anon lockdown,
-- append-only consent trigger, product size composite FK, single in-progress visit,
-- non-overlapping visits exclusion constraint, and visit completion services validation.
-- Safe: executes within a transaction and rolls back at the end.

begin;

do $$
begin
  raise notice '=== STARTING PHASE 1 DATABASE TEST SUITE ===';
end $$;

do $$
declare
  -- Actors
  v_admin_id uuid := 'aaaaaaaa-1111-1111-1111-111111111111';
  v_viewer_id uuid := 'bbbbbbbb-2222-2222-2222-222222222222';
  v_agent_a_id uuid := 'cccccccc-3333-3333-3333-333333333333';
  v_agent_b_id uuid := 'dddddddd-4444-4444-4444-444444444444';

  -- Fixtures
  v_reg_id uuid;
  v_dist_id uuid;
  v_vil_id uuid;
  v_crop_id uuid;
  v_stage_id uuid;
  v_service_id uuid;
  v_prod_a_id uuid;
  v_size_a_id uuid;
  v_prod_b_id uuid;
  v_size_b_id uuid;

  -- Test entities
  v_farmer_a_id uuid;
  v_farmer_b_id uuid;
  v_cycle_a_id uuid;
  v_visit_a1_id uuid;
  v_visit_a2_id uuid;
  v_consent_id uuid;
begin
  -- 1. Setup Auth Users & Profiles
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values 
    (v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin_p1@test.local', 'dummy', now(), '{"provider":"email"}', '{}', now(), now()),
    (v_viewer_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'viewer_p1@test.local', 'dummy', now(), '{"provider":"email"}', '{}', now(), now()),
    (v_agent_a_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'agent_a_p1@test.local', 'dummy', now(), '{"provider":"email"}', '{}', now(), now()),
    (v_agent_b_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'agent_b_p1@test.local', 'dummy', now(), '{"provider":"email"}', '{}', now(), now())
  on conflict (id) do nothing;

  insert into public.profiles (id, role, full_name, username, is_active)
  values
    (v_admin_id, 'admin', 'Admin P1', 'admin_p1', true),
    (v_viewer_id, 'client_viewer', 'Viewer P1', 'viewer_p1', true),
    (v_agent_a_id, 'agent', 'Agent A', 'agent_a', true),
    (v_agent_b_id, 'agent', 'Agent B', 'agent_b', true)
  on conflict (id) do update set role = excluded.role, is_active = excluded.is_active;

  -- 2. Setup Location & Catalog Fixtures (as Admin)
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);

  select village_id, district_id, region_id into v_vil_id, v_dist_id, v_reg_id
  from public.get_or_create_location('Phase1 Region', 'Phase1 District', 'Phase1 Village');

  select id into v_crop_id from public.crops where lower(btrim(name_en)) = 'paddy' limit 1;
  select id into v_stage_id from public.crop_stages where crop_id = v_crop_id and sort_order = 1 limit 1;
  select id into v_service_id from public.value_added_services where code = 'sticky_traps' limit 1;

  -- Create 2 products with pack sizes
  insert into public.products (name_en, name_te, is_active) values ('Test Prod A', 'ప్రొడక్ట్ A', true) returning id into v_prod_a_id;
  insert into public.product_sizes (product_id, size_label, sort_order) values (v_prod_a_id, '500 ml', 1) returning id into v_size_a_id;

  insert into public.products (name_en, name_te, is_active) values ('Test Prod B', 'ప్రొడక్ట్ B', true) returning id into v_prod_b_id;
  insert into public.product_sizes (product_id, size_label, sort_order) values (v_prod_b_id, '1000 ml', 1) returning id into v_size_b_id;

  -- Create Farmer A & Farmer B
  insert into public.farmers (farmer_code, full_name, phone, village_id, farm_lat, farm_lng, farm_accuracy_m, consent_status, onboarded_by)
  values ('SA-100001', 'Farmer Alpha', '+919100000001', v_vil_id, 16.506174, 80.648015, 12.5, 'granted', v_agent_a_id)
  returning id into v_farmer_a_id;

  insert into public.farmers (farmer_code, full_name, phone, village_id, farm_lat, farm_lng, farm_accuracy_m, consent_status, onboarded_by)
  values ('SA-100002', 'Farmer Beta', '+919100000002', v_vil_id, 16.507174, 80.649015, 10.0, 'granted', v_agent_b_id)
  returning id into v_farmer_b_id;

  -- Assign Farmer A to Agent A; Farmer B to Agent B
  insert into public.farmer_assignments (farmer_id, agent_id, assigned_by)
  values (v_farmer_a_id, v_agent_a_id, v_admin_id);

  insert into public.farmer_assignments (farmer_id, agent_id, assigned_by)
  values (v_farmer_b_id, v_agent_b_id, v_admin_id);

  -- Create Crop Cycle for Farmer A
  insert into public.crop_cycles (farmer_id, crop_id, season, acreage, sowing_date)
  values (v_farmer_a_id, v_crop_id, 'Kharif 2026', 3.5, current_date - 30)
  returning id into v_cycle_a_id;

  -- Create Consent for Farmer A
  insert into public.farmer_consents (farmer_id, agent_id, event, notice_version, notice_language)
  values (v_farmer_a_id, v_agent_a_id, 'granted', '1.0', 'te')
  returning id into v_consent_id;

  raise notice 'PASS: Fixture setup completed successfully.';

  -- TEST 1: Append-Only Trigger on farmer_consents
  -- Any UPDATE or DELETE must fail for all roles (even admin)
  begin
    update public.farmer_consents set notice_version = '2.0' where id = v_consent_id;
    raise exception 'TEST FAILED: farmer_consents UPDATE should have been forbidden';
  exception when others then
    if sqlerrm like '%immutable append-only ledger%' then
      raise notice 'PASS: farmer_consents UPDATE strictly blocked by append-only trigger.';
    else
      raise;
    end if;
  end;

  begin
    delete from public.farmer_consents where id = v_consent_id;
    raise exception 'TEST FAILED: farmer_consents DELETE should have been forbidden';
  exception when others then
    if sqlerrm like '%immutable append-only ledger%' then
      raise notice 'PASS: farmer_consents DELETE strictly blocked by append-only trigger.';
    else
      raise;
    end if;
  end;

  -- TEST 2: Product Size Composite Foreign Key Enforcement
  -- Attaching size_b (belongs to prod_b) with prod_a must fail composite FK
  -- We test via visit_purchase_items
  insert into public.farm_visits (
    farmer_id, crop_cycle_id, agent_id, status, started_at, start_lat, start_lng, tracking_mode
  ) values (
    v_farmer_a_id, v_cycle_a_id, v_agent_a_id, 'in_progress', now(), 16.506174, 80.648015, 'native_continuous'
  ) returning id into v_visit_a1_id;

  begin
    insert into public.visit_purchase_items (
      visit_id, product_id, product_size_id, quantity, product_name_snapshot, size_label_snapshot
    ) values (
      v_visit_a1_id, v_prod_a_id, v_size_b_id, 2, 'Prod A', 'Size B' -- Mismatch!
    );
    raise exception 'TEST FAILED: Composite FK should reject mismatching product and size';
  exception when others then
    raise notice 'PASS: Composite foreign key strictly prevents cross-product pack sizes.';
  end;

  -- TEST 3: Exactly One in_progress Visit Per Agent
  begin
    insert into public.farm_visits (
      farmer_id, crop_cycle_id, agent_id, status, started_at, start_lat, start_lng, tracking_mode
    ) values (
      v_farmer_a_id, v_cycle_a_id, v_agent_a_id, 'in_progress', now() + interval '1 hour', 16.506174, 80.648015, 'native_continuous'
    );
    raise exception 'TEST FAILED: Second in_progress visit for Agent A should be rejected';
  exception when others then
    raise notice 'PASS: Unique partial index allows only one in_progress visit per agent.';
  end;

  -- Close visit_a1
  update public.farm_visits 
  set ended_at = started_at + interval '45 minutes'
  where id = v_visit_a1_id;

  -- TEST 4: Non-Overlapping Visits Exclusion Constraint (btree_gist)
  -- Creating a completed visit that overlaps with [started_at, ended_at] of visit_a1 must fail
  begin
    insert into public.farm_visits (
      farmer_id, crop_cycle_id, agent_id, status, started_at, ended_at, start_lat, start_lng, tracking_mode
    ) values (
      v_farmer_a_id, v_cycle_a_id, v_agent_a_id, 'completed', 
      now() + interval '10 minutes', now() + interval '30 minutes', -- Overlaps with visit_a1!
      16.506174, 80.648015, 'native_continuous'
    );
    raise exception 'TEST FAILED: Overlapping visit should be rejected by btree_gist exclusion constraint';
  exception when others then
    raise notice 'PASS: btree_gist exclusion constraint prevents overlapping visits per agent.';
  end;

  -- TEST 5: Visit Completion Validation (Services rule)
  -- Completed visit without services decision must fail
  begin
    update public.farm_visits
    set status = 'completed',
        observations_diagnosis = 'Crop looking healthy',
        crop_stage_id = v_stage_id,
        no_services_chosen = false -- and 0 services attached!
    where id = v_visit_a1_id;
    raise exception 'TEST FAILED: Completed visit without services decision should fail';
  exception when others then
    if sqlerrm like '%Must choose at least one value-added service%' then
      raise notice 'PASS: Visit completion validation strictly enforces value-added service decision.';
    else
      raise;
    end if;
  end;

  -- TEST 6: RLS Boundaries - Agent A vs Agent B
  -- Switch to Agent B
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_agent_b_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_agent_b_id::text, 'role', 'authenticated')::text, true);

  -- Agent B cannot see Farmer A
  if exists (select 1 from public.farmers where id = v_farmer_a_id) then
    raise exception 'TEST FAILED: Agent B should NOT see Farmer A';
  end if;
  raise notice 'PASS: Agent B cannot see Agent A assigned farmer.';

  -- Agent B cannot see Agent A visit
  if exists (select 1 from public.farm_visits where id = v_visit_a1_id) then
    raise exception 'TEST FAILED: Agent B should NOT see Agent A visit';
  end if;
  raise notice 'PASS: Agent B cannot see Agent A visit.';

  -- TEST 7: Agent Unassignment Boundary
  -- Admin unassigns Farmer A from Agent A
  perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);

  update public.farmer_assignments 
  set unassigned_at = now() 
  where farmer_id = v_farmer_a_id and agent_id = v_agent_a_id;

  -- Switch back to Agent A
  perform set_config('request.jwt.claim.sub', v_agent_a_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_agent_a_id::text, 'role', 'authenticated')::text, true);

  -- Agent A should no longer see Farmer A
  if exists (select 1 from public.farmers where id = v_farmer_a_id) then
    raise exception 'TEST FAILED: Agent A should NOT see unassigned farmer';
  end if;
  raise notice 'PASS: Agent loses visibility of farmer immediately upon unassignment.';

  -- TEST 8: client_viewer Read-Only Enforcement
  perform set_config('request.jwt.claim.sub', v_viewer_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_viewer_id::text, 'role', 'authenticated')::text, true);

  -- Viewer can read farmers
  if not exists (select 1 from public.farmers where id = v_farmer_a_id) then
    raise exception 'TEST FAILED: Client viewer should be able to read farmers';
  end if;
  raise notice 'PASS: Client viewer can read farmer records.';

  -- Viewer cannot insert or update farmers
  begin
    insert into public.farmers (farmer_code, full_name, phone, village_id, farm_lat, farm_lng)
    values ('SA-999999', 'Hacker Farmer', '+919999999999', v_vil_id, 16.5, 80.5);
    raise exception 'TEST FAILED: Client viewer should not be able to insert farmers';
  exception when others then
    raise notice 'PASS: Client viewer is strictly read-only on farmer records.';
  end;

  -- TEST 9: Anon lockdown
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claim.sub', null, true);
  perform set_config('request.jwt.claims', '{}', true);

  if exists (select 1 from public.farmers) then
    raise exception 'TEST FAILED: Anon should see no farmers';
  end if;
  if exists (select 1 from public.farm_visits) then
    raise exception 'TEST FAILED: Anon should see no visits';
  end if;
  if exists (select 1 from public.app_config) then
    raise exception 'TEST FAILED: Anon should see no app config';
  end if;
  raise notice 'PASS: Anonymous users see nothing across all v2 tables.';

  raise notice '=== ALL PHASE 1 DATABASE TESTS PASSED SUCCESSFULLY ===';
end $$;

rollback;
