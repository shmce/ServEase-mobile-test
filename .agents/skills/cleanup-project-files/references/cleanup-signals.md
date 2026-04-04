# Cleanup Signals

Use this reference when the repo has multiple apps, build steps, or generated artifacts and a file may look unused at first glance.

## Strong signals

- The file is an obvious export or mockup outside the runtime tree.
- A newer replacement exists with the same purpose and active references.
- The file is generated output that should be rebuilt rather than stored.
- A search finds no references and the surrounding folder is also inactive.

## Weak signals

- The filename merely looks old.
- The file has few references but may be loaded dynamically.
- The file is disconnected from the current feature area but still part of a manual workflow.

## Check before suggesting removal

- Search for direct path references and basename references.
- Inspect package scripts, build configs, routing, and asset manifests.
- Check docs or specs that may still intentionally point to the file.
- Check git status so current user work is not mislabeled as cleanup.

## Common risky cases

- Files loaded via dynamic imports, globbing, or framework conventions
- SQL files used manually rather than through app code
- Design mockups intentionally kept for product discussion
- Environment-specific scripts run outside the main app workflow

## Recommendation language

- Use "safe cleanup candidate" only when evidence is strong.
- Use "likely obsolete" when replacement evidence exists but you did not verify every path.
- Use "needs confirmation" when the file may still serve a manual or dynamic workflow.
