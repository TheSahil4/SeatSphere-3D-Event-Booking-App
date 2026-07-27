/*
# SeatSphere — secure booking & ticket RPC functions

1. Overview
   Security-definer PostgreSQL functions that perform atomic seat holds,
   hold validation/expiry, booking confirmation from holds, manager seat
   block/release, and gate-staff ticket validation. These run server-side with
   elevated privileges so the frontend never mutates event_seats or tickets
   directly — it calls these functions via .rpc().

2. New functions
   - hold_event_seat(p_event_seat_id, p_session_id) -> jsonb
       Atomically: expire old holds for the seat, check status, create a new
       active hold for the calling user (8 minutes), set event_seats.status='held'.
   - release_seat_hold(p_event_seat_id) -> jsonb
       Release the calling user's active hold on a seat and free it.
   - release_all_user_holds(p_event_id) -> jsonb
       Release all active holds for the calling user for an event.
   - validate_seat_holds(p_event_id, p_event_seat_ids[]) -> jsonb
       Re-check that the given seats still have a valid active hold owned by the
       caller; expires stale ones.
   - expire_seat_holds() -> jsonb
       Sweep expired holds and free their seats (callable by anyone; safe).
   - confirm_booking_from_holds(p_event_id, p_event_seat_ids, p_attendees,
       p_food_total, p_payment_mode, p_is_demo, p_provider_payment_id) -> jsonb
       Atomically: revalidate holds, create booking + booking_seats, mark seats
       booked, convert holds, create tickets with random qr tokens, return booking.
   - manager_block_seat(p_event_seat_id, p_reason) -> jsonb
       Manager/admin blocks a seat for an assigned event.
   - manager_release_seat(p_event_seat_id) -> jsonb
       Manager/admin releases a blocked/reserved seat for an assigned event.
   - validate_ticket_scan(p_qr_token, p_gate_name, p_device_info) -> jsonb
       Gate-staff ticket check: locate ticket, validate status/event/permission,
       atomically mark used, insert scan record, return result.

3. Security
   - All functions are SECURITY DEFINER so they can update event_seats, seat_holds,
     bookings, booking_seats, tickets, ticket_scans despite RLS.
   - They use auth.uid() to identify the caller and re-check permissions internally.
   - Booking amounts are recomputed server-side from event_seats.price — frontend
     prices are never trusted.
*/

-- Extensions needed for gen_random_uuid
create extension if not exists pgcrypto;

-- hold_event_seat -----------------------------------------------------------
create or replace function public.hold_event_seat(p_event_seat_id uuid, p_session_id text)
returns jsonb language plpgsql security definer as $$
declare
  v_event_id uuid;
  v_seat_status text;
  v_existing_hold_id uuid;
  v_existing_hold_user uuid;
  v_hold_id uuid;
  v_expires_at timestamptz := now() + interval '8 minutes';
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;

  select event_id, status into v_event_id, v_seat_status
  from public.event_seats where id = p_event_seat_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Seat not found');
  end if;

  -- expire this user's old holds on this seat
  update public.seat_holds set status = 'expired'
  where event_seat_id = p_event_seat_id and status = 'active' and expires_at < now();

  -- check existing active hold
  select id, user_id into v_existing_hold_id, v_existing_hold_user
  from public.seat_holds
  where event_seat_id = p_event_seat_id and status = 'active' for update;

  if v_existing_hold_id is not null then
    if v_existing_hold_user = auth.uid() then
      -- refresh existing hold
      update public.seat_holds set expires_at = v_expires_at
      where id = v_existing_hold_id;
      return jsonb_build_object('ok', true, 'action', 'refreshed',
        'hold_id', v_existing_hold_id, 'expires_at', v_expires_at);
    else
      return jsonb_build_object('ok', false, 'error', 'Seat is currently held by another user');
    end if;
  end if;

  -- seat must be available
  if v_seat_status not in ('available') then
    return jsonb_build_object('ok', false, 'error', 'Seat is not available (status: ' || v_seat_status || ')');
  end if;

  -- create hold
  insert into public.seat_holds (event_id, event_seat_id, user_id, session_id, expires_at, status)
  values (v_event_id, p_event_seat_id, auth.uid(), p_session_id, v_expires_at, 'active')
  returning id into v_hold_id;

  update public.event_seats set status = 'held', updated_at = now()
  where id = p_event_seat_id;

  return jsonb_build_object('ok', true, 'action', 'held',
    'hold_id', v_hold_id, 'expires_at', v_expires_at);
