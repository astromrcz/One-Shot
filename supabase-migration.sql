-- ═══════════════════════════════════════════════════════════════════════════
-- ONE SHOT BAR & BILLIARDS MANAGEMENT SYSTEM - COMPLETE DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- This migration creates all tables required for the frontend application.
-- Run this entire script in your Supabase SQL Editor.
-- 
-- Last Updated: April 9, 2026
-- Frontend Framework: React + TypeScript
-- Database: PostgreSQL (Supabase)
--
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 1: BILLIARD TABLES
-- ═══════════════════════════════════════════════════════════════════════════
-- Stores billiard table information and active sessions
-- Frontend Type: Table (with embedded Session)

CREATE TABLE IF NOT EXISTS tables (
  -- Basic Info
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('available', 'occupied', 'reserved')) NOT NULL DEFAULT 'available',
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Embedded Session Data (when table is occupied)
  session_customer_name TEXT,
  session_start_time TIMESTAMPTZ,
  session_duration_minutes INTEGER,
  session_is_paid BOOLEAN,
  session_hourly_rate NUMERIC(10, 2),
  session_amount_paid NUMERIC(10, 2),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);
CREATE INDEX IF NOT EXISTS idx_tables_is_active ON tables(is_active);

COMMENT ON TABLE tables IS 'Billiard tables with embedded session data';
COMMENT ON COLUMN tables.session_customer_name IS 'Name of customer currently using the table (when occupied)';
COMMENT ON COLUMN tables.session_start_time IS 'Session start timestamp';
COMMENT ON COLUMN tables.session_duration_minutes IS 'Booked duration in minutes';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 2: QUEUE ITEMS
-- ═══════════════════════════════════════════════════════════════════════════
-- Walk-in customer queue management
-- Frontend Type: QueueItem

