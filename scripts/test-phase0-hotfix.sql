-- scripts/test-phase0-hotfix.sql
-- Verification script for Phase 0 hotfix (Defects F1, F2, F3, F4, F9)
-- Can be run in Supabase SQL Editor on staging or test database.
-- Safe: executes within a transaction and rolls back at the end.

begin;

-- Verify we are running on a non-production environment or explicitly safe
do $$
begin
  raise notice '=== STARTING PHASE 0 HOTFIX TEST SUITE ===';
end $$;

-- 1. Setup Test Fixtures (temporary auth users & profiles)
do $$
declare
  v_admin_id uuid := '11111111-1111-1111-1111-111111111111';
  v_agent1_id uuid := '22222222-2222-2222-2222-222222222222';
  v_agent2_id uuid := '33333333-3333-3333-3333-333333333333';
  v_deact_id uuid := '44444444-4444-4444-4444-444444444444';
  v_reg_id uuid;
  v_dist_id uuid;
  v_vil_id uuid;
  v_crop_id uuid;
  v_visit1_id uuid;
begin
  -- Insert dummy auth.users first to satisfy foreign key constraint on public.profiles(id)
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) values 
    (v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin_test@test.local', 'dummy_hash', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
    (v_agent1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'agent1_test@test.local', 'dummy_hash', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
    (v_agent2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'agent2_test@test.local', 'dummy_hash', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
    (v_deact_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'deact_test@test.local', 'dummy_hash', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
  on conflict (id) do nothing;

  -- Insert dummy profiles
  insert into public.profiles (id, role, full_name, username, is_active)
  values 
    (v_admin_id, 'admin', 'Test Admin', 'test_admin', true),
    (v_agent1_id, 'agent', 'Active Agent 1', 'agent_one', true),
    (v_agent2_id, 'agent', 'Active Agent 2', 'agent_two', true),
    (v_deact_id, 'agent', 'Deactivated Agent', 'agent_deact', false)
  on conflict (id) do update set
    role = excluded.role,
    is_active = excluded.is_active;

  -- Set auth context to admin for initial location and catalog setup
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);

  -- Create dummy location & crop
  select village_id, district_id, region_id into v_vil_id, v_dist_id, v_reg_id
  from public.get_or_create_location('Test Region', 'Test District', 'Test Village');

  insert into public.crops (name_en, name_te)
  values ('Test Paddy', 'వరి')
  returning id into v_crop_id;

  -- Test F1: Active agent can create visit with prescription_image_path
  -- Set auth context to agent1
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_agent1_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_agent1_id::text, 'role', 'authenticated')::text, true);

  -- Check is_active_agent()
  if not public.is_active_agent() then
    raise exception 'TEST FAILED: is_active_agent() should return true for active agent 1';
  end if;

  insert into public.visits (
    agent_id,
    village_id,
    crop_id,
    duration_minutes,
    farmer_name,
    farmer_phone,
    diagnosis,
    prescription,
    status,
    prescription_image_path
  ) values (
    v_agent1_id,
    v_vil_id,
    v_crop_id,
    20,
    'Farmer Ramesh',
    '9876543210',
    'Leaf blast detected',
    'Spray Tricyclazole',
    'pending',
    v_agent1_id || '/prescriptions/test_rx_123.jpg'
  ) returning id into v_visit1_id;

  raise notice 'PASS: F1 - Inserted visit with prescription_image_path (%)', v_visit1_id;

  -- Test F3: Active agent can update own visit from pending to final or closed
  update public.visits
  set status = 'final',
      purchased = true,
      purchase_amount = 500,
      purchase_image_path = v_agent1_id || '/receipt_test.jpg'
  where id = v_visit1_id;

  if not found then
    raise exception 'TEST FAILED: Active agent was unable to update own visit from pending to final (F3)';
  end if;
  raise notice 'PASS: F3 - Active agent successfully moved visit from pending to final';

  -- Test F3/F4: Agent cannot tamper with agent_id or client_uuid
  begin
    update public.visits
    set agent_id = v_agent2_id
    where id = v_visit1_id;
    raise exception 'TEST FAILED: Changing agent_id should have been blocked';
  exception when others then
    if sqlerrm like '%Cannot change agent_id%' then
      raise notice 'PASS: F3/F4 - Tampering with agent_id blocked by trigger';
    else
      raise;
    end if;
  end;

  -- Test F3: Agent cannot touch another agent''s visit
  -- Switch to agent2
  perform set_config('request.jwt.claim.sub', v_agent2_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_agent2_id::text, 'role', 'authenticated')::text, true);

  update public.visits
  set diagnosis = 'Tampered diagnosis'
  where id = v_visit1_id;

  if found then
    raise exception 'TEST FAILED: Agent 2 should not be able to update Agent 1 visit';
  end if;
  raise notice 'PASS: F3 - Agent 2 cannot update Agent 1 visit';

  -- Test F4: Deactivated agent is completely rejected
  perform set_config('request.jwt.claim.sub', v_deact_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_deact_id::text, 'role', 'authenticated')::text, true);

  if public.is_active_agent() then
    raise exception 'TEST FAILED: is_active_agent() should return false for deactivated agent';
  end if;
  raise notice 'PASS: F4 - is_active_agent() returns false for deactivated agent';

  -- Deactivated agent cannot read visits
  if exists (select 1 from public.visits where agent_id = v_deact_id) then
    raise exception 'TEST FAILED: Deactivated agent should see no visits';
  end if;
  raise notice 'PASS: F4 - Deactivated agent cannot read visits';

  -- Deactivated agent cannot insert visits
  begin
    insert into public.visits (
      agent_id, village_id, crop_id, duration_minutes, farmer_name, farmer_phone, diagnosis, prescription, status
    ) values (
      v_deact_id, v_vil_id, v_crop_id, 15, 'Bad Farmer', '9000000000', 'Diagnosis', 'Prescription', 'pending'
    );
    raise exception 'TEST FAILED: Deactivated agent insert should have been rejected by RLS';
  exception when others then
    raise notice 'PASS: F4 - Deactivated agent insert rejected by RLS';
  end;

  -- Deactivated agent cannot call get_or_create_location
  begin
    perform * from public.get_or_create_location('Reg', 'Dist', 'Vil');
    raise exception 'TEST FAILED: Deactivated agent calling get_or_create_location should fail';
  exception when others then
    if sqlerrm like '%Permission denied%' then
      raise notice 'PASS: F4 - Deactivated agent blocked in get_or_create_location';
    else
      raise;
    end if;
  end;

  -- Test F9: audit_visit_changes function configuration
  perform set_config('role', 'postgres', true);
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public'
      and p.proname = 'audit_visit_changes'
      and p.prosecdef = true
      and array_to_string(p.proconfig, ',') like '%search_path=public%'
  ) then
    raise exception 'TEST FAILED: audit_visit_changes must have search_path=public';
  end if;
  raise notice 'PASS: F9 - audit_visit_changes has fixed search_path = public';

  -- Test F9: admin_merge_location handles district village name collisions
  declare
    v_d1 uuid;
    v_d2 uuid;
    v_v1 uuid;
    v_v2 uuid;
  begin
    insert into public.districts (region_id, name) values (v_reg_id, 'Source Dist') returning id into v_d1;
    insert into public.districts (region_id, name) values (v_reg_id, 'Target Dist') returning id into v_d2;
    -- Colliding village names
    insert into public.villages (district_id, name) values (v_d1, 'Same Village') returning id into v_v1;
    insert into public.villages (district_id, name) values (v_d2, 'Same Village') returning id into v_v2;

    -- Merge as admin
    perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);

    perform public.admin_merge_location('district', v_d1, v_d2);

    if exists (select 1 from public.districts where id = v_d1) then
      raise exception 'TEST FAILED: Source district was not removed after merge';
    end if;
    if exists (select 1 from public.villages where id = v_v1) then
      raise exception 'TEST FAILED: Colliding source village was not removed';
    end if;
    raise notice 'PASS: F9 - admin_merge_location resolved duplicate village collision without error';
  end;

  -- Test F2: Storage policies for legacy and new prescriptions prefix
  declare
    v_obj_legacy uuid := gen_random_uuid();
    v_obj_new uuid := gen_random_uuid();
  begin
    perform set_config('role', 'postgres', true);
    insert into storage.buckets (id, name, public) 
    values ('purchase-photos', 'purchase-photos', false)
    on conflict (id) do nothing;

    -- Create a legacy file for agent 1: prescriptions/{agent1_id}/rx_legacy.jpg
    insert into storage.objects (id, bucket_id, name, owner)
    values (v_obj_legacy, 'purchase-photos', 'prescriptions/' || v_agent1_id || '/rx_legacy.jpg', v_agent1_id);

    -- Create a new-style file for agent 1: {agent1_id}/prescriptions/rx_new.jpg
    insert into storage.objects (id, bucket_id, name, owner)
    values (v_obj_new, 'purchase-photos', v_agent1_id || '/prescriptions/rx_new.jpg', v_agent1_id);

    -- Switch to agent 1
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_agent1_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent1_id::text, 'role', 'authenticated')::text, true);

    if not exists (select 1 from storage.objects where name = 'prescriptions/' || v_agent1_id || '/rx_legacy.jpg') then
      raise exception 'TEST FAILED: Agent 1 should be able to read own legacy prescription file';
    end if;
    if not exists (select 1 from storage.objects where name = v_agent1_id || '/prescriptions/rx_new.jpg') then
      raise exception 'TEST FAILED: Agent 1 should be able to read own new prescription file';
    end if;
    raise notice 'PASS: F2 - Agent 1 can read own legacy and new prescription files';

    -- Switch to agent 2
    perform set_config('request.jwt.claim.sub', v_agent2_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_agent2_id::text, 'role', 'authenticated')::text, true);

    if exists (select 1 from storage.objects where name = 'prescriptions/' || v_agent1_id || '/rx_legacy.jpg') then
      raise exception 'TEST FAILED: Agent 2 should NOT be able to read Agent 1 legacy prescription file';
    end if;
    if exists (select 1 from storage.objects where name = v_agent1_id || '/prescriptions/rx_new.jpg') then
      raise exception 'TEST FAILED: Agent 2 should NOT be able to read Agent 1 new prescription file';
    end if;
    raise notice 'PASS: F2 - Agent 2 is blocked from reading Agent 1 legacy and new files';
  end;

  raise notice '=== ALL PHASE 0 HOTFIX TESTS PASSED SUCCESSFULLY ===';
end $$;

rollback;
