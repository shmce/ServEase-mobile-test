# Backend API Gateway — Plan 3: Business Logic Transfer

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move business logic from mobile service files to the NestJS backend, so the backend endpoints are no longer thin pass-throughs but own validation, side effects (payment sync, notifications), and cross-service orchestration.

**Architecture:** Each task enriches an existing v3 backend service with logic that was previously in the mobile app. Mobile service files are then simplified to remove temporary client-side workarounds. The notification creation module is the foundation — other tasks depend on it.

**Tech Stack:** NestJS 11, Supabase JS v2, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-28-backend-api-gateway-design.md`

**Depends on:** Plan 2 (all 45 endpoints) must be complete.

**Important notes:**
- Backend git repo is at `Backend/ServEase-BE-API/` (has its own `.git`)
- Mobile git repo is at `ServEase-mobile-test/` (has its own `.git`)
- Commit from within each project directory
- Tasks must be done in order — Task 1 (notification creation) is a dependency for Tasks 2–4

---

## Task 1: Notification Creation on Backend

Move `createChatNotification` and `createBookingStatusNotification` from mobile to the backend notifications module. This is a prerequisite for Tasks 2–4.

**Backend files:**
- Modify: `Backend/ServEase-BE-API/src/modules/notifications/notifications.service.ts`
- Modify: `Backend/ServEase-BE-API/src/modules/notifications/notifications.controller.ts`

**Mobile files:**
- Modify: `ServEase-mobile-test/services/notificationService.ts`

### Backend

- [ ] **Step 1: Add notification creation methods to `notifications.service.ts`**

Append these methods to the existing `NotificationsService`:

```typescript
  async createBookingStatusNotification(input: {
    recipientUserId: string;
    recipientRole: string;
    actorId: string;
    bookingId: string;
    type: string;
    title: string;
    body: string;
    senderName: string;
    serviceName: string;
    senderPhone?: string;
    bookingStatus: string;
    target?: Record<string, any>;
    fallbackTarget?: Record<string, any>;
  }) {
    const recipientUserId = (input.recipientUserId || '').trim();
    if (!recipientUserId) return null;

    const data = {
      bookingId: input.bookingId,
      senderName: input.senderName,
      serviceName: input.serviceName,
      senderPhone: input.senderPhone || '',
      recipientRole: input.recipientRole,
      target: input.target,
      fallbackTarget: input.fallbackTarget,
      context: {
        bookingStatus: input.bookingStatus,
        recipientRole: input.recipientRole,
        senderName: input.senderName,
        serviceName: input.serviceName,
      },
    };

    const { data: saved, error } = await this.notificationDb
      .from('notifications')
      .insert({
        user_id: recipientUserId,
        actor_id: input.actorId,
        booking_id: input.bookingId,
        type: input.type,
        title: input.title,
        body: input.body,
        is_read: false,
        data,
      })
      .select()
      .single();
    if (error) throw error;
    return saved;
  }

  async createChatNotification(input: {
    recipientUserId: string;
    recipientRole: string;
    actorId: string;
    bookingId: string;
    senderName: string;
    serviceName: string;
    senderPhone?: string;
    target?: Record<string, any>;
    fallbackTarget?: Record<string, any>;
  }) {
    const recipientUserId = (input.recipientUserId || '').trim();
    if (!recipientUserId) return null;

    const data = {
      bookingId: input.bookingId,
      senderName: input.senderName,
      serviceName: input.serviceName,
      senderPhone: input.senderPhone || '',
      recipientRole: input.recipientRole,
      target: input.target,
      fallbackTarget: input.fallbackTarget,
    };

    const { data: saved, error } = await this.notificationDb
      .from('notifications')
      .insert({
        user_id: recipientUserId,
        actor_id: input.actorId,
        booking_id: input.bookingId,
        type: 'chat_message',
        title: `New message from ${input.senderName}`,
        body: `${input.serviceName}: open chat to reply.`,
        is_read: false,
        data,
      })
      .select()
      .single();
    if (error) throw error;
    return saved;
  }
```

- [ ] **Step 2: Add notification creation routes to `notifications.controller.ts`**

Add `Post` and `Body` to the imports, then add these routes:

```typescript
  @Post('booking-status')
  async createBookingStatusNotification(@Body() body: any) {
    return this.notificationsService.createBookingStatusNotification(body);
  }

  @Post('chat')
  async createChatNotification(@Body() body: any) {
    return this.notificationsService.createChatNotification(body);
  }
