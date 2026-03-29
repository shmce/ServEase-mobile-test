# Backend API Gateway — Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the backend schema-scoped DB clients, global auth guard, CORS, and the mobile HTTP client (`lib/api.ts`) so that subsequent plans can add endpoints and rewire services.

**Architecture:** The NestJS backend gets schema-scoped Supabase clients matching the mobile pattern (6 schemas), a globally-applied auth guard with a `@Public()` decorator for exemptions, and CORS enabled for mobile access. The mobile app gets an `api.ts` HTTP client that attaches the Supabase JWT to every request and a new env var for the backend URL.

**Tech Stack:** NestJS 11, Supabase JS v2, Expo SDK 54, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-28-backend-api-gateway-design.md`

---

## File Map

### Backend (`Backend/ServEase-BE-API/`)

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/lib/schema-clients.ts` | Schema-scoped Supabase client factory |
| Create | `src/common/decorators/public.decorator.ts` | `@Public()` decorator to exempt routes from auth |
| Create | `.env` | Environment variables (Supabase URL + service role key) |
| Modify | `src/database/supabase.module.ts` | Provide schema-scoped clients as named injection tokens |
| Modify | `src/modules/auth/guards/supabase-auth.guard.ts` | Use injected `SupabaseClient`, respect `@Public()` decorator |
| Modify | `src/app.module.ts` | Register global auth guard |
| Modify | `src/main.ts` | Enable CORS |
| Create | `src/modules/health/health.controller.ts` | `GET /api/health` — public smoke-test endpoint |
| Create | `src/modules/health/health.module.ts` | Health module |

### Mobile (`ServEase-mobile-test/`)

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `lib/api.ts` | HTTP client with Supabase JWT, typed helpers |
| Modify | `.env` | Add `EXPO_PUBLIC_API_BASE_URL` |

---

## Task 1: Backend `.env` file

**Files:**
- Create: `Backend/ServEase-BE-API/.env`

Currently the backend has no `.env` file. The `SupabaseModule` reads `SUPABASE_URL` and `SUPABASE_SECRET_KEY` from env, but the auth guard imports a hardcoded `supabaseClient.js`. We need a single source of truth.

- [ ] **Step 1: Create `.env`**

```env
SUPABASE_URL=https://strtoeeidqnsmbszhjhe.supabase.co
SUPABASE_SECRET_KEY=your-service-role-key-here
```

Replace `your-service-role-key-here` with the actual Supabase service role key from the Supabase Dashboard (Settings > API > service_role key). This is NOT the anon key — it's the secret key that bypasses RLS.

- [ ] **Step 2: Verify `.gitignore` excludes `.env`**

Run: `cat Backend/ServEase-BE-API/.gitignore | grep -i env`

If `.env` is not listed, add it:

```
# .gitignore
.env
```

- [ ] **Step 3: Commit**

```bash
cd Backend/ServEase-BE-API
git add .gitignore
git commit -m "chore: ensure .env is gitignored"
```

Note: Do NOT commit the `.env` file itself.

---

## Task 2: Schema-scoped DB clients

**Files:**
- Create: `Backend/ServEase-BE-API/src/lib/schema-clients.ts`
- Modify: `Backend/ServEase-BE-API/src/database/supabase.module.ts`

- [ ] **Step 1: Create `src/lib/schema-clients.ts`**

```typescript
import { SupabaseClient } from '@supabase/supabase-js';

export const IDENTITY_DB = 'IDENTITY_DB';
export const PROVIDER_CATALOG_DB = 'PROVIDER_CATALOG_DB';
export const BOOKING_DB = 'BOOKING_DB';
export const PAYMENT_DB = 'PAYMENT_DB';
export const TRUST_DB = 'TRUST_DB';
export const NOTIFICATION_DB = 'NOTIFICATION_DB';

export function createSchemaClients(supabase: SupabaseClient) {
  return {
    [IDENTITY_DB]: supabase.schema('identity_svc'),
    [PROVIDER_CATALOG_DB]: supabase.schema('provider_catalog_svc'),
    [BOOKING_DB]: supabase.schema('booking_svc'),
    [PAYMENT_DB]: supabase.schema('payment_svc'),
    [TRUST_DB]: supabase.schema('trust_svc'),
    [NOTIFICATION_DB]: supabase.schema('notification_svc'),
  };
}
```

- [ ] **Step 2: Update `src/database/supabase.module.ts`**

Replace the entire file with:

