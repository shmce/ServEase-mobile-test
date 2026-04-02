import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
      useFactory: (client: SupabaseClient) => client.schema('identity_svc'),
      inject: [SupabaseClient],
    },
    {
      provide: CATALOG_CLIENT,
      useFactory: (client: SupabaseClient) => client.schema('provider_catalog_svc'),
      inject: [SupabaseClient],
    },
    {
      provide: BOOKING_CLIENT,
      useFactory: (client: SupabaseClient) => client.schema('booking_svc'),
      inject: [SupabaseClient],
    },
    {
      provide: PAYMENT_CLIENT,
      useFactory: (client: SupabaseClient) => client.schema('payment_svc'),
      inject: [SupabaseClient],
    },
    {
      provide: TRUST_CLIENT,
      useFactory: (client: SupabaseClient) => client.schema('trust_svc'),
      inject: [SupabaseClient],
    },
    {
      provide: NOTIFICATION_CLIENT,
      useFactory: (client: SupabaseClient) => client.schema('notification_svc'),
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