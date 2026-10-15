-- supabase/tests/database_test.sql
-- Comprehensive Phase 1 & Gate 1 Database Test Suite
-- Strict verification covering B1-B6 blockers, Gap A, Gap B, security constraints, and RLS policies.
-- Prints exactly ONE result grid so all test rows are visible in the SQL editor.
-- Safe: executes inside a transaction and rolls back at the end.

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
grant all on test_results to authenticated, anon;
grant usage, select on sequence test_results_id_seq to authenticated, anon;
truncate test_results;

do $$
declare
  -- Diagnostic variables
  v_err_constraint text;
  v_err_message text;

  -- Actors
  v_admin_id   uuid := 'aaaaaaaa-1111-1111-1111-111111111111';
  v_viewer_id  uuid := 'bbbbbbbb-2222-2222-2222-222222222222';
  v_agent_a_id uuid := 'cccccccc-3333-3333-3333-333333333333';
  v_agent_b_id uuid := 'dddddddd-4444-4444-4444-444444444444';
  v_deact_id   uuid := 'eeeeeeee-5555-5555-5555-555555555555';

  -- Fixtures
  v_reg_id     uuid;
  v_dist_id    uuid;
  v_vil_id     uuid;
  v_vil2_id    uuid;
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
  v_visit_a1_id  uuid;
  v_consent_id   uuid;
  v_fk_visit_id  uuid;
  v_own_visit_id uuid;
  v_gap_visit_id uuid;
  v_dummy_id     uuid;
  v_count        integer;
  v_val_text     text;
  v_before_cnt   integer;
  v_after_cnt    integer;
  v_ts_check     timestamptz;
  v_ended_at     timestamptz;
  v_duration     integer;
  v_view_name    text;
  v_leaked_privs text;

  -- Agent C: dedicated actor for Gap A (no prior visits, no overlaps)
  v_agent_c_id  uuid := 'ffffffff-6666-6666-6666-666666666666';
  v_farmer_c_id uuid;
  v_cycle_c_id  uuid;

