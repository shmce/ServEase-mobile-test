# ServEase Monorepo — Agent Guide

This is a monorepo for the ServEase platform. It contains:

- **`frontend/`** — Expo + React Native mobile app (customer & provider flows)
- **`backend/`** — NestJS API connected to Supabase
- **`docs/`** — Project documentation

## Working in this Repo

- Always work within the correct subdirectory (`frontend/` or `backend/`)
- Run `npm install` inside the subdirectory before running any commands
- Frontend dev server: `cd frontend && npx expo start`
- Backend dev server: `cd backend && npm run start:dev`

## Key Conventions

- TypeScript throughout both frontend and backend
- Supabase for database (schema-per-service microservice pattern)
- Expo Router for mobile navigation
- NestJS modules for backend business logic
