/*
# SeatSphere — initial schema

1. Overview
   Core tables for the SeatSphere event-booking platform: profiles, venues,
   venue levels/sections/rows/seats, facilities, artists, events, event artists,
   event managers, event seats, seat holds, bookings, booking seats, payments,
   tickets, ticket scans, food vendors/stalls/items, event food items, food orders,
   emergency contacts/incidents, notifications, reviews, support tickets, audit logs.

2. Security
   - RLS enabled on every table.
   - Public read (anon, authenticated) on published events, active venues,
     artists, sections/seats/facilities, event_seats, food items — so the public
     site works without sign-in.
   - Owner-scoped CRUD for customers on their own bookings, tickets, food orders,
     notifications, reviews, support tickets, profiles.
   - Admin/manager/staff access is gated through the `is_admin()` / `is_manager()` /
     `is_staff()` helper functions which read the role from profiles.

3. Important notes
   - `profiles.role` defaults to 'customer' and is stamped by a trigger on insert.
   - `user_id` owner columns default to `auth.uid()` so inserts from authenticated
     clients succeed without explicitly passing the owner.
   - All seat/hold/booking mutations that must be atomic go through RPC functions
     in migration 0002.
*/

-- profiles table FIRST (no policies yet) -------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  phone text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer','admin','manager','gate_staff')),
  city text,
  date_of_birth date,
  emergency_contact_name text,
  emergency_contact_phone text,
  accessibility_preferences text,
  is_active boolean not null default true,
  force_password_change boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Helper role functions (defined after profiles table, before policies) -----
create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin' and is_active);
$$;

create or replace function public.is_manager()
returns boolean language sql stable security definer as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'manager' and is_active);
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'gate_staff' and is_active);
$$;

create or replace function public.is_customer()
returns boolean language sql stable security definer as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'customer' and is_active);
$$;

-- profiles default-role trigger
create or replace function public.profiles_default_role()
returns trigger language plpgsql security definer as $$
begin
  if new.role is null then new.role := 'customer'; end if;
  if new.email is null or new.email = '' then
    select email into new.email from auth.users where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_default_role on public.profiles;
create trigger trg_profiles_default_role
  before insert on public.profiles
  for each row execute function public.profiles_default_role();

-- profiles policies (now is_admin exists) ------------------------------------
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin" on public.profiles
  for select to authenticated using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- venues ----------------------------------------------------------------------
create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  venue_type text not null default 'arena',
  address text,
  city text not null default '',
  state text,
  country text not null default 'India',
  latitude numeric(9,6),
  longitude numeric(9,6),
  total_capacity integer not null default 0,
  parking_capacity integer not null default 0,
  venue_image_url text,
  venue_map_url text,
  model_3d_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.venues enable row level security;

drop policy if exists "venues_read_public" on public.venues;
create policy "venues_read_public" on public.venues
  for select to anon, authenticated using (is_active or public.is_admin());

drop policy if exists "venues_write_admin" on public.venues;
create policy "venues_write_admin" on public.venues
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- venue_levels ----------------------------------------------------------------
create table if not exists public.venue_levels (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  name text not null,
  level_number integer not null default 1,
  display_order integer not null default 0
);
alter table public.venue_levels enable row level security;

drop policy if exists "venue_levels_read_public" on public.venue_levels;
create policy "venue_levels_read_public" on public.venue_levels
  for select to anon, authenticated using (true);

drop policy if exists "venue_levels_write_admin" on public.venue_levels;
create policy "venue_levels_write_admin" on public.venue_levels
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- venue_sections --------------------------------------------------------------
create table if not exists public.venue_sections (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  level_id uuid references public.venue_levels(id) on delete set null,
  name text not null,
  code text not null,
  section_type text not null default 'standard',
  capacity integer not null default 0,
  base_price_multiplier numeric(5,2) not null default 1.0,
  colour_code text not null default '#6366f1',
  position_x numeric(8,3) not null default 0,
  position_y numeric(8,3) not null default 0,
  position_z numeric(8,3) not null default 0,
  rotation_x numeric(6,3) not null default 0,
  rotation_y numeric(6,3) not null default 0,
  rotation_z numeric(6,3) not null default 0,
  visibility_score numeric(4,2) not null default 80,
  is_active boolean not null default true
);
alter table public.venue_sections enable row level security;

