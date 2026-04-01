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
        const url = configService.get<string>('SUPABASE_URL')!;
        const key = configService.get<string>('SUPABASE_SECRET_KEY')!;
        return createClient(url, key);
      },
      inject: [ConfigService],
    },
    {
      provide: IDENTITY_CLIENT,
      useFactory: (configService: ConfigService) => {
        return createClient(
          configService.get<string>('SUPABASE_URL')!,
          configService.get<string>('SUPABASE_SECRET_KEY')!,
          { db: { schema: 'identity_svc' } },
        );
      },
      inject: [ConfigService],
    },
    {
      provide: CATALOG_CLIENT,
      useFactory: (configService: ConfigService) => {
        return createClient(
          configService.get<string>('SUPABASE_URL')!,
          configService.get<string>('SUPABASE_SECRET_KEY')!,
          { db: { schema: 'provider_catalog_svc' } },
        );
      },
      inject: [ConfigService],
    },
    {
      provide: BOOKING_CLIENT,
      useFactory: (configService: ConfigService) => {
        return createClient(
          configService.get<string>('SUPABASE_URL')!,
          configService.get<string>('SUPABASE_SECRET_KEY')!,
          { db: { schema: 'booking_svc' } },
        );
      },
      inject: [ConfigService],
    },
    {
      provide: PAYMENT_CLIENT,
      useFactory: (configService: ConfigService) => {
        return createClient(
          configService.get<string>('SUPABASE_URL')!,
          configService.get<string>('SUPABASE_SECRET_KEY')!,
          { db: { schema: 'payment_svc' } },
        );
      },
      inject: [ConfigService],
    },
    {
      provide: TRUST_CLIENT,
      useFactory: (configService: ConfigService) => {
        return createClient(
          configService.get<string>('SUPABASE_URL')!,
          configService.get<string>('SUPABASE_SECRET_KEY')!,
          { db: { schema: 'trust_svc' } },
        );
      },
      inject: [ConfigService],
    },
    {
      provide: NOTIFICATION_CLIENT,
      useFactory: (configService: ConfigService) => {
        return createClient(
          configService.get<string>('SUPABASE_URL')!,
          configService.get<string>('SUPABASE_SECRET_KEY')!,
          { db: { schema: 'notification_svc' } },
        );
      },
      inject: [ConfigService],
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