```

- [ ] **Step 3: Export `NotificationsService` from the module**

Modify `notifications.module.ts` to add `exports: [NotificationsService]` so other modules can inject it.

- [ ] **Step 4: Build, commit backend**

```bash
cd Backend/ServEase-BE-API && npx nest build
git add src/modules/notifications/
git commit -m "feat: add notification creation endpoints and export service"
```

### Mobile

- [ ] **Step 5: Remove client-side notification writes from `notificationService.ts`**

Remove `createChatNotification` and `createBookingStatusNotification` functions. Replace them with backend API calls:

```typescript
export const createChatNotification = async (input: {
  recipientUserId: string;
  recipientRole: string;
  actorId: string;
  bookingId: string;
  senderName: string;
  serviceName: string;
  senderPhone?: string;
  target?: any;
  fallbackTarget?: any;
}) => {
  try {
    return await api.post<any>('/api/v3/notifications/chat', input);
  } catch {
    return null;
  }
};

export const createBookingStatusNotification = async (input: {
  recipientUserId: string;
  recipientRole: string;
  actorId: string;
  bookingId: string;
  type: string;
  title: string;
  body: string;
  senderName: string;
  serviceName: string;
  senderPhone?: string;
  bookingStatus: string;
  target?: any;
  fallbackTarget?: any;
}) => {
  try {
    return await api.post<any>('/api/v3/notifications/booking-status', input);
  } catch {
    return null;
  }
};
```

Also remove the `notificationDb` import from `../lib/db` (keep `supabase` for realtime), remove `getErrorMessage` import, remove `mapNotificationRow` and `formatTimeLabel` helper functions since they're no longer needed client-side.

- [ ] **Step 6: Commit mobile**

```bash
cd ServEase-mobile-test
git add services/notificationService.ts
git commit -m "feat: move notification creation to backend API"
```

---

## Task 2: Booking Creation Business Logic

Move service resolution, availability validation, payment creation, and provider notification into the backend `createBooking` method.

**Backend files:**
- Modify: `Backend/ServEase-BE-API/src/modules/booking/v3/booking-v3.service.ts`
- Modify: `Backend/ServEase-BE-API/src/modules/booking/booking.module.ts`

### Backend

- [ ] **Step 1: Import NotificationsModule in BookingModule**

Add `NotificationsModule` to the `imports` array in `booking.module.ts` so `NotificationsService` can be injected.

- [ ] **Step 2: Inject `NotificationsService` and `PaymentsV3Service` into `BookingV3Service`**

This requires importing `PaymentsModule` in `BookingModule` as well (add to imports, add `exports: [PaymentsV3Service]` in `payments.module.ts`).

Add to the `BookingV3Service` constructor:

```typescript
import { NotificationsService } from '../../notifications/notifications.service';
import { PaymentsV3Service } from '../../payments/v3/payments-v3.service';

