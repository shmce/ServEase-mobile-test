---
name: qa-audit
description: Run app-level quality checks, smoke tests, and repo health validation, then report verified failures, functional risks, and evidence-backed recommendations with reasons. Use when a user wants an app tested, wants confidence before shipping, asks for a quality audit, or needs a structured report on what is working, what is blocked, and what should be improved.
---

# QA Audit

## Overview

Use this skill to evaluate how healthy and functional an app appears from the available local environment. The goal is to run the safest meaningful checks available, separate verified facts from inference, and return a practical report with recommendations and the reasons each recommendation is warranted.

Do not claim that the app is fully functional unless you have direct evidence. Prefer "verified", "failed", "blocked", and "not tested" over broad success language.

Read `references/report-format.md` before delivering the final report.

## When To Use It

Use this skill when the user asks to:

- test the app
- run quality checks
- verify whether features still work
- assess release readiness
- review engineering quality before shipping
- produce recommendations based on test or audit results

This skill is especially useful before merge, before release, after large refactors, after dependency upgrades, and after auth, storage, schema, or environment changes.

## Core Rules

1. Evidence before conclusions.
2. Run the highest-signal safe checks first.
3. Do not hide blocked verification; call it out explicitly.
4. Separate confirmed defects from suspected risks.
5. Every recommendation must include a reason tied to observed evidence, missing coverage, or known risk.
6. Do not modify code unless the user explicitly asks for fixes after the audit.

## Audit Workflow

### 1. Identify the project surface

Start by determining what can realistically be tested in the current repo and environment.

Check for:

- app type: web, React Native, backend, monorepo, or mixed
- package managers and lockfiles
- available scripts in `package.json`, `Makefile`, Gradle, Xcode, or other task runners
- test frameworks, linters, typecheckers, and E2E tools
- environment requirements that may block execution

If the repo contains multiple apps, scope the audit to the user-requested area. If the user did not specify, state the area you are auditing.

### 2. Build a safe execution plan

Prefer checks in this order, adapting to the repo:

1. static inspection of scripts and project layout
2. dependency and environment sanity checks
3. lint
4. typecheck
5. unit or integration tests
6. build or compile checks
7. targeted smoke tests or app startup validation
8. E2E tests if already configured and reasonably runnable

Do not invent new heavy test infrastructure during the audit.

### 3. Run checks conservatively

Run only commands that are relevant and available in the repo.

Examples include:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- framework-specific existing smoke or E2E commands

If a command fails because the environment is missing secrets, services, simulators, or network access, mark it as blocked rather than failed.

### 4. Inspect high-risk areas

When time or tooling is limited, prioritize manual inspection of high-risk code paths:

- authentication and session handling
- secure storage and secrets handling
- permissions and authorization
- network client configuration
- data persistence and migrations
- crash-prone startup paths
- feature flags and environment branching
- payment or irreversible transaction flows

For frontend or mobile apps, also look for:

- obvious navigation dead ends
- loading and error-state gaps
- unsafe null handling
- stale cache or persistence logic
- inconsistent offline or retry behavior

### 5. Evaluate functional confidence

For each important area, classify status as one of:

- `Verified working`
- `Verified failing`
- `Blocked from verifying`
- `Not tested`

Never collapse these states into one overall vague statement.

### 6. Produce recommendations

Recommendations should be specific and actionable.

Good recommendation categories:

- fix a verified defect
- add or repair a missing quality gate
- add coverage for an unverified high-risk path
- improve developer ergonomics that blocked verification
- reduce release risk with a smaller targeted safeguard

Every recommendation must include:

- what to do
- why it is recommended
- what evidence triggered it
- severity: `critical`, `high`, `medium`, or `low`

## Heuristics For Recommendations

Recommend a change when one or more of these are true:

- a check failed
- a critical workflow could not be verified
- a high-risk area has no meaningful automated coverage
- the build or startup path is fragile
- quality gates exist but are not consistently runnable
- local developer setup is likely to produce false confidence

Do not recommend work that is unrelated to the observed app behavior or quality risk.

## Output Expectations

Your report must be compact, structured, and evidence-based.

Always include:

- scope audited
- environment detected
- checks attempted
- checks that passed, failed, or were blocked
- functional confidence by area
- recommendations with reasons
- explicit unknowns or unverified areas

If nothing serious is wrong, say that clearly, then list any residual risk or test gaps.

## Recommended Execution Pattern

1. Inspect scripts and repo layout first.
2. Choose the smallest useful command set.
3. Run checks.
4. Review high-risk areas manually if needed.
5. Summarize outcomes using the report format reference.

## Boundaries

- Do not fabricate runtime behavior you did not observe.
- Do not say "everything works" unless broad verification actually happened.
- Do not convert blocked checks into failures.
- Do not bury important risk behind style commentary.
- Do not fix issues during the audit unless the user explicitly changes the task from auditing to remediation.
