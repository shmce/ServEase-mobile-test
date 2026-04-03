# Microservices Data Map

This document serves as the central registry for the microservices-based database architecture in ServEase. Each microservice is mapped to a dedicated Supabase schema using the `_svc` naming convention.

## Schema Architecture Overview

| Microservice | Supabase Schema | Key Table(s) | Role / Purpose |
| :--- | :--- | :--- | :--- |
| **Identity Service** | `identity_svc` | `users`, `customer_profiles`, `user_addresses` | User authentication, profile basics, and location data. |
| **Provider Catalog** | `provider_catalog_svc` | `provider_profiles`, `provider_services`, `service_categories` | Provider verification, service offerings, and pricing configs. |
| **Booking Service** | `booking_svc` | `bookings`, `booking_attachments`, `reschedule_requests`, `additional_charges` | Booking state, scheduling, and price snapshotting. |
| **Payment Service** | `payment_svc` | `payments`, `provider_payouts` | Transaction tracking and provider earnings. |
| **Trust Service** | `trust_svc` | `reviews`, `provider_profile_reports` | Reputation management and quality assurance. |
| **Notification Service** | `notification_svc` | `notifications`, `support_tickets`, `disputes` | Async communication and platform support. |

---

## Data Interoperability & Snapshotting

To ensure data integrity and historical accuracy, certain data points are "snapshotted" across schemas when a state change occurs (e.g., creating a booking).

### Pricing Snapshots
- **Source:** `provider_catalog_svc.provider_services` (current rates)
- **Target:** `booking_svc.bookings` (snapshotted at time of booking)
- **Fields:** `hourly_rate`, `flat_rate`, `pricing_mode`, `total_amount`.

### Notification Metadata
- **Source:** `identity_svc.users` (full_name, contact)
- **Target:** `notification_svc.notifications` (actor name snapshot)

---

## Developer Guidelines
- **Always use the schema-scoped clients:** Import `identityDb`, `catalogDb`, etc., from `@/lib/db` in the frontend or inject the corresponding client in the backend.
- **Microservice Isolation:** Avoid cross-schema joins in single SQL queries. Prefer resolving IDs via the API layer or local lookups in the frontend service layer.
- **Additive Migrations:** When updating schemas, use `add column if not exists` and include the schema prefix in all `ALTER` or `CREATE` statements.
