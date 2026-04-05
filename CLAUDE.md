# ServEase — AI Assistant Context

## Project Overview
ServEase is an on-demand service marketplace for the Philippines, connecting customers with verified service providers.

## Monorepo Structure
```
/
├── frontend/   # Expo + React Native app
├── backend/    # NestJS API
└── docs/       # Documentation
```

## Frontend (`frontend/`)
- **Framework**: Expo SDK 54, React Native, TypeScript
- **Navigation**: Expo Router (file-based)
- **Database**: Supabase (via JS client)
- **Key dirs**: `app/` (routes), `components/`, `services/`, `context/`, `lib/`

## Backend (`backend/`)
- **Framework**: NestJS
- **Database**: Supabase (PostgreSQL, schema-per-service)
- **Port**: 3001
- **Key dirs**: `src/modules/`, `src/common/`, `src/database/`

## Development Commands
```bash
# Frontend
cd frontend && npm install && npx expo start

# Backend
cd backend && npm install && npm run start:dev
```
