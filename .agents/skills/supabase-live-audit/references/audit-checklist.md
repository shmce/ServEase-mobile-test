# Audit Checklist

Use this checklist to turn raw live metadata into a useful audit.

## Security

- Check whether row-level security is enabled on user-facing tables.
- Look for policies that are effectively unconditional, such as broad `true` predicates.
- Call out missing policies on tables that appear to hold customer, provider, booking, payment, or messaging data.
- Note functions that may execute with elevated rights or unclear ownership context.
- Flag suspicious grants or role exposure if the metadata surface exposes them.

## Data Integrity

- Flag tables without primary keys.
- Flag foreign-key-like columns that do not have actual foreign keys.
- Check whether related tables use inconsistent types for linked identifiers.
- Look for nullable columns that appear structurally required.
- Highlight naming collisions or duplicate-looking tables that may indicate abandoned migrations.

## Operational Logic

- Summarize views and what they appear to expose.
- Summarize triggers and the functions they call.
- Flag triggers that point to missing, unclear, or risky logic.
- Note timestamp maintenance patterns such as missing defaults or missing updated-at behavior.

## Performance

- Flag likely filter or join columns that lack supporting indexes.
- Note duplicate or overlapping indexes when visible.
- Highlight large hub tables with many inbound or outbound relationships.

## Drift And Maintainability

- If local SQL is used, treat it as optional comparison context only.
- Call out likely drift between live objects and repo migrations.
- Note inconsistent naming conventions across schemas and tables.
- Distinguish active core tables from likely legacy or experimental objects.

## Writing Guidance

- Lead with the biggest risks first.
- Separate direct observations from inferences.
- If coverage is partial, say exactly which areas were not visible.
- Recommend fixes without applying them.