drop policy if exists "venue_sections_read_public" on public.venue_sections;
create policy "venue_sections_read_public" on public.venue_sections
  for select to anon, authenticated using (true);

drop policy if exists "venue_sections_write_admin" on public.venue_sections;
create policy "venue_sections_write_admin" on public.venue_sections
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- venue_rows -----------------------------------------------------------------
create table if not exists public.venue_rows (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.venue_sections(id) on delete cascade,
  name text not null,
  row_number integer not null default 1,
  display_order integer not null default 0
);
alter table public.venue_rows enable row level security;

drop policy if exists "venue_rows_read_public" on public.venue_rows;
create policy "venue_rows_read_public" on public.venue_rows
  for select to anon, authenticated using (true);

drop policy if exists "venue_rows_write_admin" on public.venue_rows;
create policy "venue_rows_write_admin" on public.venue_rows
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- venue_seats ----------------------------------------------------------------
create table if not exists public.venue_seats (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  section_id uuid not null references public.venue_sections(id) on delete cascade,
  row_id uuid not null references public.venue_rows(id) on delete cascade,
  seat_number integer not null,
  label text not null,
  seat_type text not null default 'standard',
  position_x numeric(8,3) not null default 0,
  position_y numeric(8,3) not null default 0,
  position_z numeric(8,3) not null default 0,
  rotation_x numeric(6,3) not null default 0,
  rotation_y numeric(6,3) not null default 0,
  rotation_z numeric(6,3) not null default 0,
  default_visibility_score numeric(4,2) not null default 80,
  is_accessible boolean not null default false,
  has_limited_view boolean not null default false,
  is_active boolean not null default true
);
alter table public.venue_seats enable row level security;

drop policy if exists "venue_seats_read_public" on public.venue_seats;
create policy "venue_seats_read_public" on public.venue_seats
  for select to anon, authenticated using (true);

drop policy if exists "venue_seats_write_admin" on public.venue_seats;
create policy "venue_seats_write_admin" on public.venue_seats
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create unique index if not exists uq_venue_seats_row_number
  on public.venue_seats (row_id, seat_number);

-- venue_facilities ----------------------------------------------------------
create table if not exists public.venue_facilities (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  name text not null,
  facility_type text not null,
  description text,
  level_id uuid references public.venue_levels(id) on delete set null,
  position_x numeric(8,3) not null default 0,
  position_y numeric(8,3) not null default 0,
  position_z numeric(8,3) not null default 0,
  contact_number text,
  is_emergency boolean not null default false,
  is_active boolean not null default true
);
alter table public.venue_facilities enable row level security;

drop policy if exists "venue_facilities_read_public" on public.venue_facilities;
create policy "venue_facilities_read_public" on public.venue_facilities
  for select to anon, authenticated using (true);

drop policy if exists "venue_facilities_write_admin" on public.venue_facilities;
create policy "venue_facilities_write_admin" on public.venue_facilities
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- artists --------------------------------------------------------------------
create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  biography text,
  category text,
  profile_image_url text,
  cover_image_url text,
  contact_email text,
  contact_phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.artists enable row level security;

drop policy if exists "artists_read_public" on public.artists;
create policy "artists_read_public" on public.artists
  for select to anon, authenticated using (is_active or public.is_admin());

