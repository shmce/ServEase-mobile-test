# QA Audit Report Format

Use this structure for the final report.

## Summary

State the audited scope and the overall confidence level in 1-3 short sentences.

Use confidence labels such as:

- High confidence
- Moderate confidence
- Limited confidence

Choose lower confidence whenever important checks were blocked or major areas were not tested.

## Checks Run

List each check with one of these statuses:

- `passed`
- `failed`
- `blocked`
- `not run`

For each check include:

- command or method used
- brief result
- why it matters if non-obvious

## Functional Areas

For each major app area reviewed, report exactly one status:

- `Verified working`
- `Verified failing`
- `Blocked from verifying`
- `Not tested`

Include a one-line reason grounded in evidence.

## Findings

If there are defects or clear risks, list them in severity order.

For each finding include:

- severity
- affected area
- evidence
- likely impact

## Recommendations

For each recommendation include:

- recommendation
- severity
- reason
- evidence trigger

Keep recommendations concrete. Prefer "add an auth session rehydration test" over "improve auth quality".

## Unknowns

List what could not be verified and why. This section is required whenever checks were blocked or omitted.

## Closing Rule

The report must distinguish observed failures from missing evidence. If verification was limited, say so directly.
