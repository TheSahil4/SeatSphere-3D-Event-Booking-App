/*
# SeatSphere — seed data (event food items fix)

Fixes the event_food_items insert: the CASE expression for stall_id returned
text instead of uuid. This migration re-runs the event_food_items seed with an
explicit uuid cast. All other seed data from 0003 is preserved (idempotent).
*/

-- EVENT FOOD ITEMS for Neon Pulse Live 2026 (uuid cast fix) -----------------
insert into public.event_food_items (event_id, food_item_id, stall_id, event_price, available_quantity, is_available)
select 'e0000000-0000-0000-0000-000000000001', id,
  (case when vendor_id = 'f0000000-0000-0000-0000-000000000001' then 'f1000000-0000-0000-0000-000000000001'
       else 'f1000000-0000-0000-0000-000000000002' end)::uuid,
  price, 200, true
from public.food_items
on conflict do nothing;
