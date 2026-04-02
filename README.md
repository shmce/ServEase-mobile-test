# ServEase - On-Demand Service Marketplace (Philippines)

ServEase is a comprehensive platform for on-demand services in the Philippines, connecting customers with verified service providers for home maintenance, beauty, automotive repair, and more.

## 📂 Repository Structure

This workspace is a monorepo containing the following sub-projects:

| Directory | Component | Technology Stack |
| :--- | :--- | :--- |
| [`ServEase-BE-API-main/`](./ServEase-BE-API-main) | **Backend API** | NestJS, TypeScript, Supabase (Service Role) |
| [`ServEase-mobile-test-expov3/`](./ServEase-mobile-test-expov3) | **Mobile App** | Expo, React Native, Supabase, Expo Router |

## 🚀 Getting Started

### 1. Backend Setup
The backend is a NestJS API that communicates with the Supabase microservice schemas.
```bash
cd ServEase-BE-API-main
npm install
npm run start:dev  # Runs on http://localhost:3001
```

### 2. Backend Connectivity (ngrok)
To allow the mobile app to talk to the local backend:
1. Run `ngrok http 3001`.
2. Copy the forwarding URL.
3. Update `EXPO_PUBLIC_API_URL` in `ServEase-mobile-test-expov3/.env`.

### 3. Mobile Frontend Setup
The mobile app uses Expo Router and a feature-based architecture.
```bash
cd ServEase-mobile-test-expov3
npm install
npx expo start     # Runs via Expo / Metro Bundler
```

---

## 🛠 Architectural Highlights

### Mobile Feature-Based Architecture
We have recently refactored the mobile app to follow a **Feature-Based Module** approach:
- **`app/`**: Contains only "Thin Routes" (Expo Router entry points).
- **`src/features/`**: Contains the core business logic, organized by domain (Auth, Bookings, etc.).
- **`src/components/common/`**: A standardized UI library (`AppButton`, `AppTextInput`, `AppPressable`) driven by Design Tokens.

### Database Schema (Microservices)
The project utilizes a microservice-inspired schema design in Supabase:
- `identity_svc`: User profiles and authentication metadata.
- `provider_catalog_svc`: Service categories, provider profiles, and verifications.
- `booking_svc`: Real-time bookings, chat messages, and availability.
- `payment_svc`: Transactions and provider payouts.
- `trust_svc`: Reviews and trust scores.

---

## 📄 Documentation & Handover
For detailed technical notes on the recent refactor and current development status, please refer to:
- **[Microservices Architecture](./docs/architecture/microservices-data-map.md)**: Detailed mapping of schemas and tables.
- **[SQL Migration Inventory](./docs/supabase/migration-inventory.md)**: Tracking of schema changes and migrations.
- **[PROJECT_HANDOVER.md](./ServEase-mobile-test-expov3/docs/PROJECT_HANDOVER.md)**: Vital for new developers.
- **[CLAUDE.md](./CLAUDE.md)**: Developer guide for build commands and environment settings.

---
*Developed for the ServEase platform.*