// In constructor:
private readonly notificationsService: NotificationsService,
private readonly paymentsV3Service: PaymentsV3Service,
```

- [ ] **Step 3: Rewrite `createBooking` with full business logic**

Replace the current simple insert with:

```typescript
  async createBooking(customerId: string, bookingData: Record<string, any>) {
    // 1. Resolve service
    let serviceRow: any = null;
    const serviceId = bookingData.service_id;
    const providerId = bookingData.provider_id;

    if (serviceId) {
      const { data } = await this.providerCatalogDb
        .from('provider_services')
        .select('id, price, provider_id, title')
        .eq('id', serviceId)
        .maybeSingle();
      serviceRow = data;
    }

    if (!serviceRow && providerId && bookingData.service_name) {
      const { data } = await this.providerCatalogDb
        .from('provider_services')
        .select('id, price, provider_id, title')
        .eq('provider_id', providerId)
        .eq('title', bookingData.service_name)
        .limit(1)
        .maybeSingle();
      serviceRow = data;
    }

    if (!serviceRow) {
      throw new Error('Selected service is not available.');
    }

    const resolvedProviderId = providerId || serviceRow.provider_id;

    // 2. Build payload
    const reference = `BK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const payload = {
      booking_reference: reference,
      customer_id: customerId,
      provider_id: resolvedProviderId,
      service_id: serviceRow.id,
      service_address: bookingData.service_address || bookingData.address || '',
      scheduled_at: bookingData.scheduled_at,
      total_amount: bookingData.total_amount ?? serviceRow.price ?? 0,
      customer_notes: (bookingData.customer_notes || bookingData.notes || '').trim() || null,
      status: 'pending',
    };

    // 3. Insert booking
    const { data: booking, error } = await this.bookingDb
      .from('bookings')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;

    // 4. Create payment record
    try {
      await this.paymentsV3Service.ensureBookingPayment({
        bookingId: booking.id,
        customerId,
        providerId: resolvedProviderId,
        amount: payload.total_amount,
        method: bookingData.payment_method || 'cash',
      });
    } catch (e) {
      console.warn('Payment record creation failed:', e);
    }

    // 5. Notify provider
    try {
      const [{ data: customer }, { data: service }] = await Promise.all([
        this.identityDb.from('users').select('full_name, contact_number').eq('id', customerId).single(),
        this.providerCatalogDb.from('provider_services').select('title').eq('id', serviceRow.id).single(),
      ]);
      const customerName = customer?.full_name || 'Customer';
      const serviceName = service?.title || 'Service Booking';

      await this.notificationsService.createBookingStatusNotification({
        recipientUserId: resolvedProviderId,
        recipientRole: 'provider',
        actorId: customerId,
        bookingId: booking.id,
        type: 'booking_requested',
        title: `New booking request from ${customerName}`,
        body: `${serviceName} needs your confirmation.`,
        senderName: customerName,
        serviceName,
        senderPhone: customer?.contact_number || '',
        bookingStatus: 'pending',
        target: { screen: '/provider-booking-details', params: { id: booking.id } },
      });
    } catch (e) {
      console.warn('Provider notification failed:', e);
    }

    return booking;
  }
```

- [ ] **Step 4: Build, commit backend**

```bash
cd Backend/ServEase-BE-API && npx nest build
git add src/modules/booking/ src/modules/payments/ src/modules/notifications/
git commit -m "feat: add business logic to createBooking (service resolution, payment, notification)"
```

---

## Task 3: Booking Status Update Side Effects

Add payment sync and notification logic to `updateBookingStatus` and `cancelBooking`.

**Backend files:**
- Modify: `Backend/ServEase-BE-API/src/modules/booking/v3/booking-v3.service.ts`

**Mobile files:**
- Modify: `ServEase-mobile-test/services/providerBookingService.ts`
- Modify: `ServEase-mobile-test/services/bookingService.ts`

### Backend

- [ ] **Step 1: Add status transition validation and side effects to `updateBookingStatus`**

Replace the current simple update:

```typescript
  async updateBookingStatus(bookingId: string, status: string, userId?: string) {
    // Validate transition
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
    };

    const { data: current } = await this.bookingDb
      .from('bookings')
      .select('status, customer_id, provider_id, service_id, total_amount')
      .eq('id', bookingId)
      .single();

    if (current) {
      const currentNormalized = (current.status || '').toLowerCase().replace(/[\s-]+/g, '_');
      const allowed = validTransitions[currentNormalized] || [];
      if (allowed.length && !allowed.includes(status)) {
        throw new Error(`Cannot transition from '${current.status}' to '${status}'.`);
      }
    }

    const { data, error } = await this.bookingDb
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .select()
      .single();
    if (error) throw error;

    // Payment sync
    try {
      if (status === 'completed') {
        await this.paymentsV3Service.markBookingPaymentPaid({ bookingId });
      } else if (status === 'cancelled') {
        await this.paymentsV3Service.cancelBookingPayment(bookingId);
      }
    } catch (e) {
      console.warn('Payment sync failed:', e);
    }

    // Notify customer about provider action
    if (current && userId) {
      try {
        const [{ data: provider }, { data: service }] = await Promise.all([
          this.identityDb.from('users').select('full_name, contact_number').eq('id', userId).single(),
          current.service_id
            ? this.providerCatalogDb.from('provider_services').select('title').eq('id', current.service_id).single()
            : Promise.resolve({ data: null }),
        ]);
        const providerName = provider?.full_name || 'Service Provider';
        const serviceName = service?.title || 'Service Booking';

        const notifMap: Record<string, { type: string; title: string; body: string }> = {
          confirmed: { type: 'booking_confirmed', title: `${providerName} confirmed your booking`, body: `${serviceName} is confirmed.` },
          in_progress: { type: 'booking_in_progress', title: `${providerName} started your service`, body: `${serviceName} is now in progress.` },
          completed: { type: 'booking_completed', title: `${serviceName} is complete`, body: 'Your provider marked this service as completed.' },
          cancelled: { type: 'booking_cancelled', title: `${serviceName} was cancelled`, body: 'This booking was cancelled by the provider.' },
        };

        const notif = notifMap[status];
        if (notif) {
          await this.notificationsService.createBookingStatusNotification({
            recipientUserId: current.customer_id,
            recipientRole: 'customer',
            actorId: userId,
            bookingId,
            type: notif.type,
            title: notif.title,
            body: notif.body,
            senderName: providerName,
            serviceName,
            senderPhone: provider?.contact_number || '',
            bookingStatus: status,
            target: { screen: '/customer-booking-details', params: { id: bookingId } },
          });
        }
      } catch (e) {
        console.warn('Customer notification failed:', e);
      }
    }

    return data;
  }
```

- [ ] **Step 2: Update `cancelBooking` with payment sync and notification**

Replace the current simple update:

```typescript
  async cancelBooking(bookingId: string, customerId: string, reason: string, explanation?: string) {
    const { data: current } = await this.bookingDb
      .from('bookings')
      .select('provider_id, service_id')
      .eq('id', bookingId)
      .single();

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

    // Cancel payment
    try {
      await this.paymentsV3Service.cancelBookingPayment(bookingId);
    } catch (e) {
      console.warn('Payment cancellation failed:', e);
    }

    // Notify provider
    if (current?.provider_id) {
      try {
        const [{ data: customer }, { data: service }] = await Promise.all([
          this.identityDb.from('users').select('full_name, contact_number').eq('id', customerId).single(),
          current.service_id
            ? this.providerCatalogDb.from('provider_services').select('title').eq('id', current.service_id).single()
            : Promise.resolve({ data: null }),
        ]);
        const customerName = customer?.full_name || 'Customer';
        const serviceName = service?.title || 'Service Booking';

        await this.notificationsService.createBookingStatusNotification({
          recipientUserId: current.provider_id,
          recipientRole: 'provider',
          actorId: customerId,
          bookingId,
          type: 'booking_cancelled',
          title: `${customerName} cancelled the booking`,
          body: `${serviceName} no longer requires provider action.`,
          senderName: customerName,
          serviceName,
          senderPhone: customer?.contact_number || '',
          bookingStatus: 'cancelled',
          target: { screen: '/provider-booking-details', params: { id: bookingId } },
        });
      } catch (e) {
        console.warn('Provider cancel notification failed:', e);
      }
    }

    return data;
  }
```

- [ ] **Step 3: Update controller to pass userId to updateBookingStatus**

In `booking-v3.controller.ts`, change the `updateBookingStatus` route to pass `req.user.id`:

```typescript
  @Patch(':bookingId/status')
  async updateBookingStatus(
    @Req() req: any,
    @Param('bookingId') bookingId: string,
    @Body() body: { status: string },
  ) {
    return this.bookingV3Service.updateBookingStatus(bookingId, body.status, req.user.id);
  }
```

- [ ] **Step 4: Build, commit backend**

```bash
cd Backend/ServEase-BE-API && npx nest build
git add src/modules/booking/
git commit -m "feat: add payment sync and notifications to booking status changes"
```

### Mobile

- [ ] **Step 5: Remove client-side payment sync from `providerBookingService.ts`**

Remove the temporary try/catch block in `updateBookingStatus`:

```typescript
export const updateBookingStatus = async (
  bookingId: string,
  providerId: string,
  target: 'confirmed' | 'in_progress' | 'completed' | 'cancelled',
) => {
  return api.patch<any>(`/api/v3/bookings/${bookingId}/status`, { status: target });
};
```

Remove the unused imports of `markBookingPaymentPaid`, `cancelBookingPayment`, and `createBookingStatusNotification`.

- [ ] **Step 6: Remove client-side payment cancel from `bookingService.ts`**

Simplify `cancelCustomerBooking`:

```typescript
export const cancelCustomerBooking = async (
  bookingId: string,
  customerId: string,
  reason: string,
  explanation: string,
) => {
  return api.post<any>(`/api/v3/bookings/${bookingId}/cancel`, { reason, explanation });
};
```

Remove unused imports of `cancelBookingPayment` and `createBookingStatusNotification`.

- [ ] **Step 7: Commit mobile**

```bash
cd ServEase-mobile-test
git add services/providerBookingService.ts services/bookingService.ts
git commit -m "feat: remove client-side payment sync and notification workarounds"
```

---

## Task 4: Chat Notification via Backend

When a chat message is sent, the backend should create a notification for the recipient. Currently the mobile does this client-side.

**Backend files:**
- Modify: `Backend/ServEase-BE-API/src/modules/chat/chat.module.ts`
- Modify: `Backend/ServEase-BE-API/src/modules/chat/chat.service.ts`

### Backend

- [ ] **Step 1: Import NotificationsModule in ChatModule**

Add `NotificationsModule` to the `imports` array in `chat.module.ts`.

- [ ] **Step 2: Inject NotificationsService into ChatService and add notification to `sendMessage`**

```typescript
import { NotificationsService } from '../notifications/notifications.service';

// Add to constructor:
private readonly notificationsService: NotificationsService,
```

Update `sendMessage` to create a notification after inserting the message:

```typescript
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

    // Notify the other party
    try {
      const { data: conversation } = await this.bookingDb
        .from('conversations')
        .select('customer_id, provider_id')
        .eq('booking_id', input.bookingId)
        .single();

      if (conversation) {
        const recipientId = input.senderRole === 'customer'
          ? conversation.provider_id
          : conversation.customer_id;
        const recipientRole = input.senderRole === 'customer' ? 'provider' : 'customer';

        const { data: sender } = await this.identityDb
          .from('users')
          .select('full_name, contact_number')
          .eq('id', input.senderId)
          .single();

        await this.notificationsService.createChatNotification({
          recipientUserId: recipientId,
          recipientRole,
          actorId: input.senderId,
          bookingId: input.bookingId,
          senderName: sender?.full_name || 'User',
          serviceName: 'Chat',
          senderPhone: sender?.contact_number || '',
        });
      }
    } catch (e) {
      console.warn('Chat notification failed:', e);
    }

    return data;
  }
```

- [ ] **Step 3: Build, commit backend**

```bash
cd Backend/ServEase-BE-API && npx nest build
git add src/modules/chat/
git commit -m "feat: add chat message notification on backend"
```

---

## Task 5: Platform Fee Configuration

Externalize the hard-coded platform fee rate in `PaymentsV3Service`.

**Backend files:**
- Modify: `Backend/ServEase-BE-API/src/modules/payments/v3/payments-v3.service.ts`

### Backend

- [ ] **Step 1: Inject ConfigService and use env var for platform fee**

```typescript
import { ConfigService } from '@nestjs/config';

// Add to constructor:
private readonly configService: ConfigService,
```

Update `getProviderEarningsSummary`:

```typescript
  async getProviderEarningsSummary(providerId: string) {
    const payments = await this.getProviderPaymentHistory(providerId);
    const paidPayments = payments.filter((p: any) => p.status === 'paid' || p.status === 'completed');
    const pendingPayments = payments.filter((p: any) => p.status === 'pending');
    const totalRevenue = paidPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const platformFeeRate = parseFloat(this.configService.get('PLATFORM_FEE_RATE', '0.10'));
    const totalNetEarnings = totalRevenue * (1 - platformFeeRate);
    const pendingRevenue = pendingPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const pendingNetEarnings = pendingRevenue * (1 - platformFeeRate);

    return {
      payments,
      totalRevenue,
      totalNetEarnings,
      pendingRevenue,
      pendingNetEarnings,
      platformFeeRate,
      paidCount: paidPayments.length,
      pendingCount: pendingPayments.length,
    };
  }
```

- [ ] **Step 2: Add default to `.env`**

Add `PLATFORM_FEE_RATE=0.10` to the `.env` file.

- [ ] **Step 3: Build, commit backend**

```bash
cd Backend/ServEase-BE-API && npx nest build
git add src/modules/payments/ .env.example
git commit -m "feat: externalize platform fee rate to config"
```
