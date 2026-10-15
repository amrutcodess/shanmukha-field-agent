-- scripts/test-gaps-fail.sql
-- Diagnostic script testing Gap A and Gap B on current staging schema (after 010, before 011).
-- Safe: executes inside a transaction and rolls back at the end.

begin;

create temp table if not exists gap_test_results (
  id serial primary key,
  test_name text not null,
  status text not null,
  detail text
);
truncate gap_test_results;

do $$
declare
  v_admin_id  uuid := 'aaaaaaaa-1111-1111-1111-111111111111';
  v_agent_a_id uuid := 'cccccccc-3333-3333-3333-333333333333';
  v_vil_id    uuid;
  v_crop_id   uuid;
  v_stage_id  uuid;
  v_service_id uuid;
  v_farmer_id uuid;
  v_visit_id  uuid;

  v_ended_at  timestamptz;
  v_duration  integer;
  v_expected_dur integer;
  v_view_name text;
  v_views     text[] := array['visits_full', 'farm_visits_full', 'farmers_full', 'farmers_masked', 'farmers_viewer_masked', 'farmers_full_masked'];
  v_has_priv  boolean;
  v_leaked_privs text := '';
begin
  -- Setup minimal fixtures as postgres
  perform set_config('role', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);

  select id into v_vil_id from public.villages limit 1;
  select id into v_crop_id from public.crops limit 1;
  select id into v_stage_id from public.crop_stages where crop_id = v_crop_id limit 1;
  select id into v_service_id from public.value_added_services limit 1;

  insert into public.farmers (
    farmer_code, full_name, phone, village_id, farm_lat, farm_lng, farm_accuracy_m, consent_status, onboarded_by
  ) values (
    'GAP-001', 'Gap Farmer', '+919988776655', v_vil_id, 16.5, 80.6, 5.0, 'granted', v_agent_a_id
  ) returning id into v_farmer_id;

  insert into public.farmer_assignments (farmer_id, agent_id, assigned_by)
  values (v_farmer_id, v_agent_a_id, v_admin_id);

  -- -------------------------------------------------------------------------
  -- GAP A: Agent completing visit with spoofed ended_at and duration_seconds
  -- -------------------------------------------------------------------------
  -- 1. Insert in_progress visit as Agent A
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_agent_a_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_agent_a_id::text, 'role', 'authenticated')::text, true);

  v_visit_id := gen_random_uuid();
  insert into public.farm_visits (
    id, client_uuid, farmer_id, agent_id, status, started_at, start_lat, start_lng, tracking_mode, time_source
  ) values (
    v_visit_id, gen_random_uuid(), v_farmer_id, v_agent_a_id,
    'in_progress', now() - interval '1 hour', 16.5, 80.6, 'native_continuous', 'server'
  );

  insert into public.visit_services (visit_id, service_id)
  values (v_visit_id, v_service_id);

  -- Agent updates to completed, sending backdated ended_at (5 days ago) and fake duration_seconds (99999)
  update public.farm_visits
  set status = 'completed',
      ended_at = now() - interval '5 days',
      duration_seconds = 99999,
      crop_stage_id = v_stage_id,
      no_services_chosen = false
  where id = v_visit_id;

  select ended_at, duration_seconds into v_ended_at, v_duration
  from public.farm_visits where id = v_visit_id;

  -- Test Gap A (i): ended_at must be server-overwritten to within 5s of now()
  if abs(extract(epoch from (v_ended_at - now()))) <= 5 then
    insert into gap_test_results (test_name, status, detail)
    values ('Gap A (i): Server-authoritative ended_at', 'PASS', 'ended_at was server-stamped to now()');
  else
    insert into gap_test_results (test_name, status, detail)
    values ('Gap A (i): Server-authoritative ended_at', 'FAIL', 'Agent was able to backdate ended_at: ' || v_ended_at::text);
  end if;

  -- Test Gap A (ii): duration_seconds must be server-calculated, not 99999
  v_expected_dur := round(extract(epoch from (v_ended_at - (now() - interval '1 hour'))))::int;
  if v_duration = v_expected_dur or abs(v_duration - 3600) <= 5 then
    insert into gap_test_results (test_name, status, detail)
    values ('Gap A (ii): Server-computed duration_seconds', 'PASS', 'duration_seconds correctly computed as ' || v_duration);
  else
    insert into gap_test_results (test_name, status, detail)
    values ('Gap A (ii): Server-computed duration_seconds', 'FAIL', 'Agent fake duration accepted: stored ' || v_duration || ' instead of server-computed duration');
  end if;

  -- -------------------------------------------------------------------------
  -- GAP B: Authenticated role has write privileges on views
  -- -------------------------------------------------------------------------
  foreach v_view_name in array v_views loop
    if has_table_privilege('authenticated', 'public.' || v_view_name, 'INSERT') then
      v_leaked_privs := v_leaked_privs || v_view_name || ':INSERT, ';
    end if;
    if has_table_privilege('authenticated', 'public.' || v_view_name, 'UPDATE') then
      v_leaked_privs := v_leaked_privs || v_view_name || ':UPDATE, ';
    end if;
    if has_table_privilege('authenticated', 'public.' || v_view_name, 'DELETE') then
      v_leaked_privs := v_leaked_privs || v_view_name || ':DELETE, ';
    end if;
  end loop;

  if v_leaked_privs = '' then
    insert into gap_test_results (test_name, status, detail)
    values ('Gap B: Views write privileges revoked from authenticated', 'PASS', 'authenticated has SELECT-only on all views');
  else
    insert into gap_test_results (test_name, status, detail)
    values ('Gap B: Views write privileges revoked from authenticated', 'FAIL', 'authenticated still has write privileges on views: ' || v_leaked_privs);
  end if;

end $$;

select
  id,
  test_name,
  status,
  detail
from gap_test_results
order by id;

rollback;