CREATE TABLE IF NOT EXISTS queue_items (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  party_size INTEGER NOT NULL,
  arrival_time TIMESTAMPTZ NOT NULL,
  notes TEXT,
  status TEXT CHECK (status IN ('waiting', 'called', 'seated')) NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_status ON queue_items(status);
CREATE INDEX IF NOT EXISTS idx_queue_arrival ON queue_items(arrival_time);

COMMENT ON TABLE queue_items IS 'Walk-in customer queue for table availability';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 3: RESERVATIONS
-- ═══════════════════════════════════════════════════════════════════════════
-- Table reservations with payment tracking
-- Frontend Type: Reservation

CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  
  -- Customer Info
  customer_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT,
  
  -- Reservation Details
  date TIMESTAMPTZ NOT NULL,
  time_slot TEXT NOT NULL,
  duration_hours INTEGER NOT NULL,
  party_size INTEGER NOT NULL,
  table_id TEXT REFERENCES tables(id) ON DELETE SET NULL,
  
  -- Status & Payments
  status TEXT CHECK (status IN ('pending', 'confirmed', 'checked-in', 'completed', 'cancelled')) NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(10, 2) NOT NULL,
  down_payment_amount NUMERIC(10, 2) NOT NULL,
  down_payment_paid BOOLEAN NOT NULL DEFAULT false,
  balance_paid BOOLEAN NOT NULL DEFAULT false,
  
  -- Optional Fields
  cancellation_reason TEXT,
  promo_code TEXT,
  discount_amount NUMERIC(10, 2),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_table ON reservations(table_id);

COMMENT ON TABLE reservations IS 'Table reservations with payment and status tracking';
COMMENT ON COLUMN reservations.down_payment_paid IS 'Whether the 25% down payment has been paid';
COMMENT ON COLUMN reservations.balance_paid IS 'Whether the remaining balance has been paid';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 4: FEEDBACK
-- ═══════════════════════════════════════════════════════════════════════════
-- Customer feedback and reviews
-- Frontend Type: Feedback

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  contact_info TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_type TEXT CHECK (feedback_type IN ('suggestion', 'complaint', 'lost_item', 'compliment', 'other')),
  comment TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reservation_id TEXT REFERENCES reservations(id) ON DELETE SET NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_date ON feedback(date);
CREATE INDEX IF NOT EXISTS idx_feedback_tags ON feedback USING GIN (tags);

COMMENT ON TABLE feedback IS 'Customer feedback, reviews, and ratings';
COMMENT ON COLUMN feedback.tags IS 'JSON array of string tags for categorization';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 5: ACTIVITIES (AUDIT LOG)
-- ═══════════════════════════════════════════════════════════════════════════
-- System-wide activity log for audit trail
-- Frontend Type: Activity

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activities_metadata ON activities USING GIN (metadata);

COMMENT ON TABLE activities IS 'Audit log of all system activities';
COMMENT ON COLUMN activities.type IS 'Activity type (table_assigned, reservation_created, etc.)';
COMMENT ON COLUMN activities.metadata IS 'JSON object with additional context data';

-- Valid activity types:
-- 'table_assigned', 'table_freed', 'table_reserved', 'session_extended'
-- 'queue_added', 'queue_removed', 'queue_called'
-- 'reservation_created', 'reservation_updated', 'payment_received', 'reservation_cancelled'
-- 'feedback_received', 'promo_created', 'tattoo_reservation_created', 'admin_action'

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 6: PROMO CODES
-- ═══════════════════════════════════════════════════════════════════════════
-- Discount and promotional codes
-- Frontend Type: PromoCode

CREATE TABLE IF NOT EXISTS promo_codes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_usage INTEGER NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_codes_expires ON promo_codes(expires_at);

COMMENT ON TABLE promo_codes IS 'Promotional discount codes';
COMMENT ON COLUMN promo_codes.usage_count IS 'Number of times this code has been used';
COMMENT ON COLUMN promo_codes.max_usage IS 'Maximum number of times this code can be used';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 7: TATTOO ARTISTS
-- ═══════════════════════════════════════════════════════════════════════════
-- Tattoo artist profiles and availability
-- Frontend Type: TattooArtist

CREATE TABLE IF NOT EXISTS tattoo_artists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT,
  bio TEXT,
  is_available_today BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  unavailable_dates JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tattoo_artists_active ON tattoo_artists(is_active);
CREATE INDEX IF NOT EXISTS idx_tattoo_artists_available ON tattoo_artists(is_available_today);

COMMENT ON TABLE tattoo_artists IS 'Tattoo artist profiles and availability calendar';
COMMENT ON COLUMN tattoo_artists.unavailable_dates IS 'JSON array of date strings (YYYY-MM-DD) when artist is unavailable';
COMMENT ON COLUMN tattoo_artists.is_available_today IS 'Quick flag for today availability (updated daily)';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 8: TATTOO RESERVATIONS
-- ═══════════════════════════════════════════════════════════════════════════
-- Tattoo appointment bookings
-- Frontend Type: TattooReservation

CREATE TABLE IF NOT EXISTS tattoo_reservations (
  id TEXT PRIMARY KEY,
  
  -- Customer Info
  customer_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT,
  
  -- Appointment Details
  date TIMESTAMPTZ NOT NULL,
  time_slot TEXT NOT NULL,
  artist_id TEXT NOT NULL REFERENCES tattoo_artists(id) ON DELETE CASCADE,
  artist_name TEXT NOT NULL,
  artist_contact TEXT NOT NULL,
  
  -- Tattoo Details
  placement TEXT NOT NULL,
  estimated_size TEXT NOT NULL,
  design_description TEXT NOT NULL,
  color_style TEXT NOT NULL,
  inspiration_images JSONB DEFAULT '[]'::jsonb,
  
  -- Agreements
  agreement_signed BOOLEAN NOT NULL DEFAULT false,
  consent_signed BOOLEAN NOT NULL DEFAULT false,
  
  -- Status & Payment
  status TEXT CHECK (status IN ('pending', 'confirmed', 'in-progress', 'completed', 'cancelled')) NOT NULL DEFAULT 'pending',
  deposit_amount NUMERIC(10, 2) NOT NULL,
  deposit_paid BOOLEAN NOT NULL DEFAULT false,
  
  -- Rescheduling
  reschedule_requested BOOLEAN,
  proposed_date TIMESTAMPTZ,
  proposed_time_slot TEXT,
  customer_reschedule_confirmed BOOLEAN,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tattoo_reservations_artist ON tattoo_reservations(artist_id);
CREATE INDEX IF NOT EXISTS idx_tattoo_reservations_status ON tattoo_reservations(status);
CREATE INDEX IF NOT EXISTS idx_tattoo_reservations_date ON tattoo_reservations(date);

COMMENT ON TABLE tattoo_reservations IS 'Tattoo appointment bookings with design details';
COMMENT ON COLUMN tattoo_reservations.inspiration_images IS 'JSON array of image URLs';
COMMENT ON COLUMN tattoo_reservations.reschedule_requested IS 'Whether artist has requested a reschedule';
COMMENT ON COLUMN tattoo_reservations.customer_reschedule_confirmed IS 'Whether customer has confirmed the proposed reschedule (null = pending)';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 9: STAFF USERS
-- ═══════════════════════════════════════════════════════════════════════════
-- Staff user accounts for authentication
-- Frontend Type: StaffUser

CREATE TABLE IF NOT EXISTS staff_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL, -- NOTE: Plain text for now; hash in production!
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('manager', 'tattoo-artist', 'cashier')) NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  artist_id TEXT REFERENCES tattoo_artists(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_users_username ON staff_users(username);
CREATE INDEX IF NOT EXISTS idx_staff_users_role ON staff_users(role);
CREATE INDEX IF NOT EXISTS idx_staff_users_active ON staff_users(is_active);

COMMENT ON TABLE staff_users IS 'Staff user accounts with role-based access';
COMMENT ON COLUMN staff_users.password IS 'WARNING: Plain text password. Use Supabase Auth in production!';
COMMENT ON COLUMN staff_users.artist_id IS 'Links to tattoo_artists if role is tattoo-artist';
COMMENT ON COLUMN staff_users.is_admin IS 'Whether user has admin portal access';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 10: RATES CONFIGURATION
-- ═══════════════════════════════════════════════════════════════════════════
-- System-wide pricing configuration (single row)
-- Frontend Type: RatesConfig

CREATE TABLE IF NOT EXISTS rates_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 250,
  happy_hour_rate NUMERIC(10, 2) NOT NULL DEFAULT 200,
  happy_hour_start TEXT NOT NULL DEFAULT '18:00',
  happy_hour_end TEXT NOT NULL DEFAULT '19:00',
  overtime_rate NUMERIC(10, 2) NOT NULL DEFAULT 300,
  tattoo_deposit NUMERIC(10, 2) NOT NULL DEFAULT 500,
  down_payment_percent NUMERIC(3, 2) NOT NULL DEFAULT 0.25,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure only one row
  CONSTRAINT only_one_row CHECK (id = 1)
);

COMMENT ON TABLE rates_config IS 'Global pricing configuration (single row only)';
COMMENT ON COLUMN rates_config.down_payment_percent IS 'Decimal (0.25 = 25%)';
COMMENT ON COLUMN rates_config.happy_hour_start IS 'Time in HH:MM format (24-hour)';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 11: RESERVATION TERMS
-- ═══════════════════════════════════════════════════════════════════════════
-- Reservation policies and terms (single row)
-- Frontend Type: ReservationTerms

CREATE TABLE IF NOT EXISTS reservation_terms (
  id INTEGER PRIMARY KEY DEFAULT 1,
  min_hours INTEGER NOT NULL DEFAULT 2,
  max_hours INTEGER NOT NULL DEFAULT 8,
  min_party_size INTEGER NOT NULL DEFAULT 1,
  max_party_size INTEGER NOT NULL DEFAULT 12,
  cancellation_hours INTEGER NOT NULL DEFAULT 24,
  cancellation_policy TEXT NOT NULL DEFAULT 'Cancellations must be made at least 24 hours in advance for a full refund.',
  terms_and_conditions TEXT NOT NULL DEFAULT 'By making a reservation, you agree to our terms and conditions.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure only one row
  CONSTRAINT only_one_row CHECK (id = 1)
);

COMMENT ON TABLE reservation_terms IS 'Reservation policies and terms (single row only)';
COMMENT ON COLUMN reservation_terms.cancellation_hours IS 'Minimum hours before reservation to cancel';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 12: ANNOUNCEMENTS
-- ═══════════════════════════════════════════════════════════════════════════
-- Homepage announcements and notifications
-- Frontend Type: Announcement

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'warning', 'promo', 'event')) NOT NULL DEFAULT 'info',
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(type);
CREATE INDEX IF NOT EXISTS idx_announcements_expires ON announcements(expires_at);

