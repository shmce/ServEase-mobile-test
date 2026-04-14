-- Supabase Postgres Optimization Script
-- Author: Antigravity Assistant
-- Category: Query Performance (query-missing-indexes), Schema Design (schema-foreign-key-indexes)

-- 1. Identity Service Optimizations
-- Missing indexes for frequent lookups on users table
CREATE INDEX IF NOT EXISTS idx_users_email ON identity_svc.users (email);
CREATE INDEX IF NOT EXISTS idx_users_contact_number ON identity_svc.users (contact_number);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON identity_svc.users (role, status);

-- 2. Booking Service Optimizations
-- Indices for customer/provider relationship and status filtering
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON booking_svc.bookings (customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON booking_svc.bookings (provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON booking_svc.bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON booking_svc.bookings (scheduled_at DESC);

-- 3. Payment Service Optimizations
-- Indices for booking references and status tracking
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payment_svc.payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payment_svc.payments (customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON payment_svc.payments (provider_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_svc.payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payment_svc.payments (paid_at DESC) WHERE status = 'completed';

-- 4. Provider Catalog Optimizations
CREATE INDEX IF NOT EXISTS idx_provider_profiles_user_id ON provider_catalog_svc.provider_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_status ON provider_catalog_svc.provider_profiles (verification_status);
CREATE INDEX IF NOT EXISTS idx_provider_documents_provider_id ON provider_catalog_svc.provider_documents (provider_id);
