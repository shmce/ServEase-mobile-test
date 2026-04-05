# ServEase Mobile Frontend

Expo + React Native app for the ServEase platform.

## Stack
- Expo Router
- React Native + TypeScript
- Supabase
- AsyncStorage

## Getting Started
```bash
npm install
npx expo start        # Start Metro bundler
npx expo start --ios  # Open in iOS simulator
npx expo start --android # Open in Android emulator
```

## Folder Structure
```
frontend/
├── app/          # Expo Router screens (file-based routing)
├── assets/       # Images, fonts, icons
├── components/   # Reusable UI components
├── constants/    # App-wide constants & theme tokens
├── context/      # React Context providers
├── hooks/        # Custom React hooks
├── lib/          # Supabase client & utilities
├── services/     # API service layers
├── src/          # Shared types & feature modules
├── supabase/     # SQL schemas & migrations
└── __tests__/    # Unit & integration tests
```