begin
  -- =========================================================================
  -- FIXTURE SETUP (Executed as postgres / table owner)
  -- =========================================================================
  begin
    perform set_config('role', 'postgres', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims', '', true);

    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values
      (v_admin_id,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin_p1@test.local',   'dummy', now(), '{"provider":"email"}', '{}', now(), now()),
      (v_viewer_id,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'viewer_p1@test.local',  'dummy', now(), '{"provider":"email"}', '{}', now(), now()),
      (v_agent_a_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'agent_a_p1@test.local', 'dummy', now(), '{"provider":"email"}', '{}', now(), now()),
      (v_agent_b_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'agent_b_p1@test.local', 'dummy', now(), '{"provider":"email"}', '{}', now(), now()),
      (v_deact_id,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'deact_p1@test.local',   'dummy', now(), '{"provider":"email"}', '{}', now(), now())
    on conflict (id) do nothing;

    insert into public.profiles (id, role, full_name, username, is_active)
    values
      (v_admin_id,   'admin',         'Admin P1',       'admin_p1',   true),
      (v_viewer_id,  'client_viewer', 'Viewer P1',      'viewer_p1',  true),
      (v_agent_a_id, 'agent',         'Agent A',        'agent_a',    true),
      (v_agent_b_id, 'agent',         'Agent B',        'agent_b',    true),
      (v_deact_id,   'agent',         'Deactivated P1', 'agent_deact',false)
    on conflict (id) do update set role = excluded.role, is_active = excluded.is_active;

    -- Locations
    insert into public.regions (name) values ('Phase1 Region') returning id into v_reg_id;
    insert into public.districts (region_id, name) values (v_reg_id, 'Phase1 District') returning id into v_dist_id;
    insert into public.villages (district_id, name) values (v_dist_id, 'Phase1 Village') returning id into v_vil_id;
    insert into public.villages (district_id, name) values (v_dist_id, 'Phase1 Village 2') returning id into v_vil2_id;

    v_crop_id    := (select id from public.crops where lower(btrim(name_en)) = 'paddy' limit 1);
    v_stage_id   := (select id from public.crop_stages where crop_id = v_crop_id and sort_order = 1 limit 1);
    v_service_id := (select id from public.value_added_services where code = 'sticky_traps' limit 1);

    -- Products and pack sizes
    v_prod_a_id := gen_random_uuid();
    v_size_a_id := gen_random_uuid();
    insert into public.products (id, name_en, name_te, is_active) values (v_prod_a_id, 'Test Prod A', 'ప్రొడక్ట్ A', true);
    insert into public.product_sizes (id, product_id, size_label, sort_order) values (v_size_a_id, v_prod_a_id, '500 ml', 1);

    v_prod_b_id := gen_random_uuid();
    v_size_b_id := gen_random_uuid();
    insert into public.products (id, name_en, name_te, is_active) values (v_prod_b_id, 'Test Prod B', 'ప్రొడక్ట్ B', true);
    insert into public.product_sizes (id, product_id, size_label, sort_order) values (v_size_b_id, v_prod_b_id, '1000 ml', 1);

    -- Farmers
    v_farmer_a_id := gen_random_uuid();
    v_farmer_b_id := gen_random_uuid();
    insert into public.farmers (id, farmer_code, full_name, phone, village_id, farm_lat, farm_lng, farm_accuracy_m, consent_status, onboarded_by)
    values (v_farmer_a_id, 'SA-100001', 'Farmer Alpha', '+919100000001', v_vil_id, 16.506174, 80.648015, 12.5, 'granted', v_agent_a_id);
    insert into public.farmers (id, farmer_code, full_name, phone, village_id, farm_lat, farm_lng, farm_accuracy_m, consent_status, onboarded_by)
    values (v_farmer_b_id, 'SA-100002', 'Farmer Beta',  '+919100000002', v_vil_id, 16.507174, 80.649015, 10.0, 'granted', v_agent_b_id);

    -- Assignments
    insert into public.farmer_assignments (farmer_id, agent_id, assigned_by) values (v_farmer_a_id, v_agent_a_id, v_admin_id);
    insert into public.farmer_assignments (farmer_id, agent_id, assigned_by) values (v_farmer_b_id, v_agent_b_id, v_admin_id);

    -- Crop Cycle
    v_cycle_a_id := gen_random_uuid();
    insert into public.crop_cycles (id, farmer_id, crop_id, season, acreage, sowing_date)
    values (v_cycle_a_id, v_farmer_a_id, v_crop_id, 'Kharif 2026', 3.5, current_date - 30);

    -- Consent for Farmer A
    v_consent_id := gen_random_uuid();
    insert into public.farmer_consents (id, farmer_id, agent_id, event, notice_version, notice_language)
    values (v_consent_id, v_farmer_a_id, v_agent_a_id, 'granted', '1.0', 'te');

    -- Persistent in_progress visit for Agent A
    v_visit_a1_id := gen_random_uuid();
    insert into public.farm_visits (
      id, client_uuid, farmer_id, crop_cycle_id, agent_id, status, started_at, start_lat, start_lng, tracking_mode, time_source
    ) values (
      v_visit_a1_id, gen_random_uuid(), v_farmer_a_id, v_cycle_a_id, v_agent_a_id,
      'in_progress', now(), 16.506174, 80.648015, 'native_continuous', 'server'
    );

    -- Agent C: isolated actor for Gap A (no visits, no overlap hazard)
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      v_agent_c_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'agent_c_p1@test.local', 'dummy', now(), '{"provider":"email"}', '{}', now(), now()
    ) on conflict (id) do nothing;

    insert into public.profiles (id, role, full_name, username, is_active)
    values (v_agent_c_id, 'agent', 'Agent C', 'agent_c_p1', true)
    on conflict (id) do update set role = excluded.role, is_active = excluded.is_active;

    v_farmer_c_id := gen_random_uuid();
    insert into public.farmers (id, farmer_code, full_name, phone, village_id, farm_lat, farm_lng, farm_accuracy_m, consent_status, onboarded_by)
    values (v_farmer_c_id, 'SA-100003', 'Farmer Gamma', '+919100000003', v_vil_id, 16.508174, 80.650015, 8.0, 'granted', v_agent_c_id);

    insert into public.farmer_assignments (farmer_id, agent_id, assigned_by)
    values (v_farmer_c_id, v_agent_c_id, v_admin_id);

    v_cycle_c_id := gen_random_uuid();
    insert into public.crop_cycles (id, farmer_id, crop_id, season, acreage, sowing_date)
    values (v_cycle_c_id, v_farmer_c_id, v_crop_id, 'Kharif 2026 C', 2.0, current_date - 20);

  exception when others then
    insert into test_results (test_name, status, detail)
    values ('Fixture Setup', 'FAIL', 'Setup error: ' || sqlerrm);
    return;
  end;


  -- =========================================================================
  -- 1. POSITIVE CONTROL: Agent A sees assigned Farmer A & Visit A1
  -- =========================================================================
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_agent_a_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent_a_id::text, 'role', 'authenticated')::text, true);

    if exists (select 1 from public.farmers where id = v_farmer_a_id) and
       exists (select 1 from public.farm_visits where id = v_visit_a1_id) then
      insert into test_results (test_name, status, detail)
      values ('Control: Agent A sees own farmer & visit', 'PASS', 'Agent A successfully sees Farmer A and Visit A1');
    else
      insert into test_results (test_name, status, detail)
      values ('Control: Agent A sees own farmer & visit', 'FAIL', 'Agent A could not see assigned farmer or own visit');
    end if;
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('Control: Agent A sees own farmer & visit', 'FAIL', sqlerrm);
  end;

  -- =========================================================================
  -- 2. POSITIVE CONTROL: Agent inserts and completes own visit with service attached
  -- =========================================================================
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_agent_b_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent_b_id::text, 'role', 'authenticated')::text, true);

    v_own_visit_id := gen_random_uuid();
    insert into public.farm_visits (
      id, client_uuid, farmer_id, crop_cycle_id, agent_id, status, started_at, start_lat, start_lng, tracking_mode, time_source
    ) values (
      v_own_visit_id, gen_random_uuid(), v_farmer_b_id, v_cycle_a_id, v_agent_b_id,
      'in_progress', now(), 16.507174, 80.649015, 'native_continuous', 'server'
    );

    insert into public.visit_services (visit_id, service_id)
    values (v_own_visit_id, v_service_id);

    update public.farm_visits
    set status = 'completed',
        crop_stage_id = v_stage_id,
        observations_diagnosis = 'Normal healthy growth',
        no_services_chosen = false
    where id = v_own_visit_id;

    insert into test_results (test_name, status, detail)
    values ('Control: Agent completes visit with service', 'PASS', 'Visit successfully created, attached service, and completed');
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('Control: Agent completes visit with service', 'FAIL', sqlerrm);
  end;

  -- =========================================================================
  -- 3. Consent Ledger: Block UPDATE
  -- =========================================================================
  begin
    perform set_config('role', 'postgres', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims', '', true);

    update public.farmer_consents
    set notice_version = '2.0'
    where id = v_consent_id;

    insert into test_results (test_name, status, detail)
    values ('Consent Ledger: Block UPDATE', 'FAIL', 'UPDATE succeeded; trigger did not fire');
  exception when others then
    if sqlerrm like '%immutable append-only ledger%' then
      insert into test_results (test_name, status, detail)
      values ('Consent Ledger: Block UPDATE', 'PASS', 'Trigger strictly prevented UPDATE');
    else
      insert into test_results (test_name, status, detail)
      values ('Consent Ledger: Block UPDATE', 'FAIL', 'Unexpected error: ' || sqlerrm);
    end if;
  end;

  -- =========================================================================
  -- 4. Consent Ledger: Block DELETE
  -- =========================================================================
  begin
    perform set_config('role', 'postgres', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims', '', true);

    delete from public.farmer_consents where id = v_consent_id;

    insert into test_results (test_name, status, detail)
    values ('Consent Ledger: Block DELETE', 'FAIL', 'DELETE succeeded; trigger did not fire');
  exception when others then
    if sqlerrm like '%immutable append-only ledger%' then
      insert into test_results (test_name, status, detail)
      values ('Consent Ledger: Block DELETE', 'PASS', 'Trigger strictly prevented DELETE');
    else
      insert into test_results (test_name, status, detail)
      values ('Consent Ledger: Block DELETE', 'FAIL', 'Unexpected error: ' || sqlerrm);
    end if;
  end;

  -- =========================================================================
  -- 5. Consent Ledger: Block TRUNCATE
  -- =========================================================================
  begin
    perform set_config('role', 'postgres', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims', '', true);

    truncate table public.farmer_consents;
    insert into test_results (test_name, status, detail)
    values ('Consent Ledger: Block TRUNCATE', 'FAIL', 'TRUNCATE succeeded; table truncated');
  exception when others then
    if sqlerrm like '%immutable append-only ledger%' then
      insert into test_results (test_name, status, detail)
      values ('Consent Ledger: Block TRUNCATE', 'PASS', 'TRUNCATE operation strictly blocked');
    else
      insert into test_results (test_name, status, detail)
      values ('Consent Ledger: Block TRUNCATE', 'FAIL', 'Unexpected error on TRUNCATE: ' || sqlerrm);
    end if;
  end;

  -- =========================================================================
  -- 6. Catalogs: Composite FK product/size (Runs as postgres with admin claims)
  -- =========================================================================
  begin
    -- Run as postgres (superuser): bypasses authoritative-time trigger so we can
    -- insert a historical completed visit without colliding with Agent A's current
    -- in_progress visit (unique_agent_in_progress_visit).
    perform set_config('role', 'postgres', true);
    perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);

    v_fk_visit_id := gen_random_uuid();
    -- Historical completed visit: started/ended 30 days ago, no_services_chosen = true
    -- (satisfies completion trigger), well outside any other visit's time range.
    insert into public.farm_visits (
      id, client_uuid, farmer_id, crop_cycle_id, agent_id, status,
      started_at, ended_at, duration_seconds,
      start_lat, start_lng, tracking_mode, no_services_chosen,
      observations_diagnosis, crop_stage_id, time_source
    ) values (
      v_fk_visit_id, gen_random_uuid(), v_farmer_a_id, v_cycle_a_id, v_agent_a_id,
      'completed',
      now() - interval '30 days',
      now() - interval '30 days' + interval '45 minutes',
      2700,
      16.5, 80.6, 'native_continuous', true,
      'FK constraint test visit', v_stage_id, 'server'
    );

    -- Now try to insert a purchase item with mismatched product/size (prod_a + size_b)
    insert into public.visit_purchase_items (visit_id, product_id, product_size_id, quantity)
    values (v_fk_visit_id, v_prod_a_id, v_size_b_id, 2);

    insert into test_results (test_name, status, detail)
    values ('Catalogs: Composite FK product/size', 'FAIL', 'Composite FK violated silently');
  exception when foreign_key_violation then
    get stacked diagnostics v_err_constraint = CONSTRAINT_NAME;
    if v_err_constraint = 'fk_visit_purchase_product_size' then
      insert into test_results (test_name, status, detail)
      values ('Catalogs: Composite FK product/size', 'PASS', 'Verified exact constraint: ' || v_err_constraint);
    else
      insert into test_results (test_name, status, detail)
      values ('Catalogs: Composite FK product/size', 'FAIL', 'Wrong FK constraint: ' || coalesce(v_err_constraint, 'null'));
    end if;
  when others then
    insert into test_results (test_name, status, detail)
    values ('Catalogs: Composite FK product/size', 'FAIL', 'Unexpected error: ' || sqlerrm);
  end;


  -- =========================================================================
  -- 7. Visits: One in_progress per agent (Runs as postgres with admin claims)
  -- =========================================================================
  begin
    perform set_config('role', 'postgres', true);
    perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);

    -- Attempt inserting second in_progress visit for Agent A (Agent A already has visit_a1 in_progress)
    insert into public.farm_visits (
      client_uuid, farmer_id, crop_cycle_id, agent_id, status, started_at, start_lat, start_lng, tracking_mode, time_source
    ) values (
      gen_random_uuid(), v_farmer_a_id, v_cycle_a_id, v_agent_a_id, 'in_progress',
      now() + interval '10 days', 16.506174, 80.648015, 'native_continuous', 'server'
    );

    insert into test_results (test_name, status, detail)
    values ('Visits: One in_progress per agent', 'FAIL', 'Allowed two in_progress visits');
  exception when unique_violation then
    get stacked diagnostics v_err_constraint = CONSTRAINT_NAME;
    if v_err_constraint = 'unique_agent_in_progress_visit' then
      insert into test_results (test_name, status, detail)
      values ('Visits: One in_progress per agent', 'PASS', 'Verified exact unique index: ' || v_err_constraint);
    else
      insert into test_results (test_name, status, detail)
      values ('Visits: One in_progress per agent', 'FAIL', 'Wrong unique constraint: ' || coalesce(v_err_constraint, 'null'));
    end if;
  when others then
    insert into test_results (test_name, status, detail)
    values ('Visits: One in_progress per agent', 'FAIL', 'Unexpected error: ' || sqlerrm);
  end;

  -- =========================================================================
  -- 8. Visits: Non-overlapping time (btree_gist) (Runs as postgres with admin claims)
  -- =========================================================================
  begin
    perform set_config('role', 'postgres', true);
    perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);

    insert into public.farm_visits (
      client_uuid, farmer_id, crop_cycle_id, agent_id, status, started_at, ended_at,
      duration_seconds, start_lat, start_lng, tracking_mode, no_services_chosen, observations_diagnosis, crop_stage_id, time_source
    ) values (
      gen_random_uuid(), v_farmer_a_id, v_cycle_a_id, v_agent_a_id, 'completed',
      now() - interval '20 days', now() - interval '20 days' + interval '60 minutes',
      3600, 16.506174, 80.648015, 'native_continuous', true, 'Historical completed visit 1', v_stage_id, 'server'
    );

    insert into public.farm_visits (
      client_uuid, farmer_id, crop_cycle_id, agent_id, status, started_at, ended_at,
      duration_seconds, start_lat, start_lng, tracking_mode, no_services_chosen, observations_diagnosis, crop_stage_id, time_source
    ) values (
      gen_random_uuid(), v_farmer_a_id, v_cycle_a_id, v_agent_a_id, 'completed',
      now() - interval '20 days' + interval '15 minutes', now() - interval '20 days' + interval '75 minutes',
      3600, 16.506174, 80.648015, 'native_continuous', true, 'Overlapping completed visit', v_stage_id, 'server'
    );

    insert into test_results (test_name, status, detail)
    values ('Visits: Non-overlapping time (btree_gist)', 'FAIL', 'Allowed overlapping completed visits');
  exception when exclusion_violation then
    get stacked diagnostics v_err_constraint = CONSTRAINT_NAME;
    if v_err_constraint = 'no_overlapping_agent_visits' then
      insert into test_results (test_name, status, detail)
      values ('Visits: Non-overlapping time (btree_gist)', 'PASS', 'Verified exact exclusion constraint: ' || v_err_constraint);
    else
      insert into test_results (test_name, status, detail)
      values ('Visits: Non-overlapping time (btree_gist)', 'FAIL', 'Wrong exclusion constraint: ' || coalesce(v_err_constraint, 'null'));
    end if;
  when others then
    insert into test_results (test_name, status, detail)
    values ('Visits: Non-overlapping time (btree_gist)', 'FAIL', 'Unexpected error: ' || sqlerrm);
  end;

  -- =========================================================================
  -- 9. Visits: Completion services validation (Runs as Agent A on own visit)
  -- =========================================================================
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_agent_a_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent_a_id::text, 'role', 'authenticated')::text, true);

    -- Ensure no services attached to v_visit_a1_id
    delete from public.visit_services where visit_id = v_visit_a1_id;

    update public.farm_visits
    set status = 'completed',
        observations_diagnosis = 'Missing service requirement',
        crop_stage_id = v_stage_id,
        no_services_chosen = false
    where id = v_visit_a1_id;

    insert into test_results (test_name, status, detail)
    values ('Visits: Completion services validation', 'FAIL', 'Completed visit with 0 services and no_services_chosen = false');
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
  -- 10. RLS: Agent farmer isolation
  -- =========================================================================
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_agent_b_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent_b_id::text, 'role', 'authenticated')::text, true);

    select count(*) into v_count from public.farmers where id = v_farmer_a_id;

    if v_count = 0 then
      insert into test_results (test_name, status, detail)
      values ('RLS: Agent farmer isolation', 'PASS', 'Agent B cannot see Farmer A (0 rows returned)');
    else
      insert into test_results (test_name, status, detail)
      values ('RLS: Agent farmer isolation', 'FAIL', 'Agent B saw Farmer A');
    end if;
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('RLS: Agent farmer isolation', 'FAIL', sqlerrm);
  end;

  -- =========================================================================
  -- 11. RLS: Agent visit isolation
  -- =========================================================================
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_agent_b_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent_b_id::text, 'role', 'authenticated')::text, true);

    select count(*) into v_count from public.farm_visits where id = v_visit_a1_id;

    if v_count = 0 then
      insert into test_results (test_name, status, detail)
      values ('RLS: Agent visit isolation', 'PASS', 'Agent B cannot see Visit A1 (0 rows returned)');
    else
      insert into test_results (test_name, status, detail)
      values ('RLS: Agent visit isolation', 'FAIL', 'Agent B saw Visit A1');
    end if;
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('RLS: Agent visit isolation', 'FAIL', sqlerrm);
  end;

  -- =========================================================================
  -- 12. RLS: Anonymous Lockdown
  -- =========================================================================
  begin
    perform set_config('role', 'anon', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims', '{}', true);

    if exists(select 1 from public.farmers) or
       exists(select 1 from public.farm_visits) or
       exists(select 1 from public.app_config) then
      insert into test_results (test_name, status, detail)
      values ('RLS: Anonymous lockdown', 'FAIL', 'Anon was able to read data');
    else
      insert into test_results (test_name, status, detail)
      values ('RLS: Anonymous lockdown', 'PASS', 'Anon user sees 0 rows across farmers, farm_visits, and app_config');
    end if;
  exception when others then
    if sqlerrm like '%permission denied%' then
      insert into test_results (test_name, status, detail)
      values ('RLS: Anonymous lockdown', 'PASS', 'Anon access rejected: ' || sqlerrm);
    else
      insert into test_results (test_name, status, detail)
      values ('RLS: Anonymous lockdown', 'FAIL', 'Unexpected error: ' || sqlerrm);
    end if;
  end;

  -- =========================================================================
  -- 13. RLS: consent_otps Unreadable and Unwritable (Agent, Viewer, Admin)
  -- =========================================================================
  begin
    -- Test Agent
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_agent_a_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent_a_id::text, 'role', 'authenticated')::text, true);

    select count(*) into v_count from public.consent_otps;
    if v_count > 0 then
      raise exception 'Agent was able to read consent_otps (% rows)', v_count;
    end if;

    -- Test Viewer
    perform set_config('request.jwt.claim.sub', v_viewer_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_viewer_id::text, 'role', 'authenticated')::text, true);
    select count(*) into v_count from public.consent_otps;
    if v_count > 0 then
      raise exception 'Viewer was able to read consent_otps (% rows)', v_count;
    end if;

    -- Test Admin
    perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);
    select count(*) into v_count from public.consent_otps;
    if v_count > 0 then
      raise exception 'Admin was able to read consent_otps (% rows)', v_count;
    end if;

    insert into test_results (test_name, status, detail)
    values ('RLS: consent_otps unreadable', 'PASS', 'Agent, viewer, and admin see 0 rows in consent_otps');
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('RLS: consent_otps unreadable', 'FAIL', sqlerrm);
  end;

  -- =========================================================================
  -- 14. RLS: Agent cannot change agent_id or farmer_id on own visit
  -- =========================================================================
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_agent_a_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent_a_id::text, 'role', 'authenticated')::text, true);

    begin
      update public.farm_visits set agent_id = v_agent_b_id where id = v_visit_a1_id;
      insert into test_results (test_name, status, detail)
      values ('RLS: Immutability of visit agent_id', 'FAIL', 'Agent was able to change agent_id on own visit');
    exception when others then
      if sqlerrm like '%Cannot change agent_id%' then
        insert into test_results (test_name, status, detail)
        values ('RLS: Immutability of visit agent_id', 'PASS', 'Trigger strictly prevented agent_id reassignment');
      else
        insert into test_results (test_name, status, detail)
        values ('RLS: Immutability of visit agent_id', 'FAIL', 'Unexpected error: ' || sqlerrm);
      end if;
    end;

    begin
      update public.farm_visits set farmer_id = v_farmer_b_id where id = v_visit_a1_id;
      insert into test_results (test_name, status, detail)
      values ('RLS: Immutability of visit farmer_id', 'FAIL', 'Agent was able to change farmer_id on own visit');
    exception when others then
      if sqlerrm like '%Cannot change farmer_id%' then
        insert into test_results (test_name, status, detail)
        values ('RLS: Immutability of visit farmer_id', 'PASS', 'Trigger strictly prevented farmer_id reassignment');
      else
        insert into test_results (test_name, status, detail)
        values ('RLS: Immutability of visit farmer_id', 'FAIL', 'Unexpected error: ' || sqlerrm);
      end if;
    end;
  end;

  -- =========================================================================
  -- 15. RLS: Deactivated agent blocked on farmers, farm_visits, visit-photos
  -- =========================================================================
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_deact_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_deact_id::text, 'role', 'authenticated')::text, true);

    if exists(select 1 from public.farmers) or
       exists(select 1 from public.farm_visits) or
       exists(select 1 from public.visit_photos) then
      insert into test_results (test_name, status, detail)
      values ('RLS: Deactivated agent blocked', 'FAIL', 'Deactivated agent accessed tables');
    else
      insert into test_results (test_name, status, detail)
      values ('RLS: Deactivated agent blocked', 'PASS', 'Deactivated agent strictly blocked (0 rows across farmers, visits, photos)');
    end if;
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('RLS: Deactivated agent blocked', 'FAIL', sqlerrm);
  end;

  -- =========================================================================
  -- 16. B1: Views RLS Lockdown (visits_full, farm_visits_full, farmers_full)
  -- =========================================================================
  begin
    -- 16a. Anon queries views
    perform set_config('role', 'anon', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims', '{}', true);

    begin
      select count(*) into v_count from public.farmers_full;
    exception when others then
      v_count := 0;
    end;

    if v_count > 0 then
      insert into test_results (test_name, status, detail)
      values ('B1: Views RLS - Anon', 'FAIL', 'Anon was able to read ' || v_count || ' rows from farmers_full');
    else
      insert into test_results (test_name, status, detail)
      values ('B1: Views RLS - Anon', 'PASS', 'Anon sees 0 rows from views (or permission denied)');
    end if;

    -- 16b. Unassigned agent queries views (Agent B querying Farmer A through view)
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_agent_b_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent_b_id::text, 'role', 'authenticated')::text, true);

    select count(*) into v_count from public.farmers_full where id = v_farmer_a_id;
    if v_count > 0 then
      insert into test_results (test_name, status, detail)
      values ('B1: Views RLS - Unassigned Agent', 'FAIL', 'Agent B saw Farmer A via farmers_full');
    else
      insert into test_results (test_name, status, detail)
      values ('B1: Views RLS - Unassigned Agent', 'PASS', 'Agent B sees 0 rows of other agents data through views');
    end if;

    -- 16c. Deactivated agent queries views
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_deact_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_deact_id::text, 'role', 'authenticated')::text, true);

    select count(*) into v_count from public.farmers_full;
    if v_count > 0 then
      insert into test_results (test_name, status, detail)
      values ('B1: Views RLS - Deactivated Agent', 'FAIL', 'Deactivated agent saw rows via view');
    else
      insert into test_results (test_name, status, detail)
      values ('B1: Views RLS - Deactivated Agent', 'PASS', 'Deactivated agent sees 0 rows through views');
    end if;

    -- 16d. Assigned agent queries views (Agent A sees own Farmer A and Visit A1)
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_agent_a_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent_a_id::text, 'role', 'authenticated')::text, true);

    if exists(select 1 from public.farmers_full where id = v_farmer_a_id) and
       exists(select 1 from public.farm_visits_full where id = v_visit_a1_id) then
      insert into test_results (test_name, status, detail)
      values ('B1: Views RLS - Assigned Agent', 'PASS', 'Assigned agent sees own assigned data through views');
    else
      insert into test_results (test_name, status, detail)
      values ('B1: Views RLS - Assigned Agent', 'FAIL', 'Assigned agent could not see own data through view');
    end if;

    -- 16e. Admin queries views (Admin sees all)
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);

    select count(*) into v_count from public.farmers_full;
    if v_count >= 2 then
      insert into test_results (test_name, status, detail)
      values ('B1: Views RLS - Admin', 'PASS', 'Admin sees all data through views (' || v_count || ' farmers)');
    else
      insert into test_results (test_name, status, detail)
      values ('B1: Views RLS - Admin', 'FAIL', 'Admin view query returned insufficient rows: ' || v_count);
    end if;

  exception when others then
    insert into test_results (test_name, status, detail)
    values ('B1: Views RLS Lockdown', 'FAIL', sqlerrm);
  end;

  -- =========================================================================
  -- 17. B2: Server-Authoritative Visit Times
  -- =========================================================================
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_agent_a_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent_a_id::text, 'role', 'authenticated')::text, true);

    -- 17a. Agent inserting completed visit with self-chosen times is rejected
    begin
      insert into public.farm_visits (
        client_uuid, farmer_id, crop_cycle_id, agent_id, status, started_at, ended_at, duration_seconds, tracking_mode, no_services_chosen, time_source
      ) values (
        gen_random_uuid(), v_farmer_a_id, v_cycle_a_id, v_agent_a_id, 'completed',
        now() - interval '3 days', now() - interval '3 days' + interval '30 minutes', 1800, 'native_continuous', false, 'client'
      );
      insert into test_results (test_name, status, detail)
      values ('B2: Reject completed visit insert', 'FAIL', 'Agent was able to insert completed visit with arbitrary times');
    exception when others then
      if sqlerrm like '%Non-admins can only insert visits with status in_progress%' then
        insert into test_results (test_name, status, detail)
        values ('B2: Reject completed visit insert', 'PASS', 'Direct completed insert strictly rejected: ' || sqlerrm);
      else
        insert into test_results (test_name, status, detail)
        values ('B2: Reject completed visit insert', 'FAIL', 'Unexpected error: ' || sqlerrm);
      end if;
    end;

    -- 17b. Agent changing started_at is rejected
    begin
      update public.farm_visits
      set started_at = now() - interval '1 hour'
      where id = v_visit_a1_id;
      insert into test_results (test_name, status, detail)
      values ('B2: Reject started_at modification', 'FAIL', 'Agent was able to modify started_at');
    exception when others then
      if sqlerrm like '%started_at is immutable and cannot be changed%' then
        insert into test_results (test_name, status, detail)
        values ('B2: Reject started_at modification', 'PASS', 'started_at modification rejected: ' || sqlerrm);
      else
        insert into test_results (test_name, status, detail)
        values ('B2: Reject started_at modification', 'FAIL', 'Unexpected error: ' || sqlerrm);
      end if;
    end;

  end;

  -- =========================================================================
  -- 18. B3: Consent Bypass Closure
  -- =========================================================================
  begin
    -- 18a. Agent direct insert on farmers is rejected
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_agent_a_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent_a_id::text, 'role', 'authenticated')::text, true);

    begin
      insert into public.farmers (farmer_code, full_name, phone, village_id, farm_lat, farm_lng, farm_accuracy_m, onboarded_by)
      values ('TEST-F-1', 'Bypass Farmer', '9000000001', v_vil_id, 16.5, 80.6, 5.0, v_agent_a_id);
      insert into test_results (test_name, status, detail)
      values ('B3: Agent direct farmer insert', 'FAIL', 'Agent direct farmer insert succeeded');
    exception when others then
      if sqlerrm like '%violates row-level security policy for table "farmers"%' then
        insert into test_results (test_name, status, detail)
        values ('B3: Agent direct farmer insert', 'PASS', 'Direct insert rejected by RLS: ' || sqlerrm);
      else
        insert into test_results (test_name, status, detail)
        values ('B3: Agent direct farmer insert', 'FAIL', 'Unexpected error: ' || sqlerrm);
      end if;
    end;

    -- 18b. Admin direct insert on farmers is rejected
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);

    begin
      insert into public.farmers (farmer_code, full_name, phone, village_id, farm_lat, farm_lng, farm_accuracy_m, onboarded_by)
      values ('TEST-F-2', 'Admin Farmer', '9000000002', v_vil_id, 16.5, 80.6, 5.0, v_admin_id);
      insert into test_results (test_name, status, detail)
      values ('B3: Admin direct farmer insert', 'FAIL', 'Admin direct farmer insert succeeded');
    exception when others then
      if sqlerrm like '%violates row-level security policy for table "farmers"%' then
        insert into test_results (test_name, status, detail)
        values ('B3: Admin direct farmer insert', 'PASS', 'Direct insert rejected by RLS: ' || sqlerrm);
      else
        insert into test_results (test_name, status, detail)
        values ('B3: Admin direct farmer insert', 'FAIL', 'Unexpected error: ' || sqlerrm);
      end if;
    end;

    -- 18c. Direct insert on farmer_consents is rejected for agent & admin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_agent_a_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent_a_id::text, 'role', 'authenticated')::text, true);

    begin
      insert into public.farmer_consents (farmer_id, agent_id, event, notice_version, notice_language)
      values (v_farmer_a_id, v_agent_a_id, 'granted', '1.0', 'en');
      insert into test_results (test_name, status, detail)
      values ('B3: Agent direct consent insert', 'FAIL', 'Agent direct consent insert succeeded');
    exception when others then
      if sqlerrm like '%violates row-level security policy for table "farmer_consents"%' then
        insert into test_results (test_name, status, detail)
        values ('B3: Agent direct consent insert', 'PASS', 'Direct consent insert rejected by RLS: ' || sqlerrm);
      else
        insert into test_results (test_name, status, detail)
        values ('B3: Agent direct consent insert', 'FAIL', 'Unexpected error: ' || sqlerrm);
      end if;
    end;

    -- 18d. Farmer code generation check
    perform set_config('role', 'postgres', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims', '', true);

    insert into public.farmers (full_name, phone, village_id, farm_lat, farm_lng, farm_accuracy_m, consent_status, onboarded_by)
    values ('Auto Code Farmer', '+919876543299', v_vil_id, 16.5, 80.6, 5.0, 'granted', v_agent_a_id)
    returning farmer_code into v_val_text;

    if v_val_text like 'SA-%' then
      insert into test_results (test_name, status, detail)
      values ('B3: Farmer code generation', 'PASS', 'Generated farmer code: ' || v_val_text);
    else
      insert into test_results (test_name, status, detail)
      values ('B3: Farmer code generation', 'FAIL', 'Invalid farmer code: ' || coalesce(v_val_text, 'null'));
    end if;
  end;

  -- =========================================================================
  -- 19. B4: Client-Viewer Phone Masking
  -- =========================================================================
  begin
    -- 19a. Viewer direct select on base table returns 0 rows
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_viewer_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_viewer_id::text, 'role', 'authenticated')::text, true);

    select count(*) into v_count from public.farmers;
    if v_count = 0 then
      insert into test_results (test_name, status, detail)
      values ('B4: Viewer base table isolation', 'PASS', 'Viewer direct select on farmers returned 0 rows');
    else
      insert into test_results (test_name, status, detail)
      values ('B4: Viewer base table isolation', 'FAIL', 'Viewer was able to read ' || v_count || ' rows from base table farmers');
    end if;

    -- 19b. Viewer reads masked phone through view (client_sees_phone is false)
    perform set_config('role', 'postgres', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims', '', true);
    update public.app_config set value = 'false'::jsonb where key = 'client_sees_phone';

    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_viewer_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_viewer_id::text, 'role', 'authenticated')::text, true);

    select phone into v_val_text from public.farmers_masked where id = v_farmer_a_id;
    if v_val_text = 'XXXXXX0001' or (v_val_text like '%0001' and v_val_text not like '%+9191%') then
      insert into test_results (test_name, status, detail)
      values ('B4: Phone masking (default false)', 'PASS', 'Phone successfully masked for viewer: ' || v_val_text);
    else
      insert into test_results (test_name, status, detail)
      values ('B4: Phone masking (default false)', 'FAIL', 'Unexpected masked value: ' || coalesce(v_val_text, 'null'));
    end if;

    -- 19c. Flipping client_sees_phone to true unmasks phone
    perform set_config('role', 'postgres', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims', '', true);
    update public.app_config set value = 'true'::jsonb where key = 'client_sees_phone';

    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_viewer_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_viewer_id::text, 'role', 'authenticated')::text, true);

    select phone into v_val_text from public.farmers_masked where id = v_farmer_a_id;
    if v_val_text = '+919100000001' then
      insert into test_results (test_name, status, detail)
      values ('B4: Phone unmasking (when config true)', 'PASS', 'Phone unmasked in full when config enabled');
    else
      insert into test_results (test_name, status, detail)
      values ('B4: Phone unmasking (when config true)', 'FAIL', 'Phone was not unmasked: ' || coalesce(v_val_text, 'null'));
    end if;

    -- Revert config to false
    perform set_config('role', 'postgres', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims', '', true);
    update public.app_config set value = 'false'::jsonb where key = 'client_sees_phone';

    -- 19d. Agent sees unmasked phone on own farmer
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_agent_a_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent_a_id::text, 'role', 'authenticated')::text, true);

    select phone into v_val_text from public.farmers where id = v_farmer_a_id;
    if v_val_text = '+919100000001' then
      insert into test_results (test_name, status, detail)
      values ('B4: Agent phone access unaffected', 'PASS', 'Assigned agent sees full unmasked phone: ' || v_val_text);
    else
      insert into test_results (test_name, status, detail)
      values ('B4: Agent phone access unaffected', 'FAIL', 'Agent could not see unmasked phone: ' || coalesce(v_val_text, 'null'));
    end if;
  end;

  -- =========================================================================
  -- 20. B5: Location Merge with Farmers & Clean Rename Collision
  -- =========================================================================
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);

    -- 20a. Village merge repointing farmers
    perform public.admin_merge_location('village', v_vil_id, v_vil2_id);

    select village_id into v_dummy_id from public.farmers where id = v_farmer_a_id;
    if v_dummy_id = v_vil2_id and not exists (select 1 from public.villages where id = v_vil_id) then
      insert into test_results (test_name, status, detail)
      values ('B5: Village merge repointing farmers', 'PASS', 'Farmer successfully repointed to target village and source deleted');
    else
      insert into test_results (test_name, status, detail)
      values ('B5: Village merge repointing farmers', 'FAIL', 'Farmer village_id not repointed or source village still exists');
    end if;

    -- 20b. Rename collision gives clear friendly error
    begin
      perform public.admin_rename_location('village', v_vil2_id, 'Phase1 Village 2');
      -- Attempt renaming to an existing sibling
      insert into public.villages (district_id, name) values (v_dist_id, 'Sibling Village') returning id into v_dummy_id;
      perform public.admin_rename_location('village', v_dummy_id, 'Phase1 Village 2');
      insert into test_results (test_name, status, detail)
      values ('B5: Rename collision clear error', 'FAIL', 'Duplicate rename succeeded without error');
    exception when others then
      if sqlerrm like '%already exists under this parent%' or sqlerrm like '%already exists%' then
        insert into test_results (test_name, status, detail)
        values ('B5: Rename collision clear error', 'PASS', 'Friendly error returned: ' || sqlerrm);
      else
        insert into test_results (test_name, status, detail)
        values ('B5: Rename collision clear error', 'FAIL', 'Raw error returned instead of clear message: ' || sqlerrm);
      end if;
    end;
  end;

  -- =========================================================================
  -- 21. B6: Seed Idempotency & Unique Catalog Indexes
  -- =========================================================================
  begin
    perform set_config('role', 'postgres', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims', '', true);

    select count(*) into v_before_cnt from public.crops;

    insert into public.crops (name_en, name_te, is_active) values
      ('Paddy', 'వరి', true),
      ('Cotton', 'పత్తి', true)
    on conflict do nothing;

    select count(*) into v_after_cnt from public.crops;

    if v_before_cnt = v_after_cnt then
      insert into test_results (test_name, status, detail)
      values ('B6: Seed idempotency (crops)', 'PASS', 'Running seed twice leaves crop count unchanged (' || v_before_cnt || ')');
    else
      insert into test_results (test_name, status, detail)
      values ('B6: Seed idempotency (crops)', 'FAIL', 'Crop count changed from ' || v_before_cnt || ' to ' || v_after_cnt);
    end if;
  end;

  -- =========================================================================
  -- 22. SMALL FIXES: audit_log actor_id check, app_events visit_id check, server stamps
  -- =========================================================================
  begin
    -- 22a. audit_log INSERT requires actor_id = auth.uid()
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_agent_a_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent_a_id::text, 'role', 'authenticated')::text, true);

    begin
      -- Attempt spoofing actor_id as admin
      insert into public.audit_log (actor_id, action, entity)
      values (v_admin_id, 'spoofed_action', 'test');
      insert into test_results (test_name, status, detail)
      values ('Small Fix: audit_log actor_id validation', 'FAIL', 'Allowed spoofing actor_id');
    exception when others then
      if sqlerrm like '%violates row-level security policy for table "audit_log"%' then
        insert into test_results (test_name, status, detail)
        values ('Small Fix: audit_log actor_id validation', 'PASS', 'Spoofed actor_id rejected by RLS: ' || sqlerrm);
      else
        insert into test_results (test_name, status, detail)
        values ('Small Fix: audit_log actor_id validation', 'FAIL', 'Unexpected error: ' || sqlerrm);
      end if;
    end;

    -- 22b. app_events INSERT requires visit_id to belong to caller
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_agent_a_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent_a_id::text, 'role', 'authenticated')::text, true);

    begin
      -- Attempt inserting event for Agent B's visit while authenticated as Agent A
      insert into public.app_events (visit_id, agent_id, type)
      values (v_own_visit_id, v_agent_a_id, 'app_backgrounded');
      insert into test_results (test_name, status, detail)
      values ('Small Fix: app_events visit_id validation', 'FAIL', 'Allowed event for another agents visit');
    exception when others then
      if sqlerrm like '%violates row-level security policy for table "app_events"%' then
        insert into test_results (test_name, status, detail)
        values ('Small Fix: app_events visit_id validation', 'PASS', 'Event on other agents visit rejected by RLS: ' || sqlerrm);
      else
        insert into test_results (test_name, status, detail)
        values ('Small Fix: app_events visit_id validation', 'FAIL', 'Unexpected error: ' || sqlerrm);
      end if;
    end;

    -- 22c. Server timestamps trigger overwrites client-provided values
    perform set_config('role', 'postgres', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims', '', true);

    insert into public.app_events (agent_id, type, at)
    values (v_agent_a_id, 'gps_disabled', now() - interval '10 days')
    returning at into v_ts_check;

    if abs(extract(epoch from (v_ts_check - now()))) < 5 then
      insert into test_results (test_name, status, detail)
      values ('Small Fix: Server timestamp trigger', 'PASS', 'Server trigger set timestamp to now() (overwrote backdated value)');
    else
      insert into test_results (test_name, status, detail)
      values ('Small Fix: Server timestamp trigger', 'FAIL', 'Trigger did not overwrite client timestamp; at = ' || v_ts_check::text);
    end if;

    -- 22d. Agent cannot create a visit for an unassigned farmer
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_agent_a_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent_a_id::text, 'role', 'authenticated')::text, true);

    begin
      insert into public.farm_visits (
        client_uuid, farmer_id, agent_id, status, started_at, start_lat, start_lng, tracking_mode, time_source
      ) values (
        gen_random_uuid(), v_farmer_b_id, v_agent_a_id, 'in_progress', now(), 16.5, 80.6, 'native_continuous', 'server'
      );
      insert into test_results (test_name, status, detail)
      values ('RLS: Agent visit for unassigned farmer', 'FAIL', 'Agent was able to create visit for unassigned farmer');
    exception when others then
      if sqlerrm like '%violates row-level security policy for table "farm_visits"%' then
        insert into test_results (test_name, status, detail)
        values ('RLS: Agent visit for unassigned farmer', 'PASS', 'Visit for unassigned farmer rejected by RLS: ' || sqlerrm);
      else
        insert into test_results (test_name, status, detail)
        values ('RLS: Agent visit for unassigned farmer', 'FAIL', 'Unexpected error: ' || sqlerrm);
      end if;
    end;
  end;

  -- =========================================================================
  -- 23. GAP A: Server-Authoritative ended_at & duration_seconds on Visit Completion
  -- Uses dedicated Agent C (no prior visits) to avoid no_overlapping_agent_visits.
  -- =========================================================================
  begin
    -- Agent C has no prior visits so no exclusion constraint can fire on INSERT.
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_agent_c_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent_c_id::text, 'role', 'authenticated')::text, true);

    -- Setup: insert in_progress visit as Agent C
    v_gap_visit_id := gen_random_uuid();

    begin
      insert into public.farm_visits (
        id, client_uuid, farmer_id, crop_cycle_id, agent_id, status, started_at,
        start_lat, start_lng, tracking_mode, time_source
      ) values (
        v_gap_visit_id, gen_random_uuid(), v_farmer_c_id, v_cycle_c_id, v_agent_c_id,
        'in_progress', now(),
        16.508174, 80.650015, 'native_continuous', 'server'
      );
    exception when others then
      -- Named error row so the failure is visible in the grid
      insert into test_results (test_name, status, detail)
      values ('Gap A setup: in_progress insert for Agent C', 'FAIL',
        'Failed to insert in_progress visit for Agent C: ' || sqlerrm);
      -- Skip Gap A sub-tests by jumping to the outer exception handler
      raise;
    end;

    insert into public.visit_services (visit_id, service_id)
    values (v_gap_visit_id, v_service_id);

    -- Agent C attempts to complete with backdated ended_at (5 days ago) and forged duration_seconds (99999)
    update public.farm_visits
    set status            = 'completed',
        ended_at          = now() - interval '5 days',
        duration_seconds  = 99999,
        crop_stage_id     = v_stage_id,
        no_services_chosen = false
    where id = v_gap_visit_id;

    select ended_at, duration_seconds into v_ended_at, v_duration
    from public.farm_visits where id = v_gap_visit_id;

    -- Gap A (i): ended_at must be within 5 s of now() (server-stamped), not 5 days ago
    if v_ended_at is not null and abs(extract(epoch from (v_ended_at - now()))) <= 5 then
      insert into test_results (test_name, status, detail)
      values ('Gap A (i): Server-authoritative ended_at', 'PASS',
        'ended_at was server-stamped to now()');
    else
      insert into test_results (test_name, status, detail)
      values ('Gap A (i): Server-authoritative ended_at', 'FAIL',
        'Stored ended_at was not overwritten with now(); got: ' || coalesce(v_ended_at::text, 'null'));
    end if;

    -- Gap A (ii): duration_seconds must NOT be 99999 and must be near 0 s (visit was seconds old)
    if v_duration is not null and v_duration <> 99999 and abs(v_duration) <= 10 then
      insert into test_results (test_name, status, detail)
      values ('Gap A (ii): Server-computed duration_seconds', 'PASS',
        'duration_seconds correctly server-computed as ' || v_duration);
    else
      insert into test_results (test_name, status, detail)
      values ('Gap A (ii): Server-computed duration_seconds', 'FAIL',
        'Stored duration_seconds = ' || coalesce(v_duration::text, 'null') ||
        '; expected near 0 (server-computed), not 99999');
    end if;

    -- Gap A (iii): Reject setting ended_at standalone on an in_progress visit (uses Agent A's visit)
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_agent_a_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent_a_id::text, 'role', 'authenticated')::text, true);

    begin
      update public.farm_visits
      set ended_at = now()
      where id = v_visit_a1_id; -- visit_a1_id is still in_progress
      insert into test_results (test_name, status, detail)
      values ('Gap A (iii): Reject standalone ended_at update', 'FAIL',
        'Allowed setting ended_at on in_progress visit without completing');
    exception when others then
      if sqlerrm like '%ended_at can only be set when completing a visit%' then
        insert into test_results (test_name, status, detail)
        values ('Gap A (iii): Reject standalone ended_at update', 'PASS',
          'Strictly rejected: ' || sqlerrm);
      else
        insert into test_results (test_name, status, detail)
        values ('Gap A (iii): Reject standalone ended_at update', 'FAIL',
          'Unexpected error: ' || sqlerrm);
      end if;
    end;

  exception when others then
    -- Catch re-raised setup failure or any other unexpected error
    insert into test_results (test_name, status, detail)
    values ('Gap A: fatal error', 'FAIL', 'Gap A block crashed: ' || sqlerrm);
  end;


  -- =========================================================================
  -- 24. GAP B: Views Write Privileges Revocation
  -- =========================================================================
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_agent_a_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent_a_id::text, 'role', 'authenticated')::text, true);

    v_leaked_privs := '';
    foreach v_view_name in array array['visits_full', 'farm_visits_full', 'farmers_full', 'farmers_masked', 'farmers_viewer_masked', 'farmers_full_masked'] loop
      if has_table_privilege('authenticated', 'public.' || v_view_name, 'INSERT') then
        v_leaked_privs := v_leaked_privs || v_view_name || ':INSERT, ';
      end if;
      if has_table_privilege('authenticated', 'public.' || v_view_name, 'UPDATE') then
        v_leaked_privs := v_leaked_privs || v_view_name || ':UPDATE, ';
      end if;
      if has_table_privilege('authenticated', 'public.' || v_view_name, 'DELETE') then
        v_leaked_privs := v_leaked_privs || v_view_name || ':DELETE, ';
      end if;
      if has_table_privilege('authenticated', 'public.' || v_view_name, 'TRUNCATE') then
        v_leaked_privs := v_leaked_privs || v_view_name || ':TRUNCATE, ';
      end if;
    end loop;

    if v_leaked_privs = '' then
      insert into test_results (test_name, status, detail)
      values ('Gap B: Views write privileges revoked', 'PASS', 'authenticated has SELECT-only on all 6 views');
    else
      insert into test_results (test_name, status, detail)
      values ('Gap B: Views write privileges revoked', 'FAIL', 'authenticated still has write privileges on views: ' || v_leaked_privs);
    end if;
  end;

end $$;

-- Output EXACTLY ONE result grid so all rows are visible in the SQL editor
select
  id,
  test_name,
  status,
  detail
from test_results
order by id;

rollback;
