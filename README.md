# ServEase - On-Demand Service Marketplace (Philippines)

ServEase is a comprehensive platform for on-demand services in the Philippines, connecting customers with verified service providers for home maintenance, beauty, automotive repair, and more.

## 📂 Repository Structure

This workspace is a monorepo organized into specialized directories:

| Directory | Component | Technology Stack |
| :--- | :--- | :--- |
| [`backend/`](./backend) | **NestJS API** | NestJS, TypeScript, Supabase (Service Role) |
| [`mobile/`](./mobile) | **Mobile App** | Expo, React Native, Supabase, Expo Router |

## 🚀 Getting Started

### 1. Backend Setup
The backend is a NestJS API that communicates with the Supabase microservice schemas.
```bash
cd backend
npm install
npm run start:dev  # Runs on http://localhost:3001
```

### 2. Backend Connectivity (ngrok)
To allow the mobile app to talk to the local backend during development:
1. Run `ngrok http 3001`.
2. Copy the forwarding URL.
3. Update `EXPO_PUBLIC_API_URL` in `mobile/.env`.

### 3. Mobile Frontend Setup
The mobile app uses Expo Router and a feature-based architecture.
```bash
cd mobile
npm install
npx expo start     # Runs via Expo / Metro Bundler
```

---

## 🔥 Key Features & Recent Updates

### 📍 Smart Location & Address Management
We have integrated a robust, Philippines-specific location system:
- **PSGC v2 API Integration**: Hierarchical fetching of Provinces, Cities, and Barangays to ensure data accuracy and minimal payload size.
- **Manila City Specialized Handling**: Implemented custom regional filtering to handle Manila's unique district-based PSGC structure.
- **Unified Address System**: A shared `AddressForm` component used across Onboarding, Add Address, and Edit Address flows.
- **Expanded Schema**: Added `label`, `is_default`, and `barangay` columns to the `user_addresses` table in the `identity_svc` schema.

### 🛡️ Provider Verification & Trust
- **Enhanced Onboarding**: A step-aware signup process for providers, including secure ID verification.
- **ID Type Selection**: Support for standard Philippine IDs (PhilID, Driver's License, UMID, Passport) with specific validation flows.

---

## 🛠 Architectural Highlights

### Mobile Feature-Based Architecture
The mobile app follows a **Feature-Based Module** approach to ensure scalability:
- **`app/`**: Thin Routes (Expo Router entry points).
- **`src/features/`**: Core business logic organized by domain (Auth, Booking, Locations).
- **`src/components/common/`**: Standardized UI library driven by design tokens.

### Database Schema (Microservices)
The project utilizes a microservice-inspired schema design in Supabase:
- `identity_svc`: User profiles and address management.
- `provider_catalog_svc`: Service categories, provider profiles, and internal location metadata.
- `booking_svc`: Real-time bookings and scheduling.
- `payment_svc`: Transactions and payouts.
- `trust_svc`: Reviews, ratings, and verification status.
- `notification_svc`: Real-time alerts and messaging.

### 🛡️ Resilience & Microservices Patterns
The backend has been modernized with industry-standard microservices patterns to ensure high availability and loose coupling:
- **Event-Driven Architecture**: Side effects (e.g., creating a payment after a booking) are handled asynchronously using `@nestjs/event-emitter`, improving API response times.
- **Circuit Breaker Pattern**: Critical "cross-service" calls are protected by a Circuit Breaker that trips to `OPEN` state upon repeated failures, preventing cascading system crashes.
- **Exponential Backoff Retries**: Transient network or database issues are automatically handled with smart retries.
- **Transparency Proxies**: Every Supabase schema client is automatically wrapped in a resilience proxy, enforcing service boundaries at the architectural level.

### 🔗 Full-Stack Type Safety & Schema Synchronization
We have achieved true full-stack type safety by synchronizing domain models between the NestJS backend and the Expo mobile application:
- **Synchronized Interfaces**: A master `database.interfaces.ts` defines all domain entities, shared and versioned across the entire repo.
- **Strict Service Typing**: All frontend and backend services (Booking, Support, Payment, Notification) are refactored to eliminate `any` types, ensuring that API data mappings are validated at compile time.
- **Deep UI Type-Safety**: Critical booking and review screens are fully typed, preventing common "undefined property" crashes during data hydration.
- **Backend Schema Recovery**: Fixed critical backend compilation errors and resolved database column mismatches (e.g., remapping `trust_score` to `average_rating`) to ensure query stability.

---

## 🧪 Automated Testing Suite (Maestro Governance)

We have implemented a robust, multi-layered testing infrastructure following the **Maestro Architectural Governance Protocol**.

### 🛡️ Backend Unit & Integration (NestJS)
Verified core business logic for Auth, Bookings, and Payments modules.
- **Run Tests**: `cd backend && npm test`
- **Coverage**: `cd backend && npm run test:cov`

### 🧪 Mobile Unit & Integration (Jest + RTL)
Comprehensive verification for complex components (e.g., `BookingForm`) and session persistence.
- **Run Tests**: `cd mobile && npm test`

### 📱 End-to-End Orchestration (Maestro)
Automated user journeys covering the entire system from onboarding to booking completion.
- **Maestro Directory**: `mobile/.maestro/`
- **Key Flows**: `booking_journey.yaml`, `provider_onboarding.yaml`, `login_flow.yaml`.
- **Run Flow**: `maestro test .maestro/booking_journey.yaml`

---

## 📄 Documentation
- **[PROJECT_HANDOVER.md](./mobile/docs/PROJECT_HANDOVER.md)**: Vital for new developers.
- **[SQL Schema](./mobile/supabase/addresses_schema.sql)**: Latest address management schema definition.

---
*Developed for the ServEase platform.*
