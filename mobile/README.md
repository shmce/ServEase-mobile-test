# ServEase Mobile

ServEase is a mobile marketplace app for on-demand services in the Philippines. This repository is an Expo + React Native codebase that currently includes customer and provider flows, Supabase integration, booking-related services, and route-based mobile screens.

## Stack

- Expo Router
- React Native + TypeScript
- Supabase
- Expo SecureStore

## 🚀 CI/CD & GitHub Actions

This project uses automated CI/CD with GitHub Actions for quality assurance and deployment.

### Quick Start for CI/CD
1. See **[CI_CD_SETUP.md](./CI_CD_SETUP.md)** for complete setup instructions
2. Set `MOBILE_SINGLE_SYSTEMS_JSON` repository variable in GitHub Settings
3. Push to `test`, `uat`, or `main` to trigger the pipeline

### Local Pre-Push Checks
Before pushing code, run:
```bash
# Windows
run-ci-checks.bat

# Or validate CI readiness
scripts\validate-ci-readiness.bat
```

This checks:
- ✅ ESLint (code style)
- ✅ TypeScript (type checking)
- ✅ Jest tests (80% coverage required)
- ✅ No committed `.env` files

**Documentation:**
- [CI_CD_SETUP.md](./CI_CD_SETUP.md) - Complete setup guide
- [GITHUB_ACTIONS_COMPLETE.md](./GITHUB_ACTIONS_COMPLETE.md) - Summary of fixes
- [.github/workflows/README.md](./.github/workflows/README.md) - Workflow details

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
npm run android     # Run on Android
npm run ios         # Run on iOS
npm run web         # Run on web
npm run lint        # Run ESLint
npm run typecheck   # TypeScript validation
npm run test        # Run tests with coverage
npm run test:watch  # Run tests in watch mode
npm run test:e2e    # Run Maestro E2E tests
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
- **Run tests with coverage**: `npm run test:ci`
- **Watch mode**: `npm run test:watch`
- **Coverage threshold**: 80% (branches, functions, lines, statements)
- **Mocking**: Global mocks for Supabase, Expo Router, and Expo SecureStore are configured in `jest-setup.js`.

**Coverage reports:**
- Console output (on test run)
- HTML report: `coverage/lcov-report/index.html`
- LCOV format: `coverage/lcov.info` (for CI/SonarCloud)

### End-to-End (Maestro)
Maestro flows are located in the `.maestro/` directory.
- **Prerequisite**: Install [Maestro CLI](https://maestro.mobile.dev/getting-started/installing-maestro).
- **Run Flow**: `maestro test .maestro/booking_journey.yaml`
- **Run all E2E tests**: `npm run test:e2e`
- **Key flows**:
  - `login_flow.yaml`: Basic authentication.
  - `booking_journey.yaml`: Complete customer booking funnel.
  - `provider_onboarding.yaml`: Provider registration and verification.
  - `address_selection.yaml`: Address management system.

## Notes

- This repo is mobile-first and currently focused on the Expo app, not the full web/admin platform described in the broader ServEase vision.
- If you want generated code to fit this repo cleanly, ask for React Native + Expo Router + TypeScript solutions unless you explicitly want architecture-only output.
