# Screen API Migration — Complete Remaining Direct Supabase Calls

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the 4 remaining customer/provider screens from direct Supabase calls to the NestJS backend API, add missing backend endpoints, and remove unused schema-scoped clients from the mobile app.

**Architecture:** Add new backend endpoints for customer profile (with customer_profiles), enriched booking details (booking + provider + service in one call), and provider service CRUD. Then rewire each screen to use `api.get/post/patch/put/delete` from `lib/api.ts`. Finally, remove `identityDb`, `providerCatalogDb`, `bookingDb` from `lib/db.ts`.

**Tech Stack:** NestJS 11, Supabase JS v2, Expo SDK 54, TypeScript

**Important notes:**
- Backend git repo is at `Backend/ServEase-BE-API/` (has its own `.git`)
- Mobile git repo is at `ServEase-mobile-test/` (has its own `.git`)
- Commit from within each project directory
- Tasks 1-3 are backend. Tasks 4-7 are mobile. Task 8 is cleanup.

---

## File Map

### Backend (`Backend/ServEase-BE-API/`)

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/modules/users/v3/users-v3.service.ts` | Add `getFullProfile` and `saveFullProfile` methods |
| Modify | `src/modules/users/v3/users-v3.controller.ts` | Add `GET/PUT profile/full` routes |
| Modify | `src/modules/booking/v3/booking-v3.service.ts` | Add `getBookingDetails` (enriched) |
| Modify | `src/modules/booking/v3/booking-v3.controller.ts` | Add `GET :bookingId/details` route |
| Modify | `src/modules/provider/v3/provider-v3.service.ts` | Add service CRUD + ensureIdentity methods |
| Modify | `src/modules/provider/v3/provider-v3.controller.ts` | Add service CRUD routes |

### Mobile (`ServEase-mobile-test/`)

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `app/customer-edit-profile.tsx` | Use API for profile load/save |
| Modify | `app/customer-booking-details.tsx` | Use API for booking details |
| Modify | `app/customer-track-order.tsx` | Use API for booking details |
| Modify | `app/(provider-tabs)/pricing.tsx` | Use API for all CRUD |
| Modify | `lib/db.ts` | Remove unused schema-scoped clients |

---

## Task 1: Backend — Customer Full Profile Endpoints

**Files:**
- Modify: `Backend/ServEase-BE-API/src/modules/users/v3/users-v3.service.ts`
- Modify: `Backend/ServEase-BE-API/src/modules/users/v3/users-v3.controller.ts`

- [ ] **Step 1: Add `getFullProfile` method to `users-v3.service.ts`**

Append after the existing `updateProfile` method:

```typescript
  async getFullProfile(userId: string) {
    const [userResult, profileResult] = await Promise.all([
      this.identityDb.from('users').select('*').eq('id', userId).maybeSingle(),
      this.identityDb.from('customer_profiles').select('*').eq('user_id', userId).maybeSingle(),
    ]);
    if (userResult.error && userResult.error.code !== 'PGRST116') throw userResult.error;
    return {
      user: userResult.data,
      customerProfile: profileResult.data,
    };
  }

  async saveFullProfile(userId: string, input: Record<string, any>) {
    const { full_name, contact_number, email, role, address } = input;

    const { error: userErr } = await this.identityDb
      .from('users')
      .upsert({
        id: userId,
        email: email || undefined,
        full_name,
        contact_number,
        role: role || 'customer',
      });
    if (userErr) throw userErr;

    const { error: profileErr } = await this.identityDb
      .from('customer_profiles')
      .upsert({
        user_id: userId,
        address,
      });
    if (profileErr) throw profileErr;

    return this.getFullProfile(userId);
  }
```

- [ ] **Step 2: Add routes to `users-v3.controller.ts`**

Add `Put` to the imports from `@nestjs/common`, then add these routes after the existing `updateProfile` route:

```typescript
  @Get('profile/full')
  async getFullProfile(@Req() req: any) {
    return this.usersV3Service.getFullProfile(req.user.id);
  }

  @Put('profile/full')
  async saveFullProfile(@Req() req: any, @Body() body: Record<string, any>) {
    return this.usersV3Service.saveFullProfile(req.user.id, body);
  }
