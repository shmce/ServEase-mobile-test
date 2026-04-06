# ServEase Mobile Test

ServEase is a mobile marketplace app for on-demand services in the Philippines. This repository is an Expo + React Native codebase that currently includes customer and provider flows, Supabase integration, booking-related services, and route-based mobile screens.

## Stack

- Expo Router
- React Native + TypeScript
- Supabase
- AsyncStorage

## Current App Structure

The app already contains route files for customer and provider experiences under [`app`](C:/Users/Personal/Desktop/ServEase/tite/ServEase-mobile-test/app), reusable UI in [`components`](C:/Users/Personal/Desktop/ServEase/tite/ServEase-mobile-test/components), shared app state in [`context`](C:/Users/Personal/Desktop/ServEase/tite/ServEase-mobile-test/context), and API/service helpers in [`services`](C:/Users/Personal/Desktop/ServEase/tite/ServEase-mobile-test/services) and [`lib`](C:/Users/Personal/Desktop/ServEase/tite/ServEase-mobile-test/lib).

Notable existing screens include:

- Customer auth, booking, chat, review, tracking, address, and profile flows
- Provider login, signup, navigation, service start/in-progress/complete, earnings, bookings, and settings flows
- Tab layouts for both customer and provider experiences

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the Expo development server:

```bash
npm run start
```

If local networking fails, try:

```bash
npx expo start --tunnel
```

Useful commands:

```bash
npm run android
npm run ios
npm run web
npm run lint
```

## Prompt Package

The ServEase project prompt has been implemented as a repository-specific document here:

- [`docs/SERVEASE_PROMPT.md`](C:/Users/Personal/Desktop/ServEase/tite/ServEase-mobile-test/docs/SERVEASE_PROMPT.md)

Use that file when you want ChatGPT or another coding assistant to work from the actual state of this repo instead of a generic marketplace brief.

## Recommended Workflow With AI

1. Paste the prompt from [`docs/SERVEASE_PROMPT.md`](C:/Users/Personal/Desktop/ServEase/tite/ServEase-mobile-test/docs/SERVEASE_PROMPT.md).
2. Fill in the `Specific request`, `Project phase`, and `Priority features` sections.
3. Ask for one concrete deliverable at a time.

Good examples:

- Implement the provider navigation flow using the existing route files and services in this repo.
- Build Supabase-backed booking status updates for the customer and provider booking detail screens.
- Refactor the payment service to support GCash, card, and cash-on-service placeholders.
- Add validation and test coverage for customer booking form submission.

## 🧪 Testing

We use a dual-layered testing strategy to ensure app stability.

### Unit & Integration (Jest + RTL)
Tests are located in `__tests__` directories throughout the project.
- **Run all tests**: `npm test`
- **Mocking**: Global mocks for Supabase, Expo Router, and AsyncStorage are configured in `jest-setup.js`.

### End-to-End (Maestro)
Maestro flows are located in the `.maestro/` directory.
- **Prerequisite**: Install [Maestro CLI](https://maestro.mobile.dev/getting-started/installing-maestro).
- **Run Flow**: `maestro test .maestro/booking_journey.yaml`
- **Key flows**:
  - `login_flow.yaml`: Basic authentication.
  - `booking_journey.yaml`: Complete customer booking funnel.
  - `provider_onboarding.yaml`: Provider registration and verification.
  - `address_selection.yaml`: Address management system.

## Notes

- This repo is mobile-first and currently focused on the Expo app, not the full web/admin platform described in the broader ServEase vision.
- If you want generated code to fit this repo cleanly, ask for React Native + Expo Router + TypeScript solutions unless you explicitly want architecture-only output.
