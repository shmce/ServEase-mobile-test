# SQL Migration Inventory

This inventory tracks the schema evolution and applied migrations in the ServEase database across all microservices schemas.

| Migration Script | Target Schema(s) | Description | Status |
| :--- | :--- | :--- | :--- |
| **addresses_schema.sql** | `identity_svc` | User address handling. | Applied |
| **booking_flow_schema.sql** | `booking_svc` | Core booking lifecycle tables. | Applied |
| **chat_schema.sql** | `booking_svc` / `identity_svc` | Conversation and message tables. | Applied |
| **customer_feedback_schema.sql** | `trust_svc` | Review and feedback system. | Applied |
| **dual_pricing_booking_schema_v2.sql**| `provider_catalog_svc`, `booking_svc` | Additive dual-pricing fields and snapshotting. | Applied (Current Step) |
| **fix_missing_rls_policies.sql** | (All) | Security hardening and RLS policies. | Applied |
| **notifications_schema.sql** | `notification_svc` | In-app and push notification stores. | Applied |
| **provider_booking_requests_schema.sql**| `booking_svc` | Provider request management logic. | Applied |
| **provider_profile_schema.sql** | `provider_catalog_svc` | Core provider metadata and dual-pricing fields. | Applied (Updated) |
| **provider_verification_schema.sql** | `provider_catalog_svc` / `identity_svc` | Identity verification and document handling. | Applied |

---

## Migration Guidelines
- **Always version your migrations:** Use `_v2`, `_v3`, etc., for corrective or incremental updates.
- **Reference-Only Docs:** `provider_profile_schema.sql` serves as a master reference for all fields in that schema.
- **Microservices Awareness:** Ensure all table names are correctly prefixed with their respective schema (e.g. `booking_svc.bookings`).
- **Idempotency:** Always use `IF NOT EXISTS` or `DROP ... IF EXISTS` to ensure scripts can be rerun safely.
