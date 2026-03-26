/**
 * Microservice schema-scoped Supabase clients.
 *
 * Import the right client for the table you are querying:
 *
 *   identityDb        → users, customer_profiles, user_addresses
 *   providerCatalogDb → provider_profiles, provider_verification,
 *                       provider_services, service_categories, provider_documents
 *   bookingDb         → bookings, booking_attachments, booking_reschedule_requests,
 *                       additional_charges, provider_availability, provider_days_off,
 *                       conversations, messages
 *   paymentDb         → payments, provider_payouts
 *   trustDb           → reviews, provider_profile_reports
 *   notificationDb    → notifications, support_tickets, disputes
 *
 * Use `supabase` directly for: auth, storage, realtime channels.
 */
import { supabase } from './supabase';

export { supabase };

export const identityDb        = supabase.schema('identity_svc');
export const providerCatalogDb = supabase.schema('provider_catalog_svc');
export const bookingDb         = supabase.schema('booking_svc');
export const paymentDb         = supabase.schema('payment_svc');
export const trustDb           = supabase.schema('trust_svc');
export const notificationDb    = supabase.schema('notification_svc');
