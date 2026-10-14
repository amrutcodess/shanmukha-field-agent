-- supabase/tests/database_test.sql
-- Comprehensive Phase 1 Database Test Suite (Section B15.2)
-- Tests: RLS isolation, assignment boundaries, client_viewer read-only, anon lockdown,
-- append-only consent trigger, product size composite FK, single in-progress visit,
-- non-overlapping visits exclusion constraint, and visit completion services validation.
-- Outputs results as a visible table grid with summary counts.
-- Safe: executes inside a transaction and rolls back at the end.
--
-- Fix history (88cd071 -> this commit):
-- FAILURE 1 & 2 (Consent Ledger UPDATE/DELETE):
--   Root cause: farmer_consents has no UPDATE/DELETE RLS policy (007 lines 148-164).
--   Running as `authenticated` causes RLS to silently match 0 rows; the BEFORE trigger
--   never fires. Fix: switch to postgres (session superuser, bypasses RLS) before these
--   tests so the trigger is the only guard -- exactly what we want to verify.
--
-- FAILURES 3, 4, 5 (One in_progress / btree_gist / Completion validation):
--   Root cause: v_visit_a1_id was created INSIDE test 3's begin/exception block.
--   When test 3's FK violation is caught, PostgreSQL rolls back the implicit SAVEPOINT
--   created at block entry, which includes the farm_visit INSERT. After test 3,
--   v_visit_a1_id does not exist in farm_visits, so tests 4/5/6 hit 0 rows and no
--   constraint fires. Fix: create v_visit_a1_id in the fixture setup block (which
--   completes normally and is never rolled back). Test 3 uses a separate v_fk_visit_id.
--
-- FAILURE 6 (Anonymous lockdown):
--   Root cause: after set_config('role','anon',true), the result INSERT runs as anon,
--   which has no INSERT privilege on test_results (only `authenticated` was granted).
--   Fix: capture the boolean check result into v_anon_data_visible, switch back to
--   admin before writing to test_results.

begin;

-- Create temporary table to store test results
create temp table if not exists test_results (
  id serial primary key,
  test_name text not null,
  status text not null,
  detail text
);
alter table test_results enable row level security;
drop policy if exists "test_results_open" on test_results;
create policy "test_results_open" on test_results for all using (true) with check (true);
grant all on test_results to authenticated;
grant usage, select on sequence test_results_id_seq to authenticated;
truncate test_results;

do $$
declare
  -- Actors
  v_admin_id  uuid := 'aaaaaaaa-1111-1111-1111-111111111111';
  v_viewer_id uuid := 'bbbbbbbb-2222-2222-2222-222222222222';
  v_agent_a_id uuid := 'cccccccc-3333-3333-3333-333333333333';
  v_agent_b_id uuid := 'dddddddd-4444-4444-4444-444444444444';
  r_loc record;

  -- Fixtures
  v_reg_id     uuid;
  v_dist_id    uuid;
  v_vil_id     uuid;
  v_crop_id    uuid;
  v_stage_id   uuid;
  v_service_id uuid;
  v_prod_a_id  uuid;
  v_size_a_id  uuid;
  v_prod_b_id  uuid;
  v_size_b_id  uuid;

  -- Test entities
  v_farmer_a_id  uuid;
  v_farmer_b_id  uuid;
  v_cycle_a_id   uuid;
  v_visit_a1_id  uuid;  -- persistent across tests 4/5/6; created in fixture setup
  v_consent_id   uuid;
  v_fk_visit_id  uuid;  -- disposable; used only in test 3 (rolled back by FK violation)
  v_anon_data_visible boolean; -- used in test 11 to capture result before role switch