```

- [ ] **Step 3: Verify backend compiles**

Run: `cd Backend/ServEase-BE-API && npx nest build`

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit backend**

```bash
cd Backend/ServEase-BE-API
git add src/modules/users/
git commit -m "feat: add full profile endpoints (user + customer_profiles)"
```

---

## Task 2: Backend — Enriched Booking Details Endpoint

**Files:**
- Modify: `Backend/ServEase-BE-API/src/modules/booking/v3/booking-v3.service.ts`
- Modify: `Backend/ServEase-BE-API/src/modules/booking/v3/booking-v3.controller.ts`

- [ ] **Step 1: Add `getBookingDetails` method to `booking-v3.service.ts`**

Append after the existing `getBookingById` method:

```typescript
  async getBookingDetails(bookingId: string) {
    const { data: booking, error } = await this.bookingDb
      .from('bookings')
      .select('id, booking_reference, status, service_address, scheduled_at, total_amount, provider_id, service_id, customer_id, customer_notes, created_at, cancellation_reason, cancellation_explanation, cancelled_at, cancelled_by')
      .eq('id', bookingId)
      .single();
    if (error) throw error;

    const [providerUser, providerProfile, service] = await Promise.all([
      this.identityDb
        .from('users')
        .select('id, full_name, is_verified, contact_number')
        .eq('id', booking.provider_id)
        .maybeSingle(),
      this.providerCatalogDb
        .from('provider_profiles')
        .select('user_id, business_name, average_rating, verification_status')
        .eq('user_id', booking.provider_id)
        .maybeSingle(),
      booking.service_id
        ? this.providerCatalogDb
            .from('provider_services')
            .select('id, title')
            .eq('id', booking.service_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    return {
      ...booking,
      provider: providerUser.data
        ? {
            ...providerUser.data,
            business_name: providerProfile.data?.business_name || null,
            average_rating: providerProfile.data?.average_rating || 0,
            verification_status: providerProfile.data?.verification_status || null,
          }
        : null,
      service: service.data,
    };
  }
```

- [ ] **Step 2: Add route to `booking-v3.controller.ts`**

Add this route **before** the existing `@Get(':bookingId')` route (so `:bookingId/details` matches first):

```typescript
  @Get(':bookingId/details')
  async getBookingDetails(@Param('bookingId') bookingId: string) {
    return this.bookingV3Service.getBookingDetails(bookingId);
  }
```

- [ ] **Step 3: Verify backend compiles**

Run: `cd Backend/ServEase-BE-API && npx nest build`

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit backend**

```bash
cd Backend/ServEase-BE-API
git add src/modules/booking/v3/
git commit -m "feat: add enriched booking details endpoint"
```

---

## Task 3: Backend — Provider Service CRUD Endpoints

**Files:**
- Modify: `Backend/ServEase-BE-API/src/modules/provider/v3/provider-v3.service.ts`
- Modify: `Backend/ServEase-BE-API/src/modules/provider/v3/provider-v3.controller.ts`

- [ ] **Step 1: Add service CRUD methods to `provider-v3.service.ts`**

Append these methods to the existing `ProviderV3Service` class:

```typescript
  async getProviderServicesList(userId: string) {
    const { data, error } = await this.providerCatalogDb
      .from('provider_services')
      .select('id, title, description, price, category_id')
      .eq('provider_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async createProviderServices(userId: string, input: { services: Array<{ title: string; description?: string; price: number; category_id: string }> }) {
    const rows = input.services.map((s) => ({
      provider_id: userId,
      title: s.title,
      description: s.description || null,
      price: s.price,
      category_id: s.category_id,
    }));
    const { data, error } = await this.providerCatalogDb
      .from('provider_services')
      .insert(rows)
      .select();
    if (error) throw error;
    return data || [];
  }

  async updateProviderService(userId: string, serviceId: string, input: Record<string, any>) {
    const { data, error } = await this.providerCatalogDb
      .from('provider_services')
      .update({
        title: input.title,
        description: input.description || null,
        price: input.price,
        category_id: input.category_id,
      })
      .eq('id', serviceId)
      .eq('provider_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteProviderService(userId: string, serviceId: string) {
    const { error } = await this.providerCatalogDb
      .from('provider_services')
      .delete()
      .eq('id', serviceId)
      .eq('provider_id', userId);
    if (error) throw error;
    return { success: true };
  }

  async ensureProviderIdentity(userId: string, meta: Record<string, any>) {
    const fullName = String(meta.full_name || '').trim() || `Provider ${userId.slice(0, 8)}`;
    const email = String(meta.email || '').trim().toLowerCase();
    const contactNumber = String(meta.contact_number || '').trim() || 'N/A';

    const { error: usersErr } = await this.identityDb.from('users').upsert({
      id: userId,
      role: 'provider',
      full_name: fullName,
      email: email || undefined,
      contact_number: contactNumber,
    });
    if (usersErr) console.warn('ensureProviderIdentity users upsert failed:', usersErr.message);

    const { error: profileErr } = await this.providerCatalogDb.from('provider_profiles').upsert({
      user_id: userId,
      business_name: meta.business_name || fullName,
    });
    if (profileErr) console.warn('ensureProviderIdentity profile upsert failed:', profileErr.message);

    return { success: true };
  }
```

- [ ] **Step 2: Add routes to `provider-v3.controller.ts`**

Add `Post, Delete` to the `@nestjs/common` imports (if not already present). Add these routes inside the existing `ProviderV3Controller` class:

```typescript
  @Get('services/:userId')
  async getProviderServices(@Param('userId') userId: string) {
    return this.providerV3Service.getProviderServicesList(userId);
  }

  @Post('services/:userId')
  async createProviderServices(
    @Param('userId') userId: string,
    @Body() body: { services: Array<{ title: string; description?: string; price: number; category_id: string }> },
  ) {
    return this.providerV3Service.createProviderServices(userId, body);
  }

  @Patch('services/:userId/:serviceId')
  async updateProviderService(
    @Param('userId') userId: string,
    @Param('serviceId') serviceId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.providerV3Service.updateProviderService(userId, serviceId, body);
  }

  @Delete('services/:userId/:serviceId')
  async deleteProviderService(
    @Param('userId') userId: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.providerV3Service.deleteProviderService(userId, serviceId);
  }

  @Post('ensure-identity/:userId')
  async ensureProviderIdentity(
    @Param('userId') userId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.providerV3Service.ensureProviderIdentity(userId, body);
  }
```

- [ ] **Step 3: Verify backend compiles**

Run: `cd Backend/ServEase-BE-API && npx nest build`

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit backend**

```bash
cd Backend/ServEase-BE-API
git add src/modules/provider/v3/
git commit -m "feat: add provider service CRUD and ensure-identity endpoints"
```

---

## Task 4: Mobile — Migrate customer-edit-profile.tsx

**Files:**
- Modify: `ServEase-mobile-test/app/customer-edit-profile.tsx`

- [ ] **Step 1: Replace Supabase imports with API**

Replace:
```typescript
import { supabase, identityDb } from '@/lib/db';
```

With:
```typescript
import { api } from '@/lib/api';
```

- [ ] **Step 2: Replace `loadProfile` function body**

Replace the entire `loadProfile` function (inside the useEffect) from:
```typescript
        const { data: userData } = await identityDb
          .from('users')
          .select('*')
          .eq('id', user!.id)
          .single();

        if (userData) {
          setFullName(userData.full_name || '');
          setPhone(userData.contact_number || '');
        }

        const { data: profileData } = await identityDb
          .from('customer_profiles')
          .select('*')
          .eq('user_id', user!.id)
          .single();

        if (profileData) {
          setAddress(profileData.address || '');
        }
```

With:
```typescript
        const result = await api.get<any>('/api/v3/users/profile/full');
        if (result?.user) {
          setFullName(result.user.full_name || '');
          setPhone(result.user.contact_number || '');
        }
        if (result?.customerProfile) {
          setAddress(result.customerProfile.address || '');
        }
```

- [ ] **Step 3: Replace `handleSave` Supabase calls**

Replace the try block contents in `handleSave` from:
```typescript
      const { error: userErr } = await identityDb
        .from('users')
        .upsert({
          id: user.id,
          email: user.email || email.trim(),
          full_name: fullName.trim(),
          contact_number: phone.trim(),
          role: 'customer',
        })

      if (userErr) throw userErr;

      const { error: profileErr } = await supabase
        .from('customer_profiles')
        .upsert({
          user_id: user.id,
          address: address.trim(),
        });

      if (profileErr) throw profileErr;
```

With:
```typescript
      await api.put<any>('/api/v3/users/profile/full', {
        full_name: fullName.trim(),
        contact_number: phone.trim(),
        email: user.email || email.trim(),
        role: 'customer',
        address: address.trim(),
      });
```

- [ ] **Step 4: Commit mobile**

```bash
cd ServEase-mobile-test
git add app/customer-edit-profile.tsx
git commit -m "feat: migrate customer-edit-profile to use backend API"
```

---

## Task 5: Mobile — Migrate customer-booking-details.tsx

**Files:**
- Modify: `ServEase-mobile-test/app/customer-booking-details.tsx`

- [ ] **Step 1: Replace Supabase imports with API**

Replace:
```typescript
import { supabase, identityDb, providerCatalogDb, bookingDb } from '@/lib/db';
```

With:
```typescript
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
```

Keep `supabase` only if the file uses `supabase.auth`, `supabase.channel()`, or `supabase.storage`. Check the file — if it uses `supabase.channel()` for realtime booking status, keep it. Otherwise remove it entirely.

- [ ] **Step 2: Replace the booking fetch logic**

Find the block that fetches booking + provider + service separately (around lines 124-139) and replace with a single API call:

Replace:
```typescript
        const { data: bookingRow, error: bookingError } = await bookingDb
          .from('bookings')
          .select('id,booking_reference,status,service_address,scheduled_at,total_amount,provider_id,service_id,customer_notes')
          .eq('id', bookingId)
          .single();
```

And the `Promise.all` that fetches provider user, provider profile, and service — replace the entire fetch block with:

```typescript
        const details = await api.get<any>(`/api/v3/bookings/${bookingId}/details`);
        if (!details) throw new Error('Booking not found');

        const bookingRow = details;
        const providerUser = details.provider;
        const providerProfile = details.provider;
        const serviceRow = details.service;
```

Then update the state setters to use these variables instead of the destructured Supabase results. The `details.provider` object now contains `id`, `full_name`, `is_verified`, `contact_number`, `business_name`, `average_rating`, `verification_status` combined.

- [ ] **Step 3: Commit mobile**

```bash
cd ServEase-mobile-test
git add app/customer-booking-details.tsx
git commit -m "feat: migrate customer-booking-details to use backend API"
```

---

## Task 6: Mobile — Migrate customer-track-order.tsx

**Files:**
- Modify: `ServEase-mobile-test/app/customer-track-order.tsx`

- [ ] **Step 1: Replace Supabase imports with API**

Replace:
```typescript
import { supabase, identityDb, providerCatalogDb, bookingDb } from '@/lib/db';
```

With:
```typescript
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
```

Keep `supabase` only if the file uses realtime subscriptions (`supabase.channel()`).

- [ ] **Step 2: Replace the booking fetch logic**

Same pattern as Task 5. Find the block that fetches booking + provider + service separately (around lines 53-72) and replace with:

```typescript
        const details = await api.get<any>(`/api/v3/bookings/${bookingId}/details`);
        if (!details) throw new Error('Booking not found');

        const bookingRow = details;
        const providerUser = details.provider;
        const providerProfile = details.provider;
        const serviceRow = details.service;
```

Then update the state setters to use these variables.

- [ ] **Step 3: Commit mobile**

```bash
cd ServEase-mobile-test
git add app/customer-track-order.tsx
git commit -m "feat: migrate customer-track-order to use backend API"
```

---

## Task 7: Mobile — Migrate pricing.tsx

**Files:**
- Modify: `ServEase-mobile-test/app/(provider-tabs)/pricing.tsx`

This is the largest screen migration. The pricing screen does: load categories, load services, create/update/delete services, ensure provider identity rows, and bootstrap categories.

- [ ] **Step 1: Replace imports**

Replace:
```typescript
import { supabase, identityDb, providerCatalogDb } from '@/lib/db';
```

With:
```typescript
import { api } from '@/lib/api';
```

- [ ] **Step 2: Replace `loadCategories` function**

Replace the entire `loadCategories` callback body with:

```typescript
  const loadCategories = useCallback(async () => {
    let rows: CategoryRow[] = [];

    try {
      const data = await api.get<any[]>('/api/v3/marketplace/categories');
      rows = (data || []).map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }));
    } catch (err) {
      console.warn('[PricingScreen] loadCategories failed:', err);
    }

    if (rows.length === 0 && user?.id) {
      const meta = (user.user_metadata ?? {}) as Record<string, any>;
      const fromSignup = String(meta.sub_category || meta.primary_category || '').trim() || 'General Services';
      const slug = slugify(fromSignup) || `general-services-${Date.now()}`;
      const syntheticId = `local-${Date.now()}`;
      rows = [{ id: syntheticId, name: fromSignup, slug }];
    }

    const meta = (user?.user_metadata ?? {}) as Record<string, any>;
    const selectedNames = [meta.sub_category, meta.primary_category]
      .map((v) => String(v || '').trim())
      .filter(Boolean);
    const selectedSlugs = selectedNames.map((n) => slugify(n));

    const scopedRows = selectedNames.length
      ? rows.filter((r) => selectedNames.some((n) => n.toLowerCase() === r.name.toLowerCase()) || selectedSlugs.includes(r.slug))
      : rows;

    const finalRows = scopedRows.length > 0 ? scopedRows : rows;
    setCategories(finalRows);

    if (finalRows.length > 0) {
      const preferred = String(meta.sub_category || meta.primary_category || '').trim().toLowerCase();
      const preferredRow = preferred
        ? finalRows.find((r) => r.name.toLowerCase() === preferred || r.slug === slugify(preferred))
        : null;
      if (categoryIds.length === 0 || !categoryIds.every((id) => finalRows.some((r) => r.id === id))) {
        setCategoryIds([preferredRow?.id || finalRows[0].id]);
      }
    }

    return finalRows;
  }, [categoryIds, user]);
```

- [ ] **Step 3: Replace `loadServices` function**

Replace the entire `loadServices` callback body with:

```typescript
  const loadServices = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await api.get<any[]>(`/api/v3/providers/services/${user.id}`);
      setServices((data || []) as ServiceRow[]);
    } catch (err) {
      console.warn('[PricingScreen] loadServices failed:', err);
    }
  }, [user?.id]);