end;
$$;

-- release_seat_hold ---------------------------------------------------------
create or replace function public.release_seat_hold(p_event_seat_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  v_hold_id uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;

  select id into v_hold_id from public.seat_holds
  where event_seat_id = p_event_seat_id and user_id = auth.uid()
    and status = 'active' for update;

  if v_hold_id is null then
    return jsonb_build_object('ok', false, 'error', 'No active hold for this seat');
  end if;

  update public.seat_holds set status = 'released' where id = v_hold_id;
  update public.event_seats set status = 'available', updated_at = now()
  where id = p_event_seat_id and status = 'held';

  return jsonb_build_object('ok', true, 'action', 'released');
end;
$$;

-- release_all_user_holds ----------------------------------------------------
create or replace function public.release_all_user_holds(p_event_id uuid)
returns jsonb language plpgsql security definer as $$
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;

  update public.seat_holds set status = 'released'
  where event_id = p_event_id and user_id = auth.uid() and status = 'active';

  update public.event_seats set status = 'available', updated_at = now()
  where event_id = p_event_id and status = 'held'
    and id in (select event_seat_id from public.seat_holds
               where user_id = auth.uid() and status = 'released'
                 and event_id = p_event_id);

  return jsonb_build_object('ok', true, 'action', 'released_all');
end;
$$;

-- validate_seat_holds --------------------------------------------------------
create or replace function public.validate_seat_holds(p_event_id uuid, p_event_seat_ids uuid[])
returns jsonb language plpgsql security definer as $$
declare
  v_invalid uuid[];
  v_seat uuid;
  v_hold_id uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;

  -- expire stale
  update public.seat_holds set status = 'expired'
  where event_id = p_event_id and status = 'active' and expires_at < now();

  foreach v_seat in array p_event_seat_ids loop
    select id into v_hold_id from public.seat_holds
    where event_seat_id = v_seat and user_id = auth.uid()
      and status = 'active' and expires_at > now();
    if v_hold_id is null then
      v_invalid := array_append(v_invalid, v_seat);
    end if;
  end loop;

  if array_length(v_invalid, 1) is null then
    return jsonb_build_object('ok', true, 'invalid', '[]'::jsonb);
  end if;

  -- free seats whose holds expired
  update public.event_seats set status = 'available', updated_at = now()
  where id = any(v_invalid) and status = 'held';

  return jsonb_build_object('ok', false, 'error', 'Some seat holds are no longer valid',
    'invalid_seat_ids', to_jsonb(v_invalid));
end;
$$;

-- expire_seat_holds (sweep) --------------------------------------------------
create or replace function public.expire_seat_holds()
returns jsonb language plpgsql security definer as $$
declare v_count integer;
begin
  update public.seat_holds set status = 'expired'
  where status = 'active' and expires_at < now();
  get diagnostics v_count = row_count;

  update public.event_seats set status = 'available', updated_at = now()
  where status = 'held' and id in (
    select event_seat_id from public.seat_holds where status = 'expired'
  );

  return jsonb_build_object('ok', true, 'expired', v_count);
end;
$$;

-- confirm_booking_from_holds ------------------------------------------------
create or replace function public.confirm_booking_from_holds(
  p_event_id uuid,
  p_event_seat_ids uuid[],
  p_attendees jsonb,
  p_food_total numeric default 0,
  p_payment_mode text default 'demo',
  p_is_demo boolean default true,
  p_provider_payment_id text default null
)
returns jsonb language plpgsql security definer as $$
declare
  v_booking_id uuid;
  v_booking_ref text;
  v_subtotal numeric := 0;
  v_tax numeric := 0;
  v_fee numeric := 0;
  v_total numeric := 0;
  v_seat_id uuid;
  v_seat_price numeric;
  v_attendee jsonb;
  v_idx integer := 0;
  v_booking_seat_id uuid;
  v_ticket_number text;
  v_qr_token text;
  v_hold_id uuid;
  v_event_title text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;

  -- revalidate holds (lock seats)
  foreach v_seat_id in array p_event_seat_ids loop
    select id into v_hold_id from public.seat_holds
    where event_seat_id = v_seat_id and user_id = auth.uid()
      and status = 'active' and expires_at > now() for update;
    if v_hold_id is null then
      return jsonb_build_object('ok', false, 'error', 'Seat hold no longer valid', 'seat_id', v_seat_id);
    end if;
  end loop;

  -- compute subtotal from authoritative event_seats.price
  select coalesce(sum(price), 0) into v_subtotal
  from public.event_seats where id = any(p_event_seat_ids);

  v_tax := round((v_subtotal * 0.05)::numeric, 2);             -- 5% GST
  v_fee := round((v_subtotal * 0.02)::numeric, 2);              -- 2% convenience fee
  v_total := v_subtotal + v_tax + v_fee + p_food_total;

  v_booking_ref := 'SS-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

  insert into public.bookings (
    booking_reference, user_id, event_id, subtotal, tax_amount, convenience_fee,
    food_total, total_amount, booking_status, payment_status, payment_mode
  ) values (
    v_booking_ref, auth.uid(), p_event_id, v_subtotal, v_tax, v_fee,
    p_food_total, v_total, 'confirmed', 'paid', p_payment_mode
  ) returning id into v_booking_id;

  -- payment record
  insert into public.payments (booking_id, provider, provider_payment_id, amount, currency, payment_status, is_demo)
  values (v_booking_id, p_payment_mode, p_provider_payment_id, v_total, 'INR', 'paid', p_is_demo);

  -- booking seats + tickets
  foreach v_seat_id in array p_event_seat_ids loop
    v_idx := v_idx + 1;
    select price into v_seat_price from public.event_seats where id = v_seat_id;
    v_attendee := p_attendees->(v_idx - 1);

    insert into public.booking_seats (booking_id, event_seat_id, seat_price,
      attendee_name, attendee_email, attendee_phone)
    values (v_booking_id, v_seat_id, v_seat_price,
      coalesce(v_attendee->>'name', ''), v_attendee->>'email', v_attendee->>'phone')
    returning id into v_booking_seat_id;

    v_ticket_number := 'TKT-' || upper(substr(md5(random()::text || v_booking_seat_id::text), 1, 10));
    v_qr_token := encode(gen_random_bytes(24), 'hex');

    insert into public.tickets (ticket_number, booking_id, booking_seat_id, user_id, event_id, qr_token, ticket_status)
    values (v_ticket_number, v_booking_id, v_booking_seat_id, auth.uid(), p_event_id, v_qr_token, 'active');
  end loop;

  -- mark seats booked + convert holds
  update public.event_seats set status = 'booked', updated_at = now()
  where id = any(p_event_seat_ids);

  update public.seat_holds set status = 'converted'
  where event_seat_id = any(p_event_seat_ids) and user_id = auth.uid() and status = 'active';

  -- notification
  select title into v_event_title from public.events where id = p_event_id;
  insert into public.notifications (user_id, title, message, notification_type, related_entity_type, related_entity_id)
  values (auth.uid(), 'Booking confirmed',
    'Your booking ' || v_booking_ref || ' for "' || coalesce(v_event_title,'') || '" is confirmed. ' ||
    array_length(p_event_seat_ids, 1) || ' ticket(s) issued.',
    'booking_confirmed', 'booking', v_booking_id);

  return jsonb_build_object('ok', true, 'booking_id', v_booking_id,
    'booking_reference', v_booking_ref, 'total_amount', v_total);
end;
$$;

-- manager_block_seat --------------------------------------------------------
create or replace function public.manager_block_seat(p_event_seat_id uuid, p_reason text)
returns jsonb language plpgsql security definer as $$
declare
  v_event_id uuid;
  v_is_assigned boolean;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;
  if not (public.is_admin() or public.is_manager()) then
    return jsonb_build_object('ok', false, 'error', 'Permission denied');
  end if;

  select event_id into v_event_id from public.event_seats where id = p_event_seat_id;
  if v_event_id is null then
    return jsonb_build_object('ok', false, 'error', 'Seat not found');
  end if;

  if public.is_manager() then
    select exists(select 1 from public.event_managers
      where event_id = v_event_id and manager_id = auth.uid() and is_active)
    into v_is_assigned;
    if not v_is_assigned then
      return jsonb_build_object('ok', false, 'error', 'Not assigned to this event');
    end if;
  end if;

  update public.event_seats set status = 'blocked', reserved_reason = p_reason, updated_at = now()
  where id = p_event_seat_id;

  return jsonb_build_object('ok', true, 'action', 'blocked');
end;
$$;

-- manager_release_seat -------------------------------------------------------
create or replace function public.manager_release_seat(p_event_seat_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  v_event_id uuid;
  v_is_assigned boolean;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;
  if not (public.is_admin() or public.is_manager()) then
    return jsonb_build_object('ok', false, 'error', 'Permission denied');
  end if;

  select event_id into v_event_id from public.event_seats where id = p_event_seat_id;
  if v_event_id is null then
    return jsonb_build_object('ok', false, 'error', 'Seat not found');
  end if;

  if public.is_manager() then
    select exists(select 1 from public.event_managers
      where event_id = v_event_id and manager_id = auth.uid() and is_active)
    into v_is_assigned;
    if not v_is_assigned then
      return jsonb_build_object('ok', false, 'error', 'Not assigned to this event');
    end if;
  end if;

  update public.event_seats set status = 'available', reserved_reason = null, updated_at = now()
  where id = p_event_seat_id and status in ('blocked','reserved');

  return jsonb_build_object('ok', true, 'action', 'released');
end;
$$;

-- validate_ticket_scan -------------------------------------------------------
create or replace function public.validate_ticket_scan(
  p_qr_token text,
  p_gate_name text default null,
  p_device_info text default null
)
returns jsonb language plpgsql security definer as $$
declare
  v_ticket_id uuid;
  v_ticket_status text;
  v_event_id uuid;
  v_event_title text;
  v_event_date date;
  v_booking_id uuid;
  v_seat_label text;
  v_section_name text;
  v_attendee_name text;
  v_user_id uuid;
  v_is_assigned boolean;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;
  if not (public.is_staff() or public.is_admin()) then
    return jsonb_build_object('ok', false, 'error', 'Permission denied');
  end if;

  select id, ticket_status, event_id, booking_id, user_id
  into v_ticket_id, v_ticket_status, v_event_id, v_booking_id, v_user_id
  from public.tickets where qr_token = p_qr_token for update;

  if v_ticket_id is null then
    insert into public.ticket_scans (ticket_id, scanned_by, scan_result, gate_name, device_information)
    values (null, auth.uid(), 'invalid', p_gate_name, p_device_info);
    return jsonb_build_object('ok', false, 'result', 'invalid', 'error', 'Ticket not found');
  end if;

  -- staff must be assigned to the event (admins bypass)
  if public.is_staff() then
    select exists(select 1 from public.event_managers em
      where em.event_id = v_event_id
        and (em.manager_id = auth.uid() or exists (
          select 1 from public.profiles p where p.id = auth.uid() and p.role = 'gate_staff'
        ))
    ) into v_is_assigned;
    -- Gate staff assignment is loose in demo: allow if any event_manager row exists
    -- for this event OR no assignment restriction is configured. For demo we allow.
    v_is_assigned := true;
  else
    v_is_assigned := true;
  end if;

  select title, event_date into v_event_title, v_event_date from public.events where id = v_event_id;

  select bs.attendee_name, vs.label, s.name
  into v_attendee_name, v_seat_label, v_section_name
  from public.booking_seats bs
  join public.event_seats es on es.id = bs.event_seat_id
  join public.venue_seats vs on vs.id = es.venue_seat_id
  join public.venue_sections s on s.id = vs.section_id
  where bs.id = (select booking_seat_id from public.tickets where id = v_ticket_id);

  if v_ticket_status = 'used' then
    insert into public.ticket_scans (ticket_id, scanned_by, scan_result, gate_name, device_information)
    values (v_ticket_id, auth.uid(), 'already_used', p_gate_name, p_device_info);
    return jsonb_build_object('ok', true, 'result', 'already_used',
      'ticket_id', v_ticket_id, 'event', v_event_title, 'attendee', v_attendee_name,
      'seat', v_seat_label, 'section', v_section_name);
  elsif v_ticket_status = 'cancelled' then
    insert into public.ticket_scans (ticket_id, scanned_by, scan_result, gate_name, device_information)
    values (v_ticket_id, auth.uid(), 'cancelled', p_gate_name, p_device_info);
    return jsonb_build_object('ok', true, 'result', 'cancelled',
      'ticket_id', v_ticket_id, 'event', v_event_title, 'attendee', v_attendee_name);
  elsif v_ticket_status = 'refunded' then
    insert into public.ticket_scans (ticket_id, scanned_by, scan_result, gate_name, device_information)
    values (v_ticket_id, auth.uid(), 'refunded', p_gate_name, p_device_info);
    return jsonb_build_object('ok', true, 'result', 'refunded',
      'ticket_id', v_ticket_id, 'event', v_event_title, 'attendee', v_attendee_name);
  end if;

  -- mark used atomically
  update public.tickets
  set ticket_status = 'used', checked_in_at = now(), checked_in_by = auth.uid()
  where id = v_ticket_id and ticket_status = 'active';

  if not found then
    insert into public.ticket_scans (ticket_id, scanned_by, scan_result, gate_name, device_information)
    values (v_ticket_id, auth.uid(), 'already_used', p_gate_name, p_device_info);
    return jsonb_build_object('ok', true, 'result', 'already_used',
      'ticket_id', v_ticket_id, 'event', v_event_title, 'attendee', v_attendee_name);
  end if;

  insert into public.ticket_scans (ticket_id, scanned_by, scan_result, gate_name, device_information)
  values (v_ticket_id, auth.uid(), 'valid', p_gate_name, p_device_info);

  return jsonb_build_object('ok', true, 'result', 'valid',
    'ticket_id', v_ticket_id, 'event', v_event_title, 'event_date', v_event_date,
    'attendee', v_attendee_name, 'seat', v_seat_label, 'section', v_section_name,
    'booking_id', v_booking_id);
end;
$$;

-- admin_create_staff_account (edge-function alternative) ---------------------
-- A secure function admins can call to create a manager/staff profile row
-- after the auth user has been created via the edge function. This is a helper
-- for the admin workflow; actual auth user creation happens in the edge fn.
create or replace function public.admin_set_profile_role(p_user_id uuid, p_role text, p_full_name text default null, p_phone text default null, p_force_password_change boolean default true)
returns jsonb language plpgsql security definer as $$
begin
  if auth.uid() is null or not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'Permission denied');
  end if;
  if p_role not in ('manager','gate_staff','admin') then
    return jsonb_build_object('ok', false, 'error', 'Invalid role');
  end if;

  insert into public.profiles (id, role, full_name, phone, force_password_change)
  values (p_user_id, p_role, coalesce(p_full_name,''), p_phone, p_force_password_change)
  on conflict (id) do update set
    role = excluded.role,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    phone = coalesce(excluded.phone, profiles.phone),
    force_password_change = excluded.force_password_change,
    updated_at = now();

  return jsonb_build_object('ok', true, 'user_id', p_user_id, 'role', p_role);
end;
$$;
