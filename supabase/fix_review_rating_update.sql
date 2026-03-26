-- ============================================================
-- ServEase: Fix Review Rating Update RLS Issue
-- Run this in Supabase Dashboard → SQL Editor
--
-- Problem: When a customer submits a review, the app needs to
-- update the provider's average_rating and total_reviews on
-- provider_catalog_svc.provider_profiles. But the customer
-- doesn't have RLS permission to write to the provider's row.
--
-- Solution: A SECURITY DEFINER function that runs with elevated
-- privileges, so any authenticated user can trigger a rating
-- recalculation for a provider.
-- ============================================================

CREATE OR REPLACE FUNCTION provider_catalog_svc.update_provider_rating(
  p_provider_id UUID,
  p_average_rating NUMERIC,
  p_total_reviews INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = provider_catalog_svc
AS $$
BEGIN
  UPDATE provider_catalog_svc.provider_profiles
  SET average_rating = p_average_rating,
      total_reviews  = p_total_reviews
  WHERE user_id = p_provider_id;
END;
$$;

-- Allow authenticated users to call this function
GRANT EXECUTE ON FUNCTION provider_catalog_svc.update_provider_rating(UUID, NUMERIC, INTEGER)
  TO authenticated;
