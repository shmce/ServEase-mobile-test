-- ============================================================
-- ServEase: Move Tables into Microservice Schemas
-- Run this THIRD, after 01_drop_cross_service_fks.sql
--
-- Uses ALTER TABLE ... SET SCHEMA to move tables in-place.
-- No data is copied — this is a metadata-only operation.
-- ============================================================

-- ============================================================
-- IDENTITY_SVC
-- Tables: users, customer_profiles, user_addresses,
--         auth_sessions, otp_codes, app_policies,
--         user_policy_acceptance
-- ============================================================
ALTER TABLE public.users
  SET SCHEMA identity_svc;

ALTER TABLE public.customer_profiles
  SET SCHEMA identity_svc;

ALTER TABLE public.user_addresses
  SET SCHEMA identity_svc;

-- auth_sessions (if it exists in public)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'auth_sessions') THEN
    ALTER TABLE public.auth_sessions SET SCHEMA identity_svc;
  END IF;
END $$;

-- otp_codes (if it exists in public)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'otp_codes') THEN
    ALTER TABLE public.otp_codes SET SCHEMA identity_svc;
  END IF;
END $$;

-- app_policies (if it exists in public)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'app_policies') THEN
    ALTER TABLE public.app_policies SET SCHEMA identity_svc;
  END IF;
END $$;

-- user_policy_acceptance (if it exists in public)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'user_policy_acceptance') THEN
    ALTER TABLE public.user_policy_acceptance SET SCHEMA identity_svc;
  END IF;
END $$;

-- ============================================================
-- PROVIDER_CATALOG_SVC
-- Tables: service_categories, provider_profiles,
--         provider_documents, provider_verification,
--         provider_services, location
-- ============================================================
ALTER TABLE public.service_categories
  SET SCHEMA provider_catalog_svc;

ALTER TABLE public.provider_profiles
  SET SCHEMA provider_catalog_svc;

-- provider_verification table not present in this project

ALTER TABLE public.provider_services
  SET SCHEMA provider_catalog_svc;

-- provider_documents (if it exists in public)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'provider_documents') THEN
    ALTER TABLE public.provider_documents SET SCHEMA provider_catalog_svc;
  END IF;
END $$;

-- location (if it exists in public)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'location') THEN
    ALTER TABLE public.location SET SCHEMA provider_catalog_svc;
  END IF;
END $$;

-- ============================================================
-- BOOKING_SVC
-- Tables: bookings, booking_attachments,
--         booking_reschedule_requests, additional_charges,
--         provider_availability, provider_days_off,
--         conversations, messages
-- ============================================================
ALTER TABLE public.bookings
  SET SCHEMA booking_svc;

ALTER TABLE public.booking_attachments
  SET SCHEMA booking_svc;

ALTER TABLE public.booking_reschedule_requests
  SET SCHEMA booking_svc;

ALTER TABLE public.additional_charges
  SET SCHEMA booking_svc;

ALTER TABLE public.provider_availability
  SET SCHEMA booking_svc;

ALTER TABLE public.provider_days_off
  SET SCHEMA booking_svc;

ALTER TABLE public.conversations
  SET SCHEMA booking_svc;

ALTER TABLE public.messages
  SET SCHEMA booking_svc;

-- ============================================================
-- PAYMENT_SVC
-- Tables: payments, provider_payouts
-- ============================================================
ALTER TABLE public.payments
  SET SCHEMA payment_svc;

-- provider_payouts (if it exists in public)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'provider_payouts') THEN
    ALTER TABLE public.provider_payouts SET SCHEMA payment_svc;
  END IF;
END $$;

-- ============================================================
-- TRUST_SVC
-- Tables: reviews, provider_profile_reports
-- ============================================================
ALTER TABLE public.reviews
  SET SCHEMA trust_svc;

ALTER TABLE public.provider_profile_reports
  SET SCHEMA trust_svc;

-- ============================================================
-- NOTIFICATION_SVC
-- Tables: notifications, support_tickets, disputes
-- ============================================================
ALTER TABLE public.notifications
  SET SCHEMA notification_svc;

-- support_tickets (if it exists in public)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'support_tickets') THEN
    ALTER TABLE public.support_tickets SET SCHEMA notification_svc;
  END IF;
END $$;

-- disputes (if it exists in public)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'disputes') THEN
    ALTER TABLE public.disputes SET SCHEMA notification_svc;
  END IF;
END $$;

-- ============================================================
-- Grant table-level access AFTER moving (schemas now exist)
-- ============================================================
GRANT ALL ON ALL TABLES IN SCHEMA identity_svc         TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA provider_catalog_svc TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA booking_svc          TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA payment_svc          TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA trust_svc            TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA notification_svc     TO authenticated, service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA identity_svc         TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA provider_catalog_svc TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA trust_svc            TO anon;
