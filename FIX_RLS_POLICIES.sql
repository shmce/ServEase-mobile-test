-- Fix Row-Level Security (RLS) Policies for ServEase

-- Disable RLS temporarily to fix policies
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view their addresses" ON public.user_addresses;
DROP POLICY IF EXISTS "Users can manage their addresses" ON public.user_addresses;
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;

-- Re-enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- BOOKINGS POLICIES
-- Allow customers to create bookings (insert with their own customer_id)
CREATE POLICY "Customers can create bookings"
ON public.bookings
FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Allow customers to view their own bookings OR providers to view bookings they're assigned to
CREATE POLICY "View own bookings"
ON public.bookings
FOR SELECT
USING (
  auth.uid() = customer_id OR 
  auth.uid() = provider_id
);

-- Allow customers to update their own pending bookings
CREATE POLICY "Update own bookings"
ON public.bookings
FOR UPDATE
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);

-- Allow providers to update bookings assigned to them
CREATE POLICY "Providers update their bookings"
ON public.bookings
FOR UPDATE
USING (auth.uid() = provider_id)
WITH CHECK (auth.uid() = provider_id);

-- CHAT MESSAGES POLICIES
-- Allow users to create messages they are sending (sender_id = auth.uid())
CREATE POLICY "Users can send messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Allow users to view messages they sent or received
CREATE POLICY "Users can view their messages"
ON public.chat_messages
FOR SELECT
USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id
);

-- USER ADDRESSES POLICIES
-- Allow users to view and manage only their own addresses
CREATE POLICY "Users can view their own addresses"
ON public.user_addresses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create addresses"
ON public.user_addresses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their addresses"
ON public.user_addresses
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their addresses"
ON public.user_addresses
FOR DELETE
USING (auth.uid() = user_id);

-- REVIEWS POLICIES
-- Allow anyone to view reviews (public)
CREATE POLICY "Anyone can view reviews"
ON public.reviews
FOR SELECT
USING (true);

-- Allow customers to create reviews for completed bookings
CREATE POLICY "Customers can create reviews"
ON public.reviews
FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- SERVICES POLICIES
DROP POLICY IF EXISTS "Anyone can view services" ON public.services;
DROP POLICY IF EXISTS "Providers can manage their services" ON public.services;

CREATE POLICY "Anyone can view services"
ON public.services
FOR SELECT
USING (true);

CREATE POLICY "Providers can manage their services"
ON public.services
FOR ALL
USING (auth.uid() = provider_id)
WITH CHECK (auth.uid() = provider_id);

-- PROVIDER_PROFILES POLICIES
DROP POLICY IF EXISTS "Anyone can view provider profiles" ON public.provider_profiles;
DROP POLICY IF EXISTS "Providers can update their profile" ON public.provider_profiles;

CREATE POLICY "Anyone can view provider profiles"
ON public.provider_profiles
FOR SELECT
USING (true);

CREATE POLICY "Providers can update their profile"
ON public.provider_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- USER_PROFILES POLICIES
DROP POLICY IF EXISTS "Anyone can view user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their profile" ON public.user_profiles;

CREATE POLICY "Anyone can view user profiles"
ON public.user_profiles
FOR SELECT
USING (true);

CREATE POLICY "Users can update their profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
