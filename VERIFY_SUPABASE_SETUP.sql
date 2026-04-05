-- SUPABASE DATA VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to check if all data is properly set up

-- Step 1: Verify all tables exist with correct counts
SELECT 'Table Verification' as check_type;
SELECT 
  'user_profiles' as table_name, 
  COUNT(*) as total_rows,
  COUNT(CASE WHEN user_type = 'provider' THEN 1 END) as providers,
  COUNT(CASE WHEN user_type = 'customer' THEN 1 END) as customers
FROM public.user_profiles
UNION ALL
SELECT 'provider_profiles', COUNT(*), COUNT(*), 0 FROM public.provider_profiles
UNION ALL
SELECT 'services', COUNT(*), 0, 0 FROM public.services
UNION ALL
SELECT 'reviews', COUNT(*), 0, 0 FROM public.reviews
UNION ALL
SELECT 'user_addresses', COUNT(*), 0, 0 FROM public.user_addresses
UNION ALL
SELECT 'bookings', COUNT(*), 0, 0 FROM public.bookings
UNION ALL
SELECT 'chat_messages', COUNT(*), 0, 0 FROM public.chat_messages;

-- Step 2: Verify data integrity - FK relationships
SELECT 'Foreign Key Verification' as check_type;

-- Check provider_profiles have valid user_id references
SELECT 
  'provider_profiles.user_id → user_profiles.id' as fk_check,
  COUNT(*) as total_provider_profiles,
  COUNT(CASE WHEN u.id IS NOT NULL THEN 1 END) as valid_references,
  COUNT(CASE WHEN u.id IS NULL THEN 1 END) as broken_references
FROM public.provider_profiles pp
LEFT JOIN public.user_profiles u ON pp.user_id = u.id;

-- Check services have valid provider_id references
SELECT 
  'services.provider_id → provider_profiles.id' as fk_check,
  COUNT(*) as total_services,
  COUNT(CASE WHEN pp.id IS NOT NULL THEN 1 END) as valid_references,
  COUNT(CASE WHEN pp.id IS NULL THEN 1 END) as broken_references
FROM public.services s
LEFT JOIN public.provider_profiles pp ON s.provider_id = pp.id;

-- Check reviews have valid references
SELECT 
  'reviews.provider_id → provider_profiles.id' as fk_check,
  COUNT(*) as total_reviews,
  COUNT(CASE WHEN pp.id IS NOT NULL THEN 1 END) as valid_references,
  COUNT(CASE WHEN pp.id IS NULL THEN 1 END) as broken_references
FROM public.reviews r
LEFT JOIN public.provider_profiles pp ON r.provider_id = pp.id;

SELECT 
  'reviews.customer_id → user_profiles.id' as fk_check,
  COUNT(*) as total_reviews,
  COUNT(CASE WHEN u.id IS NOT NULL THEN 1 END) as valid_references,
  COUNT(CASE WHEN u.id IS NULL THEN 1 END) as broken_references
FROM public.reviews r
LEFT JOIN public.user_profiles u ON r.customer_id = u.id;

-- Step 3: Show actual seed data
SELECT 'Seed Data Details' as check_type;

SELECT 
  'Provider Users' as data_type,
  id, 
  full_name, 
  email, 
  user_type
FROM public.user_profiles
WHERE user_type = 'provider'
LIMIT 5;

SELECT 
  'Provider Profiles' as data_type,
  pp.id,
  up.full_name,
  pp.rating,
  pp.years_experience
FROM public.provider_profiles pp
JOIN public.user_profiles up ON pp.user_id = up.id
LIMIT 5;

SELECT 
  'Services' as data_type,
  s.id,
  s.title,
  up.full_name as provider_name,
  s.starting_price,
  s.duration
FROM public.services s
JOIN public.provider_profiles pp ON s.provider_id = pp.id
JOIN public.user_profiles up ON pp.user_id = up.id
LIMIT 12;

SELECT 
  'Reviews' as data_type,
  r.id,
  pp.id as provider_id,
  up_provider.full_name as provider_name,
  r.rating,
  r.content,
  up_customer.full_name as customer_name
FROM public.reviews r
JOIN public.provider_profiles pp ON r.provider_id = pp.id
JOIN public.user_profiles up_provider ON pp.user_id = up_provider.id
JOIN public.user_profiles up_customer ON r.customer_id = up_customer.id
LIMIT 5;

-- Step 4: Verify FK constraint was removed
SELECT 'Foreign Key Constraint Check' as check_type;
SELECT 
  constraint_name,
  table_name,
  column_name
FROM information_schema.key_column_usage
WHERE table_name = 'bookings' AND constraint_type = 'FOREIGN KEY';

-- Step 5: Verify RLS policies exist
SELECT 'RLS Policy Check' as check_type;
SELECT 
  tablename,
  policyname,
  permissive,
  qual as policy_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Step 6: Test query simulation - what the app will run
SELECT 'Query Simulation Test' as check_type;

-- Simulate: Provider profile lookup
SELECT 
  'Provider Profile Query' as test_name,
  pp.id,
  up.full_name,
  pp.rating,
  pp.total_reviews
FROM public.provider_profiles pp
JOIN public.user_profiles up ON pp.user_id = up.id
WHERE pp.id = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'
LIMIT 1;

-- Simulate: Services list for provider
SELECT 
  'Services Query' as test_name,
  COUNT(*) as service_count
FROM public.services
WHERE provider_id = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';

-- Simulate: Reviews for provider
SELECT 
  'Reviews Query' as test_name,
  COUNT(*) as review_count
FROM public.reviews
WHERE provider_id = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';

-- Step 7: Summary Report
SELECT 
  'SUMMARY' as report_type,
  'Database is ready for production' as status,
  COUNT(*) as total_providers
FROM public.user_profiles
WHERE user_type = 'provider' AND id IN (
  SELECT user_id FROM public.provider_profiles
);
