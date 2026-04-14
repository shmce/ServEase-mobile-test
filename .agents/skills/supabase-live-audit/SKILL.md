---
name: supabase-live-audit
description: Inspect the live state of a Supabase project and explain the current schemas, tables, columns, relationships, views, functions, triggers, row-level security, policies, grants, and storage metadata. Use when Claude, Gemini, Codex, or another compatible agent needs to analyze what exists in Supabase right now, describe how the database is organized, diagnose risks or inconsistencies, or recommend fixes without making changes.
---

# Supabase Live Audit

## Overview

Use this skill to audit a live Supabase project as it exists now. Treat the live project as the source of truth. Use local SQL files only as optional comparison material for drift analysis, never as the authoritative schema.

## Quick Start

1. Find credentials.
Look for `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in the environment, local env files, or user-provided inputs.

2. Run the live introspection script.
Use `scripts/introspect_supabase_live.js` and capture its JSON output.

3. Read the output before answering.
Separate observed facts from inferred intent. If the script reports blind spots or inaccessible surfaces, say that explicitly.

4. Produce a readable audit.
Explain the database structure, security posture, relationships, operational logic, major risks, and recommended fixes.

## Workflow

### 1. Collect Credentials

Prefer these environment variables:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

If they are unavailable, ask the user for them only if needed. Do not invent values or silently skip authentication-sensitive sections.

### 2. Run Live Introspection

Run:

```bash
node /Users/mac/.agents/skills/supabase-live-audit/scripts/introspect_supabase_live.js
```

Optional flags:

```bash
node /Users/mac/.agents/skills/supabase-live-audit/scripts/introspect_supabase_live.js --url https://<project-ref>.supabase.co --service-key <service-role-key> --out /tmp/supabase-audit.json
```

What the script tries to collect:

- project reference and endpoints
- schemas
- tables
- columns
- relationships
- indexes
- views
- materialized views
- functions
- triggers
- row-level-security state
- policies
- roles and grants when exposed
- REST API OpenAPI exposure for live table/view definitions when available
- Auth admin user metadata when the service role key can access it
- storage buckets

The script records inaccessible surfaces in `collection_notes` and `warnings`.

### 3. Interpret Carefully

Use [references/query-surface.md](./references/query-surface.md) when the output shows partial metadata. The metadata API surface can differ across Supabase setups.

Rules:

- Treat live metadata as fact.
- Treat business-purpose explanations as inference and label them as such.
- Do not overstate storage or grants coverage if the script marks them partial.
- Do not assume local SQL matches production.

### 4. Write the Audit

Structure the response around:

1. Overall architecture
2. Schemas and major table groups
3. Relationships and data flow
4. Security posture
5. Operational logic such as functions, triggers, and views
6. Findings and risks
7. Recommended fixes in priority order

Good prompts this skill should handle:

- "Analyze my Supabase database right now."
- "Describe everything happening in this Supabase project."
- "Audit my RLS and explain what looks risky."
- "What tables exist and how do they relate?"
- "What should I fix first in this database?"

## Findings Checklist

Use [references/audit-checklist.md](./references/audit-checklist.md) when writing findings. Prioritize:

- security issues first
- data integrity problems second
- performance and maintainability issues third

When useful, group findings into:

- `Critical`
- `High`
- `Medium`
- `Low`

## Drift Comparison

Only compare against local SQL if:

- the user asks for drift analysis
- drift would explain a live problem
- implementation context requires knowing intended schema direction

When you compare:

- say clearly that local SQL is secondary evidence
- report mismatches as drift, not truth

## Safety Rules

This skill is read-only by default.

Allowed:

- read metadata
- inspect storage buckets
- compare local SQL
- recommend fixes

Not allowed:

- run migrations
- alter tables
- change policies
- mutate data
- delete storage objects

If the user wants fixes applied, treat that as a separate task after the audit.

## Output Style

Aim for an audit that is both technical and readable:

- explain what exists
- explain why it matters
- distinguish fact from inference
- state blind spots clearly
- end with a prioritized action list

Avoid dumping raw JSON unless the user asks for it.

## Coverage Notes

This skill is strongest when one of these is available:

- Supabase `pg-meta` HTTP metadata endpoints
- a direct database connection string supplied by the user in a future extension
- a sufficiently rich live REST OpenAPI surface

If `pg-meta` is unavailable, the skill should still audit whatever live surfaces are visible, such as:

- exposed REST API definitions
- auth users
- storage buckets

Be explicit when the result is a partial live audit instead of a full database audit.
