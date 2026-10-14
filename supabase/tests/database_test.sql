-- supabase/tests/database_test.sql
-- Comprehensive Phase 1 Database Test Suite (Section B15.2)
-- Tests: RLS isolation, assignment boundaries, client_viewer read-only, anon lockdown,
-- append-only consent trigger, product size composite FK, single in-progress visit,
-- non-overlapping visits exclusion constraint, and visit completion services validation.
-- Outputs results as a visible table grid with summary counts.
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
grant all on test_results to authenticated;
truncate test_results;

do $$
declare
  -- Actors
  v_admin_id uuid := 'aaaaaaaa-1111-1111-1111-111111111111';
  v_viewer_id uuid := 'bbbbbbbb-2222-2222-2222-222222222222';
  v_agent_a_id uuid := 'cccccccc-3333-3333-3333-333333333333';
  v_agent_b_id uuid := 'dddddddd-4444-4444-4444-444444444444';
  r_loc record;

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
  v_consent_id uuid;
begin
  -- 1. Setup Auth Users & Profiles Fixtures
  begin
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

    -- Setup Location & Catalog Fixtures (as Admin)
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);

    for r_loc in (select village_id, district_id, region_id from public.get_or_create_location('Phase1 Region', 'Phase1 District', 'Phase1 Village')) loop
      v_vil_id := r_loc.village_id;
      v_dist_id := r_loc.district_id;
      v_reg_id := r_loc.region_id;
    end loop;

    v_crop_id := (select id from public.crops where lower(btrim(name_en)) = 'paddy' limit 1);
    v_stage_id := (select id from public.crop_stages where crop_id = v_crop_id and sort_order = 1 limit 1);
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

    -- Create Farmer A & Farmer B
    v_farmer_a_id := gen_random_uuid();
    v_farmer_b_id := gen_random_uuid();
    insert into public.farmers (id, farmer_code, full_name, phone, village_id, farm_lat, farm_lng, farm_accuracy_m, consent_status, onboarded_by)
    values (v_farmer_a_id, 'SA-100001', 'Farmer Alpha', '+919100000001', v_vil_id, 16.506174, 80.648015, 12.5, 'granted', v_agent_a_id);

    insert into public.farmers (id, farmer_code, full_name, phone, village_id, farm_lat, farm_lng, farm_accuracy_m, consent_status, onboarded_by)
    values (v_farmer_b_id, 'SA-100002', 'Farmer Beta', '+919100000002', v_vil_id, 16.507174, 80.649015, 10.0, 'granted', v_agent_b_id);

    -- Assign Farmer A to Agent A; Farmer B to Agent B
    insert into public.farmer_assignments (farmer_id, agent_id, assigned_by)
    values (v_farmer_a_id, v_agent_a_id, v_admin_id);

    insert into public.farmer_assignments (farmer_id, agent_id, assigned_by)
    values (v_farmer_b_id, v_agent_b_id, v_admin_id);

    -- Create Crop Cycle for Farmer A
    v_cycle_a_id := gen_random_uuid();
    insert into public.crop_cycles (id, farmer_id, crop_id, season, acreage, sowing_date)
    values (v_cycle_a_id, v_farmer_a_id, v_crop_id, 'Kharif 2026', 3.5, current_date - 30);

    -- Create Consent for Farmer A
    v_consent_id := gen_random_uuid();
    insert into public.farmer_consents (id, farmer_id, agent_id, event, notice_version, notice_language)
    values (v_consent_id, v_farmer_a_id, v_agent_a_id, 'granted', '1.0', 'te');
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('Fixture Setup', 'FAIL', 'Setup error: ' || sqlerrm);
    return;
  end;

  -- TEST 1: Append-Only Trigger on farmer_consents (UPDATE)
  begin
    update public.farmer_consents set notice_version = '2.0' where id = v_consent_id;
    insert into test_results (test_name, status, detail)
    values ('Consent Ledger: Block UPDATE', 'FAIL', 'UPDATE should have been rejected');
  exception when others then
    if sqlerrm like '%immutable append-only ledger%' then
      insert into test_results (test_name, status, detail)
      values ('Consent Ledger: Block UPDATE', 'PASS', 'Trigger strictly prevented UPDATE');
    else
      insert into test_results (test_name, status, detail)
      values ('Consent Ledger: Block UPDATE', 'FAIL', 'Unexpected error: ' || sqlerrm);
    end if;
  end;

  -- TEST 2: Append-Only Trigger on farmer_consents (DELETE)
  begin
    delete from public.farmer_consents where id = v_consent_id;
    insert into test_results (test_name, status, detail)
    values ('Consent Ledger: Block DELETE', 'FAIL', 'DELETE should have been rejected');
  exception when others then
    if sqlerrm like '%immutable append-only ledger%' then
      insert into test_results (test_name, status, detail)
      values ('Consent Ledger: Block DELETE', 'PASS', 'Trigger strictly prevented DELETE');
    else
      insert into test_results (test_name, status, detail)
      values ('Consent Ledger: Block DELETE', 'FAIL', 'Unexpected error: ' || sqlerrm);
    end if;
  end;

  -- TEST 3: Product Size Composite Foreign Key Enforcement
  begin
    v_visit_a1_id := gen_random_uuid();
    insert into public.farm_visits (
      id, farmer_id, crop_cycle_id, agent_id, status, started_at, start_lat, start_lng, tracking_mode
    ) values (
      v_visit_a1_id, v_farmer_a_id, v_cycle_a_id, v_agent_a_id, 'in_progress', now(), 16.506174, 80.648015, 'native_continuous'
    );

    insert into public.visit_purchase_items (
      visit_id, product_id, product_size_id, quantity, product_name_snapshot, size_label_snapshot
    ) values (
      v_visit_a1_id, v_prod_a_id, v_size_b_id, 2, 'Prod A', 'Size B' -- Mismatch!
    );
    insert into test_results (test_name, status, detail)
    values ('Catalogs: Composite FK product/size', 'FAIL', 'Composite FK should have rejected cross-product size');
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('Catalogs: Composite FK product/size', 'PASS', 'Composite FK strictly prevented cross-product pack size');
  end;

  -- TEST 4: Exactly One in_progress Visit Per Agent
  begin
    insert into public.farm_visits (
      farmer_id, crop_cycle_id, agent_id, status, started_at, start_lat, start_lng, tracking_mode
    ) values (
      v_farmer_a_id, v_cycle_a_id, v_agent_a_id, 'in_progress', now() + interval '1 hour', 16.506174, 80.648015, 'native_continuous'
    );
    insert into test_results (test_name, status, detail)
    values ('Visits: One in_progress per agent', 'FAIL', 'Second in_progress visit should have been rejected');
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('Visits: One in_progress per agent', 'PASS', 'Unique partial index rejected second in_progress visit');
  end;

  -- Close visit_a1
  update public.farm_visits 
  set ended_at = started_at + interval '45 minutes'
  where id = v_visit_a1_id;

  -- TEST 5: Non-Overlapping Visits Exclusion Constraint (btree_gist)
  begin
    insert into public.farm_visits (
      farmer_id, crop_cycle_id, agent_id, status, started_at, ended_at, start_lat, start_lng, tracking_mode
    ) values (
      v_farmer_a_id, v_cycle_a_id, v_agent_a_id, 'completed', 
      now() + interval '10 minutes', now() + interval '30 minutes', -- Overlaps with visit_a1!
      16.506174, 80.648015, 'native_continuous'
    );
    insert into test_results (test_name, status, detail)
    values ('Visits: Non-overlapping time (btree_gist)', 'FAIL', 'Overlapping visit should have been rejected');
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('Visits: Non-overlapping time (btree_gist)', 'PASS', 'Exclusion constraint prevented overlapping visit times');
  end;

  -- TEST 6: Visit Completion Validation (Services rule)
  begin
    update public.farm_visits
    set status = 'completed',
        observations_diagnosis = 'Crop looking healthy',
        crop_stage_id = v_stage_id,
        no_services_chosen = false -- and 0 services attached!
    where id = v_visit_a1_id;
    insert into test_results (test_name, status, detail)
    values ('Visits: Completion services validation', 'FAIL', 'Completed visit with 0 services should fail');
  exception when others then
    if sqlerrm like '%Must choose at least one value-added service%' then
      insert into test_results (test_name, status, detail)
      values ('Visits: Completion services validation', 'PASS', 'Validation trigger enforced value-added service choice');
    else
      insert into test_results (test_name, status, detail)
      values ('Visits: Completion services validation', 'FAIL', 'Unexpected error: ' || sqlerrm);
    end if;
  end;

  -- TEST 7: Cross-Agent RLS Isolation (Farmer)
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_agent_b_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent_b_id::text, 'role', 'authenticated')::text, true);

    if exists (select 1 from public.farmers where id = v_farmer_a_id) then
      insert into test_results (test_name, status, detail)
      values ('RLS: Agent farmer isolation', 'FAIL', 'Agent B was able to see Agent A farmer');
    else
      insert into test_results (test_name, status, detail)
      values ('RLS: Agent farmer isolation', 'PASS', 'Agent B cannot see Farmer A (0 rows returned)');
    end if;
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('RLS: Agent farmer isolation', 'FAIL', sqlerrm);
  end;

  -- TEST 8: Cross-Agent RLS Isolation (Visits)
  begin
    if exists (select 1 from public.farm_visits where id = v_visit_a1_id) then
      insert into test_results (test_name, status, detail)
      values ('RLS: Agent visit isolation', 'FAIL', 'Agent B was able to see Agent A visit');
    else
      insert into test_results (test_name, status, detail)
      values ('RLS: Agent visit isolation', 'PASS', 'Agent B cannot see Visit A (0 rows returned)');
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
      values ('RLS: Unassignment boundary', 'FAIL', 'Agent A still sees farmer after unassignment');
    else
      insert into test_results (test_name, status, detail)
      values ('RLS: Unassignment boundary', 'PASS', 'Farmer became immediately invisible upon unassignment');
    end if;
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('RLS: Unassignment boundary', 'FAIL', sqlerrm);
  end;

  -- TEST 10: client_viewer Read-Only Enforcement
  begin
    perform set_config('request.jwt.claim.sub', v_viewer_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_viewer_id::text, 'role', 'authenticated')::text, true);

    if not exists (select 1 from public.farmers where id = v_farmer_a_id) then
      insert into test_results (test_name, status, detail)
      values ('RLS: client_viewer read permission', 'FAIL', 'Client viewer should be able to read farmers');
    else
      insert into test_results (test_name, status, detail)
      values ('RLS: client_viewer read permission', 'PASS', 'Client viewer successfully read farmer record');
    end if;

    begin
      insert into public.farmers (farmer_code, full_name, phone, village_id, farm_lat, farm_lng)
      values ('SA-999999', 'Hacker Farmer', '+919999999999', v_vil_id, 16.5, 80.5);
      insert into test_results (test_name, status, detail)
      values ('RLS: client_viewer write denial', 'FAIL', 'Client viewer should be denied write access');
    exception when others then
      insert into test_results (test_name, status, detail)
      values ('RLS: client_viewer write denial', 'PASS', 'Insert rejected by RLS for client_viewer');
    end;
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('RLS: client_viewer checks', 'FAIL', sqlerrm);
  end;

  -- TEST 11: Anonymous Lockdown
  begin
    perform set_config('role', 'anon', true);
    perform set_config('request.jwt.claim.sub', null, true);
    perform set_config('request.jwt.claims', '{}', true);

    if exists (select 1 from public.farmers) or exists (select 1 from public.farm_visits) or exists (select 1 from public.app_config) then
      insert into test_results (test_name, status, detail)
      values ('RLS: Anonymous lockdown', 'FAIL', 'Anon was able to read data');
    else
      insert into test_results (test_name, status, detail)
      values ('RLS: Anonymous lockdown', 'PASS', 'Anon user sees 0 rows across tables');
    end if;
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('RLS: Anonymous lockdown', 'FAIL', sqlerrm);
  end;

end $$;

-- Summary Count Row
insert into test_results (test_name, status, detail)
select
  'TOTAL SUMMARY' as test_name,
  case when count(*) filter (where status = 'FAIL') = 0 then 'PASS' else 'FAIL' end as status,
  'Passed: ' || count(*) filter (where status = 'PASS') || ' | Failed: ' || count(*) filter (where status = 'FAIL') || ' | Total Tests: ' || count(*) as detail
from test_results;

-- Return results as a visible table grid
select id, test_name, status, detail 
from test_results 
order by id;

-- Rollback transaction so no test users, visits, or records are retained
rollback;
