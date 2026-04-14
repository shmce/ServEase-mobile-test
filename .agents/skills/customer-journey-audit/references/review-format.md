# Customer Journey Review Format

Use this structure for the durable review note.

## Summary

State the audited surface, customer persona, and overall confidence in 1-3 short sentences.

Use one confidence label:

- High confidence
- Moderate confidence
- Limited confidence

Lower confidence whenever live interaction was blocked or major journeys were not exercised.

## Scope

Include:

- app surface audited
- persona or customer role used
- journeys targeted
- environment assumptions

## Checks Run

List each check with one of:

- `passed`
- `failed`
- `blocked`
- `not run`

For each check include:

- command, flow, or method used
- short result
- why it mattered

## Functional Journeys

For each major journey, report exactly one:

- `Verified working`
- `Verified failing`
- `Blocked from verifying`
- `Not tested`

Include a one-line reason grounded in evidence.

## Findings

List findings in severity order.

For each finding include:

- severity
- status: `verified`, `blocked`, or `inferred`
- affected journey or area
- evidence
- likely customer impact

## Contract Notes

Include this section whenever the journey crosses screens, services, or layers.

Examples:

- route params added, missing, or misused
- DTO or response-shape mismatches
- fallback behavior when data is absent
- backend state changes that do not match the UI

## Recommendations

For each recommendation include:

- recommendation
- severity
- reason
- evidence trigger

Keep recommendations specific and actionable.

## Unknowns

List what could not be verified and why.

This section is required whenever checks were blocked or omitted.
