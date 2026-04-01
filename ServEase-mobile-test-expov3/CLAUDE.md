# ServEase — Claude Context

## Project Overview
ServEase is a service marketplace app.
- **Mobile app**: React Native (Expo)
- **Web interface**: React
- **Backend**: Supabase (PostgreSQL + Storage)
- **Events**: Kafka
- **BI**: Power BI

---

## Microservice Database Migration — IN PROGRESS

We are reorganizing the Supabase database from a single `public` schema into 6 microservice schemas.

### Schema Map

| Schema | Tables |
|---|---|
| `identity_svc` | users, customer_profiles, user_addresses, auth_sessions, otp_codes, app_policies, user_policy_acceptance |
| `provider_catalog_svc` | provider_profiles, provider_verification, provider_services, service_categories, provider_documents, location |
| `booking_svc` | bookings, booking_attachments, booking_reschedule_requests, additional_charges, provider_availability, provider_days_off, conversations, messages |
| `payment_svc` | payments, provider_payouts |
| `trust_svc` | reviews, provider_profile_reports |
| `notification_svc` | notifications, support_tickets, disputes |

### What is DONE

- [x] SQL migration files created in `supabase/microservices/`
- [x] All 16 app service files updated to use schema-scoped clients
- [x] `lib/db.ts` created — central export of schema-scoped Supabase clients
- [x] Realtime subscription schema strings updated (`booking_svc`, `notification_svc`)

### What is PENDING

- [ ] **Run the 4 SQL migration files** in Supabase SQL Editor (in order)
- [ ] **Expose schemas in Supabase Dashboard** → Settings → API → Data API → Exposed schemas
- [ ] Needs **Owner/Admin role** on Supabase org to edit exposed schemas

### SQL Files to Run (in order)

Run each in **Supabase Dashboard → SQL Editor**, one at a time:

1. `supabase/microservices/00_create_schemas.sql` — creates the 6 schemas + grants
2. `supabase/microservices/01_drop_cross_service_fks.sql` — drops cross-service FK constraints (data is safe)
3. `supabase/microservices/02_migrate_tables.sql` — moves tables from `public` to new schemas
4. `supabase/microservices/03_rls_and_grants.sql` — re-applies RLS policies per schema

> Run files 00, 01, 03 first safely. Run 02 only after the exposed schemas setting is updated.

### Exposed Schemas Setting

After getting Owner/Admin access:
- Go to **Supabase Dashboard → Settings → API → Data API**
- Add to **Exposed schemas** (keep `public`):

```
public, identity_svc, provider_catalog_svc, booking_svc, payment_svc, trust_svc, notification_svc
```

### How to Reverse (if needed)

```sql
-- Move a table back to public
ALTER TABLE identity_svc.users SET SCHEMA public;
ALTER TABLE identity_svc.customer_profiles SET SCHEMA public;
ALTER TABLE identity_svc.user_addresses SET SCHEMA public;
ALTER TABLE provider_catalog_svc.provider_profiles SET SCHEMA public;
ALTER TABLE provider_catalog_svc.provider_services SET SCHEMA public;
ALTER TABLE provider_catalog_svc.service_categories SET SCHEMA public;
ALTER TABLE provider_catalog_svc.provider_verification SET SCHEMA public;
ALTER TABLE booking_svc.bookings SET SCHEMA public;
ALTER TABLE booking_svc.conversations SET SCHEMA public;
ALTER TABLE booking_svc.messages SET SCHEMA public;
ALTER TABLE booking_svc.booking_attachments SET SCHEMA public;
ALTER TABLE booking_svc.booking_reschedule_requests SET SCHEMA public;
ALTER TABLE booking_svc.additional_charges SET SCHEMA public;
ALTER TABLE booking_svc.provider_availability SET SCHEMA public;
ALTER TABLE booking_svc.provider_days_off SET SCHEMA public;
ALTER TABLE payment_svc.payments SET SCHEMA public;
ALTER TABLE trust_svc.reviews SET SCHEMA public;
ALTER TABLE trust_svc.provider_profile_reports SET SCHEMA public;
ALTER TABLE notification_svc.notifications SET SCHEMA public;
ALTER TABLE notification_svc.support_tickets SET SCHEMA public;
ALTER TABLE notification_svc.disputes SET SCHEMA public;
```

---

## App Code — Schema Client Pattern

All Supabase table queries now use schema-scoped clients from `lib/db.ts`:

```typescript
import { identityDb, providerCatalogDb, bookingDb, paymentDb, trustDb, notificationDb } from '../lib/db';

// Example
identityDb.from('users')           // identity_svc.users
bookingDb.from('bookings')         // booking_svc.bookings
providerCatalogDb.from('provider_services') // provider_catalog_svc.provider_services
```

Use bare `supabase` (from `lib/db.ts`) only for: `supabase.auth`, `supabase.storage`, `supabase.channel()`.

---

## Supabase Project

- **URL**: `https://strtoeeidqnsmbszhjhe.supabase.co`
- **Project ref**: `strtoeeidqnsmbszhjhe`