drop policy if exists "artists_write_admin" on public.artists;
create policy "artists_write_admin" on public.artists
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- events ---------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  short_description text,
  category text not null default 'Concerts',
  venue_id uuid references public.venues(id) on delete set null,
  banner_url text,
  thumbnail_url text,
  promotional_video_url text,
  language text not null default 'English',
  age_restriction text,
  duration_minutes integer,
  event_date date not null,
  start_time time not null default '19:00',
  end_time time,
  gate_open_time time,
  booking_open_at timestamptz,
  booking_close_at timestamptz,
  capacity_limit integer not null default 0,
  minimum_ticket_price numeric(10,2) not null default 0,
  maximum_ticket_price numeric(10,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','published','booking_open','sold_out','ongoing','completed','cancelled','postponed')),
  cancellation_policy text,
  refund_policy text,
  terms_and_conditions text,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.events enable row level security;

drop policy if exists "events_read_public" on public.events;
create policy "events_read_public" on public.events
  for select to anon, authenticated
  using (is_published or public.is_admin() or public.is_manager());

drop policy if exists "events_write_admin" on public.events;
create policy "events_write_admin" on public.events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- event_artists --------------------------------------------------------------
create table if not exists public.event_artists (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  artist_id uuid not null references public.artists(id) on delete cascade,
  performance_order integer not null default 1,
  reporting_time time,
  rehearsal_time time,
  performance_start_time time,
  performance_end_time time,
  unique (event_id, artist_id)
);
alter table public.event_artists enable row level security;

drop policy if exists "event_artists_read_public" on public.event_artists;
create policy "event_artists_read_public" on public.event_artists
  for select to anon, authenticated using (true);

drop policy if exists "event_artists_write_admin" on public.event_artists;
create policy "event_artists_write_admin" on public.event_artists
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- event_managers -------------------------------------------------------------
create table if not exists public.event_managers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  manager_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  access_start_at timestamptz,
  access_end_at timestamptz,
  is_primary_manager boolean not null default false,
  is_active boolean not null default true,
  unique (event_id, manager_id)
);
alter table public.event_managers enable row level security;

drop policy if exists "event_managers_read_self_or_admin" on public.event_managers;
create policy "event_managers_read_self_or_admin" on public.event_managers
  for select to authenticated
  using (manager_id = auth.uid() or public.is_admin());

drop policy if exists "event_managers_write_admin" on public.event_managers;
create policy "event_managers_write_admin" on public.event_managers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- event_seats ----------------------------------------------------------------
create table if not exists public.event_seats (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  venue_seat_id uuid not null references public.venue_seats(id) on delete cascade,
  category_name text not null default 'Standard',
  price numeric(10,2) not null default 0,
  status text not null default 'available' check (status in ('available','held','booked','reserved','blocked','unavailable')),
  visibility_score numeric(4,2) not null default 80,
  stage_view_image_url text,
  stage_view_camera_x numeric(8,3),
  stage_view_camera_y numeric(8,3),
  stage_view_camera_z numeric(8,3),
  reserved_reason text,
  updated_at timestamptz not null default now(),
  unique (event_id, venue_seat_id)
);
alter table public.event_seats enable row level security;

drop policy if exists "event_seats_read_public" on public.event_seats;
create policy "event_seats_read_public" on public.event_seats
  for select to anon, authenticated using (true);

drop policy if exists "event_seats_write_admin" on public.event_seats;
create policy "event_seats_write_admin" on public.event_seats
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- seat_holds -----------------------------------------------------------------
create table if not exists public.seat_holds (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  event_seat_id uuid not null references public.event_seats(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  session_id text,
  held_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status text not null default 'active' check (status in ('active','expired','converted','released'))
);
alter table public.seat_holds enable row level security;

drop policy if exists "seat_holds_read_self_or_admin" on public.seat_holds;
create policy "seat_holds_read_self_or_admin" on public.seat_holds
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- bookings -------------------------------------------------------------------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null unique,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  convenience_fee numeric(12,2) not null default 0,
  food_total numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  currency text not null default 'INR',
  booking_status text not null default 'pending' check (booking_status in ('pending','confirmed','cancelled','expired','partially_refunded','refunded')),
  payment_status text not null default 'pending' check (payment_status in ('pending','processing','paid','failed','refunded','partially_refunded')),
  payment_mode text not null default 'demo',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.bookings enable row level security;

drop policy if exists "bookings_read_self_or_admin_manager" on public.bookings;
create policy "bookings_read_self_or_admin_manager" on public.bookings
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin()
         or exists(select 1 from public.event_managers em
                   where em.event_id = bookings.event_id
                     and em.manager_id = auth.uid() and em.is_active));

