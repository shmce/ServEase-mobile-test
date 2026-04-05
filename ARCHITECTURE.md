# ServEase Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    SERVEASE MONOREPO                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
              FRONTEND      BACKEND      DATABASE
              MOBILE         API        (Supabase)
              (Expo)       (NestJS)    (PostgreSQL)
                │             │             │
        ┌───────┴─────────┐   │   ┌─────────┴───────────┐
        │                 │   │   │                     │
    React         Expo         HTTP              ┌───────┴─────┐
    Native        Router       REST              │             │
                              APIs               Tables      RLS
   ┌─────────────────────┬──────────────┬─────────────────────┐
   │                     │              │                     │
Customer Login      Provider Login  Bookings           Services
   │                     │              │                     │
├──────────────────┤ ├──────────────────┤ ├──────────────────┤
│ App               │ │ App               │ │ App              │
│ - Browse          │ │ - Manage jobs     │ │ - View profiles  │
│ - Search          │ │ - Track earnings  │ │ - Search         │
│ - Book service    │ │ - Messages        │ │ - Filter         │
│ - Chat            │ │ - Availability    │ │ - Rate           │
└─────────────────┘ └─────────────────┘ └─────────────────┘
        │                   │                     │
        └───────────────────┼─────────────────────┘
                            │
                    DATABASE QUERIES
                   (RLS Policies Active)
```

---

## Module Structure (Backend)

```
backend/src/
├── main.ts                          ← Entry point (with CORS)
├── app.module.ts                    ← Main module (imports all)
│
└── modules/
    ├── core/                        ✅ WORKING
    │   ├── core.module.ts
    │   └── health/
    │       └── health.controller.ts ← GET /health
    │
    ├── database/                    ✅ WORKING
    │   ├── database.module.ts
    │   └── database.service.ts      ← Supabase client
    │
    ├── providers/                   ✅ WORKING
    │   ├── providers.module.ts
    │   ├── providers.service.ts
    │   └── providers.controller.ts  ← GET /providers
    │
    ├── auth/                        ⏳ TODO
    │   └── auth.module.ts
    │
    ├── bookings/                    ⏳ TODO
    │   └── bookings.module.ts
    │
    └── services/                    ⏳ TODO
        └── services.module.ts
```

---

## Database Schema (Supabase)

```
PostgreSQL Database
│
├── public schema
│   │
│   ├── user_profiles               ← Main user table
│   │   ├── id (UUID)
│   │   ├── email
│   │   ├── full_name
│   │   ├── user_type (customer|provider)
│   │   └── RLS: Public read, users UPDATE own
│   │
│   ├── provider_profiles            ← Extended provider info
│   │   ├── id (UUID)
│   │   ├── user_id (FK → user_profiles)
│   │   ├── rating
│   │   ├── total_reviews
│   │   └── RLS: Public read
│   │
│   ├── services                     ← Service listings
│   │   ├── id (UUID)
│   │   ├── provider_id (FK)
│   │   ├── name
│   │   ├── category
│   │   └── RLS: Public read
│   │
│   ├── bookings                     ← Booking records
│   │   ├── id (UUID)
│   │   ├── customer_id (UUID)
│   │   ├── provider_id (UUID)
│   │   ├── service_id (UUID, FK)
│   │   ├── status
│   │   └── RLS: Users see own bookings
│   │
│   ├── chat_messages                ← Real-time chat
│   │   ├── id (UUID)
│   │   ├── sender_id
│   │   ├── recipient_id
│   │   └── RLS: Users see own messages
│   │
│   └── reviews                      ← Ratings & reviews
│       ├── id (UUID)
│       ├── provider_id (FK)
│       ├── customer_id (FK)
│       ├── rating
│       └── RLS: Public read, customers UPDATE own
```

---

## API Endpoints (Created So Far)

### Health Check
```
GET /health
→ Returns: { status: "ok", database: "connected" }
Purpose: Test if backend is running
```

### Providers
```
GET /providers
→ Returns: Array of all providers
Purpose: List all providers

