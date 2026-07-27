export type Role = 'customer' | 'admin' | 'manager' | 'gate_staff';

export type EventStatus =
  | 'draft'
  | 'published'
  | 'booking_open'
  | 'sold_out'
  | 'ongoing'
  | 'completed'
  | 'cancelled'
  | 'postponed';

export type SeatStatus = 'available' | 'held' | 'booked' | 'reserved' | 'blocked' | 'unavailable';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired' | 'partially_refunded' | 'refunded';
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
export type TicketStatus = 'active' | 'used' | 'cancelled' | 'transferred' | 'refunded';
export type FoodOrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'collected' | 'cancelled';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: Role;
  city: string | null;
  date_of_birth: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  accessibility_preferences: string | null;
  is_active: boolean;
  force_password_change: boolean;
  created_at: string;
  updated_at: string;
}

export interface Venue {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  venue_type: string;
  address: string | null;
  city: string;
  state: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  total_capacity: number;
  parking_capacity: number;
  venue_image_url: string | null;
  venue_map_url: string | null;
  model_3d_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VenueLevel {
  id: string;
  venue_id: string;
  name: string;
  level_number: number;
  display_order: number;
}

export interface VenueSection {
  id: string;
  venue_id: string;
  level_id: string | null;
  name: string;
  code: string;
  section_type: string;
  capacity: number;
  base_price_multiplier: number;
  colour_code: string;
  position_x: number;
  position_y: number;
  position_z: number;
  rotation_x: number;
  rotation_y: number;
  rotation_z: number;
  visibility_score: number;
  is_active: boolean;
}

export interface VenueRow {
  id: string;
  section_id: string;
  name: string;
  row_number: number;
  display_order: number;
}

export interface VenueSeat {
  id: string;
  venue_id: string;
  section_id: string;
  row_id: string;
  seat_number: number;
  label: string;
  seat_type: string;
  position_x: number;
  position_y: number;
  position_z: number;
  rotation_x: number;
  rotation_y: number;
  rotation_z: number;
  default_visibility_score: number;
  is_accessible: boolean;
  has_limited_view: boolean;
  is_active: boolean;
}

export interface VenueFacility {
  id: string;
  venue_id: string;
  name: string;
  facility_type: string;
  description: string | null;
  level_id: string | null;
  position_x: number;
  position_y: number;
  position_z: number;
  contact_number: string | null;
  is_emergency: boolean;
  is_active: boolean;
}

export interface Artist {
  id: string;
  name: string;
  slug: string;
  biography: string | null;
  category: string | null;
  profile_image_url: string | null;
  cover_image_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category: string;
  venue_id: string | null;
  banner_url: string | null;
  thumbnail_url: string | null;
  promotional_video_url: string | null;
  language: string;
  age_restriction: string | null;
  duration_minutes: number | null;
  event_date: string;
  start_time: string;
  end_time: string | null;
  gate_open_time: string | null;
  booking_open_at: string | null;
  booking_close_at: string | null;
  capacity_limit: number;
  minimum_ticket_price: number;
  maximum_ticket_price: number;
  status: EventStatus;
  cancellation_policy: string | null;
  refund_policy: string | null;
  terms_and_conditions: string | null;
  is_featured: boolean;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventArtist {
  id: string;
  event_id: string;
  artist_id: string;
  performance_order: number;
  reporting_time: string | null;
  rehearsal_time: string | null;
  performance_start_time: string | null;
  performance_end_time: string | null;
  artist?: Artist;
}

export interface EventManager {
  id: string;
  event_id: string;
  manager_id: string;
  assigned_by: string | null;
  assigned_at: string;
  access_start_at: string | null;
  access_end_at: string | null;
  is_primary_manager: boolean;
  is_active: boolean;
}

export interface EventSeat {
  id: string;
  event_id: string;
  venue_seat_id: string;
  category_name: string;
  price: number;
  status: SeatStatus;
  visibility_score: number;
  stage_view_image_url: string | null;
  stage_view_camera_x: number | null;
  stage_view_camera_y: number | null;
  stage_view_camera_z: number | null;
  reserved_reason: string | null;
  updated_at: string;
}

export interface SeatHold {
  id: string;
  event_id: string;
  event_seat_id: string;
  user_id: string;
  session_id: string | null;
  held_at: string;
  expires_at: string;
  status: 'active' | 'expired' | 'converted' | 'released';
}

export interface Booking {
  id: string;
  booking_reference: string;
  user_id: string;
  event_id: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  convenience_fee: number;
  food_total: number;
  total_amount: number;
  currency: string;
  booking_status: BookingStatus;
  payment_status: PaymentStatus;
  payment_mode: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingSeat {
  id: string;
  booking_id: string;
  event_seat_id: string;
  seat_price: number;
  attendee_name: string;
  attendee_email: string | null;
  attendee_phone: string | null;
}

export interface Payment {
  id: string;
  booking_id: string;
  provider: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  provider_signature: string | null;
  amount: number;
  currency: string;
  payment_status: PaymentStatus;
  is_demo: boolean;
  error_code: string | null;
  error_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  booking_id: string;
  booking_seat_id: string;
  user_id: string;
  event_id: string;
  qr_token: string;
  qr_code_url: string | null;
  ticket_status: TicketStatus;
  checked_in_at: string | null;
  checked_in_by: string | null;
  created_at: string;
}

export interface TicketScan {
  id: string;
  ticket_id: string;
  scanned_by: string | null;
  scanned_at: string;
  scan_result: 'valid' | 'already_used' | 'cancelled' | 'invalid' | 'refunded';
  gate_name: string | null;
  device_information: string | null;
}

export interface FoodVendor {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FoodStall {
  id: string;
  venue_id: string;
  vendor_id: string;
  name: string;
  stall_number: string | null;
  location_description: string | null;
  position_x: number;
  position_y: number;
  position_z: number;
  is_active: boolean;
}

export interface FoodItem {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  category: string;
  image_url: string | null;
  price: number;
  is_vegetarian: boolean;
  allergen_information: string | null;
  preparation_time_minutes: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventFoodItem {
  id: string;
  event_id: string;
  food_item_id: string;
  stall_id: string | null;
  event_price: number;
  available_quantity: number;
  is_available: boolean;
  food_item?: FoodItem;
  stall?: FoodStall;
}

export interface FoodOrder {
  id: string;
  order_number: string;
  booking_id: string | null;
  user_id: string;
  event_id: string;
  stall_id: string | null;
  total_amount: number;
  order_status: FoodOrderStatus;
  pickup_time: string | null;
  pickup_qr_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface FoodOrderItem {
  id: string;
  food_order_id: string;
  event_food_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface EmergencyContact {
  id: string;
  event_id: string | null;
  venue_id: string | null;
  contact_type: string;
  name: string;
  phone: string;
  description: string | null;
  priority: number;
  is_active: boolean;
}

export interface EmergencyIncident {
  id: string;
  event_id: string;
  reported_by: string | null;
  incident_type: string;
  description: string | null;
  seat_or_location: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'assigned' | 'resolved' | 'closed';
  assigned_to: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  event_id: string;
  booking_id: string | null;
  overall_rating: number;
  stage_view_rating: number | null;
  venue_rating: number | null;
  sound_rating: number | null;
  food_rating: number | null;
  review_text: string | null;
  is_approved: boolean;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_reference: string;
  user_id: string;
  booking_id: string | null;
  subject: string;
  category: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface EventWithVenue extends Event {
  venue?: Pick<Venue, 'id' | 'name' | 'city' | 'address' | 'venue_image_url'>;
  event_artists?: EventArtist[];
}

export interface EventSeatWithSeat extends EventSeat {
  venue_seat?: VenueSeat;
  section?: Pick<VenueSection, 'id' | 'name' | 'code' | 'colour_code' | 'visibility_score'>;
}