COMMENT ON TABLE announcements IS 'Homepage announcements and promotional messages';
COMMENT ON COLUMN announcements.expires_at IS 'Optional expiration date (null = no expiration)';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 13: CLOSED DATES
-- ═══════════════════════════════════════════════════════════════════════════
-- Business closure calendar
-- Frontend Type: ClosedDate

CREATE TABLE IF NOT EXISTS closed_dates (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL, -- YYYY-MM-DD format
  reason TEXT NOT NULL,
  is_full_day BOOLEAN NOT NULL DEFAULT true,
  open_time TEXT,
  close_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_closed_dates_date ON closed_dates(date);

COMMENT ON TABLE closed_dates IS 'Business closure calendar (holidays, maintenance, etc.)';
COMMENT ON COLUMN closed_dates.date IS 'Date in YYYY-MM-DD format';
COMMENT ON COLUMN closed_dates.is_full_day IS 'If false, business is partially open during open_time to close_time';

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS: AUTO-UPDATE TIMESTAMPS
-- ═══════════════════════════════════════════════════════════════════════════

-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at column
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tattoo_artists_updated_at BEFORE UPDATE ON tattoo_artists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tattoo_reservations_updated_at BEFORE UPDATE ON tattoo_reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_users_updated_at BEFORE UPDATE ON staff_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rates_config_updated_at BEFORE UPDATE ON rates_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservation_terms_updated_at BEFORE UPDATE ON reservation_terms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- DEFAULT DATA: ESSENTIAL CONFIGURATION
-- ═══════════════════════════════════════════════════════════════════════════

-- Insert default rates configuration
INSERT INTO rates_config (id, hourly_rate, happy_hour_rate, happy_hour_start, happy_hour_end, overtime_rate, tattoo_deposit, down_payment_percent)
VALUES (1, 250, 200, '18:00', '19:00', 300, 500, 0.25)
ON CONFLICT (id) DO NOTHING;

-- Insert default reservation terms
INSERT INTO reservation_terms (id, min_hours, max_hours, min_party_size, max_party_size, cancellation_hours, cancellation_policy, terms_and_conditions)
VALUES (
  1, 
  2, 
  8, 
  1, 
  12, 
  24,
  'Cancellations must be made at least 24 hours in advance for a full refund. Late cancellations will forfeit the down payment.',
  'By making a reservation, you agree to: (1) Arrive on time or notify us of delays, (2) Pay the remaining balance upon arrival, (3) Respect the venue and other guests, (4) Follow house rules and staff instructions.'
)
ON CONFLICT (id) DO NOTHING;

-- Insert default admin user
INSERT INTO staff_users (id, username, password, full_name, email, role, is_admin, phone, is_active)
VALUES (
  'staff_admin',
  'admin',
  'admin123',
  'Admin User',
  'admin@oneshot.com',
  'manager',
  true,
  '09171234567',
  true
)
ON CONFLICT (username) DO NOTHING;

-- Insert welcome announcement
INSERT INTO announcements (id, title, content, type, is_active)
VALUES (
  'welcome_announcement',
  '🎱 Welcome to One Shot Bar & Billiards!',
  'We are now fully integrated with Supabase. All your data is securely stored in the cloud. Enjoy seamless table reservations and tattoo bookings!',
  'info',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Run these queries to verify the migration was successful:

-- 1. List all tables
 SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- 2. Check default data
 SELECT * FROM rates_config;
 SELECT * FROM reservation_terms;
 SELECT * FROM staff_users;
 SELECT * FROM announcements;

-- 3. Count rows in each table
 SELECT 
   'tables' as table_name, COUNT(*) as row_count FROM tables
   UNION ALL SELECT 'queue_items', COUNT(*) FROM queue_items
   UNION ALL SELECT 'reservations', COUNT(*) FROM reservations
   UNION ALL SELECT 'feedback', COUNT(*) FROM feedback
   UNION ALL SELECT 'activities', COUNT(*) FROM activities
   UNION ALL SELECT 'promo_codes', COUNT(*) FROM promo_codes
   UNION ALL SELECT 'tattoo_artists', COUNT(*) FROM tattoo_artists
   UNION ALL SELECT 'tattoo_reservations', COUNT(*) FROM tattoo_reservations
   UNION ALL SELECT 'staff_users', COUNT(*) FROM staff_users
   UNION ALL SELECT 'announcements', COUNT(*) FROM announcements
   UNION ALL SELECT 'closed_dates', COUNT(*) FROM closed_dates;

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE!
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- ✅ 13 tables created
-- ✅ Indexes added for performance
-- ✅ Triggers set up for auto-updating timestamps
-- ✅ Default configuration inserted
-- ✅ Default admin user created (username: admin, password: admin123)
-- 
-- Next steps:
-- 1. Verify tables exist in Supabase Table Editor
-- 2. Start your application: npm run dev
-- 3. Login with admin/admin123
-- 4. Start adding your data!
-- 
-- For seed data, see SEED_DATA.md
-- For verification, run verify-tables.sql
-- 
-- ═══════════════════════════════════════════════════════════════════════════
