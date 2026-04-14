# Customer Journey Audit: Photo & Service Location

## Summary

Audited the Expo customer and provider journey around provider photos and service-location handling using current code inspection plus targeted frontend tests. Moderate confidence: the key contracts now look aligned and the previously noted provider-side clarity gap has been addressed, but live screen interaction through a running simulator/device was not executed in this environment.

## Scope

- App surface audited: Expo frontend plus supporting backend/service contracts
- Persona: customer browsing and booking a provider, plus provider managing profile/services
- Journeys targeted:
  - discovery list
  - provider profile
  - booking form
  - provider profile edit and service management
- Environment assumptions:
  - no verified live device or simulator session was exercised
  - evidence comes from current implementation snapshot and targeted tests

## Checks Run

- `passed` `npm test -- --runInBand services/__tests__/marketplaceService.test.ts app/__tests__/customer-booking-form.test.tsx`
  - Both targeted suites passed.
  - This matters because they cover discovery mapping, booking-form avatar rendering, and booking-form service-location behavior.

- `passed` code inspection of `frontend/app/provider-edit-profile.tsx`
  - Confirmed uploaded avatar URLs are now tracked, sanitized with `split('?')[0]`, and persisted through `PATCH /provider/profile`.
  - This matters because avatar rendering only works for real customers if the URL is stored durably.

- `passed` code inspection of `backend/src/modules/provider/dto/update-provider-profile.dto.ts`
  - Confirmed `avatar_url` is now accepted by the backend DTO.
  - This matters because the frontend patch would otherwise be silently stripped.

- `passed` code inspection of discovery/profile/booking screens and service contract mapping
  - Confirmed `provider-list.tsx`, `provider-profile.tsx`, `customer-booking-form.tsx`, `frontend/services/marketplaceService.ts`, and `backend/src/modules/services/services.service.ts` now carry and render avatar/service-location data.
  - This matters because the audit target spans multiple screens and layers.

- `passed` code inspection of `frontend/app/(provider-tabs)/pricing.tsx`
  - Confirmed saved service cards now show `Mobile` / `In-Shop` badges plus a short service-location summary.
  - This matters because providers can now verify service logistics without reopening edit mode.

- `blocked` live interaction via Expo / Maestro
  - Existing scripts and `.maestro` flows were detected, but no fresh emulator/device-backed run was performed here.
  - This matters because customer confidence is strongest when real screens are exercised end-to-end.

## Functional Journeys

- `Verified working` Discovery list
  - Provider cards now map `avatarUrl`, render an image fallback, and show `In-Shop` badges plus location preview text when applicable.

- `Verified working` Provider profile inspection
  - The profile now exposes service-location context in the About/Services experience before booking.

- `Verified working` Booking form
  - The booking form renders the provider avatar when present, falls back safely when it fails, and swaps to a read-only provider-location card for in-shop services.

- `Verified working` Provider-side avatar persistence
  - The edit-profile flow now carries a sanitized `avatar_url` into the provider profile patch payload instead of leaving uploads as local-only state.

- `Verified working` Provider-side service management clarity
  - The pricing/service-management list now shows visible `Mobile` / `In-Shop` badges and a short saved-location summary on each service card.

## Findings

- `low`
  - status: `blocked`
  - affected journey or area: full customer trust validation
  - evidence: no fresh live Expo/Maestro run with a simulator/device session in this audit pass.
  - likely customer impact: some layout, navigation, image-loading, or environment-specific issues could still exist even though the contracts and targeted tests now look correct.

## Contract Notes

- Route params:
  - `/customer-booking-form` now receives `avatarUrl` from `provider-profile.tsx`.

- DTO / response-shape changes:
  - `UpdateProviderProfileDto` now includes `avatar_url`.
  - discovery mapping now includes avatar and service-location data via `frontend/services/marketplaceService.ts`.

- Fallback behavior:
  - booking form falls back to an icon if the avatar fails to load.
  - provider list falls back to a generic avatar shell if no avatar exists.
  - in-shop booking uses the provider address card; mobile booking keeps customer address selection.

## Recommendations

- Recommendation: run one real device or emulator-based customer journey through discovery -> profile -> booking using the new `customer-journey-audit` skill
  - severity: `low`
  - reason: live interaction is the best way to catch image-loading, spacing, and navigation regressions that code review cannot fully prove.
  - evidence trigger: this audit pass was blocked from fresh live interaction.

## Unknowns

- Whether avatar rendering works against a real uploaded image in the current environment after a full provider edit -> save -> discovery refresh cycle.
- Whether Maestro or a live simulator session reveals any runtime layout issues not covered by the targeted Jest suites.
