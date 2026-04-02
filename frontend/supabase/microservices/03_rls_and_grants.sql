-- ============================================================
-- ServEase: RLS Policies for All Microservice Schemas
-- Run this FOURTH (last), after 02_migrate_tables.sql
--
-- After moving tables, existing RLS policies that were
-- created in public still exist but may reference old schema
-- paths. This file re-creates all RLS policies cleanly.
-- ============================================================

-- ============================================================
-- IDENTITY_SVC
-- ============================================================

-- users
ALTER TABLE identity_svc.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can read own record" ON identity_svc.users;
CREATE POLICY "users can read own record"
ON identity_svc.users FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "authenticated users can read provider users" ON identity_svc.users;
CREATE POLICY "authenticated users can read provider users"
ON identity_svc.users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM provider_catalog_svc.provider_profiles p
    WHERE p.user_id = identity_svc.users.id
  )
);

DROP POLICY IF EXISTS "users can update own record" ON identity_svc.users;
CREATE POLICY "users can update own record"
ON identity_svc.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- customer_profiles
ALTER TABLE identity_svc.customer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can read own customer profile" ON identity_svc.customer_profiles;
CREATE POLICY "users can read own customer profile"
ON identity_svc.customer_profiles FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users can insert own customer profile" ON identity_svc.customer_profiles;
CREATE POLICY "users can insert own customer profile"
ON identity_svc.customer_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users can update own customer profile" ON identity_svc.customer_profiles;
CREATE POLICY "users can update own customer profile"
ON identity_svc.customer_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- user_addresses
ALTER TABLE identity_svc.user_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can read own addresses" ON identity_svc.user_addresses;
CREATE POLICY "users can read own addresses"
ON identity_svc.user_addresses FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users can insert own addresses" ON identity_svc.user_addresses;
CREATE POLICY "users can insert own addresses"
ON identity_svc.user_addresses FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users can update own addresses" ON identity_svc.user_addresses;
CREATE POLICY "users can update own addresses"
ON identity_svc.user_addresses FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users can delete own addresses" ON identity_svc.user_addresses;
CREATE POLICY "users can delete own addresses"
ON identity_svc.user_addresses FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================
-- PROVIDER_CATALOG_SVC
-- ============================================================

-- provider_profiles
ALTER TABLE provider_catalog_svc.provider_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated users can read provider profiles" ON provider_catalog_svc.provider_profiles;
CREATE POLICY "authenticated users can read provider profiles"
ON provider_catalog_svc.provider_profiles FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "providers can update own profile" ON provider_catalog_svc.provider_profiles;
CREATE POLICY "providers can update own profile"
ON provider_catalog_svc.provider_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "providers can insert own profile" ON provider_catalog_svc.provider_profiles;
CREATE POLICY "providers can insert own profile"
ON provider_catalog_svc.provider_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- provider_services
ALTER TABLE provider_catalog_svc.provider_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated users can read provider services" ON provider_catalog_svc.provider_services;
CREATE POLICY "authenticated users can read provider services"
ON provider_catalog_svc.provider_services FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "providers can manage own services" ON provider_catalog_svc.provider_services;
CREATE POLICY "providers can manage own services"
ON provider_catalog_svc.provider_services FOR ALL
USING (auth.uid() = provider_id)
WITH CHECK (auth.uid() = provider_id);

-- service_categories
ALTER TABLE provider_catalog_svc.service_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "everyone can read service categories" ON provider_catalog_svc.service_categories;
CREATE POLICY "everyone can read service categories"
ON provider_catalog_svc.service_categories FOR SELECT
USING (true);

-- provider_verification table not present in this project

-- ============================================================
-- BOOKING_SVC
-- ============================================================

-- bookings
ALTER TABLE booking_svc.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking participants can read bookings" ON booking_svc.bookings;
CREATE POLICY "booking participants can read bookings"
ON booking_svc.bookings FOR SELECT
USING (
  auth.uid() = customer_id
  OR auth.uid() = provider_id
);

DROP POLICY IF EXISTS "customers can create bookings" ON booking_svc.bookings;
CREATE POLICY "customers can create bookings"
ON booking_svc.bookings FOR INSERT
WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "booking participants can update bookings" ON booking_svc.bookings;
CREATE POLICY "booking participants can update bookings"
ON booking_svc.bookings FOR UPDATE
USING (
  auth.uid() = customer_id
  OR auth.uid() = provider_id
);