begin
  -- =========================================================================
  -- FIXTURE SETUP
  -- =========================================================================
  begin
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values
      (v_admin_id,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin_p1@test.local',   'dummy', now(), '{"provider":"email"}', '{}', now(), now()),
      (v_viewer_id,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'viewer_p1@test.local',  'dummy', now(), '{"provider":"email"}', '{}', now(), now()),
      (v_agent_a_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'agent_a_p1@test.local', 'dummy', now(), '{"provider":"email"}', '{}', now(), now()),
      (v_agent_b_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'agent_b_p1@test.local', 'dummy', now(), '{"provider":"email"}', '{}', now(), now())
    on conflict (id) do nothing;

    insert into public.profiles (id, role, full_name, username, is_active)
    values
      (v_admin_id,   'admin',         'Admin P1', 'admin_p1',   true),
      (v_viewer_id,  'client_viewer', 'Viewer P1', 'viewer_p1', true),
      (v_agent_a_id, 'agent',         'Agent A',  'agent_a',    true),
      (v_agent_b_id, 'agent',         'Agent B',  'agent_b',    true)
    on conflict (id) do update set role = excluded.role, is_active = excluded.is_active;

    -- Set admin context (needed for get_or_create_location RPC which checks is_admin())
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);

    for r_loc in (
      select village_id, district_id, region_id
      from public.get_or_create_location('Phase1 Region', 'Phase1 District', 'Phase1 Village')
    ) loop
      v_vil_id  := r_loc.village_id;
      v_dist_id := r_loc.district_id;
      v_reg_id  := r_loc.region_id;
    end loop;

    v_crop_id    := (select id from public.crops where lower(btrim(name_en)) = 'paddy' limit 1);
    v_stage_id   := (select id from public.crop_stages where crop_id = v_crop_id and sort_order = 1 limit 1);
    v_service_id := (select id from public.value_added_services where code = 'sticky_traps' limit 1);

    -- Create 2 products with pack sizes
    v_prod_a_id := gen_random_uuid();
    v_size_a_id := gen_random_uuid();
    insert into public.products (id, name_en, name_te, is_active) values (v_prod_a_id, 'Test Prod A', 'ప్రొడక్ట్ A', true);
    insert into public.product_sizes (id, product_id, size_label, sort_order) values (v_size_a_id, v_prod_a_id, '500 ml', 1);

    v_prod_b_id := gen_random_uuid();
    v_size_b_id := gen_random_uuid();
    insert into public.products (id, name_en, name_te, is_active) values (v_prod_b_id, 'Test Prod B', 'ప్రొడక్ట్ B', true);
    insert into public.product_sizes (id, product_id, size_label, sort_order) values (v_size_b_id, v_prod_b_id, '1000 ml', 1);

    -- Create Farmers
    v_farmer_a_id := gen_random_uuid();
    v_farmer_b_id := gen_random_uuid();
    insert into public.farmers (id, farmer_code, full_name, phone, village_id, farm_lat, farm_lng, farm_accuracy_m, consent_status, onboarded_by)
    values (v_farmer_a_id, 'SA-100001', 'Farmer Alpha', '+919100000001', v_vil_id, 16.506174, 80.648015, 12.5, 'granted', v_agent_a_id);
    insert into public.farmers (id, farmer_code, full_name, phone, village_id, farm_lat, farm_lng, farm_accuracy_m, consent_status, onboarded_by)
    values (v_farmer_b_id, 'SA-100002', 'Farmer Beta',  '+919100000002', v_vil_id, 16.507174, 80.649015, 10.0, 'granted', v_agent_b_id);

    -- Assign Farmer A -> Agent A; Farmer B -> Agent B
    insert into public.farmer_assignments (farmer_id, agent_id, assigned_by) values (v_farmer_a_id, v_agent_a_id, v_admin_id);
    insert into public.farmer_assignments (farmer_id, agent_id, assigned_by) values (v_farmer_b_id, v_agent_b_id, v_admin_id);

    -- Create Crop Cycle for Farmer A
    v_cycle_a_id := gen_random_uuid();
    insert into public.crop_cycles (id, farmer_id, crop_id, season, acreage, sowing_date)
    values (v_cycle_a_id, v_farmer_a_id, v_crop_id, 'Kharif 2026', 3.5, current_date - 30);

    -- Create Consent for Farmer A
    v_consent_id := gen_random_uuid();
    insert into public.farmer_consents (id, farmer_id, agent_id, event, notice_version, notice_language)
    values (v_consent_id, v_farmer_a_id, v_agent_a_id, 'granted', '1.0', 'te');

    -- Create the persistent in-progress visit for Agent A.
    -- IMPORTANT: this MUST live in the fixture setup block, NOT inside test 3's begin/exception
    -- block. When test 3 catches its FK violation, PostgreSQL rolls back to test 3's implicit
    -- SAVEPOINT. Any INSERT made inside that block is undone. Tests 4, 5, and 6 all depend on
    -- this visit existing after test 3 finishes.
    v_visit_a1_id := gen_random_uuid();
    insert into public.farm_visits (
      id, farmer_id, crop_cycle_id, agent_id, status, started_at, start_lat, start_lng, tracking_mode
    ) values (
      v_visit_a1_id, v_farmer_a_id, v_cycle_a_id, v_agent_a_id,
      'in_progress', now(), 16.506174, 80.648015, 'native_continuous'
    );

  exception when others then
    insert into test_results (test_name, status, detail)
    values ('Fixture Setup', 'FAIL', 'Setup error: ' || sqlerrm);
    return;
  end;

  -- =========================================================================
  -- TESTS 1 & 2: Consent Ledger immutability
  -- Switch to postgres (session superuser) to bypass RLS before these tests.
  -- Rationale: farmer_consents has only SELECT + INSERT RLS policies (007 lines 148-164).
  -- No UPDATE and no DELETE policy exists. Running as `authenticated` causes PostgreSQL
  -- to silently match 0 rows on UPDATE/DELETE (no USING policy = no visible rows), so
  -- the BEFORE trigger never fires. Running as postgres bypasses RLS entirely; the trigger
  -- becomes the only guard -- which is exactly what these tests are verifying.
  -- =========================================================================
  perform set_config('role', 'postgres', true);

  -- TEST 1: Append-Only Trigger blocks UPDATE
  begin
    update public.farmer_consents set notice_version = '2.0' where id = v_consent_id;
    -- If we reach here, the trigger did not fire (a real failure)
    insert into test_results (test_name, status, detail)
    values ('Consent Ledger: Block UPDATE', 'FAIL', 'UPDATE reached the table — trigger did not fire');
  exception when others then
    if sqlerrm like '%immutable append-only ledger%' then
      insert into test_results (test_name, status, detail)
      values ('Consent Ledger: Block UPDATE', 'PASS', 'Trigger strictly prevented UPDATE');
    else
      insert into test_results (test_name, status, detail)
      values ('Consent Ledger: Block UPDATE', 'FAIL', 'Unexpected error: ' || sqlerrm);
    end if;
  end;

  -- TEST 2: Append-Only Trigger blocks DELETE
  begin
    delete from public.farmer_consents where id = v_consent_id;
    -- If we reach here, the trigger did not fire (a real failure)
    insert into test_results (test_name, status, detail)
    values ('Consent Ledger: Block DELETE', 'FAIL', 'DELETE reached the table — trigger did not fire');
  exception when others then
    if sqlerrm like '%immutable append-only ledger%' then
      insert into test_results (test_name, status, detail)
      values ('Consent Ledger: Block DELETE', 'PASS', 'Trigger strictly prevented DELETE');
    else
      insert into test_results (test_name, status, detail)
      values ('Consent Ledger: Block DELETE', 'FAIL', 'Unexpected error: ' || sqlerrm);
    end if;
  end;

  -- Restore admin context for constraint / RLS tests
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);

  -- =========================================================================
  -- TEST 3: Product Size Composite Foreign Key Enforcement
  -- Uses v_fk_visit_id (a separate, disposable visit) so that when the FK
  -- violation is caught and the savepoint is rolled back, v_visit_a1_id (the
  -- fixture visit that tests 4/5/6 depend on) is unaffected.
  -- =========================================================================
  begin
    v_fk_visit_id := gen_random_uuid();
    insert into public.farm_visits (
      id, farmer_id, crop_cycle_id, agent_id, status, started_at, ended_at,
      start_lat, start_lng, tracking_mode
    ) values (
      v_fk_visit_id, v_farmer_a_id, v_cycle_a_id, v_agent_a_id, 'completed',
      now() - interval '10 days', now() - interval '10 days' + interval '2 hours',
      16.506174, 80.648015, 'native_continuous'
    );

    insert into public.visit_purchase_items (
      visit_id, product_id, product_size_id, quantity, product_name_snapshot, size_label_snapshot
    ) values (
      v_fk_visit_id, v_prod_a_id, v_size_b_id, 2, 'Prod A', 'Size B'  -- Mismatch: size_b belongs to prod_b
    );

    insert into test_results (test_name, status, detail)
    values ('Catalogs: Composite FK product/size', 'FAIL', 'Composite FK allowed cross-product pack size — constraint missing or wrong');
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('Catalogs: Composite FK product/size', 'PASS', 'Composite FK strictly prevented cross-product pack size');
  end;

  -- =========================================================================
  -- TEST 4: Exactly One in_progress Visit Per Agent
  -- v_visit_a1_id is already in_progress for agent_a (created in fixture setup).
  -- The unique partial index unique_agent_in_progress_visit must reject a second one.
  -- =========================================================================
  begin
    insert into public.farm_visits (
      farmer_id, crop_cycle_id, agent_id, status, started_at, start_lat, start_lng, tracking_mode
    ) values (
      v_farmer_a_id, v_cycle_a_id, v_agent_a_id, 'in_progress',
      now() + interval '1 hour', 16.506174, 80.648015, 'native_continuous'
    );
    -- If we reach here, the index did not fire (a real failure)
    insert into test_results (test_name, status, detail)
    values ('Visits: One in_progress per agent', 'FAIL', 'Second in_progress insert succeeded — unique partial index did not fire');
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('Visits: One in_progress per agent', 'PASS', 'Unique partial index rejected second in_progress visit');
  end;

  -- Set ended_at on v_visit_a1_id so it has a bounded time range for the overlap test.
  -- Status stays 'in_progress'; the exclusion constraint still applies (status clause includes it).
  update public.farm_visits
  set ended_at = started_at + interval '45 minutes'
  where id = v_visit_a1_id;

  -- =========================================================================
  -- TEST 5: Non-Overlapping Visits Exclusion Constraint (btree_gist)
  -- v_visit_a1_id range: [now(), now()+45min).
  -- New insert range: [now()+10min, now()+30min) — clearly overlaps.
  -- =========================================================================
  begin
    insert into public.farm_visits (
      farmer_id, crop_cycle_id, agent_id, status, started_at, ended_at,
      start_lat, start_lng, tracking_mode
    ) values (
      v_farmer_a_id, v_cycle_a_id, v_agent_a_id, 'completed',
      now() + interval '10 minutes', now() + interval '30 minutes',
      16.506174, 80.648015, 'native_continuous'
    );
    -- If we reach here, the exclusion constraint did not fire (a real failure)
    insert into test_results (test_name, status, detail)
    values ('Visits: Non-overlapping time (btree_gist)', 'FAIL', 'Overlapping visit insert succeeded — exclusion constraint did not fire');
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('Visits: Non-overlapping time (btree_gist)', 'PASS', 'Exclusion constraint prevented overlapping visit times');
  end;

  -- =========================================================================
  -- TEST 6: Visit Completion Validation (services rule)
  -- Tries to complete v_visit_a1_id with no_services_chosen=false but 0 services attached.
  -- The validate_farm_visit_completion trigger (006 lines 60-89) must raise.
  -- =========================================================================
  begin
    update public.farm_visits
    set status = 'completed',
        observations_diagnosis = 'Crop looking healthy',
        crop_stage_id = v_stage_id,
        no_services_chosen = false  -- 0 services attached — must be rejected
    where id = v_visit_a1_id;
    -- If we reach here, the trigger did not fire (a real failure)
    insert into test_results (test_name, status, detail)
    values ('Visits: Completion services validation', 'FAIL', 'Completed visit with 0 services was accepted — trigger did not fire');
  exception when others then
    if sqlerrm like '%Must choose at least one value-added service%' then
      insert into test_results (test_name, status, detail)
      values ('Visits: Completion services validation', 'PASS', 'Validation trigger enforced value-added service requirement');
    else
      insert into test_results (test_name, status, detail)
      values ('Visits: Completion services validation', 'FAIL', 'Unexpected error: ' || sqlerrm);
    end if;
  end;

  -- =========================================================================
  -- TEST 7: Cross-Agent RLS Isolation (Farmer visibility)
  -- =========================================================================
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_agent_b_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent_b_id::text, 'role', 'authenticated')::text, true);

    if exists (select 1 from public.farmers where id = v_farmer_a_id) then
      insert into test_results (test_name, status, detail)
      values ('RLS: Agent farmer isolation', 'FAIL', 'Agent B was able to see Farmer A');
    else
      insert into test_results (test_name, status, detail)
      values ('RLS: Agent farmer isolation', 'PASS', 'Agent B cannot see Farmer A (0 rows returned by RLS)');
    end if;
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('RLS: Agent farmer isolation', 'FAIL', sqlerrm);
  end;

  -- TEST 8: Cross-Agent RLS Isolation (Visit visibility)
  begin
    if exists (select 1 from public.farm_visits where id = v_visit_a1_id) then
      insert into test_results (test_name, status, detail)
      values ('RLS: Agent visit isolation', 'FAIL', 'Agent B was able to see Agent A visit');
    else
      insert into test_results (test_name, status, detail)
      values ('RLS: Agent visit isolation', 'PASS', 'Agent B cannot see Visit A1 (0 rows returned by RLS)');
    end if;
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('RLS: Agent visit isolation', 'FAIL', sqlerrm);
  end;

  -- TEST 9: Agent Unassignment Boundary
  begin
    perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);

    update public.farmer_assignments
    set unassigned_at = now()
    where farmer_id = v_farmer_a_id and agent_id = v_agent_a_id;

    perform set_config('request.jwt.claim.sub', v_agent_a_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent_a_id::text, 'role', 'authenticated')::text, true);

    if exists (select 1 from public.farmers where id = v_farmer_a_id) then
      insert into test_results (test_name, status, detail)
      values ('RLS: Unassignment boundary', 'FAIL', 'Agent A still sees Farmer A after unassignment');
    else
      insert into test_results (test_name, status, detail)
      values ('RLS: Unassignment boundary', 'PASS', 'Farmer A became immediately invisible to Agent A upon unassignment');
    end if;
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('RLS: Unassignment boundary', 'FAIL', sqlerrm);
  end;

  -- TEST 10: client_viewer Read-Only Enforcement
  begin
    perform set_config('request.jwt.claim.sub', v_viewer_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_viewer_id::text, 'role', 'authenticated')::text, true);

    -- Viewer must be able to read farmers
    if not exists (select 1 from public.farmers where id = v_farmer_a_id) then
      insert into test_results (test_name, status, detail)
      values ('RLS: client_viewer read permission', 'FAIL', 'Client viewer could not read farmer record');
    else
      insert into test_results (test_name, status, detail)
      values ('RLS: client_viewer read permission', 'PASS', 'Client viewer successfully read farmer record');
    end if;

    -- Viewer must NOT be able to write
    begin
      insert into public.farmers (farmer_code, full_name, phone, village_id, farm_lat, farm_lng, farm_accuracy_m, consent_status, onboarded_by)
      values ('SA-999999', 'Hacker Farmer', '+919999999999', v_vil_id, 16.5, 80.5, 5.0, 'pending', v_viewer_id);
      insert into test_results (test_name, status, detail)
      values ('RLS: client_viewer write denial', 'FAIL', 'Client viewer INSERT was accepted — write should have been denied');
    exception when others then
      insert into test_results (test_name, status, detail)
      values ('RLS: client_viewer write denial', 'PASS', 'Insert rejected by RLS for client_viewer');
    end;
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('RLS: client_viewer checks', 'FAIL', sqlerrm);
  end;

  -- =========================================================================
  -- TEST 11: Anonymous Lockdown
  -- Bug (original): after set_config('role','anon',true), the result INSERT ran as anon,
  -- which has no INSERT privilege on test_results. Fix: capture the boolean check result
  -- into v_anon_data_visible, switch back to admin, THEN write to test_results.
  -- =========================================================================
  begin
    -- Perform SELECT checks as anon
    perform set_config('role', 'anon', true);
    perform set_config('request.jwt.claim.sub', null, true);
    perform set_config('request.jwt.claims', '{}', true);

    v_anon_data_visible := (
      exists(select 1 from public.farmers)    or
      exists(select 1 from public.farm_visits) or
      exists(select 1 from public.app_config)
    );

    -- Switch back to admin BEFORE writing to test_results (anon lacks INSERT privilege)
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);

    if v_anon_data_visible then
      insert into test_results (test_name, status, detail)
      values ('RLS: Anonymous lockdown', 'FAIL', 'Anon was able to read data from at least one v2 table');
    else
      insert into test_results (test_name, status, detail)
      values ('RLS: Anonymous lockdown', 'PASS', 'Anon user sees 0 rows across farmers, farm_visits, and app_config');
    end if;
  exception when others then
    -- On exception the savepoint rollback reverts set_config(is_local=true) back to
    -- the pre-block role (authenticated), so this INSERT runs as authenticated and succeeds.
    insert into test_results (test_name, status, detail)
    values ('RLS: Anonymous lockdown', 'FAIL', sqlerrm);
  end;

end $$;

-- Summary Count Row
insert into test_results (test_name, status, detail)
select
  'TOTAL SUMMARY' as test_name,
  case when count(*) filter (where status = 'FAIL') = 0 then 'PASS' else 'FAIL' end as status,
  'Passed: ' || count(*) filter (where status = 'PASS') ||
  ' | Failed: ' || count(*) filter (where status = 'FAIL') ||
  ' | Total Tests: ' || count(*) as detail
from test_results;

-- Return results as a visible table grid
select id, test_name, status, detail
from test_results
order by id;

-- Rollback transaction so no test users, visits, or records are retained
rollback;