```typescript
import { Global, Module } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  IDENTITY_DB,
  PROVIDER_CATALOG_DB,
  BOOKING_DB,
  PAYMENT_DB,
  TRUST_DB,
  NOTIFICATION_DB,
  createSchemaClients,
} from '../lib/schema-clients';

const supabaseFactory = {
  provide: SupabaseClient,
  useFactory: () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set in environment variables.');
    }

    return createClient(supabaseUrl, supabaseKey);
  },
};

function schemaProvider(token: string) {
  return {
    provide: token,
    useFactory: (supabase: SupabaseClient) => createSchemaClients(supabase)[token],
    inject: [SupabaseClient],
  };
}

@Global()
@Module({
  providers: [
    supabaseFactory,
    schemaProvider(IDENTITY_DB),
    schemaProvider(PROVIDER_CATALOG_DB),
    schemaProvider(BOOKING_DB),
    schemaProvider(PAYMENT_DB),
    schemaProvider(TRUST_DB),
    schemaProvider(NOTIFICATION_DB),
  ],
  exports: [
    SupabaseClient,
    IDENTITY_DB,
    PROVIDER_CATALOG_DB,
    BOOKING_DB,
    PAYMENT_DB,
    TRUST_DB,
    NOTIFICATION_DB,
  ],
})
export class SupabaseModule {}
```

- [ ] **Step 3: Verify the backend compiles**

Run: `cd Backend/ServEase-BE-API && npx nest build`

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/schema-clients.ts src/database/supabase.module.ts
git commit -m "feat: add schema-scoped Supabase clients for microservice schemas"
```

---

## Task 3: `@Public()` decorator

**Files:**
- Create: `Backend/ServEase-BE-API/src/common/decorators/public.decorator.ts`

The global auth guard needs a way to skip authentication for specific routes (like health checks). We use a custom `@Public()` decorator with NestJS `Reflector`.

- [ ] **Step 1: Create `src/common/decorators/public.decorator.ts`**

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

- [ ] **Step 2: Commit**

```bash
git add src/common/decorators/public.decorator.ts
git commit -m "feat: add @Public() decorator for auth guard exemption"
```

---

## Task 4: Update auth guard to support DI and `@Public()`

**Files:**
- Modify: `Backend/ServEase-BE-API/src/modules/auth/guards/supabase-auth.guard.ts`

The current guard imports the hardcoded `supabaseClient.js`. We need it to use the injected `SupabaseClient` and respect the `@Public()` decorator.

- [ ] **Step 1: Rewrite `src/modules/auth/guards/supabase-auth.guard.ts`**

Replace the entire file with:

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No authorization token provided');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    const { data, error } = await this.supabase.auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    request['user'] = data.user;
    return true;
  }
}
```

- [ ] **Step 2: Verify the backend compiles**

Run: `cd Backend/ServEase-BE-API && npx nest build`

Expected: Build succeeds. (It may have runtime errors until we register the guard globally in the next task, but compilation should pass.)

- [ ] **Step 3: Commit**

```bash
git add src/modules/auth/guards/supabase-auth.guard.ts
git commit -m "refactor: auth guard uses DI and respects @Public() decorator"
```

---

## Task 5: Register global auth guard and enable CORS

**Files:**
- Modify: `Backend/ServEase-BE-API/src/app.module.ts`
- Modify: `Backend/ServEase-BE-API/src/main.ts`

- [ ] **Step 1: Update `src/app.module.ts`**

Replace the entire file with:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { SupabaseModule } from './database/supabase.module';
import { SupabaseAuthGuard } from './modules/auth/guards/supabase-auth.guard';
import { ProviderModule } from './modules/provider/provider.module';
import { AuthModule } from './modules/auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomerModule } from './modules/customer/customer.module';
import { AdminModule } from './modules/admin/admin.module';
import { ServicesModule } from './modules/services/services.module';
import { BookingModule } from './modules/booking/booking.module';
import { ReferenceModule } from './modules/reference/reference.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { LocationsModule } from './modules/locations/locations.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    ProviderModule,
    AuthModule,
    CustomerModule,
    AdminModule,
    ServicesModule,
    BookingModule,
    ReferenceModule,
    PaymentsModule,
    LocationsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
  ],
})
export class AppModule {}
```

- [ ] **Step 2: Update `src/main.ts` to enable CORS**

Replace the entire file with:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(5000);
  console.log('Server is running on http://localhost:5000');
}
bootstrap();
```

- [ ] **Step 3: Commit**

```bash
git add src/app.module.ts src/main.ts
git commit -m "feat: register global auth guard and enable CORS"
```

---

## Task 6: Health check endpoint

**Files:**
- Create: `Backend/ServEase-BE-API/src/modules/health/health.controller.ts`
- Create: `Backend/ServEase-BE-API/src/modules/health/health.module.ts`

This is a public endpoint for smoke-testing that the backend is running and the Supabase connection works.

- [ ] **Step 1: Create `src/modules/health/health.controller.ts`**

```typescript
import { Controller, Get } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/health')
export class HealthController {
  constructor(private readonly supabase: SupabaseClient) {}

  @Public()
  @Get()
  async check() {
    const { error } = await this.supabase.schema('identity_svc').from('users').select('id').limit(1);
    return {
      status: error ? 'degraded' : 'ok',
      timestamp: new Date().toISOString(),
      supabase: error ? 'unreachable' : 'connected',
    };
  }
}
```

- [ ] **Step 2: Create `src/modules/health/health.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
```

- [ ] **Step 3: Verify the backend compiles**

Run: `cd Backend/ServEase-BE-API && npx nest build`

