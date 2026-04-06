---
name: customer-journey-audit
description: Audit an app from the customer's point of view by interacting with live screens when possible, reviewing UI clarity, trust, friction, and logical correctness across journeys. Use when a user asks to test the design, review the whole UI, validate whether flows make sense to a customer, inspect whether backend-driven states appear correctly in the UI, or produce a durable customer-facing review note with evidence-backed findings.
---

# Customer Journey Audit

Use this skill to evaluate whether the app feels clear, trustworthy, and logically correct to a real customer. Prefer live interaction over static inspection whenever the app can be launched locally.

Read `references/review-format.md` before delivering the final report.

## Core Rules

1. Prefer customer-observed evidence over code-only theory.
2. Interact with live screens when the environment allows it.
3. Reuse existing interaction flows before inventing new ones.
4. Judge both UX quality and logic correctness.
5. Separate `verified`, `blocked`, and `inferred` outcomes.
6. Persist a durable review note under `docs/superpowers/reviews/`.
7. Do not modify code unless the user explicitly changes the task from audit to remediation.

## Audit Workflow

### 1. Detect the runnable surface

Inspect the repo and identify:

- app type and likely user-facing entrypoints
- package manager and scripts
- existing Maestro, E2E, or smoke-flow assets
- whether the app can be launched locally
- whether screenshots, logs, or screen recordings can be captured
- which customer role or journey the user cares about most

If the repo has multiple app surfaces, state which one you are auditing.

### 2. Build the highest-signal customer plan

Prefer this order:

1. user-requested journey
2. login or onboarding
3. discovery or browse flow
4. checkout, booking, or confirmation flow
5. profile, support, cancellation, reschedule, or post-purchase flow

If repo-owned Maestro flows exist, use them first. Only create or adapt flows when needed.

### 3. Run live interaction first

When the app is runnable, launch it and interact with screens through the safest existing tooling.

Good evidence sources:

- existing Maestro flows
- app startup logs
- screenshots or emulator captures
- observed navigation behavior
- visible loading, error, and success states

If live interaction is blocked by environment gaps such as missing auth data, simulator access, secrets, or backend availability, mark the affected journey as `blocked` and continue with the next best evidence.

### 4. Evaluate every journey with two lenses

For each journey, assess both of these:

#### Customer-experience lens

Look for:

- unclear labels or next steps
- weak visual hierarchy
- trust-breaking copy or presentation
- friction or unnecessary repetition
- confusing empty, loading, or error states
- dead ends and navigation traps
- mismatch between what the UI suggests and what the customer expects

#### Logic-correctness lens

Look for:

- impossible or contradictory states
- stale, missing, or mis-mapped data
- wrong booking, order, or status transitions
- broken fallbacks
- route param mismatches
- DTO or response-shape assumptions leaking into the UI
- backend behavior that appears incorrect from the user's perspective

If the UI symptom suggests a deeper contract issue, inspect the relevant frontend and backend boundary just enough to explain the risk without drifting into unrelated code review.

### 5. Classify evidence clearly

Use these labels consistently:

- `verified`: observed directly through interaction, command output, logs, or captured screens
- `blocked`: could not be verified because the environment prevented it
- `inferred`: reasoned from code or visible symptoms but not reproduced end-to-end

Do not present inferred issues as proven defects.

### 6. Rate functional confidence by journey

For each important journey, report exactly one:

- `Verified working`
- `Verified failing`
- `Blocked from verifying`
- `Not tested`

Ground each status in a short evidence line.

### 7. Write the durable review note

Save the report to:

- `docs/superpowers/reviews/YYYY-MM-DD-<topic>-review.md`

The review note must be compact, evidence-based, and written for product and engineering readers.

## Repo-Specific Guidance

In this repo, prefer checking for:

- Expo app launch scripts in `mobile/package.json`
- existing Maestro flows in `mobile/.maestro/`
- customer booking, address, login, and profile journeys in `mobile/app/`
- backend contract or booking-state logic only when a UI symptom points there

When a journey crosses layers, include contract notes such as:

- route params added or assumed
- DTO or response-shape assumptions
- fallback behavior when required data is missing

## Recommended Execution Pattern

1. Inspect scripts, flows, and runnable app surface.
2. Choose the smallest useful live-interaction plan.
3. Run existing Maestro journeys or equivalent screen interactions.
4. Capture verified UX and logic findings.
5. Inspect boundary code only for symptoms exposed by the UI.
6. Write the durable review note using the reference format.

## Boundaries

- Do not claim full app quality from one or two flows.
- Do not collapse blocked verification into failures.
- Do not bury customer-facing issues under style commentary.
- Do not turn this into a generic lint or unit-test audit unless the user asks for broader QA.
- Do not fix issues during the audit unless the user explicitly requests fixes.
