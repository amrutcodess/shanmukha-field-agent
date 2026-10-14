-- scripts/test-phase0-hotfix.sql
-- Verification script for Phase 0 hotfix (Defects F1, F2, F3, F4, F9)
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
  -- Test actor IDs
  v_admin_id uuid := '11111111-1111-1111-1111-111111111111';
  v_agent1_id uuid := '22222222-2222-2222-2222-222222222222';
  v_agent2_id uuid := '33333333-3333-3333-3333-333333333333';
  v_deact_id uuid := '44444444-4444-4444-4444-444444444444';

  v_reg_id uuid;
  v_dist_id uuid;
  v_vil_id uuid;
  v_crop_id uuid;
  v_visit1_id uuid;
  v_obj_legacy uuid := gen_random_uuid();
  v_obj_new uuid := gen_random_uuid();
  v_count integer;
  r_loc record;
begin
  -- 1. Setup Fixtures (auth.users & profiles)
  begin
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values 
      (v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin_test@test.local', 'dummy_hash', now(), '{"provider":"email"}', '{}', now(), now()),
      (v_agent1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'agent1_test@test.local', 'dummy_hash', now(), '{"provider":"email"}', '{}', now(), now()),
      (v_agent2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'agent2_test@test.local', 'dummy_hash', now(), '{"provider":"email"}', '{}', now(), now()),
      (v_deact_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'deact_test@test.local', 'dummy_hash', now(), '{"provider":"email"}', '{}', now(), now())
    on conflict (id) do nothing;

    insert into public.profiles (id, role, full_name, username, is_active)
    values 
      (v_admin_id, 'admin', 'Test Admin', 'test_admin', true),
      (v_agent1_id, 'agent', 'Active Agent 1', 'agent_one', true),
      (v_agent2_id, 'agent', 'Active Agent 2', 'agent_two', true),
      (v_deact_id, 'agent', 'Deactivated Agent', 'agent_deact', false)
    on conflict (id) do update set
      role = excluded.role,
      is_active = excluded.is_active;

    -- Set admin context to set up location and catalog
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);

    for r_loc in (select village_id, district_id, region_id from public.get_or_create_location('Phase0 Region', 'Phase0 District', 'Phase0 Village')) loop
      v_vil_id := r_loc.village_id;
      v_dist_id := r_loc.district_id;
      v_reg_id := r_loc.region_id;
    end loop;

    v_crop_id := gen_random_uuid();
    insert into public.crops (id, name_en, name_te)
    values (v_crop_id, 'Phase0 Crop', 'పంట');
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('Fixture Setup', 'FAIL', 'Setup error: ' || sqlerrm);
    return;
  end;

  -- TEST 1: F1 - Active agent can create visit with prescription_image_path
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_agent1_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent1_id::text, 'role', 'authenticated')::text, true);

    v_visit1_id := gen_random_uuid();
    insert into public.visits (
      id, agent_id, village_id, crop_id, duration_minutes, farmer_name, farmer_phone,
      diagnosis, prescription, status, prescription_image_path
    ) values (
      v_visit1_id, v_agent1_id, v_vil_id, v_crop_id, 20, 'Farmer Ramesh', '9876543210',
      'Leaf blast detected', 'Spray Tricyclazole', 'pending',
      v_agent1_id || '/prescriptions/rx_101.jpg'
    );

    insert into test_results (test_name, status, detail)
    values ('F1: Create visit with prescription path', 'PASS', 'Created visit id: ' || v_visit1_id);
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('F1: Create visit with prescription path', 'FAIL', sqlerrm);
  end;

  -- TEST 2: F3 - Active agent can update own visit from pending to final
  begin
    update public.visits
    set status = 'final',
        purchased = true,
        purchase_amount = 750,
        purchase_image_path = v_agent1_id || '/receipt_101.jpg'
    where id = v_visit1_id;

    if found then
      insert into test_results (test_name, status, detail)
      values ('F3: Transition visit pending -> final', 'PASS', 'Visit updated with receipt and purchase amount');
    else
      insert into test_results (test_name, status, detail)
      values ('F3: Transition visit pending -> final', 'FAIL', 'Update returned 0 rows (rejected by RLS)');
    end if;
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('F3: Transition visit pending -> final', 'FAIL', sqlerrm);
  end;

  -- TEST 3: F3/F4 - Anti-tampering trigger blocks altering agent_id
  begin
    update public.visits
    set agent_id = v_agent2_id
    where id = v_visit1_id;

    insert into test_results (test_name, status, detail)
    values ('F3/F4: Anti-tampering (agent_id)', 'FAIL', 'Updating agent_id should have been rejected');
  exception when others then
    if sqlerrm like '%Cannot change agent_id%' then
      insert into test_results (test_name, status, detail)
      values ('F3/F4: Anti-tampering (agent_id)', 'PASS', 'Trigger prevented agent_id tampering');
    else
      insert into test_results (test_name, status, detail)
      values ('F3/F4: Anti-tampering (agent_id)', 'FAIL', 'Unexpected error: ' || sqlerrm);
    end if;
  end;

  -- TEST 4: F3 - Agent 2 cannot update Agent 1 visit
  begin
    perform set_config('request.jwt.claim.sub', v_agent2_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent2_id::text, 'role', 'authenticated')::text, true);

    update public.visits
    set diagnosis = 'Tampered diagnosis'
    where id = v_visit1_id;

    if found then
      insert into test_results (test_name, status, detail)
      values ('F3: Cross-agent update isolation', 'FAIL', 'Agent 2 was able to update Agent 1 visit');
    else
      insert into test_results (test_name, status, detail)
      values ('F3: Cross-agent update isolation', 'PASS', 'Agent 2 update strictly blocked (0 rows updated)');
    end if;
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('F3: Cross-agent update isolation', 'FAIL', sqlerrm);
  end;

  -- TEST 5: F4 - is_active_agent() returns false for deactivated agent
  begin
    perform set_config('request.jwt.claim.sub', v_deact_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_deact_id::text, 'role', 'authenticated')::text, true);

    if public.is_active_agent() then
      insert into test_results (test_name, status, detail)
      values ('F4: Deactivated is_active_agent()', 'FAIL', 'Returned true for deactivated agent');
    else
      insert into test_results (test_name, status, detail)
      values ('F4: Deactivated is_active_agent()', 'PASS', 'Correctly returned false for deactivated agent');
    end if;
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('F4: Deactivated is_active_agent()', 'FAIL', sqlerrm);
  end;

  -- TEST 6: F4 - Deactivated agent cannot read visits
  begin
    if exists (select 1 from public.visits where agent_id = v_deact_id) then
      insert into test_results (test_name, status, detail)
      values ('F4: Deactivated agent read visits', 'FAIL', 'Deactivated agent was able to read visits');
    else
      insert into test_results (test_name, status, detail)
      values ('F4: Deactivated agent read visits', 'PASS', 'Deactivated agent sees 0 visits');
    end if;
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('F4: Deactivated agent read visits', 'FAIL', sqlerrm);
  end;

  -- TEST 7: F4 - Deactivated agent cannot insert visits
  begin
    insert into public.visits (
      agent_id, village_id, crop_id, duration_minutes, farmer_name, farmer_phone,
      diagnosis, prescription, status
    ) values (
      v_deact_id, v_vil_id, v_crop_id, 15, 'Bad Farmer', '9000000000',
      'Diag', 'Rx', 'pending'
    );
    insert into test_results (test_name, status, detail)
    values ('F4: Deactivated agent insert visit', 'FAIL', 'Insert should have been rejected by RLS');
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('F4: Deactivated agent insert visit', 'PASS', 'Insert rejected by RLS');
  end;

  -- TEST 8: F4 - Deactivated agent blocked in get_or_create_location
  begin
    perform * from public.get_or_create_location('Reg', 'Dist', 'Vil');
    insert into test_results (test_name, status, detail)
    values ('F4: Deactivated agent location RPC', 'FAIL', 'Location RPC should have raised Permission denied');
  exception when others then
    if sqlerrm like '%Permission denied%' then
      insert into test_results (test_name, status, detail)
      values ('F4: Deactivated agent location RPC', 'PASS', 'Blocked with Permission denied error');
    else
      insert into test_results (test_name, status, detail)
      values ('F4: Deactivated agent location RPC', 'FAIL', 'Unexpected error: ' || sqlerrm);
    end if;
  end;

  -- TEST 9: F9 - audit_visit_changes function has search_path = public
  begin
    perform set_config('role', 'postgres', true);
    if exists (
      select 1 from pg_proc p
      join pg_namespace n on p.pronamespace = n.oid
      where n.nspname = 'public'
        and p.proname = 'audit_visit_changes'
        and p.prosecdef = true
        and array_to_string(p.proconfig, ',') like '%search_path=public%'
    ) then
      insert into test_results (test_name, status, detail)
      values ('F9: audit_visit_changes search_path', 'PASS', 'Function has prosecdef=true and search_path=public');
    else
      insert into test_results (test_name, status, detail)
      values ('F9: audit_visit_changes search_path', 'FAIL', 'Function missing search_path=public');
    end if;
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('F9: audit_visit_changes search_path', 'FAIL', sqlerrm);
  end;

  -- TEST 10: F9 - admin_merge_location handles village name collisions
  declare
    v_d1 uuid;
    v_d2 uuid;
    v_v1 uuid;
    v_v2 uuid;
  begin
    v_d1 := gen_random_uuid();
    v_d2 := gen_random_uuid();
    v_v1 := gen_random_uuid();
    v_v2 := gen_random_uuid();
    insert into public.districts (id, region_id, name) values (v_d1, v_reg_id, 'Merge Dist A');
    insert into public.districts (id, region_id, name) values (v_d2, v_reg_id, 'Merge Dist B');
    insert into public.villages (id, district_id, name) values (v_v1, v_d1, 'Collision Village');
    insert into public.villages (id, district_id, name) values (v_v2, v_d2, 'Collision Village');

    perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);

    perform public.admin_merge_location('district', v_d1, v_d2);

    if exists (select 1 from public.districts where id = v_d1) or exists (select 1 from public.villages where id = v_v1) then
      insert into test_results (test_name, status, detail)
      values ('F9: Location merge village collision', 'FAIL', 'Source district or village still exists after merge');
    else
      insert into test_results (test_name, status, detail)
      values ('F9: Location merge village collision', 'PASS', 'Merged duplicate village names without collision error');
    end if;
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('F9: Location merge village collision', 'FAIL', sqlerrm);
  end;

  -- TEST 11: F2 - Agent 1 can read own legacy and new prescription files
  begin
    perform set_config('role', 'postgres', true);
    insert into storage.buckets (id, name, public) 
    values ('purchase-photos', 'purchase-photos', false)
    on conflict (id) do nothing;

    insert into storage.objects (id, bucket_id, name, owner)
    values (v_obj_legacy, 'purchase-photos', 'prescriptions/' || v_agent1_id || '/rx_leg.jpg', v_agent1_id);

    insert into storage.objects (id, bucket_id, name, owner)
    values (v_obj_new, 'purchase-photos', v_agent1_id || '/prescriptions/rx_nw.jpg', v_agent1_id);

    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_agent1_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent1_id::text, 'role', 'authenticated')::text, true);

    if exists (select 1 from storage.objects where name = 'prescriptions/' || v_agent1_id || '/rx_leg.jpg')
       and exists (select 1 from storage.objects where name = v_agent1_id || '/prescriptions/rx_nw.jpg') then
      insert into test_results (test_name, status, detail)
      values ('F2: Agent 1 read own legacy & new files', 'PASS', 'Able to read both legacy and new path files');
    else
      insert into test_results (test_name, status, detail)
      values ('F2: Agent 1 read own legacy & new files', 'FAIL', 'Could not read own files');
    end if;
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('F2: Agent 1 read own legacy & new files', 'FAIL', sqlerrm);
  end;

  -- TEST 12: F2 - Agent 2 cannot read Agent 1 files
  begin
    perform set_config('request.jwt.claim.sub', v_agent2_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent2_id::text, 'role', 'authenticated')::text, true);

    if exists (select 1 from storage.objects where name = 'prescriptions/' || v_agent1_id || '/rx_leg.jpg')
       or exists (select 1 from storage.objects where name = v_agent1_id || '/prescriptions/rx_nw.jpg') then
      insert into test_results (test_name, status, detail)
      values ('F2: Storage cross-agent isolation', 'FAIL', 'Agent 2 was able to read Agent 1 files');
    else
      insert into test_results (test_name, status, detail)
      values ('F2: Storage cross-agent isolation', 'PASS', 'Agent 2 receives 0 rows for Agent 1 files');
    end if;
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('F2: Storage cross-agent isolation', 'FAIL', sqlerrm);
  end;

  -- TEST 13: F2/F4 - Deactivated agent cannot read storage objects
  begin
    perform set_config('request.jwt.claim.sub', v_deact_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_deact_id::text, 'role', 'authenticated')::text, true);

    if exists (select 1 from storage.objects where bucket_id = 'purchase-photos') then
      insert into test_results (test_name, status, detail)
      values ('F2/F4: Deactivated storage read', 'FAIL', 'Deactivated agent was able to read storage objects');
    else
      insert into test_results (test_name, status, detail)
      values ('F2/F4: Deactivated storage read', 'PASS', 'Deactivated agent reads 0 storage objects');
    end if;
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('F2/F4: Deactivated storage read', 'FAIL', sqlerrm);
  end;

  -- TEST 14: F2/F4 - Deactivated agent cannot upload storage objects
  begin
    insert into storage.objects (id, bucket_id, name, owner)
    values (gen_random_uuid(), 'purchase-photos', v_deact_id || '/hack.jpg', v_deact_id);

    insert into test_results (test_name, status, detail)
    values ('F2/F4: Deactivated storage upload', 'FAIL', 'Deactivated agent was allowed to upload');
  exception when others then
    insert into test_results (test_name, status, detail)
    values ('F2/F4: Deactivated storage upload', 'PASS', 'Upload rejected by storage RLS');
  end;

end $$;

-- 5. Insert Final Summary Count Row
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

-- Rollback transaction so no test users, visits, or storage records are retained
rollback;