Expected: Build succeeds with no errors.

- [ ] **Step 4: Start the backend and test the health endpoint**

Run: `cd Backend/ServEase-BE-API && npm run start:dev`

In a separate terminal:

Run: `curl http://localhost:5000/api/health`

Expected output (roughly):
```json
{"status":"ok","timestamp":"2026-03-28T...","supabase":"connected"}
```

Verify that hitting an authenticated endpoint without a token returns 401:

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/users/v1/profile`

Expected: `401`

- [ ] **Step 5: Commit**

```bash
git add src/modules/health/health.controller.ts src/modules/health/health.module.ts
git commit -m "feat: add public health check endpoint at /api/health"
```

---

## Task 7: Mark existing auth endpoints as `@Public()`

**Files:**
- Modify: `Backend/ServEase-BE-API/src/modules/auth/auth.controller.ts`

The existing login and registration endpoints must remain accessible without a token. Now that the auth guard is global, we need to mark them as public.

- [ ] **Step 1: Read the current auth controller**

Read `src/modules/auth/auth.controller.ts` to see all route handlers.

- [ ] **Step 2: Add `@Public()` to login and registration endpoints**

Add the import at the top of the file:

```typescript
import { Public } from '../../common/decorators/public.decorator';
```

Add `@Public()` decorator above each route handler that should be accessible without auth:

- `@Public()` on the `POST /v1/register/customer` handler
- `@Public()` on the `POST /v1/login` handler
- `@Public()` on the `POST /v2/register` handler (provider registration)

Do NOT add `@Public()` to any other endpoints.

- [ ] **Step 3: Verify login still works without a token**

Run (with backend running):

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:5000/api/auth/v1/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@test.com","password":"Test1234!"}'
```

Expected: `200` or `401` (depending on credentials) — but NOT `401` with "No authorization token provided". If you see that message, the `@Public()` decorator is not being picked up.

- [ ] **Step 4: Commit**

```bash
git add src/modules/auth/auth.controller.ts
git commit -m "feat: mark auth endpoints as @Public() for global guard"
```

---

## Task 8: Mobile HTTP client (`lib/api.ts`)

**Files:**
- Create: `ServEase-mobile-test/lib/api.ts`
- Modify: `ServEase-mobile-test/.env`

- [ ] **Step 1: Add env var to `.env`**

Append to the existing `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000
```

- [ ] **Step 2: Create `lib/api.ts`**

```typescript
import { supabase } from './supabase';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000';

type RequestOptions = {
  body?: unknown;
  params?: Record<string, string>;
};

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function request<T>(method: string, path: string, options?: RequestOptions): Promise<T> {
  let url = `${BASE_URL}${path}`;

  if (options?.params) {
    const qs = new URLSearchParams(options.params).toString();
    url += `?${qs}`;
  }

  const authHeader = await getAuthHeader();

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    await supabase.auth.signOut();
    throw new ApiError(401, 'Session expired');
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, json?.message || res.statusText, json);
  }

  return json as T;
}

export const api = {
  get: <T>(path: string, params?: Record<string, string>) =>
    request<T>('GET', path, { params }),

  post: <T>(path: string, body?: unknown) =>
    request<T>('POST', path, { body }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>('PATCH', path, { body }),

  put: <T>(path: string, body?: unknown) =>
    request<T>('PUT', path, { body }),

  delete: <T>(path: string) =>
    request<T>('DELETE', path),
};

export { ApiError };
```

- [ ] **Step 3: Verify the mobile app compiles**

Run: `cd ServEase-mobile-test && npx expo start --web` (Ctrl+C after it loads)

Expected: No TypeScript errors related to `lib/api.ts`.

- [ ] **Step 4: Commit**

```bash
git add lib/api.ts .env
git commit -m "feat: add HTTP API client with Supabase JWT auth"
```

---

## Task 9: Integration smoke test

Verify the full chain works: mobile `api.ts` → NestJS backend → Supabase.

- [ ] **Step 1: Start the backend**

Run: `cd Backend/ServEase-BE-API && npm run start:dev`

- [ ] **Step 2: Test unauthenticated health check**

Run: `curl http://localhost:5000/api/health`

Expected: `{"status":"ok",...,"supabase":"connected"}`

- [ ] **Step 3: Test authenticated endpoint is protected**

Run: `curl -s -w "\n%{http_code}" http://localhost:5000/api/users/v1/profile`

Expected: Response body contains "No authorization token provided", status `401`.

- [ ] **Step 4: Test with a valid Supabase token**

Get a token by logging in via the existing auth endpoint:

```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/v1/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"your-test-email@example.com","password":"YourPassword1!"}' \
  | python -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")

curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/users/v1/profile
```

Expected: Returns the user profile JSON (or a meaningful error if the test user doesn't exist — but NOT a 401 "No authorization token" error).

- [ ] **Step 5: Document any issues found and fix them before proceeding to Plan 2**

If all checks pass, the foundation is complete. The backend has schema-scoped clients, a global auth guard, CORS, and the mobile app has an HTTP client ready to call it.
