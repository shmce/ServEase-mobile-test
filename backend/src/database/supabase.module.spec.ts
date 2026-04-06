import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CircuitBreaker } from '../common/utils/resilience.utils';
import {
  SupabaseModule,
  BOOKING_CLIENT,
  CATALOG_CLIENT,
  IDENTITY_CLIENT,
  NOTIFICATION_CLIENT,
  PAYMENT_CLIENT,
  TRUST_CLIENT,
} from './supabase.module';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
  SupabaseClient: class {},
}));

describe('SupabaseModule providers', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function createModule(configMap?: Record<string, string>) {
    const schemaClient = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
        then: jest.fn((onFulfilled: (value: unknown) => unknown) =>
          Promise.resolve(onFulfilled({ data: [{ ok: true }], error: null })),
        ),
      })),
    };
    const baseClient = {
      schema: jest.fn(() => schemaClient),
    };

    (createClient as jest.Mock).mockReturnValue(baseClient);

    const moduleRef = await Test.createTestingModule({
      imports: [SupabaseModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn((key: string) => configMap?.[key]),
      })
      .compile();

    return { moduleRef, baseClient, schemaClient };
  }

  it('creates a base supabase client from config', async () => {
    const config = {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SECRET_KEY: 'secret',
    };
    const { moduleRef, baseClient } = await createModule(config);
    const result = moduleRef.get(SupabaseClient);

    expect(createClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'secret',
      {
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    expect(result).toBe(baseClient);
  });

  it('throws when base config is missing', async () => {
    await expect(createModule()).rejects.toThrow(
      'Supabase URL or Secret Key not found in config.',
    );
  });

  it.each([
    [IDENTITY_CLIENT, 'identity_svc'],
    [CATALOG_CLIENT, 'provider_catalog_svc'],
    [BOOKING_CLIENT, 'booking_svc'],
    [PAYMENT_CLIENT, 'payment_svc'],
    [TRUST_CLIENT, 'trust_svc'],
    [NOTIFICATION_CLIENT, 'notification_svc'],
  ])('creates resilient schema proxy for %s', (token, schemaName) => {
    return createModule({
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SECRET_KEY: 'secret',
    }).then(async ({ moduleRef, baseClient, schemaClient }) => {
      jest
        .spyOn(CircuitBreaker.prototype, 'execute')
        .mockImplementation(async (fn) => fn());

      const proxy = moduleRef.get(token);
      expect(baseClient.schema).toHaveBeenCalledWith(schemaName);

      const query = (proxy as { from: (table: string) => any }).from('users');
      const result = await query.select('*').maybeSingle();

      expect(schemaClient.from).toHaveBeenCalledWith('users');
      expect(result).toEqual({ data: [{ ok: true }], error: null });
    });
  });
});
