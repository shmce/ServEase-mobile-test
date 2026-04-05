import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { withResilience } from '../common/utils/resilience.utils';

/**
 * Creates a Supabase client for a specific schema service,
 * wrapped in a resilience proxy (circuit breaker + retry).
 */
export function createServiceClient(schema: string): any {
  const client = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema } },
  );

  return new Proxy(client, {
    get(target, prop) {
      const original = (target as any)[prop];
      if (prop === 'from') {
        return (...args: any[]) => {
          const query = original.apply(target, args);
          return new Proxy(query, {
            get(qTarget, qProp) {
              const qOriginal = (qTarget as any)[qProp];
              if (typeof qOriginal === 'function') {
                return (...qArgs: any[]) =>
                  withResilience(schema, () =>
                    qOriginal.apply(qTarget, qArgs),
                  );
              }
              return qOriginal;
            },
          });
        };
      }
      return original;
    },
  });
}

// Named service clients
export const identityClient = createServiceClient('identity_svc');
export const providerClient = createServiceClient('provider_catalog_svc');
export const bookingClient = createServiceClient('booking_svc');
export const paymentClient = createServiceClient('payment_svc');
export const trustClient = createServiceClient('trust_svc');
export const notificationClient = createServiceClient('notification_svc');
