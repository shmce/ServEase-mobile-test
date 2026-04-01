-- ============================================================
-- ServEase Microservice Schema Creation
-- Run this FIRST before any other migration files.
-- ============================================================
-- Services:
--   identity_svc          → users, auth, profiles, addresses
--   provider_catalog_svc  → provider profiles, services, categories, verification
--   booking_svc           → bookings, scheduling, chat
--   payment_svc           → payments, payouts
--   trust_svc             → reviews, reports
--   notification_svc      → notifications, support tickets, disputes
-- ============================================================

-- 1. Create schemas
CREATE SCHEMA IF NOT EXISTS identity_svc;
CREATE SCHEMA IF NOT EXISTS provider_catalog_svc;
CREATE SCHEMA IF NOT EXISTS booking_svc;
CREATE SCHEMA IF NOT EXISTS payment_svc;
CREATE SCHEMA IF NOT EXISTS trust_svc;
CREATE SCHEMA IF NOT EXISTS notification_svc;

-- 2. Grant USAGE to Supabase roles
GRANT USAGE ON SCHEMA identity_svc         TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA provider_catalog_svc TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA booking_svc          TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA payment_svc          TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA trust_svc            TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA notification_svc     TO anon, authenticated, service_role;

-- 3. Set default privileges so future tables in each schema inherit grants automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA identity_svc
  GRANT ALL ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA identity_svc
  GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA provider_catalog_svc
  GRANT ALL ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA provider_catalog_svc
  GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA booking_svc
  GRANT ALL ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA booking_svc
  GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA payment_svc
  GRANT ALL ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA payment_svc
  GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA trust_svc
  GRANT ALL ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA trust_svc
  GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA notification_svc
  GRANT ALL ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA notification_svc
  GRANT SELECT ON TABLES TO anon;

-- ============================================================
-- IMPORTANT: After running this file, go to:
-- Supabase Dashboard → Settings → API → Extra Schema
-- Add: identity_svc, provider_catalog_svc, booking_svc,
--      payment_svc, trust_svc, notification_svc
-- This exposes the schemas to PostgREST (the REST API layer).
-- ============================================================
