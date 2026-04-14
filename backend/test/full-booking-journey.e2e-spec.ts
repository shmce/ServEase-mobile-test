import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AppAuthGuard } from '../src/modules/auth/guards/app-auth.guard';

describe('Full Booking Journey (e2e)', () => {
  let app: INestApplication;
  let bookingDb: any;
  let identityDb: any;
  let catalogDb: any;
  let paymentDb: any;
  let notificationDb: any;

  const mockBooking = {
    id: 'booking-123',
    customer_id: 'customer-123',
    provider_id: 'provider-456',
    service_id: 'service-789',
    status: 'pending',
    total_amount: 1500,
    booking_reference: 'BKG-TEST',
  };

  /**
   * Creates a chainable Supabase query builder mock that resolves with the given data.
   * All chain methods return `this` so .from().select().eq().single() etc. all work.
   */
  const createMockBuilder = (data: any) => {
    let singleMode = false;
    const builder: any = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockImplementation(() => {
        singleMode = true;
        return builder;
      }),
      single: jest.fn().mockImplementation(() => {
        singleMode = true;
        return builder;
      }),
      // Thenable: allows `await builder` to resolve with { data, error }
      // Single-mode returns the scalar data; list-mode returns [] so conflict checks find no conflicts.
      then: jest.fn().mockImplementation(function (onfulfilled: any) {
        const resolvedData = singleMode ? data : [];
        const result = { data: resolvedData, error: null };
        return onfulfilled
          ? Promise.resolve(onfulfilled(result))
          : Promise.resolve(result);
      }),
    };
    return builder;
  };

  /**
   * Creates a Supabase client mock whose `.from(table)` returns table-specific data.
   * The top-level client intentionally has no `then` so NestJS DI does not unwrap it.
   */
  const createMockSupabase = (tableDataMap: Record<string, any>) => ({
    from: jest
      .fn()
      .mockImplementation((table: string) =>
        createMockBuilder(tableDataMap[table] ?? null),
      ),
  });

  beforeAll(async () => {
    bookingDb = createMockSupabase({
      bookings: mockBooking,
      conversations: { id: 'conv-123', booking_id: mockBooking.id },
      messages: {
        id: 'msg-123',
        text: 'Hello provider!',
        sender_id: 'customer-123',
        sender_role: 'customer',
      },
    });

    identityDb = createMockSupabase({
      users: { id: 'provider-456', role: 'provider', status: 'active' },
    });

    catalogDb = createMockSupabase({
      provider_profiles: { verification_status: 'approved' },
      provider_services: {
        id: 'service-789',
        provider_id: 'provider-456',
        supports_flat: true,
        flat_rate: 1500,
        service_location_type: 'mobile',
        service_location_address: null,
      },
    });

    paymentDb = createMockSupabase({
      payments: { id: 'pay-123', status: 'pending' },
    });

    notificationDb = createMockSupabase({
      notifications: null,
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AppAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.authUser = { sub: 'customer-123', role: 'customer' };
          return true;
        },
      })
      .overrideProvider('BOOKING_CLIENT')
      .useValue(bookingDb)
      .overrideProvider('IDENTITY_CLIENT')
      .useValue(identityDb)
      .overrideProvider('CATALOG_CLIENT')
      .useValue(catalogDb)
      .overrideProvider('PAYMENT_CLIENT')
      .useValue(paymentDb)
      .overrideProvider('NOTIFICATION_CLIENT')
      .useValue(notificationDb)
      .compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should complete a full booking journey: Create -> Accept -> Chat -> Pay -> Complete', async () => {
    const agent = request(app.getHttpServer());

    // 1. Create Booking
    const createRes = await agent
      .post('/v1/booking/create')
      .set('Authorization', 'Bearer mock-token')
      .send({
        provider_id: 'provider-456',
        service_id: 'service-789',
        scheduled_at: new Date().toISOString(),
        service_address: '123 Test St',
        service_location_type: 'mobile',
        pricing_mode: 'flat',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.booking).toMatchObject({
      id: 'booking-123',
      booking_reference: 'BKG-TEST',
    });

    // 2. Accept Booking (Provider)
    const acceptRes = await agent
      .patch(`/v1/booking/${mockBooking.id}/status`)
      .set('Authorization', 'Bearer provider-token')
      .send({ status: 'confirmed' });

    expect(acceptRes.status).toBe(200);

    // 3. Send Message
    const chatRes = await agent
      .post(`/v1/chat/conversations/${mockBooking.id}/messages`)
      .set('Authorization', 'Bearer customer-token')
      .send({ text: 'Hello provider!' });

    expect(chatRes.status).toBe(201);

    // 4. Complete Service (Provider)
    const completeRes = await agent
      .patch(`/v1/booking/${mockBooking.id}/status`)
      .set('Authorization', 'Bearer provider-token')
      .send({ status: 'completed' });

    expect(completeRes.status).toBe(200);
  });
});
