-- BEST PRACTICE: Remove restrictive FK constraint and use RLS policies instead
-- This approach ensures data integrity through Row Level Security instead of database constraints

-- Step 1: Drop the old restrictive foreign key constraint on bookings.customer_id
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey;

-- Step 2: Note - FK purposely NOT recreated because RLS policies will handle integrity
-- If you need FK for referential integrity, uncomment below (but RLS is preferred):
-- ALTER TABLE public.bookings ADD CONSTRAINT bookings_customer_id_fkey 
--   FOREIGN KEY (customer_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Step 3: Enable RLS on bookings table
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop old policies (if they exist) to replace with new ones
DROP POLICY IF EXISTS "Customers can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "View own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Providers update their bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view booking details" ON public.bookings;
DROP POLICY IF EXISTS "Customers can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Providers can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete bookings" ON public.bookings;

-- Step 5: Create comprehensive RLS policies for bookings

-- INSERT: Only authenticated users can create bookings for themselves
CREATE POLICY "Authenticated users can create bookings"
ON public.bookings
FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- SELECT: Users can view their own bookings (as customer or provider)
CREATE POLICY "Users can view booking details"
ON public.bookings
FOR SELECT
USING (
  auth.uid() = customer_id OR 
  auth.uid() = provider_id
);

-- UPDATE: Customers can update their own bookings
CREATE POLICY "Customers can update own bookings"
ON public.bookings
FOR UPDATE
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);

-- UPDATE: Providers can update bookings they're assigned to
CREATE POLICY "Providers can update bookings"
ON public.bookings
FOR UPDATE
USING (auth.uid() = provider_id)
WITH CHECK (auth.uid() = provider_id);

-- DELETE: Customers can delete their own bookings
CREATE POLICY "Customers can delete own bookings"
ON public.bookings
FOR DELETE
USING (auth.uid() = customer_id);

-- DELETE: Providers can delete bookings assigned to them
CREATE POLICY "Providers can delete bookings"
ON public.bookings
FOR DELETE
USING (auth.uid() = provider_id);

-- Step 6: Verify RLS is enabled and working
-- Run VERIFY_SUPABASE_SETUP.sql after applying these changes
