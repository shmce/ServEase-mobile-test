# ServEase Backend - Modular Microservices API

The ServEase backend is a high-performance, resilient API built with **NestJS** and **Supabase (PostgreSQL)**. It is architected using a **Modular Monolith** approach with strict schema-per-service boundaries, enabling the project to scale like a suite of microservices while maintaining a unified codebase.

## 🏛 Architecture: Microservices Patterns

We have implemented several industry-standard patterns to ensure system stability and performance:

### 1. Resilience Layer ([resilience.utils.ts](src/common/utils/resilience.utils.ts))
- **Circuit Breaker**: Protects the system from cascading failures by "tripping" to an `OPEN` state when a schema-specific client (e.g., `payment_svc`) experiences repeated errors.
- **Exponential Backoff Retries**: Automatically handles transient network or database issues with intelligent retry logic.

### 2. Event-Driven Communication
To maintain loose coupling and improve API response times, we use `@nestjs/event-emitter` for asynchronous side effects:
- **Booking Flow**: When a booking is created, the system emits a `BookingCreatedEvent`.
- **Listeners**: The `BookingListeners` catch this event to asynchronously initialize payments and conversations without blocking the main request thread.

### 3. Service Boundary Enforcement
Every Supabase client injected into a module (e.g., `IDENTITY_CLIENT`, `PAYMENT_CLIENT`) is wrapped in a **Resilience Proxy**. This ensures that cross-module calls are always protected by the Circuit Breaker and Retry logic at the architectural level.

---

## 🚀 Getting Started

### Project Setup
```bash
$ npm install
```

### Compile and Run
```bash
# development
$ npm run start:dev

# production mode
$ npm run start:prod
```

---

## 🧪 Testing Strategy

We follow the **Maestro Architectural Governance Protocol** for high-integrity verification.

### Run Tests
```bash
# Unit & Integration Tests (Jest)
$ npm run test

# Performance Benchmarking & Coverage
$ npm run test:cov
```

### Coverage Focus
Current mission-critical coverage including resilience verification:
- **Auth Service**: Login validation and role management.
- **Booking Service**: Status transitions and event-driven fulfillment.
- **Payments Service**: Transaction processing andplatform fee calculations.
- **Resilience Utils**: Circuit breaker state transitions and retry backoff timing.

---

## 📂 Internal Directory Structure

- `src/common/utils/`: Global utilities including resilience and error handlers.
- `src/database/`: Supabase client initialization and resilience proxy logic.
- `src/modules/`: Business domain modules (Auth, Booking, Customer, Provider, etc.).
- `src/modules/booking/listeners/`: Event handlers for asynchronous side effects.

---

## Support & Maintainance
Developed for the **ServEase** platform. For deployment or schema updates, refer to the root `README.md`.

<!-- CI trigger: 2026-04-09 02:00 -->