drop policy if exists "bookings_insert_self" on public.bookings;
create policy "bookings_insert_self" on public.bookings
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "bookings_update_self_or_admin" on public.bookings;
create policy "bookings_update_self_or_admin" on public.bookings
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- booking_seats --------------------------------------------------------------
create table if not exists public.booking_seats (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  event_seat_id uuid not null references public.event_seats(id) on delete cascade,
  seat_price numeric(10,2) not null default 0,
  attendee_name text not null,
  attendee_email text,
  attendee_phone text
);
alter table public.booking_seats enable row level security;

drop policy if exists "booking_seats_read_self_or_admin_manager" on public.booking_seats;
create policy "booking_seats_read_self_or_admin_manager" on public.booking_seats
  for select to authenticated
  using (exists(select 1 from public.bookings b where b.id = booking_id
                and (b.user_id = auth.uid() or public.is_admin()
                     or exists(select 1 from public.event_managers em
                               where em.event_id = b.event_id
                                 and em.manager_id = auth.uid() and em.is_active))));

drop policy if exists "booking_seats_insert_self" on public.booking_seats;
create policy "booking_seats_insert_self" on public.booking_seats
  for insert to authenticated with check (
    exists(select 1 from public.bookings b where b.id = booking_id and b.user_id = auth.uid())
  );

drop policy if exists "booking_seats_update_self_or_admin" on public.booking_seats;
create policy "booking_seats_update_self_or_admin" on public.booking_seats
  for update to authenticated
  using (exists(select 1 from public.bookings b where b.id = booking_id
                and (b.user_id = auth.uid() or public.is_admin())))
  with check (exists(select 1 from public.bookings b where b.id = booking_id
                and (b.user_id = auth.uid() or public.is_admin())));

-- payments -------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  provider text not null default 'demo',
  provider_order_id text,
  provider_payment_id text,
  provider_signature text,
  amount numeric(12,2) not null default 0,
  currency text not null default 'INR',
  payment_status text not null default 'pending' check (payment_status in ('pending','processing','paid','failed','refunded','partially_refunded')),
  is_demo boolean not null default true,
  error_code text,
  error_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.payments enable row level security;

drop policy if exists "payments_read_self_or_admin" on public.payments;
create policy "payments_read_self_or_admin" on public.payments
  for select to authenticated
  using (exists(select 1 from public.bookings b where b.id = payments.booking_id
                and (b.user_id = auth.uid() or public.is_admin())));

drop policy if exists "payments_insert_self" on public.payments;
create policy "payments_insert_self" on public.payments
  for insert to authenticated with check (
    exists(select 1 from public.bookings b where b.id = payments.booking_id and b.user_id = auth.uid())
  );

drop policy if exists "payments_update_self_or_admin" on public.payments;
create policy "payments_update_self_or_admin" on public.payments
  for update to authenticated
  using (exists(select 1 from public.bookings b where b.id = payments.booking_id
                and (b.user_id = auth.uid() or public.is_admin())))
  with check (exists(select 1 from public.bookings b where b.id = payments.booking_id
                and (b.user_id = auth.uid() or public.is_admin())));

-- tickets --------------------------------------------------------------------
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  booking_seat_id uuid not null references public.booking_seats(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  qr_token text not null unique,
  qr_code_url text,
  ticket_status text not null default 'active' check (ticket_status in ('active','used','cancelled','transferred','refunded')),
  checked_in_at timestamptz,
  checked_in_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.tickets enable row level security;

drop policy if exists "tickets_read_self_or_admin_manager_staff" on public.tickets;
create policy "tickets_read_self_or_admin_manager_staff" on public.tickets
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin()
         or public.is_manager() or public.is_staff());

