# Backend API Gateway — Plan 2: Endpoints & Mobile Service Rewrites

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create all 45 v3 backend endpoints as thin pass-throughs and rewrite all 16 mobile service files to call the backend instead of Supabase directly.

**Architecture:** Each task pairs a backend module (controller + service) with the corresponding mobile service rewrite. Backend endpoints are thin: validate auth, query Supabase via schema-scoped clients, return result. Mobile services become thin API wrappers. Business logic stays in mobile temporarily (moved to backend in Plan 3).

**Tech Stack:** NestJS 11, Supabase JS v2, Expo SDK 54, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-28-backend-api-gateway-design.md`

**Depends on:** Plan 1 (foundation) must be complete.

**Important notes:**
- Backend git repo is at `Backend/ServEase-BE-API/` (has its own `.git`)
- Mobile git repo is at `ServEase-mobile-test/` (has its own `.git`)
- Commit from within each project directory, not from the parent
- All backend controllers use prefix `api/v3/`
- All services inject schema-scoped clients via `@Inject(TOKEN_NAME)`
- The `req.user` object (set by `SupabaseAuthGuard`) contains the authenticated Supabase user with `.id` property

---

## Injection Pattern Reference

Every backend service in this plan follows the same injection pattern. Use this for all tasks:

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { IDENTITY_DB } from '../../lib/schema-clients';

@Injectable()
export class ExampleService {
  constructor(@Inject(IDENTITY_DB) private readonly identityDb: any) {}

  async getUser(userId: string) {
    const { data, error } = await this.identityDb.from('users').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
  }
}
```

The `@Inject(TOKEN)` pattern is required because schema-scoped clients are provided as string tokens, not classes.

---

## Task 1: Users & Profiles

**Backend files:**
- Create: `Backend/ServEase-BE-API/src/modules/users/v3/users-v3.controller.ts`
- Create: `Backend/ServEase-BE-API/src/modules/users/v3/users-v3.service.ts`
- Modify: `Backend/ServEase-BE-API/src/modules/users/users.module.ts`

**Mobile files:**
- Rewrite: `ServEase-mobile-test/services/profileService.ts`
- Rewrite: `ServEase-mobile-test/services/api.ts`

### Backend

- [ ] **Step 1: Create `src/modules/users/v3/users-v3.service.ts`**

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { IDENTITY_DB } from '../../../lib/schema-clients';

@Injectable()
export class UsersV3Service {
  constructor(@Inject(IDENTITY_DB) private readonly identityDb: any) {}

