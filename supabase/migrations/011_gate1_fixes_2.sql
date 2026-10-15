-- Migration: 011_gate1_fixes_2.sql
-- Resolves Gate 1 Gap A (server-calculated visit completion times) and Gap B (views write privilege revocation).

-- =============================================================================
-- GAP A: SERVER-AUTHORITATIVE ended_at & duration_seconds ON VISIT COMPLETION
-- =============================================================================
create or replace function public.enforce_farm_visit_authoritative_times()
returns trigger as $$
begin
  if not public.is_admin() then
    if TG_OP = 'INSERT' then
      if new.status <> 'in_progress' then
        raise exception 'Non-admins can only insert visits with status in_progress';
      end if;
      if new.ended_at is not null then
        raise exception 'Non-admins cannot specify ended_at on visit insert';
      end if;
      if new.duration_seconds is not null then
        raise exception 'Non-admins cannot specify duration_seconds on visit insert';
      end if;
      if new.time_source is distinct from 'server' then
        raise exception 'Non-admins must use time_source server';
      end if;
      -- started_at must not be self-chosen in past or future (> 10s difference from server now)
      if new.started_at is not null and abs(extract(epoch from (new.started_at - now()))) > 10 then
        raise exception 'Non-admins cannot supply self-chosen started_at; must be server-authoritative now()';
      end if;
      new.started_at := coalesce(new.started_at, now());
      new.time_source := 'server';

    elsif TG_OP = 'UPDATE' then
      if new.started_at <> old.started_at then
        raise exception 'started_at is immutable and cannot be changed';
      end if;
      if new.time_source <> old.time_source then
        raise exception 'time_source is immutable and cannot be changed';
      end if;

      -- Non-admin completing visit: server-compute ended_at and duration_seconds
      if old.status = 'in_progress' and new.status = 'completed' then
        new.ended_at := now();
        new.duration_seconds := round(extract(epoch from (new.ended_at - new.started_at)))::int;
      else
        -- On any other update (not transitioning to completed), reject modifications to ended_at or duration_seconds
        if new.ended_at is distinct from old.ended_at then
          raise exception 'ended_at can only be set when completing a visit';
        end if;
        if new.duration_seconds is distinct from old.duration_seconds then
          raise exception 'duration_seconds can only be set when completing a visit';
        end if;
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Reattach trigger ensuring clean execution
drop trigger if exists tr_enforce_farm_visit_authoritative_times on public.farm_visits;
create trigger tr_enforce_farm_visit_authoritative_times
  before insert or update on public.farm_visits
  for each row execute function public.enforce_farm_visit_authoritative_times();

-- =============================================================================
-- GAP B: REVOKE ALL WRITE PRIVILEGES ON VIEWS FROM AUTHENTICATED
-- =============================================================================
revoke all on public.visits_full from authenticated, anon, public;
revoke all on public.farm_visits_full from authenticated, anon, public;
revoke all on public.farmers_full from authenticated, anon, public;
revoke all on public.farmers_masked from authenticated, anon, public;
revoke all on public.farmers_viewer_masked from authenticated, anon, public;
revoke all on public.farmers_full_masked from authenticated, anon, public;

grant select on public.visits_full to authenticated;
grant select on public.farm_visits_full to authenticated;
grant select on public.farmers_full to authenticated;
grant select on public.farmers_masked to authenticated;
grant select on public.farmers_viewer_masked to authenticated;
grant select on public.farmers_full_masked to authenticated;