-- booking_attachments
ALTER TABLE booking_svc.booking_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated users can upload booking attachments" ON booking_svc.booking_attachments;
CREATE POLICY "authenticated users can upload booking attachments"
ON booking_svc.booking_attachments FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated users can read booking attachments" ON booking_svc.booking_attachments;
CREATE POLICY "authenticated users can read booking attachments"
ON booking_svc.booking_attachments FOR SELECT
TO authenticated
USING (true);

-- booking_reschedule_requests
ALTER TABLE booking_svc.booking_reschedule_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking participants can read reschedule requests" ON booking_svc.booking_reschedule_requests;
CREATE POLICY "booking participants can read reschedule requests"
ON booking_svc.booking_reschedule_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM booking_svc.bookings b
    WHERE b.id = booking_svc.booking_reschedule_requests.booking_id
      AND (auth.uid() = b.customer_id OR auth.uid() = b.provider_id)
  )
);

DROP POLICY IF EXISTS "providers can create reschedule requests" ON booking_svc.booking_reschedule_requests;
CREATE POLICY "providers can create reschedule requests"
ON booking_svc.booking_reschedule_requests FOR INSERT
WITH CHECK (auth.uid() = provider_id);

-- additional_charges
ALTER TABLE booking_svc.additional_charges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking participants can read additional charges" ON booking_svc.additional_charges;
CREATE POLICY "booking participants can read additional charges"
ON booking_svc.additional_charges FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM booking_svc.bookings b
    WHERE b.id = booking_svc.additional_charges.booking_id
      AND (auth.uid() = b.customer_id OR auth.uid() = b.provider_id)
  )
);

DROP POLICY IF EXISTS "providers can create additional charges" ON booking_svc.additional_charges;
CREATE POLICY "providers can create additional charges"
ON booking_svc.additional_charges FOR INSERT
WITH CHECK (auth.uid() = requested_by);

-- provider_availability
ALTER TABLE booking_svc.provider_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated users can read provider availability" ON booking_svc.provider_availability;
CREATE POLICY "authenticated users can read provider availability"
ON booking_svc.provider_availability FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "providers can manage own availability" ON booking_svc.provider_availability;
CREATE POLICY "providers can manage own availability"
ON booking_svc.provider_availability FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- provider_days_off
ALTER TABLE booking_svc.provider_days_off ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated users can read provider days off" ON booking_svc.provider_days_off;
CREATE POLICY "authenticated users can read provider days off"
ON booking_svc.provider_days_off FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "providers can manage own days off" ON booking_svc.provider_days_off;
CREATE POLICY "providers can manage own days off"
ON booking_svc.provider_days_off FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- conversations
ALTER TABLE booking_svc.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversation participants can read conversations" ON booking_svc.conversations;
CREATE POLICY "conversation participants can read conversations"
ON booking_svc.conversations FOR SELECT
USING (
  auth.uid() = customer_id
  OR auth.uid() = provider_id
);

DROP POLICY IF EXISTS "conversation participants can insert conversations" ON booking_svc.conversations;
CREATE POLICY "conversation participants can insert conversations"
ON booking_svc.conversations FOR INSERT
WITH CHECK (
  auth.uid() = customer_id
  OR auth.uid() = provider_id
);

DROP POLICY IF EXISTS "conversation participants can update conversations" ON booking_svc.conversations;
CREATE POLICY "conversation participants can update conversations"
ON booking_svc.conversations FOR UPDATE
USING (
  auth.uid() = customer_id
  OR auth.uid() = provider_id
)
WITH CHECK (
  auth.uid() = customer_id
  OR auth.uid() = provider_id
);

-- messages
ALTER TABLE booking_svc.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversation participants can read messages" ON booking_svc.messages;
CREATE POLICY "conversation participants can read messages"
ON booking_svc.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM booking_svc.conversations c
    WHERE c.id = booking_svc.messages.conversation_id
      AND (auth.uid() = c.customer_id OR auth.uid() = c.provider_id)
  )
);

DROP POLICY IF EXISTS "conversation participants can insert messages" ON booking_svc.messages;
CREATE POLICY "conversation participants can insert messages"
ON booking_svc.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM booking_svc.conversations c
    WHERE c.id = booking_svc.messages.conversation_id
      AND (auth.uid() = c.customer_id OR auth.uid() = c.provider_id)
  )
);

