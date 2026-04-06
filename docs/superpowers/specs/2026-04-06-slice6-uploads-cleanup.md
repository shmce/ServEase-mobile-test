# Slice 6 — Uploads and Cleanup

**Date:** 2026-04-06  
**Status:** Approved  
**Risk:** Medium

---

## Goal

Move all file uploads behind backend endpoints so the mobile app no longer talks directly to Supabase Storage. Then remove all remaining direct Supabase runtime usage from mobile.

---

## Scope

**Upload migration (3 flows):**
1. Avatar upload (`lib/avatar.ts` + `provider-edit-profile.tsx`)
2. Booking attachment upload (`bookingAttachmentService.ts`)
3. Provider verification document upload (`providerVerificationService.ts`)

**Cleanup (after uploads are migrated):**
- Remove `supabase.storage` calls from mobile
- Remove `lib/supabase.ts` runtime import from all non-test mobile files
- Remove schema client imports (`identityDb`, `providerCatalogDb`, etc.) from any remaining mobile files that still use them
- Remove dead helpers and memory fallback stubs left by Slice 5

---

## Non-goals

- No changes to Supabase bucket configuration (buckets remain, backend now writes to them)
- No virus scanning or image processing (backend validates type/size only)
- No changes to how uploaded files are displayed (URLs remain public Supabase Storage URLs)

---

## Backend — Upload Endpoints

### New module: `backend/src/modules/uploads/`

Files:
- `uploads.module.ts`
- `uploads.controller.ts`
- `uploads.service.ts`

All endpoints require auth (SupabaseAuthGuard). Use `multipart/form-data`.

### Endpoints

```
POST /uploads/avatar                         — upload provider/customer avatar
POST /uploads/booking/:bookingId/attachment  — upload booking attachment
POST /uploads/verification/document         — upload provider verification document
```

### `POST /uploads/avatar`

**Request:** `multipart/form-data` with field `file` (image/jpeg or image/png, max 5MB)

**Backend behavior:**
1. Validate: content-type must be `image/jpeg` or `image/png`, size ≤ 5MB
2. Upload to Supabase Storage bucket `avatars` at path `{userId}.jpg` with `upsert: true`
3. Update `provider_profiles.avatar_url` (or `customer_profiles.avatar_url`) to the public URL (clean, no `?t=` suffix)
4. Return `{ avatar_url: string }`

**Note:** This supersedes the avatar persistence fix spec (`2026-04-05-avatar-persistence-fix.md`). If the persistence fix lands first, this endpoint replaces it in full. If this lands first, skip the persistence fix.

### `POST /uploads/booking/:bookingId/attachment`

**Request:** `multipart/form-data` with fields `file` (image/jpeg, image/png, application/pdf, max 10MB) and optional `label` (string)

**Backend behavior:**
1. Verify the booking belongs to the authenticated user (customer or provider)
2. Validate file type and size
3. Upload to Supabase Storage bucket `booking-attachments` at path `{bookingId}/{userId}-{timestamp}.{ext}`
4. Insert a row into `booking_svc.booking_attachments` with `booking_id`, `uploader_id`, `storage_path`, `public_url`, `label`
5. Return `{ id, public_url, label, storage_path }`

### `POST /uploads/verification/document`

**Request:** `multipart/form-data` with fields `file` (image/jpeg, image/png, application/pdf, max 10MB) and `document_type` (string, e.g. `"government_id"`, `"business_permit"`)

**Backend behavior:**
1. Validate file type and size
2. Upload to Supabase Storage bucket `provider-documents` at path `{userId}/{document_type}-{timestamp}.{ext}`
3. Upsert a row in `provider_catalog_svc.provider_documents`
4. Return `{ id, public_url, document_type }`

---

## Mobile — Upload Migration

### `lib/avatar.ts`

Replace `pickAndUploadAvatar`:

```ts
export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  // permission + ImagePicker logic unchanged...

  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    name: 'avatar.jpg',
    type: 'image/jpeg',
  } as any);

  const { avatar_url } = await api.postForm<{ avatar_url: string }>('/uploads/avatar', formData);
  return avatar_url;
}
```

`getAvatarUrl` can remain as a utility for display (derives public URL from userId for cache-busting).

Remove `supabase.storage` import from `lib/avatar.ts`.

### `services/bookingAttachmentService.ts`

Replace `uploadBookingAttachment`:

