# Query Surface Notes

This skill is intentionally live-first, but Supabase metadata visibility can vary.

## Primary Metadata Surface

The bundled script first tries the Supabase `pg-meta` HTTP surface under the project URL:

- `/pg/meta/schemas`
- `/pg/meta/tables`
- `/pg/meta/columns`
- `/pg/meta/relationships`
- `/pg/meta/functions`
- `/pg/meta/triggers`
- `/pg/meta/policies`
- `/pg/meta/roles`
- `/pg/meta/extensions`

These endpoints are convenient when available because they return structured database metadata without needing a direct Postgres connection string.

## Partial Coverage

Some projects may not expose every endpoint, or may expose only a subset depending on auth or platform configuration. When that happens:

- trust the sections that were retrieved
- mark missing sections as inaccessible or unsupported
- avoid claiming the audit is exhaustive

## REST OpenAPI Fallback

When `pg-meta` is unavailable, check the live REST OpenAPI document at:

- `/rest/v1/` with `Accept: application/openapi+json`

This can expose:

- table and view definitions
- column names and types
- primary-key hints in property descriptions
- RPC path exposure when present

It will not reliably expose full relationships, triggers, policies, or grants.

## Storage

Storage buckets are collected separately from:

- `/storage/v1/bucket`

Bucket metadata does not imply full object inspection. If object-level visibility is unavailable, say so clearly.

## Auth Admin Surface

With a service role key, `/auth/v1/admin/users` may be readable. This is not database schema metadata, but it is useful for describing the live project state:

- current auth users
- provider mix
- basic user metadata shape

Keep this separate from database-schema conclusions.

## Live-First Rule

Do not replace live findings with repo SQL assumptions. Local SQL is useful only for:

- drift comparison
- understanding intended future state
- explaining migration history

## Recommended Wording

When coverage is partial, use language like:

- "The live metadata surface exposed tables, columns, and policies, but not grants."
- "Storage bucket metadata was visible, but object-level inspection was not confirmed."
- "The following conclusions are based on the accessible live metadata only."