```

- [ ] **Step 4: Replace `ensureCategoryIds` function**

Replace the entire `ensureCategoryIds` callback body with:

```typescript
  const ensureCategoryIds = useCallback(async () => {
    if (categoryIds.length > 0) return categoryIds;

    const rows = categories.length ? categories : await loadCategories();
    if (rows.length > 0) {
      const defaultId = rows[0].id;
      setCategoryIds([defaultId]);
      return [defaultId];
    }

    const syntheticId = `local-${Date.now()}`;
    const synthetic: CategoryRow = { id: syntheticId, name: 'General Services', slug: `general-services-${Date.now()}` };
    setCategories([synthetic]);
    setCategoryIds([synthetic.id]);
    return [synthetic.id];
  }, [categories, categoryIds, loadCategories]);
```

- [ ] **Step 5: Replace `ensureProviderIdentityRows` function**

Replace the entire `ensureProviderIdentityRows` callback body with:

```typescript
  const ensureProviderIdentityRows = useCallback(async () => {
    if (!user?.id) throw new Error('Missing authenticated user.');

    const meta = (user.user_metadata ?? {}) as Record<string, any>;
    await api.post<any>(`/api/v3/providers/ensure-identity/${user.id}`, {
      full_name: String(meta.full_name || meta.name || '').trim() || `Provider ${user.id.slice(0, 8)}`,
      email: String(user.email || '').trim().toLowerCase(),
      contact_number: String(meta.phone || meta.contact_number || '').trim() || 'N/A',
      business_name: String(meta.full_name || meta.name || '').trim() || `Provider ${user.id.slice(0, 8)}`,
    });
  }, [user]);
