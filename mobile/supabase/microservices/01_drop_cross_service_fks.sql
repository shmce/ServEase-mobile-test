-- ============================================================
-- ServEase: Drop Cross-Service Foreign Key Constraints
-- Run this SECOND, before migrating tables to new schemas.
--
-- These FK constraints cross service boundaries and become
-- "Soft Links" — UUID references enforced by the application
-- and event streams (Kafka), NOT by the database.
--
-- Within-service FKs (e.g. bookings → booking_attachments)
-- are NOT dropped here — they remain as hard constraints.
-- ============================================================

-- ============================================================
-- BOOKING_SVC → IDENTITY_SVC  (soft links)
-- ============================================================
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_provider_id_fkey;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_cancelled_by_fkey;

ALTER TABLE public.booking_reschedule_requests
  DROP CONSTRAINT IF EXISTS booking_reschedule_requests_provider_id_fkey;

ALTER TABLE public.booking_reschedule_requests
  DROP CONSTRAINT IF EXISTS booking_reschedule_requests_reviewed_by_fkey;

ALTER TABLE public.additional_charges
  DROP CONSTRAINT IF EXISTS additional_charges_requested_by_fkey;

ALTER TABLE public.additional_charges
  DROP CONSTRAINT IF EXISTS additional_charges_reviewed_by_fkey;

ALTER TABLE public.provider_availability
  DROP CONSTRAINT IF EXISTS provider_availability_user_id_fkey;

ALTER TABLE public.provider_days_off
  DROP CONSTRAINT IF EXISTS provider_days_off_user_id_fkey;

-- ============================================================
-- BOOKING_SVC → PROVIDER_CATALOG_SVC  (soft links)
-- ============================================================
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_service_id_fkey;

ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_service_id_fkey;

-- ============================================================
-- BOOKING_SVC (chat) → IDENTITY_SVC  (soft links)
-- ============================================================
ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_customer_id_fkey;

ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_provider_id_fkey;

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

-- ============================================================
-- PAYMENT_SVC → IDENTITY_SVC  (soft links)
-- ============================================================
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_customer_id_fkey;

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_provider_id_fkey;

ALTER TABLE public.provider_payouts
  DROP CONSTRAINT IF EXISTS provider_payouts_provider_id_fkey;

-- ============================================================
-- PAYMENT_SVC → BOOKING_SVC  (soft links)
-- ============================================================
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_booking_id_fkey;

ALTER TABLE public.provider_payouts
  DROP CONSTRAINT IF EXISTS provider_payouts_booking_id_fkey;

-- ============================================================
-- TRUST_SVC → IDENTITY_SVC  (soft links)
-- ============================================================
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_reviewer_id_fkey;

ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_reviewee_id_fkey;

ALTER TABLE public.provider_profile_reports
  DROP CONSTRAINT IF EXISTS provider_profile_reports_provider_id_fkey;

ALTER TABLE public.provider_profile_reports
  DROP CONSTRAINT IF EXISTS provider_profile_reports_reporter_id_fkey;

-- ============================================================
-- TRUST_SVC → BOOKING_SVC  (soft links)
-- ============================================================
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_booking_id_fkey;

ALTER TABLE public.provider_profile_reports
  DROP CONSTRAINT IF EXISTS provider_profile_reports_booking_id_fkey;

-- ============================================================
-- NOTIFICATION_SVC → IDENTITY_SVC  (soft links)
-- ============================================================
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_actor_id_fkey;

-- ============================================================
-- NOTIFICATION_SVC → BOOKING_SVC  (soft links)
-- ============================================================
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_booking_id_fkey;

-- ============================================================
-- NOTIFICATION_SVC (support_tickets, disputes) → IDENTITY_SVC  (soft links)
-- ============================================================
ALTER TABLE public.support_tickets
  DROP CONSTRAINT IF EXISTS support_tickets_user_id_fkey;

ALTER TABLE public.disputes
  DROP CONSTRAINT IF EXISTS disputes_booking_id_fkey;

ALTER TABLE public.disputes
  DROP CONSTRAINT IF EXISTS disputes_raised_by_fkey;

-- ============================================================
-- PROVIDER_CATALOG_SVC → IDENTITY_SVC  (soft links)
-- ============================================================
ALTER TABLE public.provider_profiles
  DROP CONSTRAINT IF EXISTS provider_profiles_user_id_fkey;

-- provider_verification and provider_documents tables not present in this project

-- ============================================================
-- Add COMMENTS to document soft links (cross-service refs)
-- These serve as living documentation for the architecture.
-- ============================================================

-- bookings soft links
COMMENT ON COLUMN public.bookings.customer_id  IS 'SOFT LINK → identity_svc.users.id';
COMMENT ON COLUMN public.bookings.provider_id  IS 'SOFT LINK → identity_svc.users.id';
COMMENT ON COLUMN public.bookings.service_id   IS 'SOFT LINK → provider_catalog_svc.provider_services.id';

-- payments soft links
COMMENT ON COLUMN public.payments.booking_id   IS 'SOFT LINK → booking_svc.bookings.id';
COMMENT ON COLUMN public.payments.customer_id  IS 'SOFT LINK → identity_svc.users.id';
COMMENT ON COLUMN public.payments.provider_id  IS 'SOFT LINK → identity_svc.users.id';

-- reviews soft links
COMMENT ON COLUMN public.reviews.booking_id    IS 'SOFT LINK → booking_svc.bookings.id';
COMMENT ON COLUMN public.reviews.reviewer_id   IS 'SOFT LINK → identity_svc.users.id';
COMMENT ON COLUMN public.reviews.reviewee_id   IS 'SOFT LINK → identity_svc.users.id';

-- notifications soft links
COMMENT ON COLUMN public.notifications.user_id    IS 'SOFT LINK → identity_svc.users.id';
COMMENT ON COLUMN public.notifications.actor_id   IS 'SOFT LINK → identity_svc.users.id';
COMMENT ON COLUMN public.notifications.booking_id IS 'SOFT LINK → booking_svc.bookings.id';

-- provider_profiles soft links
COMMENT ON COLUMN public.provider_profiles.user_id IS 'SOFT LINK → identity_svc.users.id';
