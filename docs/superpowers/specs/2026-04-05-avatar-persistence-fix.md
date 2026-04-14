# Avatar Persistence Fix

**Date:** 2026-04-05  
**Status:** Approved  
**Risk:** Low

---

## Goal

Persist the provider's avatar URL to the database after a successful upload so that it appears in the marketplace, provider profile, and booking form.

---

## Root Cause

`lib/avatar.ts` — `pickAndUploadAvatar` uploads the image to Supabase Storage and returns the public URL, but **never writes it to the database**.

`provider-edit-profile.tsx` — `handlePickAvatar` calls `pickAndUploadAvatar` and updates local `avatarUri` state only. The `onSave` function calls `PATCH /provider/profile` but does not include `avatar_url` in the payload.

`backend/src/modules/provider/dto/update-provider-profile.dto.ts` — `UpdateProviderProfileDto` has no `avatar_url` field, so even if the frontend sent it, the backend would strip it.

`backend/src/modules/provider/provider.service.ts:683` — `updateProfile` uses spread `...dto` into the upsert, so adding `avatar_url` to the DTO is all that's needed on the backend.

---

## Scope

- `backend/src/modules/provider/dto/update-provider-profile.dto.ts` — add `avatar_url` field
- `frontend/app/provider-edit-profile.tsx` — track whether avatar changed; include `avatar_url` in save payload
- No changes to `lib/avatar.ts` — upload logic is correct as-is

---

## Non-goals

- No changes to customer-side avatar display (already reads from `avatar_url` correctly)
- No storage bucket policy changes
- No migration needed — `avatar_url` column already exists on `provider_profiles`

---

## Files Affected

| File | Change |
|---|---|
| `backend/src/modules/provider/dto/update-provider-profile.dto.ts` | Add optional `avatar_url` string field |
| `frontend/app/provider-edit-profile.tsx` | Track uploaded avatar URL; include in `onSave` patch payload |

---

## Backend Change

### `update-provider-profile.dto.ts`

Add one field:

```ts
@IsOptional()
@IsString()
avatar_url?: string;
```

No other backend changes needed — `provider.service.ts:updateProfile` already spreads the DTO into the upsert.

---

## Frontend Change

### `provider-edit-profile.tsx`

**State:** Add a separate ref/state to track the newly uploaded URL distinct from the display URI:

```ts
const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
```

**`handlePickAvatar`:** After a successful upload, set both the display state and the persisted URL:

```ts
const handlePickAvatar = async () => {
  if (!user) return;
  const url = await pickAndUploadAvatar(user.id);
  if (url) {
    setAvatarUri(url);
    setUploadedAvatarUrl(url);
  }
};
```

**`onSave`:** Include `avatar_url` in the provider profile patch only when a new avatar was uploaded:

```ts
await api.patch('/provider/profile', {
  business_name: businessName.trim(),
  bio: bio.trim(),
  service_areas: parseTagInput(serviceAreasText),
  languages: parseTagInput(languagesText),
  years_experience: yearsExperience.trim() ? Number(yearsExperience.trim()) : null,
  facebook_url: facebookUrl.trim() || null,
  instagram_handle: instagramHandle.trim() || null,
  website_url: websiteUrl.trim() || null,
  ...(uploadedAvatarUrl ? { avatar_url: uploadedAvatarUrl } : {}),
});
```

This avoids overwriting an existing `avatar_url` with null on saves where no new photo was picked.

---

## Risks

- The cache-busting `?t=Date.now()` suffix stored in `uploadedAvatarUrl` should be stripped before persisting — the DB should store the clean URL without query params. Strip it with `url.split('?')[0]` before setting `uploadedAvatarUrl`.
- No rollback needed — `avatar_url` column already exists and is nullable; adding it to the DTO is additive.

---

## Acceptance Criteria

1. Provider uploads a photo in the edit profile screen and taps Save
2. `provider_profiles.avatar_url` is updated in the database with the clean storage URL (no `?t=` suffix)
3. The photo appears in the marketplace provider list, provider profile screen, and booking form banner
4. Saving profile details without uploading a new photo does not overwrite or null out an existing `avatar_url`
5. If upload fails (storage error), no partial/broken URL is written to the DB

---

## Verification Plan

1. Upload a photo → Save → query `provider_profiles` in Supabase dashboard and confirm `avatar_url` is set
2. Navigate to marketplace → confirm provider photo appears
3. Open booking form for that provider → confirm photo appears in banner
4. Save profile without changing photo → confirm `avatar_url` is unchanged in DB
5. Simulate storage upload failure (revoke storage key) → confirm DB is not updated
