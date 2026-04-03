-- ============================================================
-- ServEase: Fix Missing RLS Policies in Microservice Schemas
-- Run this in Supabase Dashboard → SQL Editor
--
-- PREREQUISITE: Make sure all 6 schemas are listed in:
--   Supabase Dashboard → Settings → API → Extra Schema
--   → identity_svc, provider_catalog_svc, booking_svc,
--     payment_svc, trust_svc, notification_svc
--
-- Without that, PostgREST cannot see the schemas and ALL
-- schema-scoped queries from the app will fail.
-- ============================================================

-- ============================================================
-- provider_catalog_svc.service_categories
-- Currently only has a SELECT policy.
-- Missing: INSERT (needed during signup & pricing bootstrap)
-- ============================================================

DROP POLICY IF EXISTS "authenticated users can insert service categories" ON provider_catalog_svc.service_categories;
CREATE POLICY "authenticated users can insert service categories"
ON provider_catalog_svc.service_categories FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated users can update service categories" ON provider_catalog_svc.service_categories;
CREATE POLICY "authenticated users can update service categories"
ON provider_catalog_svc.service_categories FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================
-- identity_svc.users
-- Currently only has SELECT + UPDATE policies.
-- Missing: INSERT (needed during signup to create the user row)
-- ============================================================

DROP POLICY IF EXISTS "users can insert own record" ON identity_svc.users;
CREATE POLICY "users can insert own record"
ON identity_svc.users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ============================================================
-- Verify: These policies should already exist from
-- 03_rls_and_grants.sql but are listed here for reference.
-- Uncomment and run them ONLY if you see errors about
-- missing policies for these tables.
-- ============================================================

-- provider_catalog_svc.provider_services (should have FOR ALL)
-- provider_catalog_svc.provider_profiles (should have INSERT + UPDATE)
-- identity_svc.users (should have SELECT + UPDATE)
