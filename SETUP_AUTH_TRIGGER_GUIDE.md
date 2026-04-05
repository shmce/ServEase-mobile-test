# Setting Up Auth Triggers for Auto-Profile Creation

## Overview
When users sign up via Supabase Authentication, this trigger automatically creates a `user_profile` entry. This eliminates the need for separate signup flows and ensures data consistency.

## How It Works

```
User Signs Up
     ↓
Supabase Auth creates auth.users entry
     ↓
Trigger fires automatically
     ↓
user_profiles table gets auto-populated
     ↓
User can immediately create bookings ✅
```

## Setup Steps

### Step 1: Create the Trigger Function
Run this in your Supabase SQL Editor:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, email, user_type, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;
```

### Step 2: Create the Trigger
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
```

## Frontend Implementation

When users sign up, pass metadata that the trigger will use:

```typescript
const { data, error } = await supabase.auth.signUp({
  email: userEmail,
  password: userPassword,
  options: {
    data: {
      full_name: displayName,
      user_type: 'customer'  // or 'provider'
    }
  }
});

if (error) {
  console.error('Signup failed:', error);
} else {
  console.log('User created and profile auto-generated!');
  // User can now book immediately
}
```

## What Gets Created Automatically

When the trigger fires, it creates a `user_profile` with:

| Column | Source |
|--------|--------|
| `id` | `auth.users.id` |
| `full_name` | From signup metadata (fallback: "User") |
| `email` | `auth.users.email` |
| `user_type` | From signup metadata (fallback: "customer") |
| `created_at` | Current timestamp |
| `updated_at` | Current timestamp |

## Example Flow

**User Signs Up:**
```json
{
  "email": "juan@example.com",
  "password": "secure_password",
  "full_name": "Juan dela Cruz",
  "user_type": "provider"
}
```

**Auto-Created Profile:**
```sql
id: abc123-xyz (from auth.users)
full_name: Juan dela Cruz
email: juan@example.com
user_type: provider
created_at: 2026-04-05 18:50:00
updated_at: 2026-04-05 18:50:00
```

**Result:** Juan can immediately browse providers and create bookings! ✅

## Verification

To verify the trigger is working:

1. Create a new auth user in Supabase Dashboard
2. Check the `user_profiles` table
3. A new row should appear automatically

Or run:
```sql
SELECT id, email, user_type FROM user_profiles WHERE created_at > NOW() - INTERVAL '1 minute';
```

## Troubleshooting

**Profile not created?**
- Check trigger logs: `SELECT * FROM pg_stat_user_functions WHERE proname = 'handle_new_user';`
- Verify auth.users has data
- Check RLS policies on user_profiles

**Metadata not passed?**
- Ensure `options.data` is included in signUp call
- Metadata must match column names exactly (case-sensitive)

## Security Notes

- ✅ Trigger uses `SECURITY DEFINER` so it runs with function owner permissions
- ✅ RLS policies still apply to user_profiles (users can only access their own)
- ✅ `ON CONFLICT (id) DO NOTHING` prevents duplicate inserts
