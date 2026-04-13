# ServEase Technical Project Update - Handover Document

## 1. Architectural Migration (Feature-Based)
The mobile application has been migrated from a monolithic structure in `app/` to a **Feature-Based Architecture** in `src/features/`.

- **Thin Routes**: Files in `app/` (Expo Router) now serve only as entry points. They should remain "pure" and only render components from `src/features/`.
  - *Example*: `app/customer-signup.tsx` now calls its corresponding Screen in `src/features/auth/screens/CustomerSignupScreen.tsx`.
- **Feature Modules**: Core screens and logic are now grouped by domain (e.g., `src/features/auth`, `src/features/bookings`).

## 2. Standardized UI System
We have implemented a shared design system based on design tokens (`constants/tokens.ts`).

- **Shared Components**: Located in `src/components/common/`.
  - `AppButton`: Multi-variant, loading-state-ready button.
  - `AppTextInput`: Refactored with `forwardRef` to support sequential focus and "tap-to-focus" wrapper logic.
  - `AppPressable`: Consistent tactile feedback and haptic support.
  - `AnimatedCard`: Passive-container support to prevent touch interception in forms.
- **Visual Standards**: All components use the `TOKENS` object for colors, spacing, and shadows to maintain UI consistency.

## 3. Backend Synchronization (NestJS)
The backend API has been standardized to resolve port conflicts and improve routing.

- **Port Migration**: The server now runs on **Port 3001** (to avoid conflicts with default services).
- **Versioning**: Integrated `URI` based versioning. All endpoints follow the `/v1/` standard.
- **Routing**: Standardized controller decorators to remove nested `/api/` prefixes.
- **Ngrok**: Standardized tunnel for development.
- **Microservices**: All service files now use schema-scoped Supabase clients (`identityDb`, `bookingDb`, etc.).

## 2. Backend Connectivity (Mobile to API)
The mobile app communicates with the NestJS API via an ngrok tunnel.
1.  **Backend Port**: API runs on **3001**.
2.  **Tunnel Command**: `ngrok http 3001`.
3.  **Config URL**: update `EXPO_PUBLIC_API_URL` within `ServEase-mobile-test-expov3/.env` after each ngrok restart.
4.  **Static URLs**: If using a paid ngrok plan, configure a static domain to avoid changing the `.env` file daily.
- **Focus Stability**: Highly optimized major signup forms by moving local component definitions (like `CheckItem`) outside the render function. This resolved the "keyboard auto-closing" bug.
- **Input Ergonomics**: Standardized numeric and phone input fields to prevent layout shifts and focus loss.
- **UUID Validation**: Added pre-flight UUID checks in `CustomerCancelBookingScreen.tsx` to prevent service-layer crashes.

## 5. Next Steps for Development
- **Continue Migration**: Migrate remaining screens from `app/` (e.g., Profile, Settings) to `src/features/`.
- **UI Audit**: Systematically replace remaining legacy `TouchableOpacity` instances with `AppPressable`.
- **Testing**: Cross-platform verification for the new focus-management logic in multi-step forms.

---
*Last Updated: 2026-04-02*
