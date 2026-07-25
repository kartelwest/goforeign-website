-- ============================================================
-- book_appointment: the ONLY way the public (anon) role can write to
-- clients/appointments. SECURITY DEFINER so it can bypass RLS for this one
-- narrow, parameterized operation — anon still can't read/write those
-- tables directly (no policies grant that).
--
-- Client upsert + appointment insert happen as a single statement-level
-- transaction (implicit per RPC call), and the appointments_no_overlap
-- exclusion constraint is checked as part of that same INSERT — so a slot
-- that was free when the calendar rendered but taken by the time this runs
-- is caught here, atomically, not by an app-level check-then-insert race.
-- ============================================================
create or replace function book_appointment(
  p_service_id uuid,
  p_starts_at timestamptz,
  p_full_name text,
  p_email citext,
  p_phone text,
  p_client_timezone text,
  p_intake_notes text
) returns appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_duration int;
  v_buffer int;
  v_ends_at timestamptz;
  v_booking_settings jsonb;
  v_lead_hours int;
  v_window_days int;
  v_appointment appointments;
begin
  select duration_minutes, buffer_after_min
    into v_duration, v_buffer
    from services
   where id = p_service_id and is_active and is_public;

  if v_duration is null then
    raise exception 'invalid_service' using errcode = 'P0001';
  end if;

  select value into v_booking_settings from settings where key = 'booking';
  v_lead_hours := coalesce((v_booking_settings->>'lead_time_hours')::int, 12);
  v_window_days := coalesce((v_booking_settings->>'booking_window_days')::int, 60);

  if p_starts_at < now() + make_interval(hours => v_lead_hours) then
    raise exception 'lead_time_violation' using errcode = 'P0001';
  end if;

  if p_starts_at > now() + make_interval(days => v_window_days) then
    raise exception 'booking_window_violation' using errcode = 'P0001';
  end if;

  v_ends_at := p_starts_at + make_interval(mins => v_duration);

  if exists (
    select 1 from availability_blocks
     where tstzrange(starts_at, ends_at)
           && tstzrange(p_starts_at, v_ends_at + make_interval(mins => v_buffer))
  ) then
    raise exception 'slot_blocked' using errcode = 'P0001';
  end if;

  insert into clients (full_name, email, phone, timezone)
  values (p_full_name, p_email, p_phone, coalesce(p_client_timezone, 'America/New_York'))
  on conflict (email) do update
    set full_name = excluded.full_name,
        phone = coalesce(excluded.phone, clients.phone)
  returning id into v_client_id;

  -- appointments_no_overlap (exclusion constraint, migration 0001) fires
  -- here on the actual INSERT — this is the real double-booking guard.
  insert into appointments (
    client_id, service_id, starts_at, duration_minutes,
    client_timezone, intake_notes, source
  )
  values (
    v_client_id, p_service_id, p_starts_at, v_duration,
    p_client_timezone, p_intake_notes, 'web'
  )
  returning * into v_appointment;

  return v_appointment;
end;
$$;

revoke all on function book_appointment(uuid, timestamptz, text, citext, text, text, text) from public;
grant execute on function book_appointment(uuid, timestamptz, text, citext, text, text, text)
  to anon, authenticated;

-- ============================================================
-- cancel_appointment: token-based cancellation, no login required.
-- Also SECURITY DEFINER + narrow, so anon can cancel their own appointment
-- by token without any table-level access.
-- ============================================================
create or replace function cancel_appointment(
  p_manage_token text,
  p_reason text
) returns appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appointment appointments;
  v_cutoff_hours int;
  v_booking_settings jsonb;
begin
  select * into v_appointment from appointments where manage_token = p_manage_token;

  if v_appointment.id is null then
    raise exception 'not_found' using errcode = 'P0001';
  end if;

  if v_appointment.status in ('cancelled', 'completed', 'no_show') then
    raise exception 'not_cancellable' using errcode = 'P0001';
  end if;

  select value into v_booking_settings from settings where key = 'booking';
  v_cutoff_hours := coalesce((v_booking_settings->>'cancel_cutoff_hours')::int, 24);

  if v_appointment.starts_at < now() + make_interval(hours => v_cutoff_hours) then
    raise exception 'cutoff_passed' using errcode = 'P0001';
  end if;

  update appointments
     set status = 'cancelled',
         cancelled_at = now(),
         cancellation_reason = p_reason
   where manage_token = p_manage_token
  returning * into v_appointment;

  return v_appointment;
