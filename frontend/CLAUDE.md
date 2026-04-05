# ServEase Frontend — AI Assistant Context

## Stack
- Expo SDK 54 + React Native + TypeScript
- Expo Router (file-based navigation)
- Supabase JS client
- React Context for state management

## Key Patterns
- Screens live in `app/` using Expo Router conventions
- Reusable API calls go in `services/`
- Supabase client is initialized in `lib/supabase.ts`
- Shared state lives in `context/`

## Commands
```bash
npm install
npx expo start --ios      # iOS simulator
npx expo start --android  # Android emulator
npm test                  # Run Jest tests
```