```

- [ ] **Step 6: Replace `handleDelete` Supabase call**

In `handleDelete`, replace:
```typescript
            const { error } = await providerCatalogDb
              .from('provider_services')
              .delete()
              .eq('id', id)
              .eq('provider_id', user.id);

            if (error) throw error;
```

With:
```typescript
            await api.delete<any>(`/api/v3/providers/services/${user.id}/${id}`);
```

- [ ] **Step 7: Replace `handleSubmit` Supabase calls**

In `handleSubmit`, replace the editing block:
```typescript
      if (editingId) {
        const payload = {
          ...basePayload,
          category_id: resolvedCategoryIds[0],
        };
        const { error } = await providerCatalogDb
          .from('provider_services')
          .update(payload)
          .eq('id', editingId)
          .eq('provider_id', user.id);
        if (error) {
          await ensureProviderIdentityRows();
          const { error: retryError } = await providerCatalogDb
            .from('provider_services')
            .update(payload)
            .eq('id', editingId)
            .eq('provider_id', user.id);
          if (retryError) throw retryError;
        }
      } else {
        const payloads = resolvedCategoryIds.map((categoryId) => ({
          ...basePayload,
          category_id: categoryId,
        }));
        const { error } = await providerCatalogDb.from('provider_services').insert(payloads);
        if (error) {
          await ensureProviderIdentityRows();
          const { error: retryError } = await providerCatalogDb.from('provider_services').insert(payloads);
          if (retryError) throw retryError;
        }
      }
