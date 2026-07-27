/*
# SeatSphere — seed data (emergency contacts uuid fix)

Re-runs the full seed with valid UUIDs for emergency_contacts. Idempotent.
*/

-- VENUES ----------------------------------------------------------------------
insert into public.venues (id, name, slug, description, venue_type, address, city, state, country, total_capacity, parking_capacity, venue_image_url, is_active)
values
  ('11111111-1111-1111-1111-111111111111', 'Astra Arena', 'astra-arena', 'Astra Arena is Pune''s premier indoor concert and esports venue, featuring a 360-degree stage view, immersive lighting and tiered seating across eight sections.', 'arena', 'Plot 12, MG Road, Baner', 'Pune', 'Maharashtra', 'India', 4200, 800, 'https://images.pexels.com/photos/2027638/pexels-photo-2027638.jpeg', true),
  ('22222222-2222-2222-2222-222222222222', 'Lumiere Theatre', 'lumiere-theatre', 'An intimate proscenium theatre in the heart of Mumbai hosting plays, stand-up and classical performances.', 'theatre', '14 Marine Drive', 'Mumbai', 'Maharashtra', 'India', 1200, 200, 'https://images.pexels.com/photos/269322/pexels-photo-269322.png', true),
  ('33333333-3333-3333-3333-333333333333', 'Velocity Sports Park', 'velocity-sports-park', 'A world-class open-air sports stadium in Bengaluru designed for cricket, football and esports finals.', 'stadium', 'Outer Ring Road, Whitefield', 'Bengaluru', 'Karnataka', 'India', 8000, 1500, 'https://images.pexels.com/photos/209977/pexels-photo-209977.png', true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, venue_image_url = excluded.venue_image_url, total_capacity = excluded.total_capacity;

-- VENUE LEVELS ---------------------------------------------------------------
insert into public.venue_levels (id, venue_id, name, level_number, display_order) values
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Ground Floor', 1, 1),
  ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Balcony', 2, 2)
on conflict do nothing;

-- VENUE SECTIONS (Astra Arena) ----------------------------------------------
insert into public.venue_sections (id, venue_id, level_id, name, code, section_type, capacity, base_price_multiplier, colour_code, position_x, position_y, position_z, rotation_x, rotation_y, rotation_z, visibility_score, is_active) values
  ('b1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'VIP Front', 'VIP', 'vip', 40, 3.50, '#f59e0b', 0, 0, 6, 0, 0, 0, 98, true),
  ('b1111111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Premium Left', 'PL', 'premium', 30, 2.00, '#8b5cf6', -8, 0, 5, 0, 0.4, 0, 90, true),
  ('b1111111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Premium Right', 'PR', 'premium', 30, 2.00, '#8b5cf6', 8, 0, 5, 0, -0.4, 0, 90, true),
  ('b1111111-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Gold Centre', 'GC', 'gold', 40, 1.30, '#06b6d4', 0, 0, 11, 0, 0, 0, 85, true),
  ('b1111111-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Silver Left', 'SL', 'silver', 30, 0.80, '#10b981', -10, 0, 14, 0, 0.5, 0, 70, true),
  ('b1111111-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Silver Right', 'SR', 'silver', 30, 0.80, '#10b981', 10, 0, 14, 0, -0.5, 0, 70, true),
  ('b1111111-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'Balcony', 'BAL', 'balcony', 30, 1.00, '#ec4899', 0, 6, 16, -0.3, 0, 0, 75, true),
  ('b1111111-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Accessible Zone', 'AZ', 'accessible', 10, 0.80, '#ef4444', 0, 0, 18, 0, 0, 0, 65, true)
on conflict do nothing;

-- VENUE ROWS + SEATS generation ---------------------------------------------
do $$
declare
  sec record;
  row_count int;
  seats_per_row int;
  r int;
  s int;
  row_id uuid;
  letter char;
  base_x numeric;
  base_z numeric;
  seat_label text;
  is_acc boolean;
  is_lim boolean;
begin
  for sec in select * from public.venue_sections where venue_id = '11111111-1111-1111-1111-111111111111' loop
    case sec.code
      when 'VIP' then row_count := 2; seats_per_row := 20;
      when 'PL' then row_count := 3; seats_per_row := 10;
      when 'PR' then row_count := 3; seats_per_row := 10;
      when 'GC' then row_count := 4; seats_per_row := 10;
      when 'SL' then row_count := 3; seats_per_row := 10;
      when 'SR' then row_count := 3; seats_per_row := 10;
      when 'BAL' then row_count := 3; seats_per_row := 10;
      when 'AZ' then row_count := 1; seats_per_row := 10;
      else row_count := 2; seats_per_row := 10;
    end case;

    for r in 1..row_count loop
      letter := chr(64 + r);
      insert into public.venue_rows (id, section_id, name, row_number, display_order)
      values (gen_random_uuid(), sec.id, letter::text, r, r)
      returning id into row_id;

      base_x := sec.position_x;
      base_z := sec.position_z + (r - 1) * 1.2;

      for s in 1..seats_per_row loop
        seat_label := letter || s;
        is_acc := (sec.code = 'AZ');
        is_lim := (sec.code = 'SL' and r = 3) or (sec.code = 'SR' and r = 3);

        insert into public.venue_seats (id, venue_id, section_id, row_id, seat_number, label, seat_type,
          position_x, position_y, position_z, default_visibility_score, is_accessible, has_limited_view, is_active)
        values (
          gen_random_uuid(), '11111111-1111-1111-1111-111111111111', sec.id, row_id, s, seat_label,
          case when is_acc then 'accessible' when is_lim then 'limited_view' else 'standard' end,
          base_x + (s - (seats_per_row/2.0)) * 0.8, 0, base_z,
          sec.visibility_score, is_acc, is_lim, true
        )
        on conflict do nothing;
      end loop;
    end loop;
  end loop;
end;
$$;

-- VENUE FACILITIES ----------------------------------------------------------
insert into public.venue_facilities (id, venue_id, name, facility_type, description, position_x, position_y, position_z, contact_number, is_emergency, is_active) values
  ('c0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Main Entry Gate A', 'entry_gate', 'North main entrance', -14, 0, -2, null, false, true),
  ('c0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Entry Gate B', 'entry_gate', 'South entrance', 14, 0, -2, null, false, true),
  ('c0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Emergency Exit E1', 'emergency_exit', 'West emergency exit', -16, 0, 8, null, true, true),
  ('c0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Emergency Exit E2', 'emergency_exit', 'East emergency exit', 16, 0, 8, null, true, true),
  ('c0000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Medical Room', 'medical_room', 'Ground floor medical bay', 0, 0, -4, '555-0100', true, true),
  ('c0000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'Security Point S1', 'security_point', 'Main security desk', -12, 0, -3, '555-0101', true, true),
  ('c0000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'Washroom W1', 'washroom', 'Ground floor washroom', -10, 0, -3, null, false, true),
  ('c0000000-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'Accessible Washroom', 'accessible_washroom', 'Accessible washroom near Gate A', -13, 0, -3, null, false, true),
  ('c0000000-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'Food Stall F1', 'food_stall', 'Snacks & beverages', 12, 0, -3, null, false, true),
  ('c0000000-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'Fire Extinguisher FE1', 'fire_extinguisher', 'Near stage left', -6, 0, 2, null, true, true),
  ('c0000000-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'Assembly Point AP1', 'assembly_point', 'North parking lot', -20, 0, -8, null, true, true),
  ('c0000000-0000-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', 'Parking P1', 'parking', 'Main parking', -22, 0, -10, null, false, true)
on conflict do nothing;

-- ARTISTS -------------------------------------------------------------------
insert into public.artists (id, name, slug, biography, category, profile_image_url, cover_image_url, contact_email, contact_phone, is_active) values
  ('d0000000-0000-0000-0000-000000000001', 'Neon Pulse', 'neon-pulse', 'Neon Pulse is an electronic music duo known for immersive light shows and synth-driven anthems.', 'Concerts', 'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg', 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg', 'demo@neonpulse.example', '555-0200', true),
  ('d0000000-0000-0000-0000-000000000002', 'Aria Vance', 'aria-vance', 'Aria Vance is a soulful vocalist blending jazz and contemporary pop.', 'Concerts', 'https://images.pexels.com/photos/3062579/pexels-photo-3062579.jpeg', 'https://images.pexels.com/photos/1644888/pexels-photo-1644888.png', 'demo@ariavance.example', '555-0201', true),
  ('d0000000-0000-0000-0000-000000000003', 'The Lumiere Players', 'lumiere-players', 'A repertory theatre company specialising in modern adaptations of the classics.', 'Theatre', 'https://images.pexels.com/photos/2167673/pexels-photo-2167673.jpeg', 'https://images.pexels.com/photos/269322/pexels-photo-269322.png', 'demo@lumiereplayers.example', '555-0202', true),
  ('d0000000-0000-0000-0000-000000000004', 'Rajesh Kumar', 'rajesh-kumar', 'Stand-up comedian whose observational humour has sold out arenas across India.', 'Stand-up Comedy', null, null, 'demo@rajeshkumar.example', '555-0203', true),
  ('d0000000-0000-0000-0000-000000000005', 'Velocity Esports', 'velocity-esports', 'A top-tier esports organisation competing in international FPS and MOBA leagues.', 'Esports', 'https://images.pexels.com/photos/7973868/pexels-photo-7973868.jpeg', 'https://images.pexels.com/photos/2115256/pexels-photo-2115256.jpeg', 'demo@velocityesports.example', '555-0204', true),
  ('d0000000-0000-0000-0000-000000000006', 'Saanvi Iyer', 'saanvi-iyer', 'Classical violinist and composer bridging Indian ragas with orchestral arrangements.', 'Concerts', 'https://images.pexels.com/photos/5192250/pexels-photo-5192250.jpeg', 'https://images.pexels.com/photos/164743/pexels-photo-164743.jpg', 'demo@saanviiyer.example', '555-0205', true),
  ('d0000000-0000-0000-0000-000000000007', 'The Midnight Set', 'midnight-set', 'Indie rock four-piece from Delhi with a reputation for electric live shows.', 'Concerts', 'https://images.pexels.com/photos/995301/pexels-photo-995301.jpeg', 'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg', 'demo@midnightset.example', '555-0206', true),
  ('d0000000-0000-0000-0000-000000000008', 'Dr. Meera Rao', 'meera-rao', 'Keynote speaker on technology ethics and the future of AI.', 'Conferences', 'https://images.pexels.com/photos/3760262/pexels-photo-3760262.jpeg', 'https://images.pexels.com/photos/1181271/pexels-photo-1181271.jpeg', 'demo@meerarao.example', '555-0207', true),
  ('d0000000-0000-0000-0000-000000000009', 'Carnival Collective', 'carnival-collective', 'A 20-piece brass and percussion ensemble bringing street-carnival energy to festivals.', 'Festivals', 'https://images.pexels.com/photos/167005/pexels-photo-167005.jpeg', 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg', 'demo@carnivalcollective.example', '555-0208', true),
  ('d0000000-0000-0000-0000-000000000010', 'Bengaluru Strikers', 'bengaluru-strikers', 'Professional football club competing in the national league.', 'Sports', 'https://images.pexels.com/photos/2744358/pexels-photo-2744358.jpeg', 'https://images.pexels.com/photos/209977/pexels-photo-209977.png', 'demo@strikers.example', '555-0209', true)
on conflict (slug) do update set name = excluded.name, biography = excluded.biography, profile_image_url = excluded.profile_image_url, cover_image_url = excluded.cover_image_url;

-- EVENTS --------------------------------------------------------------------
insert into public.events (id, title, slug, description, short_description, category, venue_id, banner_url, thumbnail_url, language, age_restriction, duration_minutes, event_date, start_time, end_time, gate_open_time, booking_open_at, booking_close_at, capacity_limit, minimum_ticket_price, maximum_ticket_price, status, cancellation_policy, refund_policy, terms_and_conditions, is_featured, is_published, created_by) values
  ('e0000000-0000-0000-0000-000000000001', 'Neon Pulse Live 2026', 'neon-pulse-live-2026',
   'Neon Pulse returns to Astra Arena with their biggest show yet — a 180-minute audio-visual journey featuring new material, surprise guests and a state-of-the-art laser rig. Doors open at 6 PM. Show starts at 7 PM.',
   'The biggest electronic show of 2026 — immersive lights, sound and surprise guests at Astra Arena, Pune.',
   'Concerts', '11111111-1111-1111-1111-111111111111',
   'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg',
   'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
   'English', 'All ages (under 14 with guardian)', 180,
   '2026-09-19', '19:00', '22:00', '18:00',
   now(), '2026-09-19 18:00:00+05:30', 4200, 799, 3499, 'booking_open',
   'Tickets can be cancelled up to 48 hours before the event for a 75% refund. Within 48 hours, no refund is available.',
   'Refunds are processed to the original payment method within 7-10 business days for eligible cancellations.',
   'Tickets are non-transferable. Re-entry is not permitted. The venue reserves the right to refuse entry. Demo event.',
   true, true, null),
  ('e0000000-0000-0000-0000-000000000002', 'Aria Vance — Soul Sessions', 'aria-vance-soul-sessions',
   'An intimate evening with Aria Vance performing tracks from her new album backed by a live band.',
   'An intimate live set with Aria Vance at Lumiere Theatre, Mumbai.',
   'Concerts', '22222222-2222-2222-2222-222222222222',
   'https://images.pexels.com/photos/3062579/pexels-photo-3062579.jpeg',
   'https://images.pexels.com/photos/3062579/pexels-photo-3062579.jpeg',
   'English', '16+', 90, '2026-08-12', '20:00', '21:30', '19:00',
   now(), '2026-08-12 19:00:00+05:30', 1200, 999, 2499, 'booking_open',
   'Cancellations up to 24 hours before the event: 50% refund.', 'Refunds within 7 business days.', 'Demo event.', false, true, null),
  ('e0000000-0000-0000-0000-000000000003', 'Hamlet Reimagined', 'hamlet-reimagined',
   'The Lumiere Players present a bold modern-dress production of Shakespeare''s Hamlet.',
   'A modern-dress Hamlet by The Lumiere Players at Lumiere Theatre.',
   'Theatre', '22222222-2222-2222-2222-222222222222',
   'https://images.pexels.com/photos/2167673/pexels-photo-2167673.jpeg',
   'https://images.pexels.com/photos/2167673/pexels-photo-2167673.jpeg',
   'English', '12+', 150, '2026-10-05', '19:30', '22:00', '18:30',
   now(), '2026-10-05 18:30:00+05:30', 1200, 599, 1499, 'booking_open',
   'No refund within 24 hours of showtime.', 'Refunds within 7 business days.', 'Demo event.', false, true, null),
  ('e0000000-0000-0000-0000-000000000004', 'Rajesh Kumar — Unfiltered', 'rajesh-kumar-unfiltered',
   'India''s favourite observational comedian brings his new hour to Pune.',
   'Stand-up comedy with Rajesh Kumar at Astra Arena.',
   'Stand-up Comedy', '11111111-1111-1111-1111-111111111111',
   'https://images.pexels.com/photos/3760262/pexels-photo-3760262.jpeg',
   'https://images.pexels.com/photos/3760262/pexels-photo-3760262.jpeg',
   'Hindi', '18+', 100, '2026-11-08', '20:00', '21:40', '19:00',
   now(), '2026-11-08 19:00:00+05:30', 4200, 699, 1799, 'booking_open',
   'Cancellations up to 48 hours: 75% refund.', 'Refunds within 7 business days.', 'Demo event.', false, true, null),
  ('e0000000-0000-0000-0000-000000000005', 'Velocity Esports Championship', 'velocity-esports-championship',
   'The grand finals of the Velocity Esports Championship with the top four teams battling for the trophy.',
   'Esports grand finals at Astra Arena.',
   'Esports', '11111111-1111-1111-1111-111111111111',
   'https://images.pexels.com/photos/7973868/pexels-photo-7973868.jpeg',
   'https://images.pexels.com/photos/2115256/pexels-photo-2115256.jpeg',
   'English', 'All ages', 240, '2026-12-12', '16:00', '20:00', '15:00',
   now(), '2026-12-12 15:00:00+05:30', 4200, 499, 1999, 'booking_open',
   'No refund on the day of the event.', 'Refunds within 7 business days.', 'Demo event.', true, true, null),
  ('e0000000-0000-0000-0000-000000000006', 'Saanvi Iyer — Ragas & Strings', 'saanvi-iyer-ragas-strings',
   'A classical-meets-orchestral performance by violinist Saanvi Iyer.',
   'Saanvi Iyer performs at Lumiere Theatre, Mumbai.',
   'Concerts', '22222222-2222-2222-2222-222222222222',
   'https://images.pexels.com/photos/5192250/pexels-photo-5192250.jpeg',
   'https://images.pexels.com/photos/5192250/pexels-photo-5192250.jpeg',
   'Instrumental', 'All ages', 120, '2026-09-02', '19:00', '21:00', '18:00',
   now(), '2026-09-02 18:00:00+05:30', 1200, 799, 1999, 'booking_open',
   'Cancellations up to 48 hours: 75% refund.', 'Refunds within 7 business days.', 'Demo event.', false, true, null),
  ('e0000000-0000-0000-0000-000000000007', 'The Midnight Set — Delhi Tour', 'midnight-set-delhi-tour',
   'Indie rock favourites The Midnight Set on their Delhi tour stop.',
   'The Midnight Set live at Astra Arena.',
   'Concerts', '11111111-1111-1111-1111-111111111111',
   'https://images.pexels.com/photos/995301/pexels-photo-995301.jpeg',
   'https://images.pexels.com/photos/995301/pexels-photo-995301.jpeg',
   'English', '16+', 100, '2026-07-30', '20:00', '21:40', '19:00',
   now(), '2026-07-30 19:00:00+05:30', 4200, 699, 1799, 'booking_open',
   'Cancellations up to 48 hours: 75% refund.', 'Refunds within 7 business days.', 'Demo event.', false, true, null),
  ('e0000000-0000-0000-0000-000000000008', 'Future of AI Summit', 'future-of-ai-summit',
   'A one-day conference on the future of AI with keynotes, panels and networking.',
   'Future of AI Summit at Velocity Sports Park, Bengaluru.',
   'Conferences', '33333333-3333-3333-3333-333333333333',
   'https://images.pexels.com/photos/1181271/pexels-photo-1181271.jpeg',
   'https://images.pexels.com/photos/1181271/pexels-photo-1181271.jpeg',
   'English', 'All ages', 480, '2026-10-20', '09:00', '17:00', '08:30',
   now(), '2026-10-20 08:30:00+05:30', 8000, 1499, 4999, 'booking_open',
   'Cancellations up to 7 days: 50% refund.', 'Refunds within 14 business days.', 'Demo event.', false, true, null)
on conflict (slug) do update set
  title = excluded.title, description = excluded.description, short_description = excluded.short_description,
  banner_url = excluded.banner_url, thumbnail_url = excluded.thumbnail_url,
  event_date = excluded.event_date, start_time = excluded.start_time, end_time = excluded.end_time,
  minimum_ticket_price = excluded.minimum_ticket_price, maximum_ticket_price = excluded.maximum_ticket_price,
  status = excluded.status, is_featured = excluded.is_featured, is_published = excluded.is_published;

-- EVENT ARTISTS -------------------------------------------------------------
insert into public.event_artists (event_id, artist_id, performance_order, reporting_time, rehearsal_time, performance_start_time, performance_end_time) values
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 1, '16:00', '17:00', '19:00', '22:00'),
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 2, '17:00', null, '19:30', '20:00'),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 1, '18:00', null, '20:00', '21:30'),
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 1, '17:00', '18:00', '19:30', '22:00'),
  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 1, '18:00', null, '20:00', '21:40'),
  ('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005', 1, '14:00', '15:00', '16:00', '20:00'),
  ('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000006', 1, '17:00', null, '19:00', '21:00'),
  ('e0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000007', 1, '18:00', null, '20:00', '21:40'),
  ('e0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000008', 1, '08:00', null, '09:00', '17:00')
on conflict (event_id, artist_id) do nothing;

-- EVENT SEATS for Neon Pulse Live 2026 --------------------------------------
do $$
declare
  r record;
  v_price numeric;
  v_cat text;
begin
  for r in
    select vs.id as venue_seat_id, vs.section_id
    from public.venue_seats vs
    join public.venue_sections s on s.id = vs.section_id
    where vs.venue_id = '11111111-1111-1111-1111-111111111111'
  loop
    v_cat := case
      when r.section_id = 'b1111111-0000-0000-0000-000000000001' then 'VIP'
      when r.section_id in ('b1111111-0000-0000-0000-000000000002','b1111111-0000-0000-0000-000000000003') then 'Premium'
      when r.section_id = 'b1111111-0000-0000-0000-000000000004' then 'Gold'
      when r.section_id in ('b1111111-0000-0000-0000-000000000005','b1111111-0000-0000-0000-000000000006') then 'Silver'
      when r.section_id = 'b1111111-0000-0000-0000-000000000007' then 'Balcony'
      when r.section_id = 'b1111111-0000-0000-0000-000000000008' then 'Accessible'
      else 'Standard'
    end;

    v_price := case v_cat
      when 'VIP' then 3499
      when 'Premium' then 1999
      when 'Gold' then 1299
      when 'Silver' then 799
      when 'Balcony' then 999
      when 'Accessible' then 799
      else 999
    end;

    insert into public.event_seats (event_id, venue_seat_id, category_name, price, status, visibility_score)
    values ('e0000000-0000-0000-0000-000000000001', r.venue_seat_id, v_cat, v_price, 'available', 80)
    on conflict (event_id, venue_seat_id) do nothing;
  end loop;
end;
$$;

-- FOOD VENDORS --------------------------------------------------------------
insert into public.food_vendors (id, name, contact_name, email, phone, is_active) values
  ('f0000000-0000-0000-0000-000000000001', 'Arena Eats', 'Priya Sharma', 'demo@arenaeats.example', '555-0300', true),
  ('f0000000-0000-0000-0000-000000000002', 'Brew & Bites', 'Arjun Mehta', 'demo@brewbites.example', '555-0301', true)
on conflict (id) do update set name = excluded.name, contact_name = excluded.contact_name;

-- FOOD STALLS --------------------------------------------------------------
insert into public.food_stalls (id, venue_id, vendor_id, name, stall_number, location_description, position_x, position_y, position_z, is_active) values
  ('f1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'f0000000-0000-0000-0000-000000000001', 'Arena Eats Main', 'F1', 'Near Gate A', 12, 0, -3, true),
  ('f1000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'f0000000-0000-0000-0000-000000000002', 'Brew & Bites', 'F2', 'Near Gate B', -12, 0, -3, true)
on conflict (id) do update set name = excluded.name;

-- FOOD ITEMS ---------------------------------------------------------------
insert into public.food_items (id, vendor_id, name, description, category, image_url, price, is_vegetarian, allergen_information, preparation_time_minutes, is_available) values
  ('f2000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Classic Cheese Burger', 'Juicy patty with cheddar, lettuce and house sauce.', 'Main Course', 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg', 349, false, 'Gluten, Dairy', 12, true),
  ('f2000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 'Loaded Nachos', 'Tortilla chips with cheese, jalapenos and salsa.', 'Snacks', 'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg', 249, true, 'Dairy', 8, true),
  ('f2000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001', 'Margherita Pizza Slice', 'Wood-fired slice with basil and mozzarella.', 'Main Course', 'https://images.pexels.com/photos/70858/pexels-photo-70858.jpeg', 199, true, 'Gluten, Dairy', 10, true),
  ('f2000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000001', 'French Fries', 'Crispy salted fries with ketchup.', 'Snacks', 'https://images.pexels.com/photos/115740/pexels-photo-115740.jpeg', 149, true, 'None', 6, true),
  ('f2000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000001', 'Veg Spring Rolls', 'Crispy rolls with vegetable filling.', 'Snacks', 'https://images.pexels.com/photos/5409010/pexels-photo-5409010.jpeg', 179, true, 'Soy, Gluten', 8, true),
  ('f2000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000002', 'Cappuccino', 'Double shot with steamed milk and foam.', 'Beverages', 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg', 179, true, 'Dairy', 5, true),
  ('f2000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000002', 'Iced Latte', 'Chilled coffee with milk over ice.', 'Beverages', 'https://images.pexels.com/photos/3034337/pexels-photo-3034337.jpeg', 199, true, 'Dairy', 5, true),
  ('f2000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000002', 'Chocolate Brownie', 'Warm fudge brownie with a scoop of vanilla.', 'Desserts', 'https://images.pexels.com/photos/45202/brownie-cake-dessert-sweet-45202.jpeg', 229, true, 'Dairy, Gluten, Eggs', 7, true),
  ('f2000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000002', 'Cold Pressed Juice', 'Seasonal fruit cold-pressed juice.', 'Beverages', 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg', 159, true, 'None', 3, true),
  ('f2000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000001', 'Chicken Wings', '8-piece spicy glazed wings with dip.', 'Main Course', 'https://images.pexels.com/photos/60616/pexels-photo-60616.jpeg', 299, false, 'None', 12, true),
  ('f2000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000001', 'Veggie Wrap', 'Grilled veggies and hummus in a wheat wrap.', 'Main Course', 'https://images.pexels.com/photos/2664216/pexels-photo-2664216.jpeg', 219, true, 'Gluten', 8, true),
  ('f2000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000002', 'Masala Chai', 'Spiced Indian tea with milk.', 'Beverages', 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg', 99, true, 'Dairy', 4, true)
on conflict (id) do update set name = excluded.name, price = excluded.price, image_url = excluded.image_url;

-- EVENT FOOD ITEMS for Neon Pulse Live 2026 (uuid cast fix) -----------------
insert into public.event_food_items (event_id, food_item_id, stall_id, event_price, available_quantity, is_available)
select 'e0000000-0000-0000-0000-000000000001', id,
  (case when vendor_id = 'f0000000-0000-0000-0000-000000000001' then 'f1000000-0000-0000-0000-000000000001'
       else 'f1000000-0000-0000-0000-000000000002' end)::uuid,
  price, 200, true
from public.food_items
on conflict do nothing;

-- EMERGENCY CONTACTS (valid UUIDs) ------------------------------------------
insert into public.emergency_contacts (id, event_id, venue_id, contact_type, name, phone, description, priority, is_active) values
  ('aaaaaa00-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Event Manager', 'Demo Manager', '555-0101', 'On-site event manager (demo number)', 1, true),
  ('aaaaaa00-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Venue Security', 'Astra Security Desk', '555-0102', 'Venue security control room (demo number)', 2, true),
  ('aaaaaa00-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Medical Team', 'Medical Room', '555-0100', 'On-site medical team (demo number)', 1, true),
  ('aaaaaa00-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Ambulance', 'Demo Ambulance', '555-0103', 'Ambulance on standby (demo number)', 1, true),
  ('aaaaaa00-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Fire Emergency', 'Fire Warden', '555-0104', 'Fire warden (demo number)', 1, true),
  ('aaaaaa00-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Police', 'Demo Police', '555-0105', 'Local police liaison (demo number)', 2, true),
  ('aaaaaa00-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Women''s Safety Desk', 'Demo Safety Desk', '555-0106', 'Women''s safety desk (demo number)', 2, true),
  ('aaaaaa00-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Lost and Found', 'Demo Lost & Found', '555-0107', 'Lost and found desk (demo number)', 3, true)
on conflict do nothing;

-- DEMO ACCOUNT PROFILES + ASSIGNMENTS --------------------------------------
do $$
declare
  v_admin uuid;
  v_manager uuid;
  v_staff uuid;
  v_customer uuid;
begin
  select id into v_admin from auth.users where email = 'admin@seatsphere.demo';
  select id into v_manager from auth.users where email = 'manager@seatsphere.demo';
  select id into v_staff from auth.users where email = 'staff@seatsphere.demo';
  select id into v_customer from auth.users where email = 'customer@seatsphere.demo';

  if v_admin is not null then
    insert into public.profiles (id, full_name, email, role, phone, city, is_active, force_password_change)
    values (v_admin, 'Demo Admin', 'admin@seatsphere.demo', 'admin', '555-0400', 'Pune', true, false)
    on conflict (id) do update set role = 'admin', full_name = 'Demo Admin', is_active = true;
  end if;

  if v_manager is not null then
    insert into public.profiles (id, full_name, email, role, phone, city, is_active, force_password_change)
    values (v_manager, 'Demo Manager', 'manager@seatsphere.demo', 'manager', '555-0401', 'Pune', true, false)
    on conflict (id) do update set role = 'manager', full_name = 'Demo Manager', is_active = true;

    insert into public.event_managers (event_id, manager_id, assigned_by, is_primary_manager, is_active)
    values ('e0000000-0000-0000-0000-000000000001', v_manager, v_admin, true, true)
    on conflict (event_id, manager_id) do nothing;
  end if;

  if v_staff is not null then
    insert into public.profiles (id, full_name, email, role, phone, city, is_active, force_password_change)
    values (v_staff, 'Demo Gate Staff', 'staff@seatsphere.demo', 'gate_staff', '555-0402', 'Pune', true, false)
    on conflict (id) do update set role = 'gate_staff', full_name = 'Demo Gate Staff', is_active = true;
  end if;

  if v_customer is not null then
    insert into public.profiles (id, full_name, email, role, phone, city, is_active, force_password_change)
    values (v_customer, 'Demo Customer', 'customer@seatsphere.demo', 'customer', '555-0403', 'Pune', true, false)
    on conflict (id) do update set role = 'customer', full_name = 'Demo Customer', is_active = true;
  end if;
end;
$$;

-- DEMO BOOKING + TICKETS for the demo customer (if exists) ------------------
do $$
declare
  v_customer uuid;
  v_booking_id uuid;
  v_seat_id uuid;
  v_bs_id uuid;
  v_es_id uuid;
begin
  select id into v_customer from auth.users where email = 'customer@seatsphere.demo';
  if v_customer is null then return; end if;

  select es.id into v_es_id from public.event_seats es
  join public.venue_seats vs on vs.id = es.venue_seat_id
  join public.venue_sections s on s.id = vs.section_id
  where es.event_id = 'e0000000-0000-0000-0000-000000000001'
    and es.status = 'available' and s.code = 'GC'
  order by vs.label limit 1;

  if v_es_id is null then return; end if;

  insert into public.bookings (booking_reference, user_id, event_id, subtotal, tax_amount, convenience_fee, total_amount, booking_status, payment_status, payment_mode)
  values ('SS-DEMO001', v_customer, 'e0000000-0000-0000-0000-000000000001', 1299, 64.95, 25.98, 1389.93, 'confirmed', 'paid', 'demo')
  on conflict (booking_reference) do nothing
  returning id into v_booking_id;

  if v_booking_id is null then
    select id into v_booking_id from public.bookings where booking_reference = 'SS-DEMO001';
  end if;

  if v_booking_id is not null then
    insert into public.booking_seats (booking_id, event_seat_id, seat_price, attendee_name, attendee_email, attendee_phone)
    values (v_booking_id, v_es_id, 1299, 'Demo Customer', 'customer@seatsphere.demo', '555-0403')
    on conflict do nothing
    returning id into v_bs_id;

    if v_bs_id is null then
      select id into v_bs_id from public.booking_seats where booking_id = v_booking_id and event_seat_id = v_es_id;
    end if;

    if v_bs_id is not null then
      insert into public.tickets (ticket_number, booking_id, booking_seat_id, user_id, event_id, qr_token, ticket_status)
      values ('TKT-DEMO00001', v_booking_id, v_bs_id, v_customer, 'e0000000-0000-0000-0000-000000000001',
        'demo-qr-token-0000000000000000000000000000000000000000000001', 'active')
      on conflict (ticket_number) do nothing;
    end if;

    update public.event_seats set status = 'booked' where id = v_es_id;
  end if;
end;
$$;

-- DEMO REVIEW --------------------------------------------------------------
insert into public.reviews (id, user_id, event_id, overall_rating, stage_view_rating, venue_rating, sound_rating, food_rating, review_text, is_approved)
select 'bbbbbb00-0000-0000-0000-000000000001', p.id, 'e0000000-0000-0000-0000-000000000001',
  5, 5, 4, 5, 4, 'Absolutely mind-blowing show. The lighting rig was next level and the Gold Centre section had a perfect view of the stage.', true
from public.profiles p where p.email = 'customer@seatsphere.demo'
on conflict (id) do nothing;