drop policy if exists "tickets_insert_self" on public.tickets;
create policy "tickets_insert_self" on public.tickets
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "tickets_update_self_or_admin" on public.tickets;
create policy "tickets_update_self_or_admin" on public.tickets
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ticket_scans ---------------------------------------------------------------
create table if not exists public.ticket_scans (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  scanned_by uuid references public.profiles(id) on delete set null,
  scanned_at timestamptz not null default now(),
  scan_result text not null check (scan_result in ('valid','already_used','cancelled','invalid','refunded')),
  gate_name text,
  device_information text
);
alter table public.ticket_scans enable row level security;

drop policy if exists "ticket_scans_read_admin_manager_staff" on public.ticket_scans;
create policy "ticket_scans_read_admin_manager_staff" on public.ticket_scans
  for select to authenticated
  using (public.is_admin() or public.is_manager() or public.is_staff());

drop policy if exists "ticket_scans_insert_staff" on public.ticket_scans;
create policy "ticket_scans_insert_staff" on public.ticket_scans
  for insert to authenticated with check (public.is_staff() or public.is_admin());

-- food_vendors ---------------------------------------------------------------
create table if not exists public.food_vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  email text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.food_vendors enable row level security;

drop policy if exists "food_vendors_read_public" on public.food_vendors;
create policy "food_vendors_read_public" on public.food_vendors
  for select to anon, authenticated using (is_active or public.is_admin());

drop policy if exists "food_vendors_write_admin" on public.food_vendors;
create policy "food_vendors_write_admin" on public.food_vendors
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- food_stalls ----------------------------------------------------------------
create table if not exists public.food_stalls (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  vendor_id uuid not null references public.food_vendors(id) on delete cascade,
  name text not null,
  stall_number text,
  location_description text,
  position_x numeric(8,3) not null default 0,
  position_y numeric(8,3) not null default 0,
  position_z numeric(8,3) not null default 0,
  is_active boolean not null default true
);
alter table public.food_stalls enable row level security;

drop policy if exists "food_stalls_read_public" on public.food_stalls;
create policy "food_stalls_read_public" on public.food_stalls
  for select to anon, authenticated using (true);

drop policy if exists "food_stalls_write_admin" on public.food_stalls;
create policy "food_stalls_write_admin" on public.food_stalls
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- food_items -----------------------------------------------------------------
create table if not exists public.food_items (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.food_vendors(id) on delete cascade,
  name text not null,
  description text,
  category text not null default 'Snacks',
  image_url text,
  price numeric(10,2) not null default 0,
  is_vegetarian boolean not null default true,
  allergen_information text,
  preparation_time_minutes integer not null default 15,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.food_items enable row level security;

drop policy if exists "food_items_read_public" on public.food_items;
create policy "food_items_read_public" on public.food_items
  for select to anon, authenticated using (true);

drop policy if exists "food_items_write_admin" on public.food_items;
create policy "food_items_write_admin" on public.food_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- event_food_items ----------------------------------------------------------
create table if not exists public.event_food_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  food_item_id uuid not null references public.food_items(id) on delete cascade,
  stall_id uuid references public.food_stalls(id) on delete set null,
  event_price numeric(10,2) not null default 0,
  available_quantity integer not null default 100,
  is_available boolean not null default true
);
alter table public.event_food_items enable row level security;

drop policy if exists "event_food_items_read_public" on public.event_food_items;
create policy "event_food_items_read_public" on public.event_food_items
  for select to anon, authenticated using (true);

drop policy if exists "event_food_items_write_admin" on public.event_food_items;
create policy "event_food_items_write_admin" on public.event_food_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- food_orders ----------------------------------------------------------------
create table if not exists public.food_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  booking_id uuid references public.bookings(id) on delete set null,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  stall_id uuid references public.food_stalls(id) on delete set null,
  total_amount numeric(12,2) not null default 0,
  order_status text not null default 'pending' check (order_status in ('pending','accepted','preparing','ready','collected','cancelled')),
  pickup_time time,
  pickup_qr_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.food_orders enable row level security;

