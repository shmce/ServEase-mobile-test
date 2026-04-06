# Shared Response Helpers Lint Slice

Date: 2026-04-06
Owner: Codex
Status: In progress

## Goal

Reduce backend lint debt in the shared response and database helper layer without changing product behavior.

## Scope

- Fix unsafe typing in the global HTTP exception filter.
- Fix unsafe typing in the global response transform interceptor.
- Tighten Supabase helper typing in database result extraction and error inspection.
- Add focused regression tests for these helpers.

## Non-goals

- Broad lint cleanup across feature modules.
- Refactoring Supabase client proxy behavior in `src/database/supabase.module.ts`.
- Changing HTTP response contracts or user-facing messages.

## Files/areas likely affected

- `backend/src/common/filters/http-exception.filter.ts`
- `backend/src/common/interceptors/transform.interceptor.ts`
- `backend/src/common/utils/database.utils.ts`
- `backend/src/common/utils/supabase-error.handler.ts`
- New helper tests under `backend/src/common/**`

## Risks

- Changing shared helpers can affect all controller responses if response shapes drift.
- Over-tightening Supabase response typing could break callers that rely on current null/empty semantics.

## Acceptance criteria

- The touched helper files are free of current lint violations.
- Existing backend tests still pass.
- New helper tests verify current response and error semantics remain intact.

## Verification plan

- Run targeted Jest tests for the new helper specs.
- Run `npx eslint` against only the touched helper files.
- Run the full backend Jest suite after the slice passes targeted checks.
