# Supabase Live Audit Skill Design

## Goal

Create a reusable shared skill that inspects the current live state of a Supabase project and explains it clearly. The skill should help Claude, Gemini, Codex, and similar compatible agents answer questions such as:

- What schemas, tables, columns, constraints, indexes, views, functions, triggers, and policies exist right now?
- How does the data model fit together?
- What RLS and security posture is currently active?
- What looks suspicious, risky, incomplete, or inconsistent?
- What fixes should be recommended first?

The live Supabase project is the source of truth. Local SQL files are optional comparison context only and must never override live findings.

## Scope

The skill should:

- Connect to a live Supabase project using environment variables or explicitly provided credentials.
- Inspect live metadata for schemas, tables, columns, keys, indexes, views, functions, triggers, RLS policies, grants, and storage metadata when accessible.
- Produce structured machine-readable output that an agent can narrate into a database audit.
- Explain the current database in plain language, including likely domain intent inferred from names and relationships.
- Diagnose likely problems and recommend fixes, prioritizing security and data integrity.
- Support centralized installation under the shared skills location, with repo access happening through the existing `.agents` symlink so other agents resolve the same single skill source.

The skill should not:

- Apply schema changes automatically.
- Mutate live data or security configuration.
- Treat local repo SQL as authoritative.
- Promise full storage object inspection if credentials or endpoints do not expose it.

## Users And Triggers

This skill is intended for requests like:

- "Analyze my Supabase database right now."
- "Describe everything in my database."
- "Audit my schemas, tables, and policies."
- "What is happening in this Supabase project?"
- "What looks broken or risky in my database?"

It should also be reusable by Claude, Gemini, Codex, and other compatible agents that need live schema understanding before implementation or debugging.

## Recommended Approach

Use a hybrid design:

1. A bundled script performs deterministic live introspection and emits structured JSON.
2. The skill instructions teach the agent how to convert that output into a readable audit.
3. Optional repo SQL comparison is a secondary step for drift detection only.

This approach keeps live data collection reliable while leaving the final explanation flexible and useful across many prompts.

## Skill Layout

Skill name: `supabase-live-audit`

Install location:

- Primary and only source: `/Users/mac/.agents/skills/supabase-live-audit`
- Access path inside this repo: `./.agents/skills/supabase-live-audit` through the existing `.agents -> /Users/mac/.agents` symlink

Planned contents:

- `SKILL.md`
- `agents/openai.yaml`
- `scripts/introspect_supabase_live.js`
- `references/audit-checklist.md`
- `references/query-surface.md`

## Data Collection Design

### Credentials

The script should support:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

Optional explicit overrides may be accepted through flags for reuse outside this repo.

### Introspection Source

The script should query live Postgres metadata through Supabase REST or direct SQL-over-API patterns available with the service role key. If some metadata is not reachable through one surface, the script should fall back to the next safest available mechanism.

Expected coverage:

- Schemas
- Tables
- Columns and data types
- Nullability and defaults
- Primary keys and foreign keys
- Unique constraints
- Indexes
- Views and materialized views when visible
- Functions and signatures
- Triggers
- Row level security enabled/disabled state
- Policies
- Grants and privilege-relevant metadata where accessible
- Storage buckets and basic metadata if accessible from the same credentials

The script should explicitly report unsupported or inaccessible areas instead of silently omitting them.

## Audit Output Shape

The script should emit JSON with sections such as:

- `project`
- `schemas`
- `tables`
- `relationships`
- `indexes`
- `views`
- `functions`
- `triggers`
- `rls`
- `policies`
- `grants`
- `storage`
- `warnings`
- `collection_notes`

This output should be designed for cross-agent narration and future machine checks.

## Agent Workflow

When invoked, the skill should guide the calling agent to:

1. Locate credentials from environment or ask for them if truly unavailable.
2. Run the live introspection script.
3. Read the JSON output.
4. Summarize the overall architecture of the current project.
5. Explain each schema and major table group in plain language.
6. Describe relationships, security posture, and operational logic.
7. Surface important findings:
   - security risks
   - missing or weak RLS
   - suspicious grants
   - missing PK/FK coverage
   - likely missing indexes
   - drift or naming inconsistencies
   - orphaned or unused-looking objects
8. Recommend fixes in priority order.
9. Use local SQL only if the user asks for drift comparison or if drift helps explain a problem.

## Diagnostic Heuristics

The skill should include a concise reference checklist for likely problems, including:

- RLS disabled on user-facing tables
- permissive policies using broad `true` conditions
- tables without primary keys
- foreign-key-like columns lacking actual foreign keys
- join-heavy or filter-heavy columns lacking indexes
- triggers calling missing or suspicious functions
- views or functions with confusing ownership or security context
- duplicate or overlapping tables suggesting abandoned migrations
- inconsistent enum/text usage across related entities
- timestamp columns missing defaults or update behavior
- nullable fields that appear required from surrounding structure

Recommendations should be framed as suggestions, not silent fixes.

## Safety Model

The skill should default to read-only behavior.

It may:

- read live metadata
- compare local SQL for drift context
- produce recommendations

It must not:

- execute DDL
- alter policies
- migrate data
- delete storage objects

If a user later wants fixes applied, that should happen in a separate task.

## Implementation Notes

- Prefer Node.js for the bundled script because the repo already contains Node-based backend context.
- Keep the script dependency-light if possible.
- Return stable, explicit JSON keys so different agents can rely on the output.
- Document known metadata blind spots in `references/query-surface.md`.
- Include examples in `SKILL.md` showing the expected style of audit requests.

## Validation Plan

Validate the skill by:

1. Running the skill validation script on the generated folder.
2. Running the live introspection script against the current Supabase project using repo credentials.
3. Checking that the output includes at least schemas, tables, columns, RLS/policies, and warnings.
4. Confirming another compatible agent could use the skill to answer a generic audit request without extra hidden context.

## Risks And Mitigations

- Live metadata access may vary by endpoint.
  Mitigation: design fallbacks, and record inaccessible sections explicitly.

- Storage inspection may be partial.
  Mitigation: report exact coverage instead of implying completeness.

- Diagnosis may over-infer business purpose from object names.
  Mitigation: separate observed facts from inferred intent.

- Credentials may be absent in future repos.
  Mitigation: support explicit credential input and fail with clear instructions.

## Success Criteria

The skill is successful if another compatible agent can use it to:

- inspect the real current Supabase project
- explain the database structure clearly
- identify meaningful risks and likely issues
- recommend fixes without making changes
- work from the centralized shared skill path through the repo symlink

## Implementation Decision

Proceed with a live-first shared skill named `supabase-live-audit`, installed centrally at `/Users/mac/.agents/skills/supabase-live-audit` and accessed from this repo through the existing `.agents` symlink, with a bundled introspection script and concise references for audit interpretation.