drop policy if exists "food_orders_read_self_or_admin_manager" on public.food_orders;
create policy "food_orders_read_self_or_admin_manager" on public.food_orders
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin()
         or exists(select 1 from public.event_managers em
                   where em.event_id = food_orders.event_id
                     and em.manager_id = auth.uid() and em.is_active));

drop policy if exists "food_orders_insert_self" on public.food_orders;
create policy "food_orders_insert_self" on public.food_orders
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "food_orders_update_self_or_admin_manager" on public.food_orders;
create policy "food_orders_update_self_or_admin_manager" on public.food_orders
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin()
         or exists(select 1 from public.event_managers em
                   where em.event_id = food_orders.event_id
                     and em.manager_id = auth.uid() and em.is_active))
  with check (user_id = auth.uid() or public.is_admin()
         or exists(select 1 from public.event_managers em
                   where em.event_id = food_orders.event_id
                     and em.manager_id = auth.uid() and em.is_active));

-- food_order_items ----------------------------------------------------------
create table if not exists public.food_order_items (
  id uuid primary key default gen_random_uuid(),
  food_order_id uuid not null references public.food_orders(id) on delete cascade,
  event_food_item_id uuid not null references public.event_food_items(id) on delete cascade,
  quantity integer not null default 1,
  unit_price numeric(10,2) not null default 0,
  total_price numeric(12,2) not null default 0
);
alter table public.food_order_items enable row level security;

drop policy if exists "food_order_items_read_self_or_admin_manager" on public.food_order_items;
create policy "food_order_items_read_self_or_admin_manager" on public.food_order_items
  for select to authenticated
  using (exists(select 1 from public.food_orders fo where fo.id = food_order_id
                and (fo.user_id = auth.uid() or public.is_admin()
                     or exists(select 1 from public.event_managers em
                               where em.event_id = fo.event_id
                                 and em.manager_id = auth.uid() and em.is_active))));

drop policy if exists "food_order_items_insert_self" on public.food_order_items;
create policy "food_order_items_insert_self" on public.food_order_items
  for insert to authenticated with check (
    exists(select 1 from public.food_orders fo where fo.id = food_order_id and fo.user_id = auth.uid())
  );

-- emergency_contacts ---------------------------------------------------------
create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  venue_id uuid references public.venues(id) on delete cascade,
  contact_type text not null,
  name text not null,
  phone text not null,
  description text,
  priority integer not null default 1,
  is_active boolean not null default true
);
alter table public.emergency_contacts enable row level security;

drop policy if exists "emergency_contacts_read_public" on public.emergency_contacts;
create policy "emergency_contacts_read_public" on public.emergency_contacts
  for select to anon, authenticated using (is_active or public.is_admin());