GET /providers/:id
→ Returns: Single provider with full details
Purpose: View provider profile

GET /providers/category/:category
→ Returns: Providers in category
Purpose: Filter by service category
```

### More Endpoints TODO
```
POST /auth/signup          - Customer signup
POST /auth/login           - Customer login
GET  /bookings             - User's bookings
POST /bookings             - Create booking
PUT  /bookings/:id         - Update booking
POST /chat/messages        - Send message
GET  /chat/history/:user   - Get message history
GET  /reviews/:provider    - Get provider reviews
POST /reviews              - Leave review
```

---

## File Navigation

```
Frontend (React Native + Expo)
├── app/                              ← Screens (file-based routing)
│   ├── (tabs)/                       ← Customer tabs
│   ├── (provider-tabs)/              ← Provider tabs
│   ├── customer-login.tsx            ← Login screen
│   ├── customer-signup.tsx           ← Signup screen
│   ├── provider-list.tsx             ← Browse providers
│   └── ... (70+ other screens)
│
├── components/                       ← Reusable UI components
├── context/                          ← AuthContext, etc
├── services/                         ← API & Supabase client
├── lib/                              ← Utilities & helpers
└── .env                              ← Frontend config

Backend (NestJS)
├── src/
│   ├── main.ts                       ← Server entry point
│   ├── app.module.ts                 ← Root module
│   └── modules/                      ← Feature modules
└── .env                              ← Backend config
```

---

## Data Flow Example: Viewing Providers

```
Customer App
    │
    ├─ Opens Provider List Screen
    │
    ├─ Calls: GET /providers
    │         (from frontend/.env EXPO_PUBLIC_API_URL)
    │
    └─→ Backend HTTP
            │
            ├─ ProvidersController receives request
            │
            ├─ ProvidersService.getAllProviders()
            │
            ├─ DatabaseService.getClient()
            │
            ├─ Query Supabase:
            │  SELECT * FROM provider_profiles
            │           JOIN user_profiles ON ...
            │           ORDER BY rating DESC
            │
            └─→ Supabase Database
                    │
                    ├─ RLS Policy Check:
                    │  "SELECT on provider_profiles is public"
                    │  ✅ ALLOWED
                    │
                    └─ Returns: 4 providers + metadata

Backend returns → Frontend displays in list → User taps provider → Details shown
```

---

## Security Measures (Active)

```
Layer 1: API Level
├─ CORS: Only allow localhost (dev) or frontend domain (prod)
├─ Service Role Key: Created new one, revoked old
└─ Environment variables: Never exposed in code

Layer 2: Database Level
├─ RLS Policies: Enforce row-level access control
├─ Authentication: Supabase Auth enforces auth.uid()
└─ Foreign Keys: Removed, enforced via RLS instead

Layer 3: Code Level
├─ No hardcoded secrets
├─ Error logging (no sensitive data exposed)
└─ Type safety: TypeScript throughout
```

---

## What's Running Right Now

| Service | Status | Command | Port | Test |
|---------|--------|---------|------|------|
| Backend | ✅ Ready | `npm run start:dev` | 3001 | curl localhost:3001/health |
| Frontend | ✅ Ready | `npx expo start` | 19000 | Press i/a in terminal |
| Database | ✅ Connected | (via HTTP) | - | Via /providers endpoint |

---

## Next Implementation Priority

1. **Auth Module** (Login/Signup)
   - Supabase Auth integration
   - JWT token handling
   - User context in API

2. **Bookings Module** (Core business logic)
   - Create booking
   - Cancel booking
   - Track status

3. **Chat Module** (Real-time messaging)
   - Realtime subscriptions
   - Message history
   - Notifications

4. **Services Module** (Service management)
   - Service CRUD
   - Pricing
   - Availability

---

## Summary

✅ **What Works**: API, Database connection, Provider listing, Frontend routing, Auth setup  
⏳ **What's Next**: Authentication flows, Booking management, Chat integration  
🔐 **Security**: All visible, credentials protected, RLS active  
📊 **Scalability**: Microservice pattern ready for growth