end;
$$;

revoke all on function cancel_appointment(text, text) from public;
grant execute on function cancel_appointment(text, text) to anon, authenticated;

-- ============================================================
-- reschedule_appointment: token-based, no login required. Re-runs the same
-- lead-time/window/block checks as booking, and the UPDATE is still covered
-- by appointments_no_overlap (exclusion constraints apply to UPDATE, not
-- just INSERT), so a slot taken between page load and submit is still
-- caught atomically here.
-- ============================================================
create or replace function reschedule_appointment(
  p_manage_token text,
  p_new_starts_at timestamptz
) returns appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appointment appointments;
  v_duration int;
  v_buffer int;
  v_new_ends_at timestamptz;
  v_booking_settings jsonb;
  v_lead_hours int;
  v_window_days int;
  v_cutoff_hours int;
begin
  select a.*, s.buffer_after_min
    into v_appointment, v_buffer
    from appointments a
    join services s on s.id = a.service_id
   where a.manage_token = p_manage_token;

  if v_appointment.id is null then
    raise exception 'not_found' using errcode = 'P0001';
  end if;

  if v_appointment.status in ('cancelled', 'completed', 'no_show') then
    raise exception 'not_reschedulable' using errcode = 'P0001';
  end if;

  select value into v_booking_settings from settings where key = 'booking';
  v_lead_hours := coalesce((v_booking_settings->>'lead_time_hours')::int, 12);
  v_window_days := coalesce((v_booking_settings->>'booking_window_days')::int, 60);
  v_cutoff_hours := coalesce((v_booking_settings->>'cancel_cutoff_hours')::int, 24);

  if v_appointment.starts_at < now() + make_interval(hours => v_cutoff_hours) then
    raise exception 'cutoff_passed' using errcode = 'P0001';
  end if;

  if p_new_starts_at < now() + make_interval(hours => v_lead_hours) then
    raise exception 'lead_time_violation' using errcode = 'P0001';
  end if;

  if p_new_starts_at > now() + make_interval(days => v_window_days) then
    raise exception 'booking_window_violation' using errcode = 'P0001';
  end if;

  v_duration := v_appointment.duration_minutes;
  v_new_ends_at := p_new_starts_at + make_interval(mins => v_duration);

  if exists (
    select 1 from availability_blocks
     where tstzrange(starts_at, ends_at)
           && tstzrange(p_new_starts_at, v_new_ends_at + make_interval(mins => v_buffer))
  ) then
    raise exception 'slot_blocked' using errcode = 'P0001';
  end if;

  update appointments
     set starts_at = p_new_starts_at
   where manage_token = p_manage_token
  returning * into v_appointment;

  return v_appointment;
end;
$$;

revoke all on function reschedule_appointment(text, timestamptz) from public;
grant execute on function reschedule_appointment(text, timestamptz) to anon, authenticated;

-- ============================================================
-- get_appointment_by_token: read-only lookup for the manage/cancel page.
-- Returns only the fields the client needs to see, not the full row.
-- ============================================================
create or replace function get_appointment_by_token(p_manage_token text)
returns table (
  id uuid,
  confirmation_code text,
  starts_at timestamptz,
  duration_minutes int,
  status appointment_status,
  service_id uuid,
  service_slug text,
  service_name text,
  client_full_name text,
  client_timezone text
)
language sql
security definer
set search_path = public
as $$
  select
    a.id, a.confirmation_code, a.starts_at, a.duration_minutes, a.status,
    s.id as service_id, s.slug as service_slug, s.name as service_name,
    c.full_name as client_full_name, a.client_timezone
  from appointments a
  join services s on s.id = a.service_id
  join clients c on c.id = a.client_id
  where a.manage_token = p_manage_token;
$$;

revoke all on function get_appointment_by_token(text) from public;
grant execute on function get_appointment_by_token(text) to anon, authenticated;
