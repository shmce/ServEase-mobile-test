-- Temporarily disable RLS for testing
-- This allows any authenticated user to create bookings without requiring a pre-existing profile

-- Disable RLS on bookings table to allow testing
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- After testing is complete, you can re-enable with:
-- ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
-- And use the previous RLS policies from FIX_RLS_POLICIES.sql
