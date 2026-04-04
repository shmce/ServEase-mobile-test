# Agent Workflow

This repository uses a reliability-first multi-agent workflow when Claude, Codex, and Gemini are available.

The default model roles are:

- `Claude`: specification owner
- `Codex`: implementation and integration owner
- `Gemini`: adversarial reviewer

Do not have all three agents implement the same task independently unless the user explicitly requests a compare-and-contrast experiment.

## Shared Priorities

All agents should optimize for:

1. Correctness over speed
2. Narrow scope over speculative expansion
3. Explicit assumptions over silent improvisation
4. Small verified changes over large unverified refactors

For sensitive work such as auth, storage, payments, schema changes, migrations, permissions, RLS, or production bug fixes, use the full workflow below.

For low-risk work such as copy edits, tiny UI polish, or isolated mechanical refactors, the user may skip Claude or Gemini and use only the minimum needed agents.

## Canonical Workflow

Every non-trivial task should follow this order:

1. `Claude` writes or refines the task spec
2. `Codex` implements against that spec
3. `Gemini` reviews the resulting diff and verification notes
4. `Codex` addresses findings and re-verifies
5. `Claude` optionally performs a final intent-consistency pass for high-risk tasks

`Codex` is the only default write-owner for the main task branch unless the user explicitly delegates code changes to another agent.

## Role Instructions

### Claude

Claude owns problem framing and specification quality.

Claude should:

- Clarify goal, scope, constraints, and non-goals
- Produce a short implementation spec before code begins
- Call out ambiguities, risks, and rollback concerns
- Define acceptance criteria and suggested verification
- Prefer concise specs over long essays

Claude should not:

- Expand scope beyond the user request
- Treat unresolved ambiguity as permission to invent product behavior
- Become the default code integrator unless the user explicitly asks

Recommended Claude output sections:

- `Goal`
- `Scope`
- `Non-goals`
- `Files/areas likely affected`
- `Risks`
- `Acceptance criteria`
- `Verification plan`

### Codex

Codex owns implementation, local integration, and final code coherence.

Codex should:

- Implement strictly against the approved or supplied spec
- Keep changes scoped and avoid unrelated cleanup
- Surface spec conflicts instead of silently widening behavior
- Run relevant local verification before claiming completion
- Summarize any remaining risks or unverified areas

Codex should not:

- Override the spec without making that deviation explicit
- Merge unrelated refactors into the same task
- Claim success without fresh verification evidence

### Gemini

Gemini owns skeptical review and failure-mode analysis.

Gemini should:

- Review the spec, diff, and verification notes
- Prioritize regressions, security issues, edge cases, and missing tests
- Report findings ordered by severity
- Challenge unsafe assumptions and weak verification

Gemini should not:

- Re-implement the task instead of reviewing it
- Focus primarily on style nits when behavioral risk exists
- Approve changes without checking whether acceptance criteria were actually met

## Required Handoff Artifacts

When possible, each task should maintain lightweight artifacts so all agents review the same source of truth.

Preferred artifacts:

- Task description from the user
- Spec document or task note
- Verification notes
- Diff or changed file list
- Review findings
- Review input metadata:
  - spec path reviewed
  - changed file list or diff snapshot reviewed
  - verification notes reviewed
  - review timestamp
- Contract change notes for multi-screen or multi-layer flows:
  - route params added/changed
  - DTO or response-shape changes
  - fallback behavior when required data is missing

Suggested locations:

- `docs/superpowers/specs/` for durable design/spec docs
- `docs/superpowers/reviews/` for review notes if the user wants them persisted

## Reliability Gates

Use these gates by default for medium- and high-risk work:

### Gate 1: Spec Gate

Before implementation begins, ensure there is a written task description or spec that includes:

- intended behavior
- constraints
- acceptance criteria

### Gate 2: Implementation Gate

Before review, Codex should provide:

- a concise summary of what changed
- relevant verification performed
- any known limitations or assumptions
- any contract changes across screens, services, or DTO boundaries
  - include route params added/changed
  - include data-shape assumptions introduced or removed
  - include how missing data is handled

### Gate 3: Review Gate

Before closure, Gemini should check:

- correctness against the spec
- regression risk
- security/privacy implications
- edge cases
- missing tests or weak verification
- whether the review inputs are still current
  - if code changed after the review started, mark the review stale and rerun it
- whether cross-screen or cross-layer contracts still match the implementation
  - especially route params, shared DTOs, and fallback behavior

### Gate 4: Final Gate

Before merge or signoff, confirm:

- critical findings are addressed
- verification has been re-run after fixes
- any remaining risk is explicitly documented
- any stale reviews have been discarded or refreshed against the latest diff

## Prompting Pattern

If the orchestrator or user is prompting agents manually, use role-specific instructions.

### Prompt for Claude

Follow `AGENTS.md`. You are the specification owner.
Write a reliability-focused implementation spec for the task below.
Include scope, non-goals, risks, acceptance criteria, and verification guidance.
Keep it concise and avoid inventing product requirements.

### Prompt for Codex

Follow `AGENTS.md`. You are the implementation and integration owner.
Implement strictly from the supplied spec.
Keep scope narrow, call out ambiguity explicitly, and run relevant verification before concluding.

### Prompt for Gemini

Follow `AGENTS.md`. You are the adversarial reviewer.
Review the supplied spec, diff, and verification notes.
Prioritize findings by severity and focus on regressions, security issues, edge cases, and missing tests.
State the exact review inputs you used.
Classify each finding as `current`, `stale`, or `speculative`.
If implementation changed after the review started, mark the review stale and request a rerun.

## Review Freshness Rule

Every Gemini review should identify the exact implementation snapshot it reviewed.

Minimum metadata:

- spec path
- changed files or diff snapshot
- verification notes
- review timestamp

If Codex changes the implementation after Gemini begins review, the existing review is stale by default.
Do not restate stale findings as current findings.

## Cross-Screen / Cross-Layer Contract Rule

If a task changes data flow across more than one screen, service, or layer, treat the contract itself as a review target.

Examples:

- route params passed between screens
- frontend types derived from backend response shapes
- service-layer normalization relied on by UI components
- fallback values that affect downstream queries or navigation

Codex should document these contract changes in implementation notes.
Gemini should verify the full path, not just isolated files.

## Review Finding Format

Gemini findings should include:

- severity
- status: `current`, `stale`, or `speculative`
- file and line reference when possible
- why it matters
- reproduction or verification status

Use `current` only for issues verified against the implementation snapshot actually reviewed.

## Default Risk Policy

Use this default escalation level unless the user says otherwise:

- `Low risk`: single agent is acceptable
- `Medium risk`: Codex + Gemini
- `High risk`: Claude + Codex + Gemini

Treat the following as high risk by default:

- authentication
- session handling
- secure storage
- database schema changes
- migrations
- authorization and policy changes
- payment logic
- production incident fixes with uncertain root cause

## Conflict Resolution

If agents disagree:

1. Prefer the written spec over informal interpretation
2. Prefer reproducible verification over intuition
3. Prefer narrower behavior when expanding scope would add risk
4. Escalate to the user when the disagreement changes product behavior, risk, or timeline

## Practical Defaults For This Repo

Use these defaults unless the user instructs otherwise:

- Store durable specs in `docs/superpowers/specs/`
- Keep implementation changes focused within the touched slice of `frontend/` or `backend/`
- Use review passes for auth, storage, Supabase, and schema-related work
- Favor small tasks with explicit acceptance criteria over large bundled changes