-- ============================================================
-- PAYMENT_SVC
-- ============================================================

-- payments
ALTER TABLE payment_svc.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment participants can read payments" ON payment_svc.payments;
CREATE POLICY "payment participants can read payments"
ON payment_svc.payments FOR SELECT
USING (
  auth.uid() = customer_id
  OR auth.uid() = provider_id
);

DROP POLICY IF EXISTS "customers can create payments" ON payment_svc.payments;
CREATE POLICY "customers can create payments"
ON payment_svc.payments FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- provider_payouts
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'payment_svc' AND table_name = 'provider_payouts') THEN
    ALTER TABLE payment_svc.provider_payouts ENABLE ROW LEVEL SECURITY;

    EXECUTE $policy$
      DROP POLICY IF EXISTS "providers can read own payouts" ON payment_svc.provider_payouts;
      CREATE POLICY "providers can read own payouts"
      ON payment_svc.provider_payouts FOR SELECT
      USING (auth.uid() = provider_id);
    $policy$;
  END IF;
END $$;

-- ============================================================
-- TRUST_SVC
-- ============================================================

-- reviews
ALTER TABLE trust_svc.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated users can read reviews" ON trust_svc.reviews;
CREATE POLICY "authenticated users can read reviews"
ON trust_svc.reviews FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "reviewers can insert reviews" ON trust_svc.reviews;
CREATE POLICY "reviewers can insert reviews"
ON trust_svc.reviews FOR INSERT
WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "reviewers can update own reviews" ON trust_svc.reviews;
CREATE POLICY "reviewers can update own reviews"
ON trust_svc.reviews FOR UPDATE
USING (auth.uid() = reviewer_id)
WITH CHECK (auth.uid() = reviewer_id);

-- provider_profile_reports
ALTER TABLE trust_svc.provider_profile_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reporters can insert reports" ON trust_svc.provider_profile_reports;
CREATE POLICY "reporters can insert reports"
ON trust_svc.provider_profile_reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reporters can read own reports" ON trust_svc.provider_profile_reports;
CREATE POLICY "reporters can read own reports"
ON trust_svc.provider_profile_reports FOR SELECT
USING (auth.uid() = reporter_id);

-- ============================================================
-- NOTIFICATION_SVC
-- ============================================================

-- notifications
ALTER TABLE notification_svc.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification recipients can read notifications" ON notification_svc.notifications;
CREATE POLICY "notification recipients can read notifications"
ON notification_svc.notifications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "actors can insert notifications" ON notification_svc.notifications;
CREATE POLICY "actors can insert notifications"
ON notification_svc.notifications FOR INSERT
WITH CHECK (
  auth.uid() = actor_id
  OR auth.uid() = user_id
);

DROP POLICY IF EXISTS "notification recipients can update notifications" ON notification_svc.notifications;
CREATE POLICY "notification recipients can update notifications"
ON notification_svc.notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- support_tickets
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'notification_svc' AND table_name = 'support_tickets') THEN
    ALTER TABLE notification_svc.support_tickets ENABLE ROW LEVEL SECURITY;

    EXECUTE $policy$
      DROP POLICY IF EXISTS "users can read own support tickets" ON notification_svc.support_tickets;
      CREATE POLICY "users can read own support tickets"
      ON notification_svc.support_tickets FOR SELECT
      USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "users can create support tickets" ON notification_svc.support_tickets;
      CREATE POLICY "users can create support tickets"
      ON notification_svc.support_tickets FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    $policy$;
  END IF;
END $$;

-- disputes
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'notification_svc' AND table_name = 'disputes') THEN
    ALTER TABLE notification_svc.disputes ENABLE ROW LEVEL SECURITY;

    EXECUTE $policy$
      DROP POLICY IF EXISTS "dispute participants can read disputes" ON notification_svc.disputes;
      CREATE POLICY "dispute participants can read disputes"
      ON notification_svc.disputes FOR SELECT
      USING (auth.uid() = raised_by);

      DROP POLICY IF EXISTS "users can raise disputes" ON notification_svc.disputes;
      CREATE POLICY "users can raise disputes"
      ON notification_svc.disputes FOR INSERT
      WITH CHECK (auth.uid() = raised_by);
    $policy$;
  END IF;
END $$;
