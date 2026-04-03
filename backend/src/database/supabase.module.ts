import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CircuitBreaker } from '../common/utils/resilience.utils';

export const IDENTITY_CLIENT = 'IDENTITY_CLIENT';
export const CATALOG_CLIENT = 'CATALOG_CLIENT';
export const BOOKING_CLIENT = 'BOOKING_CLIENT';
export const PAYMENT_CLIENT = 'PAYMENT_CLIENT';
export const TRUST_CLIENT = 'TRUST_CLIENT';
export const NOTIFICATION_CLIENT = 'NOTIFICATION_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: SupabaseClient,
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('SUPABASE_URL');
        const key = configService.get<string>('SUPABASE_SECRET_KEY');
        if (!url || !key) throw new Error('Supabase URL or Secret Key not found in config.');
        return createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false }
        });
      },
      inject: [ConfigService],
    },
    {
      provide: IDENTITY_CLIENT,
      useFactory: (client: SupabaseClient) => {
        const breaker = new CircuitBreaker('IDENTITY_SERVICE');
        return createResilientProxy(client.schema('identity_svc'), breaker);
      },
      inject: [SupabaseClient],
    },
    {
      provide: CATALOG_CLIENT,
      useFactory: (client: SupabaseClient) => {
        const breaker = new CircuitBreaker('CATALOG_SERVICE');
        return createResilientProxy(client.schema('provider_catalog_svc'), breaker);
      },
      inject: [SupabaseClient],
    },
    {
      provide: BOOKING_CLIENT,
      useFactory: (client: SupabaseClient) => {
        const breaker = new CircuitBreaker('BOOKING_SERVICE');
        return createResilientProxy(client.schema('booking_svc'), breaker);
      },
      inject: [SupabaseClient],
    },
    {
      provide: PAYMENT_CLIENT,
      useFactory: (client: SupabaseClient) => {
        const breaker = new CircuitBreaker('PAYMENT_SERVICE');
        return createResilientProxy(client.schema('payment_svc'), breaker);
      },
      inject: [SupabaseClient],
    },
    {
      provide: TRUST_CLIENT,
      useFactory: (client: SupabaseClient) => {
        const breaker = new CircuitBreaker('TRUST_SERVICE');
        return createResilientProxy(client.schema('trust_svc'), breaker);
      },
      inject: [SupabaseClient],
    },
    {
      provide: NOTIFICATION_CLIENT,
      useFactory: (client: SupabaseClient) => {
        const breaker = new CircuitBreaker('NOTIFICATION_SERVICE');
        return createResilientProxy(client.schema('notification_svc'), breaker);
      },
      inject: [SupabaseClient],
    },
  ],
  exports: [
    SupabaseClient,
    IDENTITY_CLIENT,
    CATALOG_CLIENT,
    BOOKING_CLIENT,
    PAYMENT_CLIENT,
    TRUST_CLIENT,
    NOTIFICATION_CLIENT,
  ],
})
export class SupabaseModule {}

/**
 * Creates a Proxy for the Supabase client that executes terminal calls through a Circuit Breaker.
 */
function createResilientProxy(client: any, breaker: CircuitBreaker): any {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const originalValue = Reflect.get(target, prop, receiver);

      // We only intercept 'from' because it starts the fluent builder chain
      if (prop === 'from' && typeof originalValue === 'function') {
        return (...args: any[]) => {
          const builder = originalValue.apply(target, args);
          // Return a proxy of the builder to intercept the final execution methods
          return createBuilderProxy(builder, breaker);
        };
      }

      return originalValue;
    },
  });
}

/**
 * Proxy for Supabase Query Builder to intercept execution methods like then, single, maybeSingle, etc.
 */
function createBuilderProxy(builder: any, breaker: CircuitBreaker): any {
  const executionMethods = new Set(['then', 'single', 'maybeSingle', 'select', 'insert', 'update', 'delete', 'upsert']);
  
  return new Proxy(builder, {
    get(target, prop, receiver) {
      const originalValue = Reflect.get(target, prop, receiver);

      if (typeof originalValue === 'function') {
        if (executionMethods.has(prop as string)) {
          return (...args: any[]) => {
            const next = originalValue.apply(target, args);
            // If it returns another builder (fluent API), proxy it too
            if (next && typeof next === 'object' && next !== target) {
              return createBuilderProxy(next, breaker);
            }
            return next;
          };
        }

        // Intercept 'then' to wrap the actual database call with the circuit breaker
        if (prop === 'then') {
          return (onFulfilled: any, onRejected: any) => {
            return breaker.execute(() => originalValue.call(target))
              .then(onFulfilled, onRejected);
          };
        }
      }

      return originalValue;
    },
  });
}