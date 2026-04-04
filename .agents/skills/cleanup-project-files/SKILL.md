---
name: cleanup-project-files
description: Identify obsolete, duplicate, generated, abandoned, or no-longer-referenced project files and folders, then present evidence-backed cleanup candidates without deleting them automatically. Use when an agent needs to reduce repo clutter, review mockups or prototypes, find dead assets, locate stale docs, or prepare a project for manual cleanup.
---

# Cleanup Project Files

## Overview

Find likely-unneeded files and folders in a project, explain why each item looks safe or risky to remove, and leave the final deletion decision to the user.

## Workflow

1. Inspect project context before naming candidates.
2. Group possible cleanup targets by type instead of producing one flat list.
3. Gather evidence for each target:
   - search for references in the codebase
   - check nearby docs, configs, and build inputs
   - inspect git status so uncommitted user work is not suggested casually
   - note whether the file is generated, duplicated, experimental, or orphaned
4. Assign a confidence level:
   - High: generated files, obvious duplicates, or files with zero references and clear replacements
   - Medium: likely obsolete but still needs a human sanity check
   - Low: suspicious clutter, but deletion risk is meaningful
5. Recommend only candidates by default. Do not delete anything unless the user explicitly asks for removal in the current turn.

## What To Look For

- Unreferenced mockups, prototypes, exports, and scratch files
- Duplicate assets or renamed replacements living side by side
- Generated artifacts that should not be committed
- Old migration drafts, seed files, or scripts replaced by newer canonical files
- Docs that describe removed features or outdated flows
- Empty directories or placeholder files with no active purpose

## Safety Rules

- Treat uncommitted files as user work first, clutter second.
- Prefer "candidate for review" over "safe to delete" when evidence is incomplete.
- Mention what was checked so the user can trust the recommendation.
- Call out uncertainty explicitly when a file might be loaded dynamically.
- Separate cleanup suggestions from deletion execution. If the user later asks to remove files, re-check references before editing or deleting.

## Output Shape

Report results in compact sections:

- High-confidence candidates
- Medium-confidence candidates
- Needs confirmation / unclear

For each item include:

- path
- why it looks unused
- what evidence was checked
- any risk or caveat

## Reference Guide

If the repo is complex, read `references/cleanup-signals.md` for heuristics and red flags before deciding which files to surface.