drop policy if exists "emergency_contacts_write_admin" on public.emergency_contacts;
create policy "emergency_contacts_write_admin" on public.emergency_contacts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- emergency_incidents --------------------------------------------------------
create table if not exists public.emergency_incidents (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  reported_by uuid references public.profiles(id) on delete set null,
  incident_type text not null,
  description text,
  seat_or_location text,
  severity text not null default 'low' check (severity in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','assigned','resolved','closed')),
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table public.emergency_incidents enable row level security;

drop policy if exists "emergency_incidents_read_admin_manager" on public.emergency_incidents;
create policy "emergency_incidents_read_admin_manager" on public.emergency_incidents
  for select to authenticated
  using (public.is_admin()
         or exists(select 1 from public.event_managers em
                   where em.event_id = emergency_incidents.event_id
                     and em.manager_id = auth.uid() and em.is_active));

drop policy if exists "emergency_incidents_write_admin_manager" on public.emergency_incidents;
create policy "emergency_incidents_write_admin_manager" on public.emergency_incidents
  for all to authenticated
  using (public.is_admin()
         or exists(select 1 from public.event_managers em
                   where em.event_id = emergency_incidents.event_id
                     and em.manager_id = auth.uid() and em.is_active))
  with check (public.is_admin()
         or exists(select 1 from public.event_managers em
                   where em.event_id = emergency_incidents.event_id
                     and em.manager_id = auth.uid() and em.is_active));

-- notifications --------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  notification_type text not null default 'general',
  related_entity_type text,
  related_entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;

drop policy if exists "notifications_read_self" on public.notifications;
create policy "notifications_read_self" on public.notifications
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "notifications_insert_self_or_admin" on public.notifications;
create policy "notifications_insert_self_or_admin" on public.notifications
  for insert to authenticated with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "notifications_update_self" on public.notifications;
create policy "notifications_update_self" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- reviews --------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  overall_rating integer not null default 5 check (overall_rating between 1 and 5),
  stage_view_rating integer check (stage_view_rating between 1 and 5),
  venue_rating integer check (venue_rating between 1 and 5),
  sound_rating integer check (sound_rating between 1 and 5),
  food_rating integer check (food_rating between 1 and 5),
  review_text text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;

drop policy if exists "reviews_read_public" on public.reviews;
create policy "reviews_read_public" on public.reviews
  for select to anon, authenticated using (is_approved or user_id = auth.uid());

drop policy if exists "reviews_insert_self" on public.reviews;
create policy "reviews_insert_self" on public.reviews
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "reviews_update_self_or_admin" on public.reviews;
create policy "reviews_update_self_or_admin" on public.reviews
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- support_tickets ------------------------------------------------------------
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_reference text not null unique,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  subject text not null,
  category text not null default 'general',
  description text,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.support_tickets enable row level security;

drop policy if exists "support_tickets_read_self_or_admin" on public.support_tickets;
create policy "support_tickets_read_self_or_admin" on public.support_tickets
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "support_tickets_insert_self" on public.support_tickets;
create policy "support_tickets_insert_self" on public.support_tickets
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "support_tickets_update_self_or_admin" on public.support_tickets;
create policy "support_tickets_update_self_or_admin" on public.support_tickets
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- audit_logs -----------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_read_admin" on public.audit_logs;
create policy "audit_logs_read_admin" on public.audit_logs
  for select to authenticated using (public.is_admin());

drop policy if exists "audit_logs_insert_admin" on public.audit_logs;
create policy "audit_logs_insert_admin" on public.audit_logs
  for insert to authenticated with check (public.is_admin());

-- updated_at triggers --------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

do $$
declare t text;
begin
  for t in select unnest(array['profiles','venues','artists','events','event_seats','payments','tickets','food_items','food_orders','support_tickets']) loop
    execute format('drop trigger if exists trg_touch_%I on public.%I;', t, t);
    execute format('create trigger trg_touch_%I before update on public.%I for each row execute function public.touch_updated_at();', t, t);
  end loop;
end;
$$;

-- Indexes --------------------------------------------------------------------
create index if not exists idx_events_status on public.events(status);
create index if not exists idx_events_category on public.events(category);
create index if not exists idx_events_slug on public.events(slug);
create index if not exists idx_event_seats_event on public.event_seats(event_id);
create index if not exists idx_event_seats_status on public.event_seats(status);
create index if not exists idx_seat_holds_event on public.seat_holds(event_id);
create index if not exists idx_seat_holds_user on public.seat_holds(user_id);
create index if not exists idx_bookings_user on public.bookings(user_id);
create index if not exists idx_bookings_event on public.bookings(event_id);
create index if not exists idx_bookings_status on public.bookings(booking_status);
create index if not exists idx_tickets_user on public.tickets(user_id);
create index if not exists idx_tickets_event on public.tickets(event_id);
create index if not exists idx_tickets_qr on public.tickets(qr_token);
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_venue_seats_section on public.venue_seats(section_id);
create index if not exists idx_venue_seats_row on public.venue_seats(row_id);