  async getProfile(userId: string) {
    const { data, error } = await this.identityDb
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateProfile(userId: string, updates: Record<string, any>) {
    const { data, error } = await this.identityDb
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
```

- [ ] **Step 2: Create `src/modules/users/v3/users-v3.controller.ts`**

```typescript
import { Controller, Get, Patch, Body, Req } from '@nestjs/common';
import { UsersV3Service } from './users-v3.service';

@Controller('api/v3/users')
export class UsersV3Controller {
  constructor(private readonly usersV3Service: UsersV3Service) {}

  @Get('profile')
  async getProfile(@Req() req: any) {
    return this.usersV3Service.getProfile(req.user.id);
  }

  @Patch('profile')
  async updateProfile(@Req() req: any, @Body() body: Record<string, any>) {
    return this.usersV3Service.updateProfile(req.user.id, body);
  }
}
```

- [ ] **Step 3: Register in `src/modules/users/users.module.ts`**

Add `UsersV3Controller` to controllers and `UsersV3Service` to providers. Add imports for both.

- [ ] **Step 4: Build and verify**

Run: `cd Backend/ServEase-BE-API && npx nest build`

- [ ] **Step 5: Commit backend**

```bash
cd Backend/ServEase-BE-API
git add src/modules/users/
git commit -m "feat: add v3 users/profile endpoints"
```

### Mobile

- [ ] **Step 6: Rewrite `services/api.ts`**

```typescript
import { api } from '../lib/api';

export const getUserProfile = async (userId: string) => {
  return api.get<any>('/api/v3/users/profile');
};
```

- [ ] **Step 7: Rewrite `services/profileService.ts`**

```typescript
import { api } from '../lib/api';

export const getProfile = async (userId: string) => {
  return api.get<any>('/api/v3/users/profile');
};

export const updateProfile = async (userId: string, updates: Record<string, any>) => {
  return api.patch<any>('/api/v3/users/profile', updates);
};
```

- [ ] **Step 8: Commit mobile**

```bash
cd ServEase-mobile-test
git add services/api.ts services/profileService.ts
git commit -m "feat: rewrite profileService and api.ts to use backend"
```

---

## Task 2: Addresses

**Backend files:**
- Create: `Backend/ServEase-BE-API/src/modules/addresses/addresses.controller.ts`
- Create: `Backend/ServEase-BE-API/src/modules/addresses/addresses.service.ts`
- Create: `Backend/ServEase-BE-API/src/modules/addresses/addresses.module.ts`
- Modify: `Backend/ServEase-BE-API/src/app.module.ts`

**Mobile files:**
- Rewrite: `ServEase-mobile-test/services/addressService.ts`

### Backend

- [ ] **Step 1: Create `src/modules/addresses/addresses.service.ts`**

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { IDENTITY_DB } from '../../lib/schema-clients';

@Injectable()
export class AddressesService {
  constructor(@Inject(IDENTITY_DB) private readonly identityDb: any) {}

  async getUserAddresses(userId: string) {
    const { data, error } = await this.identityDb
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async addAddress(userId: string, address: Record<string, any>) {
    const { data, error } = await this.identityDb
      .from('user_addresses')
      .insert({ ...address, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateAddress(id: string, updates: Record<string, any>) {
    const { data, error } = await this.identityDb
      .from('user_addresses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteAddress(id: string) {
    const { error } = await this.identityDb
      .from('user_addresses')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  }
}
```

- [ ] **Step 2: Create `src/modules/addresses/addresses.controller.ts`**

```typescript
import { Controller, Get, Post, Patch, Delete, Param, Body, Req } from '@nestjs/common';
import { AddressesService } from './addresses.service';

@Controller('api/v3/addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  async getUserAddresses(@Req() req: any) {
    return this.addressesService.getUserAddresses(req.user.id);
  }

  @Post()
  async addAddress(@Req() req: any, @Body() body: Record<string, any>) {
    return this.addressesService.addAddress(req.user.id, body);
  }

  @Patch(':id')
  async updateAddress(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.addressesService.updateAddress(id, body);
  }

  @Delete(':id')
  async deleteAddress(@Param('id') id: string) {
    return this.addressesService.deleteAddress(id);
  }
}
```

- [ ] **Step 3: Create `src/modules/addresses/addresses.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';

@Module({
  controllers: [AddressesController],
  providers: [AddressesService],
})
export class AddressesModule {}
```

- [ ] **Step 4: Add `AddressesModule` to `src/app.module.ts` imports**

Add import and add to the `imports` array.

- [ ] **Step 5: Build, commit backend**

```bash
cd Backend/ServEase-BE-API && npx nest build
git add src/modules/addresses/ src/app.module.ts
git commit -m "feat: add v3 addresses CRUD endpoints"
```

### Mobile

- [ ] **Step 6: Rewrite `services/addressService.ts`**

```typescript
import { api } from '../lib/api';

export const getUserAddresses = async (userId: string) => {
  return api.get<any[]>('/api/v3/addresses');
};

export const addAddress = async (address: Record<string, any>) => {
  return api.post<any>('/api/v3/addresses', address);
};

export const updateAddress = async (id: string, updates: Record<string, any>) => {
  return api.patch<any>(`/api/v3/addresses/${id}`, updates);
};

export const deleteAddress = async (id: string) => {
  return api.delete<any>(`/api/v3/addresses/${id}`);
};
```

- [ ] **Step 7: Commit mobile**

```bash
cd ServEase-mobile-test
git add services/addressService.ts
git commit -m "feat: rewrite addressService to use backend"
```

---

## Task 3: Marketplace

**Backend files:**
- Create: `Backend/ServEase-BE-API/src/modules/marketplace/marketplace.controller.ts`
- Create: `Backend/ServEase-BE-API/src/modules/marketplace/marketplace.service.ts`
- Create: `Backend/ServEase-BE-API/src/modules/marketplace/marketplace.module.ts`
- Modify: `Backend/ServEase-BE-API/src/app.module.ts`

**Mobile files:**
- Rewrite: `ServEase-mobile-test/services/marketplaceService.ts`

### Backend

- [ ] **Step 1: Create `src/modules/marketplace/marketplace.service.ts`**

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { PROVIDER_CATALOG_DB, IDENTITY_DB, TRUST_DB } from '../../lib/schema-clients';

@Injectable()
export class MarketplaceService {
  constructor(
    @Inject(PROVIDER_CATALOG_DB) private readonly providerCatalogDb: any,
    @Inject(IDENTITY_DB) private readonly identityDb: any,
    @Inject(TRUST_DB) private readonly trustDb: any,
  ) {}

  async getServiceCategories() {
    const { data, error } = await this.providerCatalogDb
      .from('service_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return data || [];
  }

  async getServicesByCategoryName(categoryName: string) {
    const { data: categories } = await this.providerCatalogDb
      .from('service_categories')
      .select('id')
      .ilike('name', categoryName)
      .limit(1);

    if (!categories?.length) return [];

    const { data, error } = await this.providerCatalogDb
      .from('provider_services')
      .select('*')
      .eq('category_id', categories[0].id);
    if (error) throw error;
    return data || [];
  }

  async getProvidersByServiceName(serviceName: string) {
    const { data: services } = await this.providerCatalogDb
      .from('provider_services')
      .select('*')
      .ilike('title', `%${serviceName}%`);

    if (!services?.length) return [];

    const providerIds = [...new Set(services.map((s: any) => s.provider_id))];

    const [usersResult, profilesResult] = await Promise.all([
      this.identityDb.from('users').select('*').in('id', providerIds),
      this.providerCatalogDb.from('provider_profiles').select('*').in('user_id', providerIds),
    ]);

    const usersMap = new Map((usersResult.data || []).map((u: any) => [u.id, u]));
    const profilesMap = new Map((profilesResult.data || []).map((p: any) => [p.user_id, p]));

    return providerIds.map((pid: string) => {
      const user = usersMap.get(pid);
      const profile = profilesMap.get(pid);
      const providerServices = services.filter((s: any) => s.provider_id === pid);
      const cheapest = Math.min(...providerServices.map((s: any) => s.price || 0));
      return {
        providerId: pid,
        fullName: user?.full_name || '',
        businessName: profile?.business_name || '',
        averageRating: profile?.average_rating || 0,
        totalReviews: profile?.total_reviews || 0,
        startingPrice: cheapest,
        services: providerServices,
      };
    });
  }

  async getProviderProfileData(providerId: string) {
    const [userResult, profileResult, servicesResult, reviewsResult] = await Promise.all([
      this.identityDb.from('users').select('*').eq('id', providerId).single(),
      this.providerCatalogDb.from('provider_profiles').select('*').eq('user_id', providerId).single(),
      this.providerCatalogDb.from('provider_services').select('*').eq('provider_id', providerId),
      this.trustDb.from('reviews').select('*').eq('reviewee_id', providerId).order('created_at', { ascending: false }),
    ]);

    return {
      user: userResult.data,
      profile: profileResult.data,
      services: servicesResult.data || [],
      reviews: reviewsResult.data || [],
    };
  }
}
```

- [ ] **Step 2: Create `src/modules/marketplace/marketplace.controller.ts`**

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/v3/marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Public()
  @Get('categories')
  async getCategories() {
    return this.marketplaceService.getServiceCategories();
  }

  @Public()
  @Get('categories/:name/services')
  async getServicesByCategory(@Param('name') name: string) {
    return this.marketplaceService.getServicesByCategoryName(decodeURIComponent(name));
  }

  @Public()
  @Get('services/:name/providers')
  async getProvidersByService(@Param('name') name: string) {
    return this.marketplaceService.getProvidersByServiceName(decodeURIComponent(name));
  }

  @Get('providers/:providerId')
  async getProviderProfile(@Param('providerId') providerId: string) {
    return this.marketplaceService.getProviderProfileData(providerId);
  }
}
```

- [ ] **Step 3: Create `src/modules/marketplace/marketplace.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';

@Module({
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
})
export class MarketplaceModule {}
```

- [ ] **Step 4: Add `MarketplaceModule` to `src/app.module.ts` imports**

- [ ] **Step 5: Build, commit backend**

```bash
cd Backend/ServEase-BE-API && npx nest build
git add src/modules/marketplace/ src/app.module.ts
git commit -m "feat: add v3 marketplace endpoints"
```

### Mobile

- [ ] **Step 6: Rewrite `services/marketplaceService.ts`**

```typescript
import { api } from '../lib/api';

export const getServiceCategories = async () => {
  return api.get<any[]>('/api/v3/marketplace/categories');
};

export const getServicesByCategoryName = async (categoryName: string) => {
  return api.get<any[]>(`/api/v3/marketplace/categories/${encodeURIComponent(categoryName)}/services`);
};

export const getProvidersByServiceName = async (serviceName: string) => {
  return api.get<any[]>(`/api/v3/marketplace/services/${encodeURIComponent(serviceName)}/providers`);
};

export const getProviderProfileData = async (providerId: string) => {
  return api.get<any>(`/api/v3/marketplace/providers/${providerId}`);
};
```

- [ ] **Step 7: Commit mobile**

```bash
cd ServEase-mobile-test
git add services/marketplaceService.ts
git commit -m "feat: rewrite marketplaceService to use backend"
```

---

## Task 4: Bookings Core

**Backend files:**
- Create: `Backend/ServEase-BE-API/src/modules/booking/v3/booking-v3.controller.ts`
- Create: `Backend/ServEase-BE-API/src/modules/booking/v3/booking-v3.service.ts`
- Modify: `Backend/ServEase-BE-API/src/modules/booking/booking.module.ts`

**Mobile files:**
- Rewrite: `ServEase-mobile-test/services/bookingService.ts`

### Backend

- [ ] **Step 1: Create `src/modules/booking/v3/booking-v3.service.ts`**

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { BOOKING_DB, PROVIDER_CATALOG_DB, IDENTITY_DB, NOTIFICATION_DB } from '../../../lib/schema-clients';

@Injectable()
export class BookingV3Service {
  constructor(
    @Inject(BOOKING_DB) private readonly bookingDb: any,
    @Inject(PROVIDER_CATALOG_DB) private readonly providerCatalogDb: any,
    @Inject(IDENTITY_DB) private readonly identityDb: any,
    @Inject(NOTIFICATION_DB) private readonly notificationDb: any,
  ) {}

  async getCustomerBookings(customerId: string) {
    const { data, error } = await this.bookingDb
      .from('bookings')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getProviderBookings(providerId: string) {
    const { data, error } = await this.bookingDb
      .from('bookings')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getBookingById(bookingId: string) {
    const { data, error } = await this.bookingDb
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
    if (error) throw error;
    return data;
  }

  async createBooking(customerId: string, bookingData: Record<string, any>) {
    const reference = `BK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const payload = {
      ...bookingData,
      customer_id: customerId,
      booking_reference: reference,
      status: 'pending',
    };
    const { data, error } = await this.bookingDb
      .from('bookings')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateBookingStatus(bookingId: string, status: string) {
    const { data, error } = await this.bookingDb
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async cancelBooking(bookingId: string, customerId: string, reason: string, explanation?: string) {
    const { data, error } = await this.bookingDb
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancellation_explanation: explanation,
        cancelled_at: new Date().toISOString(),
        cancelled_by: customerId,
      })
      .eq('id', bookingId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
```

- [ ] **Step 2: Create `src/modules/booking/v3/booking-v3.controller.ts`**

```typescript
import { Controller, Get, Post, Patch, Param, Body, Req } from '@nestjs/common';
import { BookingV3Service } from './booking-v3.service';

@Controller('api/v3/bookings')
export class BookingV3Controller {
  constructor(private readonly bookingV3Service: BookingV3Service) {}

  @Post()
  async createBooking(@Req() req: any, @Body() body: Record<string, any>) {
    return this.bookingV3Service.createBooking(req.user.id, body);
  }

  @Get('customer/:customerId')
  async getCustomerBookings(@Param('customerId') customerId: string) {
    return this.bookingV3Service.getCustomerBookings(customerId);
  }

  @Get('provider/:providerId')
  async getProviderBookings(@Param('providerId') providerId: string) {
    return this.bookingV3Service.getProviderBookings(providerId);
  }

  @Get(':bookingId')
  async getBookingById(@Param('bookingId') bookingId: string) {
    return this.bookingV3Service.getBookingById(bookingId);
  }

  @Patch(':bookingId/status')
  async updateBookingStatus(
    @Param('bookingId') bookingId: string,
    @Body() body: { status: string },
  ) {
    return this.bookingV3Service.updateBookingStatus(bookingId, body.status);
  }

  @Post(':bookingId/cancel')
  async cancelBooking(
    @Req() req: any,
    @Param('bookingId') bookingId: string,
    @Body() body: { reason: string; explanation?: string },
  ) {
    return this.bookingV3Service.cancelBooking(bookingId, req.user.id, body.reason, body.explanation);
  }
}
```

- [ ] **Step 3: Register in `src/modules/booking/booking.module.ts`**

Add `BookingV3Controller` to controllers and `BookingV3Service` to providers.

- [ ] **Step 4: Build, commit backend**

```bash
cd Backend/ServEase-BE-API && npx nest build
git add src/modules/booking/
git commit -m "feat: add v3 bookings core endpoints"
```

### Mobile

- [ ] **Step 5: Rewrite `services/bookingService.ts`**

Keep the local helper functions (`parseScheduleLocal`, notification helpers) temporarily — they'll move to backend in Plan 3. Replace all Supabase calls with API calls:

```typescript
import { api } from '../lib/api';
import { ensureBookingPayment, cancelBookingPayment } from './paymentService';
import { createBookingStatusNotification } from './notificationService';

export const getCustomerBookings = async (customerId: string) => {
  return api.get<any[]>(`/api/v3/bookings/customer/${customerId}`);
};

export const createBooking = async (bookingData: any) => {
  return api.post<any>('/api/v3/bookings', bookingData);
};

export const getBookingById = async (bookingId: string) => {
  return api.get<any>(`/api/v3/bookings/${bookingId}`);
};

export const cancelCustomerBooking = async (
  bookingId: string,
  customerId: string,
  reason: string,
  explanation: string,
) => {
  const result = await api.post<any>(`/api/v3/bookings/${bookingId}/cancel`, { reason, explanation });
  // Temporarily keep client-side payment cancel + notification until Plan 3
  try { await cancelBookingPayment(bookingId); } catch {}
  return result;
};
```

- [ ] **Step 6: Commit mobile**

```bash
cd ServEase-mobile-test
git add services/bookingService.ts
git commit -m "feat: rewrite bookingService to use backend"
```

---

## Task 5: Provider Bookings

**Backend files:**
- Endpoints already in Task 4's controller (getProviderBookings, updateBookingStatus)
- Add: support ticket and dispute endpoints to booking-v3

**Mobile files:**
- Rewrite: `ServEase-mobile-test/services/providerBookingService.ts`

### Backend

- [ ] **Step 1: Add support ticket and dispute methods to `booking-v3.service.ts`**

Append to the existing service:

```typescript
  async createSupportTicket(providerId: string, subject: string, message: string) {
    const { error } = await this.notificationDb
      .from('support_tickets')
      .insert({
        id: crypto.randomUUID(),
        user_id: providerId,
        subject,
        message,
        status: 'open',
        requester_role: 'provider',
      });
    if (error) throw error;
    return { success: true };
  }

  async createDispute(providerId: string, bookingId: string, reason: string) {
    const { error } = await this.notificationDb
      .from('disputes')
      .insert({
        id: crypto.randomUUID(),
        provider_id: providerId,
        booking_id: bookingId,
        reason,
        status: 'open',
      });
    if (error) throw error;
    return { success: true };
  }
```

- [ ] **Step 2: Add routes to `booking-v3.controller.ts`**

Append:

```typescript
  @Post('support/ticket')
  async createSupportTicket(@Req() req: any, @Body() body: { subject: string; message: string }) {
    return this.bookingV3Service.createSupportTicket(req.user.id, body.subject, body.message);
  }

  @Post('support/dispute')
  async createDispute(@Req() req: any, @Body() body: { bookingId: string; reason: string }) {
    return this.bookingV3Service.createDispute(req.user.id, body.bookingId, body.reason);
  }
```

- [ ] **Step 3: Build, commit backend**

```bash
cd Backend/ServEase-BE-API && npx nest build
git add src/modules/booking/
git commit -m "feat: add v3 support ticket and dispute endpoints"
```

### Mobile

- [ ] **Step 4: Rewrite `services/providerBookingService.ts`**

Keep pure functions (`normalizeProviderBookingStatus`, `getProviderBookingActionState`) as-is — they have no DB calls. Replace Supabase calls:

```typescript
import { api } from '../lib/api';
import { markBookingPaymentPaid, cancelBookingPayment } from './paymentService';
import { createBookingStatusNotification } from './notificationService';

// --- Pure functions (no DB, keep as-is) ---

export type ProviderBookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'unknown';

export function normalizeProviderBookingStatus(statusRaw?: string | null): ProviderBookingStatus {
  const s = (statusRaw || '').trim().toLowerCase().replace(/[\s_-]+/g, '_');
  if (['pending', 'requested'].includes(s)) return 'pending';
  if (['confirmed', 'accepted', 'assigned'].includes(s)) return 'confirmed';
  if (['in_progress', 'ongoing', 'started', 'on_the_way', 'arrived'].includes(s)) return 'in_progress';
  if (['completed', 'done'].includes(s)) return 'completed';
  if (['cancelled', 'canceled'].includes(s)) return 'cancelled';
  return 'unknown';
}

export function getProviderBookingActionState(statusRaw?: string | null) {
  const status = normalizeProviderBookingStatus(statusRaw);
  return {
    canConfirm: status === 'pending',
    canStartService: status === 'confirmed',
    canResumeService: status === 'in_progress',
    canComplete: status === 'in_progress',
    canCancel: status === 'pending' || status === 'confirmed',
  };
}

// --- API calls ---

export const getProviderBookings = async (providerId: string) => {
  return api.get<any[]>(`/api/v3/bookings/provider/${providerId}`);
};

export const getProviderBookingById = async (bookingId: string) => {
  return api.get<any>(`/api/v3/bookings/${bookingId}`);
};

export const updateBookingStatus = async (
  bookingId: string,
  providerId: string,
  target: 'confirmed' | 'in_progress' | 'completed' | 'cancelled',
) => {
  const result = await api.patch<any>(`/api/v3/bookings/${bookingId}/status`, { status: target });
  // Temporarily keep client-side payment sync + notification until Plan 3
  try {
    if (target === 'completed') await markBookingPaymentPaid({ bookingId });
    if (target === 'cancelled') await cancelBookingPayment(bookingId);
  } catch {}
  return result;
};

export const createProviderSupportTicket = async (providerId: string, subject: string, message: string) => {
  return api.post<any>('/api/v3/bookings/support/ticket', { subject, message });
};

export const createProviderDispute = async (providerId: string, bookingId: string, reason: string) => {
  return api.post<any>('/api/v3/bookings/support/dispute', { bookingId, reason });
};
```

- [ ] **Step 5: Commit mobile**

```bash
cd ServEase-mobile-test
git add services/providerBookingService.ts
git commit -m "feat: rewrite providerBookingService to use backend"
```

---

## Task 6: Booking Actions (Reschedule & Additional Charges)

**Backend files:**
- Create: `Backend/ServEase-BE-API/src/modules/booking/v3/booking-actions-v3.service.ts`
- Add routes to: `Backend/ServEase-BE-API/src/modules/booking/v3/booking-v3.controller.ts`
- Modify: `Backend/ServEase-BE-API/src/modules/booking/booking.module.ts`

**Mobile files:**
- Rewrite: `ServEase-mobile-test/services/providerBookingActionsService.ts`

### Backend

- [ ] **Step 1: Create `src/modules/booking/v3/booking-actions-v3.service.ts`**

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { BOOKING_DB } from '../../../lib/schema-clients';

@Injectable()
export class BookingActionsV3Service {
  constructor(@Inject(BOOKING_DB) private readonly bookingDb: any) {}

  async createRescheduleRequest(input: Record<string, any>) {
    const { data, error } = await this.bookingDb
      .from('booking_reschedule_requests')
      .insert({ ...input, status: 'pending' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getRescheduleRequests(bookingId: string) {
    const { data, error } = await this.bookingDb
      .from('booking_reschedule_requests')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async reviewRescheduleRequest(input: { requestId: string; bookingId: string; decision: string }) {
    const { data, error } = await this.bookingDb
      .from('booking_reschedule_requests')
      .update({ status: input.decision, reviewed_at: new Date().toISOString() })
      .eq('id', input.requestId)
      .select()
      .single();
    if (error) throw error;

    if (input.decision === 'approved' && data?.proposed_date) {
      await this.bookingDb
        .from('bookings')
        .update({ scheduled_at: data.proposed_date })
        .eq('id', input.bookingId);
    }
    return data;
  }

  async createAdditionalChargeRequest(input: { bookingId: string; items: any[]; justification?: string }) {
    const rows = input.items.map((item: any) => ({
      booking_id: input.bookingId,
      description: item.description,
      amount: item.amount,
      justification: input.justification || '',
      status: 'pending',
    }));
    const { data, error } = await this.bookingDb
      .from('additional_charges')
      .insert(rows)
      .select();
    if (error) throw error;
    return data || [];
  }

  async getAdditionalChargeRequests(bookingId: string) {
    const { data, error } = await this.bookingDb
      .from('additional_charges')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async reviewAdditionalChargeRequest(input: { bookingId: string; chargeIds: string[]; decision: string }) {
    const { data, error } = await this.bookingDb
      .from('additional_charges')
      .update({ status: input.decision, reviewed_at: new Date().toISOString() })
      .in('id', input.chargeIds)
      .select();
    if (error) throw error;
    return data || [];
  }
}
```

- [ ] **Step 2: Add routes to `booking-v3.controller.ts`**

Add injection of `BookingActionsV3Service` to the constructor and these routes:

```typescript
  @Post(':bookingId/reschedule')
  async createRescheduleRequest(@Param('bookingId') bookingId: string, @Body() body: any) {
    return this.bookingActionsV3Service.createRescheduleRequest({ ...body, booking_id: bookingId });
  }

  @Get(':bookingId/reschedules')
  async getRescheduleRequests(@Param('bookingId') bookingId: string) {
    return this.bookingActionsV3Service.getRescheduleRequests(bookingId);
  }

  @Patch('reschedules/:id/review')
  async reviewRescheduleRequest(@Param('id') id: string, @Body() body: any) {
    return this.bookingActionsV3Service.reviewRescheduleRequest({ requestId: id, ...body });
  }

  @Post(':bookingId/charges')
  async createAdditionalChargeRequest(@Param('bookingId') bookingId: string, @Body() body: any) {
    return this.bookingActionsV3Service.createAdditionalChargeRequest({ bookingId, ...body });
  }

  @Get(':bookingId/charges')
  async getAdditionalChargeRequests(@Param('bookingId') bookingId: string) {
    return this.bookingActionsV3Service.getAdditionalChargeRequests(bookingId);
  }

  @Patch('charges/:id/review')
  async reviewAdditionalChargeRequest(@Param('id') id: string, @Body() body: any) {
    return this.bookingActionsV3Service.reviewAdditionalChargeRequest({ chargeIds: [id], ...body });
  }
```

- [ ] **Step 3: Register `BookingActionsV3Service` in `booking.module.ts`**

- [ ] **Step 4: Build, commit backend**

```bash
cd Backend/ServEase-BE-API && npx nest build
git add src/modules/booking/
git commit -m "feat: add v3 booking actions endpoints (reschedule, charges)"
```

### Mobile

- [ ] **Step 5: Rewrite `services/providerBookingActionsService.ts`**

```typescript
import { api } from '../lib/api';

export const createProviderRescheduleRequest = async (input: {
  bookingId: string;
  proposedDate: string;
  proposedTime: string;
  reason: string;
  explanation?: string;
}) => {
  const { bookingId, ...body } = input;
  return api.post<any>(`/api/v3/bookings/${bookingId}/reschedule`, body);
};

export const getProviderRescheduleRequests = async (bookingId: string) => {
  return api.get<any[]>(`/api/v3/bookings/${bookingId}/reschedules`);
};

export const reviewRescheduleRequest = async (input: {
  requestId: string;
  bookingId: string;
  customerId: string;
  decision: 'approved' | 'declined';
}) => {
  return api.patch<any>(`/api/v3/bookings/reschedules/${input.requestId}/review`, {
    bookingId: input.bookingId,
    decision: input.decision,
  });
};

export const createProviderAdditionalChargeRequest = async (input: {
  bookingId: string;
  items: { description: string; amount: number }[];
  justification?: string;
}) => {
  const { bookingId, ...body } = input;
  return api.post<any[]>(`/api/v3/bookings/${bookingId}/charges`, body);
};

export const getProviderAdditionalChargeRequests = async (bookingId: string) => {
  return api.get<any[]>(`/api/v3/bookings/${bookingId}/charges`);
};

export const reviewAdditionalChargeRequest = async (input: {
  bookingId: string;
  customerId: string;
  chargeIds: string[];
  decision: 'approved' | 'declined';
}) => {
  const firstId = input.chargeIds[0];
  return api.patch<any[]>(`/api/v3/bookings/charges/${firstId}/review`, {
    bookingId: input.bookingId,
    chargeIds: input.chargeIds,
    decision: input.decision,
  });
};
```

- [ ] **Step 6: Commit mobile**

```bash
cd ServEase-mobile-test
git add services/providerBookingActionsService.ts
git commit -m "feat: rewrite providerBookingActionsService to use backend"
```

---

## Task 7: Payments

**Backend files:**
- Create: `Backend/ServEase-BE-API/src/modules/payments/v3/payments-v3.controller.ts`
- Create: `Backend/ServEase-BE-API/src/modules/payments/v3/payments-v3.service.ts`
- Modify: `Backend/ServEase-BE-API/src/modules/payments/payments.module.ts`

**Mobile files:**
- Rewrite: `ServEase-mobile-test/services/paymentService.ts`

### Backend

- [ ] **Step 1: Create `src/modules/payments/v3/payments-v3.service.ts`**

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { PAYMENT_DB, BOOKING_DB, IDENTITY_DB, PROVIDER_CATALOG_DB } from '../../../lib/schema-clients';

@Injectable()
export class PaymentsV3Service {
  constructor(
    @Inject(PAYMENT_DB) private readonly paymentDb: any,
    @Inject(BOOKING_DB) private readonly bookingDb: any,
    @Inject(IDENTITY_DB) private readonly identityDb: any,
    @Inject(PROVIDER_CATALOG_DB) private readonly providerCatalogDb: any,
  ) {}

  async getPaymentByBookingId(bookingId: string) {
    const { data, error } = await this.paymentDb
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getProviderPayments(providerId: string) {
    const { data, error } = await this.paymentDb
      .from('payments')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getProviderPaymentHistory(providerId: string) {
    const { data: payments, error } = await this.paymentDb
      .from('payments')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return payments || [];
  }

  async getProviderEarningsSummary(providerId: string) {
    const payments = await this.getProviderPaymentHistory(providerId);
    const paidPayments = payments.filter((p: any) => p.status === 'paid' || p.status === 'completed');
    const pendingPayments = payments.filter((p: any) => p.status === 'pending');
    const totalRevenue = paidPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const platformFeeRate = 0.10;
    const totalNetEarnings = totalRevenue * (1 - platformFeeRate);
    const pendingRevenue = pendingPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    return {
      payments,
      totalRevenue,
      totalNetEarnings,
      pendingRevenue,
      paidCount: paidPayments.length,
      pendingCount: pendingPayments.length,
    };
  }

  async ensureBookingPayment(input: Record<string, any>) {
    const existing = await this.getPaymentByBookingId(input.bookingId);
    if (existing) return existing;

    const ref = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const { data, error } = await this.paymentDb
      .from('payments')
      .insert({
        booking_id: input.bookingId,
        customer_id: input.customerId,
        provider_id: input.providerId,
        amount: input.amount,
        method: input.method || 'cash',
        status: 'pending',
        transaction_reference: ref,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async markBookingPaymentPaid(input: Record<string, any>) {
    const { data, error } = await this.paymentDb
      .from('payments')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('booking_id', input.bookingId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async cancelBookingPayment(bookingId: string) {
    const { data, error } = await this.paymentDb
      .from('payments')
      .update({ status: 'cancelled' })
      .eq('booking_id', bookingId)
      .select()
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateBookingPaymentAmount(bookingId: string, amount: number) {
    const { data, error } = await this.paymentDb
      .from('payments')
      .update({ amount })
      .eq('booking_id', bookingId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
```

- [ ] **Step 2: Create `src/modules/payments/v3/payments-v3.controller.ts`**

```typescript
import { Controller, Get, Post, Patch, Param, Body, Req } from '@nestjs/common';
import { PaymentsV3Service } from './payments-v3.service';

@Controller('api/v3/payments')
export class PaymentsV3Controller {
  constructor(private readonly paymentsV3Service: PaymentsV3Service) {}

  @Get('booking/:bookingId')
  async getPaymentByBooking(@Param('bookingId') bookingId: string) {
    return this.paymentsV3Service.getPaymentByBookingId(bookingId);
  }

  @Get('provider/:providerId')
  async getProviderPayments(@Param('providerId') providerId: string) {
    return this.paymentsV3Service.getProviderPayments(providerId);
  }

  @Get('provider/:providerId/history')
  async getProviderPaymentHistory(@Param('providerId') providerId: string) {
    return this.paymentsV3Service.getProviderPaymentHistory(providerId);
  }

  @Get('provider/:providerId/earnings')
  async getProviderEarnings(@Param('providerId') providerId: string) {
    return this.paymentsV3Service.getProviderEarningsSummary(providerId);
  }

  @Post('ensure')
  async ensurePayment(@Body() body: Record<string, any>) {
    return this.paymentsV3Service.ensureBookingPayment(body);
  }

  @Patch('booking/:bookingId/paid')
  async markPaid(@Param('bookingId') bookingId: string, @Body() body: any) {
    return this.paymentsV3Service.markBookingPaymentPaid({ bookingId, ...body });
  }

  @Patch('booking/:bookingId/cancel')
  async cancelPayment(@Param('bookingId') bookingId: string) {
    return this.paymentsV3Service.cancelBookingPayment(bookingId);
  }

  @Patch('booking/:bookingId/amount')
  async updateAmount(@Param('bookingId') bookingId: string, @Body() body: { amount: number }) {
    return this.paymentsV3Service.updateBookingPaymentAmount(bookingId, body.amount);
  }
}
```

- [ ] **Step 3: Register in `payments.module.ts`, build, commit**

```bash
cd Backend/ServEase-BE-API && npx nest build
git add src/modules/payments/
git commit -m "feat: add v3 payments endpoints"
```

### Mobile

- [ ] **Step 4: Rewrite `services/paymentService.ts`**

Keep pure functions (`getPaymentStatusLabel`, `getPaymentMethodLabel`) as-is. Replace DB calls:

```typescript
import { api } from '../lib/api';

// --- Pure functions (keep as-is) ---
export const getPaymentStatusLabel = (statusRaw?: string | null): string => {
  const s = (statusRaw || '').toLowerCase();
  if (s === 'paid' || s === 'completed') return 'Paid';
  if (s === 'pending') return 'Pending';
  if (s === 'cancelled' || s === 'canceled') return 'Cancelled';
  if (s === 'refunded') return 'Refunded';
  return 'Unknown';
};

export const getPaymentMethodLabel = (methodRaw?: string | null): string => {
  const m = (methodRaw || '').toLowerCase();
  if (m === 'gcash') return 'GCash';
  if (m === 'paymaya') return 'PayMaya';
  if (m === 'card') return 'Card';
  return 'Cash';
};

// --- API calls ---
export const getPaymentByBookingId = async (bookingId: string) => {
  return api.get<any>(`/api/v3/payments/booking/${bookingId}`);
};

export const getProviderPayments = async (providerId: string) => {
  return api.get<any[]>(`/api/v3/payments/provider/${providerId}`);
};

export const getProviderPaymentHistory = async (providerId: string) => {
  return api.get<any[]>(`/api/v3/payments/provider/${providerId}/history`);
};

export const getProviderEarningsSummary = async (providerId: string) => {
  return api.get<any>(`/api/v3/payments/provider/${providerId}/earnings`);
};

export const ensureBookingPayment = async (input: {
  bookingId: string; customerId: string; providerId: string; amount: number; method?: string;
}) => {
  return api.post<any>('/api/v3/payments/ensure', input);
};

export const markBookingPaymentPaid = async (input: { bookingId: string; amount?: number }) => {
  return api.patch<any>(`/api/v3/payments/booking/${input.bookingId}/paid`, input);
};

export const cancelBookingPayment = async (bookingId: string) => {
  return api.patch<any>(`/api/v3/payments/booking/${bookingId}/cancel`);
};

export const updateBookingPaymentAmount = async (bookingId: string, amount: number) => {
  return api.patch<any>(`/api/v3/payments/booking/${bookingId}/amount`, { amount });
};
```

- [ ] **Step 5: Commit mobile**

```bash
cd ServEase-mobile-test
git add services/paymentService.ts
git commit -m "feat: rewrite paymentService to use backend"
```

---

## Task 8: Chat

**Backend files:**
- Create: `Backend/ServEase-BE-API/src/modules/chat/chat.controller.ts`
- Create: `Backend/ServEase-BE-API/src/modules/chat/chat.service.ts`
- Create: `Backend/ServEase-BE-API/src/modules/chat/chat.module.ts`
- Modify: `Backend/ServEase-BE-API/src/app.module.ts`

**Mobile files:**
- Rewrite: `ServEase-mobile-test/services/chatService.ts`

### Backend

- [ ] **Step 1: Create `src/modules/chat/chat.service.ts`**

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { BOOKING_DB, IDENTITY_DB, PROVIDER_CATALOG_DB } from '../../lib/schema-clients';

@Injectable()
export class ChatService {
  constructor(
    @Inject(BOOKING_DB) private readonly bookingDb: any,
    @Inject(IDENTITY_DB) private readonly identityDb: any,
    @Inject(PROVIDER_CATALOG_DB) private readonly providerCatalogDb: any,
  ) {}

  async getCustomerChatSummaries(customerId: string) {
    const { data, error } = await this.bookingDb
      .from('conversations')
      .select('*')
      .eq('customer_id', customerId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getProviderChatSummaries(providerId: string) {
    const { data, error } = await this.bookingDb
      .from('conversations')
      .select('*')
      .eq('provider_id', providerId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getChatThread(bookingId: string, customerId?: string, providerId?: string) {
    const { data: messages, error } = await this.bookingDb
      .from('messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return { bookingId, messages: messages || [] };
  }

  async sendMessage(input: { bookingId: string; senderId: string; senderRole: string; text: string }) {
    const { data, error } = await this.bookingDb
      .from('messages')
      .insert({
        booking_id: input.bookingId,
        sender_id: input.senderId,
        sender_role: input.senderRole,
        text: input.text,
        status: 'sent',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async markThreadRead(bookingId: string, role: string) {
    const column = role === 'customer' ? 'customer_last_read_at' : 'provider_last_read_at';
    const { error } = await this.bookingDb
      .from('conversations')
      .update({ [column]: new Date().toISOString() })
      .eq('booking_id', bookingId);
    if (error) throw error;
    return { success: true };
  }
}
```

- [ ] **Step 2: Create `src/modules/chat/chat.controller.ts`**

```typescript
import { Controller, Get, Post, Patch, Param, Body, Query, Req } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('api/v3/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('customer/:customerId/summaries')
  async getCustomerSummaries(@Param('customerId') customerId: string) {
    return this.chatService.getCustomerChatSummaries(customerId);
  }

  @Get('provider/:providerId/summaries')
  async getProviderSummaries(@Param('providerId') providerId: string) {
    return this.chatService.getProviderChatSummaries(providerId);
  }

  @Get('thread')
  async getThread(
    @Query('bookingId') bookingId: string,
    @Query('customerId') customerId?: string,
    @Query('providerId') providerId?: string,
  ) {
    return this.chatService.getChatThread(bookingId, customerId, providerId);
  }

  @Post('message')
  async sendMessage(@Req() req: any, @Body() body: { bookingId: string; senderRole: string; text: string }) {
    return this.chatService.sendMessage({ ...body, senderId: req.user.id });
  }

  @Patch('thread/read')
  async markRead(@Body() body: { bookingId: string; role: string }) {
    return this.chatService.markThreadRead(body.bookingId, body.role);
  }
}
```

- [ ] **Step 3: Create `src/modules/chat/chat.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
```

- [ ] **Step 4: Add `ChatModule` to `src/app.module.ts`, build, commit**

```bash
cd Backend/ServEase-BE-API && npx nest build
git add src/modules/chat/ src/app.module.ts
git commit -m "feat: add v3 chat endpoints"
```

### Mobile

- [ ] **Step 5: Rewrite `services/chatService.ts`**

Keep realtime subscription functions (`subscribeToChatThread`, `subscribeToChatSummaries`) using `supabase.channel()` — these stay client-side. Keep in-memory cache logic temporarily. Replace Supabase DB calls with API calls:

```typescript
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

// --- API calls ---
export const getCustomerChatSummaries = async (customerId: string) => {
  return api.get<any[]>(`/api/v3/chat/customer/${customerId}/summaries`);
};

export const getProviderChatSummaries = async (providerId: string) => {
  return api.get<any[]>(`/api/v3/chat/provider/${providerId}/summaries`);
};

export const getChatThread = async (input: { bookingId: string; role: string }) => {
  return api.get<any>('/api/v3/chat/thread', { bookingId: input.bookingId });
};

export const sendChatMessage = async (input: {
  bookingId: string; senderId: string; senderRole: string; text: string;
}) => {
  return api.post<any>('/api/v3/chat/message', input);
};

export const retryChatMessage = async (input: {
  bookingId: string; senderId: string; senderRole: string; messageId: string;
}) => {
  return api.post<any>('/api/v3/chat/message', input);
};

export const markChatThreadRead = async (input: { bookingId: string; role: string }) => {
  return api.patch<any>('/api/v3/chat/thread/read', input);
};

// --- Realtime subscriptions (stay client-side) ---
export type ChatSubscription = { unsubscribe: () => void };

export const subscribeToChatThread = (input: {
  bookingId: string; onChange: () => void;
}): ChatSubscription => {
  const channel = supabase.channel(`chat-thread-${input.bookingId}`)
    .on('postgres_changes', {
      event: '*', schema: 'booking_svc', table: 'messages',
      filter: `booking_id=eq.${input.bookingId}`,
    }, input.onChange)
    .subscribe();
  return { unsubscribe: () => supabase.removeChannel(channel) };
};

export const subscribeToChatSummaries = (input: {
  role: string; userId: string; onChange: () => void;
}): ChatSubscription => {
  const channel = supabase.channel(`chat-summaries-${input.userId}`)
    .on('postgres_changes', {
      event: '*', schema: 'booking_svc', table: 'conversations',
    }, input.onChange)
    .subscribe();
  return { unsubscribe: () => supabase.removeChannel(channel) };
};
```

- [ ] **Step 6: Commit mobile**

```bash
cd ServEase-mobile-test
git add services/chatService.ts
git commit -m "feat: rewrite chatService to use backend (keep realtime client-side)"
```

---

## Task 9: Reviews & Reports

**Backend files:**
- Create: `Backend/ServEase-BE-API/src/modules/reviews/reviews.controller.ts`
- Create: `Backend/ServEase-BE-API/src/modules/reviews/reviews.service.ts`
- Create: `Backend/ServEase-BE-API/src/modules/reviews/reviews.module.ts`
- Modify: `Backend/ServEase-BE-API/src/app.module.ts`

**Mobile files:**
- Rewrite: `ServEase-mobile-test/services/customerFeedbackService.ts`

### Backend

- [ ] **Step 1: Create `src/modules/reviews/reviews.service.ts`**

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { TRUST_DB, BOOKING_DB, PROVIDER_CATALOG_DB } from '../../lib/schema-clients';

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(TRUST_DB) private readonly trustDb: any,
    @Inject(BOOKING_DB) private readonly bookingDb: any,
    @Inject(PROVIDER_CATALOG_DB) private readonly providerCatalogDb: any,
  ) {}

  async submitReview(input: {
    bookingId: string; reviewerId: string; providerId: string; rating: number; reviewText: string;
  }) {
    const { data, error } = await this.trustDb
      .from('reviews')
      .upsert({
        booking_id: input.bookingId,
        reviewer_id: input.reviewerId,
        reviewee_id: input.providerId,
        rating: input.rating,
        review_text: input.reviewText,
      }, { onConflict: 'booking_id,reviewer_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async submitProfileReport(input: {
    providerId: string; reporterId: string; reason: string; details: string; bookingId?: string;
  }) {
    const { data, error } = await this.trustDb
      .from('provider_profile_reports')
      .insert({
        provider_id: input.providerId,
        reporter_id: input.reporterId,
        reason: input.reason,
        details: input.details,
        booking_id: input.bookingId,
        status: 'submitted',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
```

- [ ] **Step 2: Create controller and module, register in app.module, build, commit**

```typescript
// reviews.controller.ts
import { Controller, Post, Body, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

@Controller('api/v3')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('reviews')
  async submitReview(@Req() req: any, @Body() body: any) {
    return this.reviewsService.submitReview({ ...body, reviewerId: req.user.id });
  }

  @Post('reports/provider')
  async submitReport(@Req() req: any, @Body() body: any) {
    return this.reviewsService.submitProfileReport({ ...body, reporterId: req.user.id });
  }
}
```

```typescript
// reviews.module.ts
import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({ controllers: [ReviewsController], providers: [ReviewsService] })
export class ReviewsModule {}
```

```bash
cd Backend/ServEase-BE-API && npx nest build
git add src/modules/reviews/ src/app.module.ts
git commit -m "feat: add v3 reviews and reports endpoints"
```

### Mobile

- [ ] **Step 3: Rewrite `services/customerFeedbackService.ts`**

```typescript
import { api } from '../lib/api';

export const submitCustomerReview = async (input: {
  bookingId: string; reviewerId: string; providerId: string; rating: number; reviewText: string;
}) => {
  return api.post<any>('/api/v3/reviews', input);
};

export const submitProviderProfileReport = async (input: {
  providerId: string; reporterId: string; reason: string; details: string; bookingId?: string;
}) => {
  return api.post<any>('/api/v3/reports/provider', input);
};
```

- [ ] **Step 4: Commit mobile**

```bash
cd ServEase-mobile-test
git add services/customerFeedbackService.ts
git commit -m "feat: rewrite customerFeedbackService to use backend"
```

---

## Task 10: Notifications

**Backend files:**
- Create: `Backend/ServEase-BE-API/src/modules/notifications/notifications.controller.ts`
- Create: `Backend/ServEase-BE-API/src/modules/notifications/notifications.service.ts`
- Create: `Backend/ServEase-BE-API/src/modules/notifications/notifications.module.ts`
- Modify: `Backend/ServEase-BE-API/src/app.module.ts`

**Mobile files:**
- Rewrite: `ServEase-mobile-test/services/notificationService.ts`

### Backend

- [ ] **Step 1: Create `src/modules/notifications/notifications.service.ts`**

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_DB } from '../../lib/schema-clients';

@Injectable()
export class NotificationsService {
  constructor(@Inject(NOTIFICATION_DB) private readonly notificationDb: any) {}

  async getNotifications(userId: string) {
    const { data, error } = await this.notificationDb
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async markRead(userId: string, notificationId: string) {
    const { error } = await this.notificationDb
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);
    if (error) throw error;
    return { success: true };
  }

  async markAllRead(userId: string) {
    const { error } = await this.notificationDb
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
    return { success: true };
  }

  async getUnreadCount(userId: string) {
    const { count, error } = await this.notificationDb
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
    return { count: count || 0 };
  }
}
```

- [ ] **Step 2: Create controller and module, register in app.module, build, commit**

```typescript
// notifications.controller.ts
import { Controller, Get, Patch, Param, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('api/v3/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Req() req: any) { return this.notificationsService.getNotifications(req.user.id); }

  @Patch(':notificationId/read')
  async markRead(@Req() req: any, @Param('notificationId') id: string) {
    return this.notificationsService.markRead(req.user.id, id);
  }

  @Patch('read-all')
  async markAllRead(@Req() req: any) { return this.notificationsService.markAllRead(req.user.id); }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) { return this.notificationsService.getUnreadCount(req.user.id); }
}
```

```typescript
// notifications.module.ts
import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({ controllers: [NotificationsController], providers: [NotificationsService] })
export class NotificationsModule {}
```

```bash
cd Backend/ServEase-BE-API && npx nest build
git add src/modules/notifications/ src/app.module.ts
git commit -m "feat: add v3 notifications endpoints"
```

### Mobile

- [ ] **Step 3: Rewrite `services/notificationService.ts`**

Keep `subscribeToNotifications` using `supabase.channel()`, keep `createChatNotification` and `createBookingStatusNotification` temporarily (they'll move in Plan 3). Replace reads:

```typescript
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { areMessageNotificationsEnabled } from '../lib/notification-preferences';

// --- API calls for reads ---
export const getNotifications = async (userId: string) => {
  return api.get<any[]>('/api/v3/notifications');
};

export const markNotificationRead = async (userId: string, notificationId: string) => {
  return api.patch<any>(`/api/v3/notifications/${notificationId}/read`);
};

export const markAllNotificationsRead = async (userId: string) => {
  return api.patch<any>('/api/v3/notifications/read-all');
};

export const getUnreadNotificationCount = async (userId: string) => {
  const result = await api.get<{ count: number }>('/api/v3/notifications/unread-count');
  return result.count;
};

// --- Notification creation (stays client-side temporarily until Plan 3) ---
// Keep createChatNotification and createBookingStatusNotification as-is
// They write to notificationDb directly — will move to backend in Plan 3

// --- Realtime (stays client-side) ---
export type NotificationSubscription = { unsubscribe: () => void };

export const subscribeToNotifications = (input: {
  userId: string; onChange: () => void;
}): NotificationSubscription => {
  const channel = supabase.channel(`notifications-${input.userId}`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'notification_svc', table: 'notifications',
      filter: `user_id=eq.${input.userId}`,
    }, input.onChange)
    .subscribe();
  return { unsubscribe: () => supabase.removeChannel(channel) };
};
```

Note: `createChatNotification` and `createBookingStatusNotification` still import from `lib/db.ts` temporarily. These move to backend in Plan 3.

- [ ] **Step 4: Commit mobile**

```bash
cd ServEase-mobile-test
git add services/notificationService.ts
git commit -m "feat: rewrite notificationService reads to use backend (keep writes temporary)"
```

---

## Task 11: Provider Operations (Availability, Profile, Verification, Support)

**Backend files:**
- Create: `Backend/ServEase-BE-API/src/modules/provider/v3/provider-v3.controller.ts`
- Create: `Backend/ServEase-BE-API/src/modules/provider/v3/provider-v3.service.ts`
- Modify: `Backend/ServEase-BE-API/src/modules/provider/provider.module.ts`

**Mobile files:**
- Rewrite: `ServEase-mobile-test/services/providerAvailabilityService.ts`
- Rewrite: `ServEase-mobile-test/services/providerProfileService.ts`
- Rewrite: `ServEase-mobile-test/services/providerVerificationService.ts`
- Rewrite: `ServEase-mobile-test/services/supportService.ts`

### Backend

- [ ] **Step 1: Create `src/modules/provider/v3/provider-v3.service.ts`**

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { BOOKING_DB, IDENTITY_DB, PROVIDER_CATALOG_DB, NOTIFICATION_DB } from '../../../lib/schema-clients';

@Injectable()
export class ProviderV3Service {
  constructor(
    @Inject(BOOKING_DB) private readonly bookingDb: any,
    @Inject(IDENTITY_DB) private readonly identityDb: any,
    @Inject(PROVIDER_CATALOG_DB) private readonly providerCatalogDb: any,
    @Inject(NOTIFICATION_DB) private readonly notificationDb: any,
  ) {}

  // --- Availability ---
  async getAvailability(userId: string) {
    const [availResult, daysOffResult] = await Promise.all([
      this.bookingDb.from('provider_availability').select('*').eq('provider_id', userId),
      this.bookingDb.from('provider_days_off').select('*').eq('provider_id', userId),
    ]);
    return {
      schedule: availResult.data || [],
      daysOff: daysOffResult.data || [],
    };
  }

  async saveAvailability(userId: string, state: Record<string, any>) {
    // Delete existing and re-insert
    await this.bookingDb.from('provider_availability').delete().eq('provider_id', userId);
    if (state.schedule?.length) {
      const rows = state.schedule.map((s: any) => ({ ...s, provider_id: userId }));
      await this.bookingDb.from('provider_availability').insert(rows);
    }
    await this.bookingDb.from('provider_days_off').delete().eq('provider_id', userId);
    if (state.daysOff?.length) {
      const rows = state.daysOff.map((d: any) => ({ ...d, provider_id: userId }));
      await this.bookingDb.from('provider_days_off').insert(rows);
    }
    return { success: true };
  }

  // --- Profile Draft ---
  async getProfileDraft(userId: string) {
    const [userResult, profileResult, servicesResult] = await Promise.all([
      this.identityDb.from('users').select('*').eq('id', userId).single(),
      this.providerCatalogDb.from('provider_profiles').select('*').eq('user_id', userId).single(),
      this.providerCatalogDb.from('provider_services').select('*').eq('provider_id', userId),
    ]);
    return {
      user: userResult.data,
      profile: profileResult.data,
      services: servicesResult.data || [],
    };
  }

  async saveProfileDraft(userId: string, input: Record<string, any>) {
    if (input.fullName) {
      await this.identityDb.from('users').update({ full_name: input.fullName }).eq('id', userId);
    }
    const profilePayload: Record<string, any> = {};
    if (input.businessName) profilePayload.business_name = input.businessName;
    if (input.bio) profilePayload.bio = input.bio;
    if (Object.keys(profilePayload).length) {
      await this.providerCatalogDb
        .from('provider_profiles')
        .upsert({ user_id: userId, ...profilePayload }, { onConflict: 'user_id' });
    }
    return { success: true };
  }

  // --- Verification Draft (remote part only) ---
  async getVerificationDraft(userId: string) {
    const { data } = await this.providerCatalogDb
      .from('provider_profiles')
      .select('verification_status, business_name')
      .eq('user_id', userId)
      .single();
    return data;
  }

  async saveVerificationDraft(userId: string, input: Record<string, any>) {
    const payload: Record<string, any> = {};
    if (input.verificationStatus) payload.verification_status = input.verificationStatus;
    if (input.businessName) payload.business_name = input.businessName;
    if (Object.keys(payload).length) {
      await this.providerCatalogDb
        .from('provider_profiles')
        .upsert({ user_id: userId, ...payload }, { onConflict: 'user_id' });
    }
    return { success: true };
  }

  // --- Support ---
  async createSupportTicket(input: Record<string, any>) {
    const { data, error } = await this.notificationDb
      .from('support_tickets')
      .insert({
        id: crypto.randomUUID(),
        user_id: input.userId,
        subject: input.subject,
        message: input.message,
        category: input.category || null,
        requester_role: input.role || 'customer',
        status: 'open',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
```

- [ ] **Step 2: Create `src/modules/provider/v3/provider-v3.controller.ts`**

```typescript
import { Controller, Get, Put, Post, Param, Body, Req } from '@nestjs/common';
import { ProviderV3Service } from './provider-v3.service';

@Controller('api/v3/providers')
export class ProviderV3Controller {
  constructor(private readonly providerV3Service: ProviderV3Service) {}

  @Get('availability/:userId')
  async getAvailability(@Param('userId') userId: string) {
    return this.providerV3Service.getAvailability(userId);
  }

  @Put('availability/:userId')
  async saveAvailability(@Param('userId') userId: string, @Body() body: any) {
    return this.providerV3Service.saveAvailability(userId, body);
  }

  @Get('profile/draft/:userId')
  async getProfileDraft(@Param('userId') userId: string) {
    return this.providerV3Service.getProfileDraft(userId);
  }

  @Put('profile/draft/:userId')
  async saveProfileDraft(@Param('userId') userId: string, @Body() body: any) {
    return this.providerV3Service.saveProfileDraft(userId, body);
  }

  @Get('verification/draft/:userId')
  async getVerificationDraft(@Param('userId') userId: string) {
    return this.providerV3Service.getVerificationDraft(userId);
  }

  @Put('verification/draft/:userId')
  async saveVerificationDraft(@Param('userId') userId: string, @Body() body: any) {
    return this.providerV3Service.saveVerificationDraft(userId, body);
  }
}

@Controller('api/v3/support')
export class SupportV3Controller {
  constructor(private readonly providerV3Service: ProviderV3Service) {}

  @Post('ticket')
  async createTicket(@Req() req: any, @Body() body: any) {
    return this.providerV3Service.createSupportTicket({ ...body, userId: req.user.id });
  }
}
```

- [ ] **Step 3: Register in `provider.module.ts`, build, commit**

Add `ProviderV3Controller`, `SupportV3Controller` to controllers and `ProviderV3Service` to providers.

```bash
cd Backend/ServEase-BE-API && npx nest build
git add src/modules/provider/
git commit -m "feat: add v3 provider operations endpoints"
```

### Mobile

- [ ] **Step 4: Rewrite `services/providerAvailabilityService.ts`**

Keep pure functions (`getDefaultProviderAvailabilityState`, time conversion helpers). Replace DB calls:

```typescript
import { api } from '../lib/api';

export const getDefaultProviderAvailabilityState = () => ({
  // Keep existing default schedule object as-is
});

export const getProviderAvailability = async (userId: string) => {
  return api.get<any>(`/api/v3/providers/availability/${userId}`);
};

export const saveProviderAvailability = async (userId: string, state: any) => {
  return api.put<any>(`/api/v3/providers/availability/${userId}`, state);
};

export const validateProviderAvailability = async (providerId: string, scheduledAt: Date) => {
  // Keep client-side validation temporarily — moves to backend in Plan 3
  const avail = await getProviderAvailability(providerId);
  // ... existing validation logic stays for now
  return { available: true };
};
```

- [ ] **Step 5: Rewrite `services/providerProfileService.ts`**

```typescript
import { api } from '../lib/api';

export const getProviderProfileDraft = async (userId: string) => {
  return api.get<any>(`/api/v3/providers/profile/draft/${userId}`);
};

export const saveProviderProfileDraft = async (userId: string, input: any) => {
  return api.put<any>(`/api/v3/providers/profile/draft/${userId}`, input);
};

export const getDefaultProviderProfileDraft = () => ({
  fullName: '', businessName: '', bio: '',
  serviceAreas: [], languages: [], yearsExperience: 0,
  socialUrls: {},
});
```

- [ ] **Step 6: Rewrite `services/providerVerificationService.ts`**

Keep pure functions (`formatVerificationStatusLabel`, `formatVerificationLevelLabel`, `assessProviderVerification`) and AsyncStorage logic. Replace Supabase calls:

```typescript
import { api } from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keep all pure functions as-is (formatVerificationStatusLabel, formatVerificationLevelLabel, assessProviderVerification)
// Keep AsyncStorage draft functions (readLocalDraft, writeLocalDraft) as-is

export const getProviderVerificationDraft = async (userId: string) => {
  // Try local first
  const local = await readLocalDraft(userId);
  // Get remote status
  const remote = await api.get<any>(`/api/v3/providers/verification/draft/${userId}`);
  return { ...local, verificationStatus: remote?.verification_status };
};

export const saveProviderVerificationDraft = async (
  userId: string, input: any, options?: { submit?: boolean }
) => {
  await writeLocalDraft(userId, input);
  if (options?.submit) {
    await api.put<any>(`/api/v3/providers/verification/draft/${userId}`, {
      verificationStatus: 'submitted',
      businessName: input.businessName,
    });
  }
  return input;
};
```

- [ ] **Step 7: Rewrite `services/supportService.ts`**

```typescript
import { api } from '../lib/api';

export const createSupportTicket = async (input: {
  userId: string; subject: string; message: string; category?: string; role?: string;
}) => {
  return api.post<any>('/api/v3/support/ticket', input);
};

export const createCustomerSupportTicket = async (
  userId: string, subject: string, message: string, category?: string,
) => {
  return createSupportTicket({ userId, subject, message, category, role: 'customer' });
};

export const createProviderSupportTicket = async (
  userId: string, subject: string, message: string, category?: string,
) => {
  return createSupportTicket({ userId, subject, message, category, role: 'provider' });
};
```

- [ ] **Step 8: Commit mobile**

```bash
cd ServEase-mobile-test
git add services/providerAvailabilityService.ts services/providerProfileService.ts services/providerVerificationService.ts services/supportService.ts
git commit -m "feat: rewrite provider services to use backend"
```

---

## Task 12: Booking Attachments

**Mobile files:**
- Modify: `ServEase-mobile-test/services/bookingAttachmentService.ts`

Booking attachments use `supabase.storage` for file uploads (stays client-side) and `bookingDb` for metadata. Only the metadata read moves to the backend.

### Backend

- [ ] **Step 1: Add attachment metadata endpoints to `booking-v3.service.ts`**

```typescript
  async getBookingAttachments(bookingId: string) {
    const { data, error } = await this.bookingDb
      .from('booking_attachments')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async saveBookingAttachments(bookingId: string, attachments: any[]) {
    const rows = attachments.map((a: any) => ({ ...a, booking_id: bookingId }));
    const { data, error } = await this.bookingDb
      .from('booking_attachments')
      .insert(rows)
      .select();
    if (error) throw error;
    return data || [];
  }
```

- [ ] **Step 2: Add routes to `booking-v3.controller.ts`**

```typescript
  @Get(':bookingId/attachments')
  async getAttachments(@Param('bookingId') bookingId: string) {
    return this.bookingV3Service.getBookingAttachments(bookingId);
  }

  @Post(':bookingId/attachments')
  async saveAttachments(@Param('bookingId') bookingId: string, @Body() body: { attachments: any[] }) {
    return this.bookingV3Service.saveBookingAttachments(bookingId, body.attachments);
  }
```

- [ ] **Step 3: Build, commit backend**

```bash
cd Backend/ServEase-BE-API && npx nest build
git add src/modules/booking/
git commit -m "feat: add v3 booking attachment metadata endpoints"
```

### Mobile

- [ ] **Step 4: Rewrite `services/bookingAttachmentService.ts`**

Keep `uploadBookingAttachment` (uses `supabase.storage` directly — stays client-side). Replace DB metadata calls:

```typescript
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

// --- File upload stays client-side (supabase.storage) ---
export const uploadBookingAttachment = async (input: {
  bookingId: string; userId: string; uri: string; fileName?: string;
}) => {
  // Keep existing supabase.storage upload logic as-is
  const response = await fetch(input.uri);
  const blob = await response.blob();
  const safeName = (input.fileName || 'photo.jpg').toLowerCase().replace(/[^a-z0-9.-]/g, '-');
  const path = `${input.userId}/${input.bookingId}/${Date.now()}-${safeName}`;
  const { data, error } = await supabase.storage.from('booking-attachments').upload(path, blob, {
    contentType: 'image/jpeg',
  });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('booking-attachments').getPublicUrl(path);
  return { publicUrl: urlData.publicUrl, storagePath: path, mimeType: 'image/jpeg', fileName: safeName };
};

// --- Metadata via backend ---
export const saveBookingAttachments = async (bookingId: string, attachments: any[]) => {
  return api.post<any[]>(`/api/v3/bookings/${bookingId}/attachments`, { attachments });
};

export const getBookingAttachments = async (bookingId: string) => {
  return api.get<any[]>(`/api/v3/bookings/${bookingId}/attachments`);
};
```

- [ ] **Step 5: Commit mobile**

```bash
cd ServEase-mobile-test
git add services/bookingAttachmentService.ts
git commit -m "feat: rewrite bookingAttachmentService metadata to use backend"
```