```ts
export async function uploadBookingAttachment({ bookingId, uri, fileName }: {
  bookingId: string;
  userId: string;
  uri: string;
  fileName: string;
}): Promise<{ publicUrl: string; fileName: string; storagePath: string }> {
  const formData = new FormData();
  formData.append('file', { uri, name: fileName, type: 'image/jpeg' } as any);
  formData.append('label', fileName);

  const result = await api.postForm<{ id: string; public_url: string; label: string; storage_path: string }>(
    `/uploads/booking/${bookingId}/attachment`,
    formData
  );

  return {
    publicUrl: result.public_url,
    fileName: result.label,
    storagePath: result.storage_path,
  };
}
```

Replace `getBookingAttachments` to use API:
```ts
export async function getBookingAttachments(bookingId: string) {
  const { attachments } = await api.get<{ attachments: any[] }>(`/booking/${bookingId}/attachments`);
  return attachments;
}
```

This requires `GET /booking/:bookingId/attachments` on the backend (add to existing booking module).

Remove `supabase.storage` and `bookingDb` imports from `bookingAttachmentService.ts`.

### `services/providerVerificationService.ts`

Replace the local-storage-only draft system's document upload step to call `POST /uploads/verification/document`. The draft/status tracking in local storage can remain until a full verification workflow spec is written.

---

## Cleanup Pass

After all upload migrations are complete and Slice 5 is done, run the following cleanup:

### Files to audit and clean

| File | Action |
|---|---|
| `mobile/lib/db.ts` | Remove exports that are no longer imported anywhere in mobile runtime |
| `mobile/lib/supabase.ts` | Remove all non-test runtime imports; file can remain for `supabase.auth` shim if still needed by edge cases |
| `mobile/services/chatService.ts` | Remove memory fallback Map stubs after Slice 5 is verified stable |
| `mobile/services/notificationService.ts` | Remove memory fallback Map stubs; remove `createChatNotification` and `createBookingStatusNotification` no-op stubs |

### Verification grep (must return zero mobile runtime hits)

```bash
rg -n "supabase\.auth|\.from\(|supabase\.storage|supabase\.channel\(" mobile/app mobile/services mobile/lib mobile/context
```

Any remaining hits must be:
- In `__tests__/` files
- Explicitly documented as approved migration shims with a comment

---

## `apiClient` — `postForm` helper

The mobile `apiClient.ts` likely only has `get`, `post`, `patch`. Add a `postForm` helper for multipart uploads:

```ts
async postForm<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await getToken()}` },
    body: formData,
    // Do NOT set Content-Type manually — fetch sets multipart boundary automatically
  });
  if (!response.ok) throw await response.json();
  return response.json();
}
```

---

## Files Affected

| File | Change |
|---|---|
| `backend/src/modules/uploads/` | New module — 3 files |
| `backend/src/modules/booking/booking.controller.ts` + service | Add `GET /booking/:bookingId/attachments` |
| `backend/src/app.module.ts` | Register UploadsModule |
| `mobile/lib/apiClient.ts` | Add `postForm` helper |
| `mobile/lib/avatar.ts` | Replace `supabase.storage` upload with API call |
| `mobile/services/bookingAttachmentService.ts` | Replace storage + DB calls with API calls |
| `mobile/services/providerVerificationService.ts` | Replace local-only upload step with API call |
| `mobile/lib/db.ts` | Cleanup unused exports |
| `mobile/lib/supabase.ts` | Cleanup unused runtime imports |

---

## Risks

- `postForm` must NOT set `Content-Type` header manually — React Native's `fetch` sets the multipart boundary automatically
- Avatar upload replaces the two-step pattern (upload storage → update DB) with a single API call. Coordinate with `2026-04-05-avatar-persistence-fix.md` — whichever lands first, the other is superseded
- Provider verification document upload only handles the file transfer; the full verification submission workflow (status transitions, admin review) needs a separate spec

---

## Acceptance Criteria

1. Provider avatar upload goes through `POST /uploads/avatar` — no `supabase.storage` call from mobile
2. Booking attachment upload goes through `POST /uploads/booking/:bookingId/attachment`
3. Verification document upload goes through `POST /uploads/verification/document`
4. `getBookingAttachments` fetches from API
5. Cleanup grep returns zero mobile runtime Supabase hits
6. All upload flows work end-to-end: file appears in Storage, metadata in DB, URL returned to mobile

---

## Verification

1. Upload avatar → confirm `provider_profiles.avatar_url` updated in DB, image visible in app
2. Attach image to booking → confirm row in `booking_attachments`, image viewable from booking details
3. Upload verification doc → confirm row in `provider_documents`
4. Run cleanup grep — zero hits outside tests and approved shims