```

With:
```typescript
      if (editingId) {
        try {
          await api.patch<any>(`/api/v3/providers/services/${user.id}/${editingId}`, {
            ...basePayload,
            category_id: resolvedCategoryIds[0],
          });
        } catch {
          await ensureProviderIdentityRows();
          await api.patch<any>(`/api/v3/providers/services/${user.id}/${editingId}`, {
            ...basePayload,
            category_id: resolvedCategoryIds[0],
          });
        }
      } else {
        const services = resolvedCategoryIds.map((categoryId) => ({
          title: basePayload.title,
          description: basePayload.description,
          price: basePayload.price,
          category_id: categoryId,
        }));
        try {
          await api.post<any>(`/api/v3/providers/services/${user.id}`, { services });
        } catch {
          await ensureProviderIdentityRows();
          await api.post<any>(`/api/v3/providers/services/${user.id}`, { services });
        }
      }
```

- [ ] **Step 8: Commit mobile**

```bash
cd ServEase-mobile-test
git add app/\(provider-tabs\)/pricing.tsx
git commit -m "feat: migrate pricing screen to use backend API"
```

---

## Task 8: Cleanup — Remove unused schema clients from lib/db.ts

**Files:**
- Modify: `ServEase-mobile-test/lib/db.ts`
- Modify: `ServEase-mobile-test/lib/customer-session.ts` (if it still imports from db.ts)

- [ ] **Step 1: Verify no more imports of schema clients**

Run from `ServEase-mobile-test/`:

```bash
grep -rn "identityDb\|providerCatalogDb\|bookingDb" --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v ".git"
```

Expected: Only `lib/db.ts` and `lib/customer-session.ts` should remain. If other files appear, they need migration first.

- [ ] **Step 2: Check `lib/customer-session.ts` usage**

If `customer-session.ts` still imports `identityDb`, check what it uses it for. If it's just a user upsert during onboarding, replace with an API call:

Replace:
```typescript
import { supabase, identityDb } from './db';
```

With:
```typescript
import { supabase } from './supabase';
import { api } from './api';
```

And replace any `identityDb.from('users').upsert(...)` with:
```typescript
await api.put<any>('/api/v3/users/profile/full', { ... });
```

- [ ] **Step 3: Simplify `lib/db.ts`**

Replace the entire file with:

```typescript
/**
 * Re-exports the Supabase client for auth, storage, and realtime.
 * All data access goes through the backend API (lib/api.ts).
 */
export { supabase } from './supabase';
```

- [ ] **Step 4: Update any remaining imports of `@/lib/db`**

Any file that imported `{ supabase }` from `@/lib/db` should now import from `@/lib/supabase` instead. Run:

```bash
grep -rn "from.*lib/db" --include="*.ts" --include="*.tsx" . | grep -v node_modules
```

Update each file to import from `@/lib/supabase`.

- [ ] **Step 5: Verify mobile compiles**

Run: `cd ServEase-mobile-test && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 6: Commit mobile**

```bash
cd ServEase-mobile-test
git add lib/db.ts lib/customer-session.ts lib/api.ts
git add app/ services/
git commit -m "chore: remove schema-scoped DB clients, all data goes through API"
```
