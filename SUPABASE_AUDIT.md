# ServEase Supabase Audit - Full Functionality Check

## 1. CRITICAL ISSUES TO VERIFY

### Issue 1: RLS Policies blocking public queries?
**Current Status**: Need to verify RLS doesn't block:
- ✅ `provider_profiles` read access (must be public)
- ✅ `services` read access (must be public)  
- ✅ `reviews` read access (must be public)
- ✅ `user_profiles` read access (must be public for display)

### Issue 2: FK constraint removed but data might not exist?
**Current Status**: FK removed from `bookings.customer_id` ✅
- But: Seed data inserted? Need to verify users exist in seed

### Issue 3: Auth trigger might not be creating profiles?
**Current Status**: Trigger created ✅
- But: Only works for NEW signups, not existing users
- Workaround: Need to manually create user_profiles for test accounts

## 2. DATA VERIFICATION CHECKLIST

### Tables that MUST exist with data:
- [ ] `user_profiles` - 5 users (4 providers + 1 customer)
- [ ] `provider_profiles` - 4 providers linked to user_profiles
- [ ] `services` - 12 services across 4 providers
- [ ] `reviews` - 4 reviews from customer to providers
- [ ] `user_addresses` - 2 addresses for demo customer
- [ ] `bookings` - (empty, ready for new bookings)
- [ ] `chat_messages` - (empty, ready for chat)

### Critical FK relationships:
- [ ] `provider_profiles.user_id` → `user_profiles.id` (MUST match)
- [ ] `services.provider_id` → `provider_profiles.id` (MUST match)
- [ ] `reviews.provider_id` → `provider_profiles.id` (MUST match)
- [ ] `reviews.customer_id` → `user_profiles.id` (MUST match)

## 3. CODE QUERIES - What the app expects

### Provider Profile Query (needs to work):
```typescript
supabase
  .from('provider_profiles')
  .select(`
    *,
    user_profiles(full_name, avatar_url, phone)
  `)
  .eq('id', providerId)
  .single()
```
**Requires**:
- ✅ `provider_profiles` table exists
- ✅ Can JOIN with `user_profiles`
- ✅ RLS allows SELECT for authenticated users
- ✅ Data exists for providerId

### Services Query (needs to work):
```typescript
supabase
  .from('services')
  .select('id, title, description, starting_price, duration')
  .eq('provider_id', providerId)
```
**Requires**:
- ✅ `services` table exists
- ✅ Has `provider_id` column
- ✅ RLS allows SELECT 
- ✅ Data exists for provider

### Reviews Query (needs to work):
```typescript
supabase
  .from('reviews')
  .select(`
    id, rating, content, created_at, image_url,
    user_profiles(full_name, avatar_url)
  `)
  .eq('provider_id', providerId)
```
**Requires**:
- ✅ `reviews` table exists
- ✅ Can JOIN with `user_profiles`
- ✅ RLS allows SELECT
- ✅ Data exists for provider

### Booking Insert (needs to work):
```typescript
supabase.from('bookings').insert({
  customer_id: user.id,
  provider_id: providerIdIsValid ? params.providerId : null,
  service_name: service,
  address: address.fullAddress,
  scheduled_at: scheduledDateTime,
  notes: notes,
  status: 'pending',
  total_price: 1500,
})
```
**Requires**:
- ✅ FK constraint removed ✅ (already done)
- ✅ RLS allows INSERT where `auth.uid() = customer_id`
- ✅ User profile exists for customer_id (or allow null)

## 4. POTENTIAL PROBLEMS & SOLUTIONS

### Problem 1: RLS policy requires user_profiles to exist
**Symptom**: Booking fails even though FK removed
**Cause**: RLS checking for auth.uid() = customer_id but user_profile doesn't exist
**Solution**: Create user_profiles for current auth user

### Problem 2: Services don't show for provider
**Symptom**: "No services available"
**Cause**: Services table empty OR RLS blocking OR provider_id doesn't match
**Solution**: Run SEED_DATA.sql to populate services

### Problem 3: Reviews show as empty
**Symptom**: "No reviews" section
**Cause**: Reviews table empty OR RLS blocking JOIN with user_profiles
**Solution**: Run SEED_DATA.sql which includes sample reviews

### Problem 4: Provider list doesn't load
**Symptom**: Can't see providers when browsing
**Cause**: provider_profiles table has wrong structure OR RLS blocking reads
**Solution**: Verify `provider_profiles` exists and RLS allows reads

## 5. WHAT NEEDS TO RUN IN SQL EDITOR (IN ORDER)

```
Step 1: Run BEST_PRACTICE_FK_REMOVAL.sql
Result: FK constraint removed, new RLS policies created

Step 2: Run SETUP_AUTH_TRIGGER.sql
Result: Auth trigger created for auto-profile creation

Step 3: Run SEED_DATA.sql
Result: Test data populated (4 providers, 12 services, 4 reviews, 1 customer)

Step 4: Verify data
Query: SELECT COUNT(*) FROM provider_profiles WHERE id = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';
Expected: 1 row
```

## 6. MISSING STEP - Create user_profiles for test users

If seed data exists but app still fails, we need to create test auth users linked to seed data.

**Option A**: Create via Supabase Dashboard
1. Go to Authentication > Users
2. Create test user with email: juan@servease.ph, password: test123
3. Set user ID to: a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d
4. Metadata: { full_name: "Juan dela Cruz", user_type: "provider" }

**Option B**: Create SQL to link existing users
```sql
-- Manually update user_profiles if auth users exist
UPDATE public.user_profiles 
SET id = (SELECT id FROM auth.users WHERE email = 'juan@servease.ph')
WHERE full_name = 'Juan dela Cruz';
```

## 7. TESTING CHECKLIST

After above steps, test in app:

- [ ] Can login as customer
- [ ] Can see provider list (provider_profiles)
- [ ] Can click on provider and see their profile
- [ ] Can see provider services
- [ ] Can see provider reviews
- [ ] Can create a booking
- [ ] Can logout and redirect to login page

## 8. WHAT I DID THAT MIGHT BREAK THINGS

1. ✅ Removed FK constraint on `bookings.customer_id`
   - **Impact**: Bookings can now be created without user_profile
   - **Risk**: If user_profile doesn't exist, booking has no customer data

2. ✅ Updated RLS policies (removed strict FK checks)
   - **Impact**: Less restrictive, more flexible
   - **Risk**: Need to verify policies still work correctly

3. ✅ Created auth trigger for auto-profile creation
   - **Impact**: New signups auto-create profiles
   - **Risk**: Only works for NEW signups, not existing auth users

4. ⚠️ Modified signup code to include user_type metadata
   - **Impact**: Profiles created with correct user_type (customer/provider)
   - **Risk**: Old auth users won't have metadata

## 9. WHAT TO CHECK RIGHT NOW

1. **Verify seed data was inserted**
```sql
SELECT id, full_name, user_type FROM public.user_profiles LIMIT 5;
```
Expected: 5 rows (4 providers, 1 customer)

2. **Verify provider_profiles exist**
```sql
SELECT id, rating, bio FROM public.provider_profiles LIMIT 4;
```
Expected: 4 rows with data

3. **Verify services exist**
```sql
SELECT id, title, provider_id FROM public.services LIMIT 12;
```
Expected: 12 rows, provider_id matches one of 4 providers

4. **Verify RLS policies**
```sql
SELECT schema, tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;
```
Check that `provider_profiles`, `services`, `reviews` have SELECT policies

5. **Check FK constraint gone**
```sql
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name='bookings' AND constraint_type='FOREIGN KEY';
```
Expected: No row for `bookings_customer_id_fkey`
