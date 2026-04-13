# GitHub Actions Workflows

## Overview

This repository uses a centralized workflow system that calls reusable workflows from the `ImplementSprint/central-workflow` repository.

## Workflows

### `ci.yml` - Master Pipeline (Mobile)

Main CI/CD pipeline that runs on:
- Push to: `test`, `uat`, `main` branches
- Pull requests to: `test`, `uat`, `main` branches
- Manual workflow dispatch

**What it does:**
1. **Lint & TypeCheck** - Validates code style and TypeScript errors
2. **Unit Tests** - Runs Jest tests with coverage
3. **Security Scan** - Checks for vulnerabilities in dependencies
4. **Android Build** - Creates debug APK for E2E testing
5. **SonarCloud Analysis** - Code quality and security analysis
6. **Maestro E2E Tests** - Optional end-to-end tests (disabled by default)
7. **Deploy** - Automated deployment on successful builds
8. **PR Promotion** - Automated PR creation for environment promotion

## Local CI Checks

Before pushing to GitHub, run local checks:

```bash
# Windows
run-ci-checks.bat

# Or manually:
npm run lint
npm run typecheck
npm run test:ci
```

## Manual Workflow Triggers

You can customize workflow execution via GitHub UI:

1. Go to **Actions** tab
2. Select **Master Pipeline - Mobile**
3. Click **Run workflow**
4. Configure options:
   - `pipeline_mode`: auto/single/multi
   - `enable_lint`: true/false
   - `enable_security_scan`: true/false
   - `enable_sonar`: true/false
   - `enable_maestro`: Enable Android E2E tests
   - `enable_maestro_ios`: Enable iOS E2E tests
   - `dry_run`: Preview mode without version tagging

## Required Configuration

See [SYSTEMS_JSON_CONFIG.md](./SYSTEMS_JSON_CONFIG.md) for required GitHub repository variables.

## Workflow Dependencies

- **Central Workflow**: `ImplementSprint/central-workflow/.github/workflows/master-pipeline-mobile.yml@maestro`
- **Branch**: `maestro` (temporary branch for Maestro integration)

## Troubleshooting

### "MOBILE_SINGLE_SYSTEMS_JSON not found"
- You need to set the repository variable in GitHub settings
- See [SYSTEMS_JSON_CONFIG.md](./SYSTEMS_JSON_CONFIG.md)

### Tests failing in CI but passing locally
- Check environment variables are set correctly
- Ensure `.env` is not committed (it's in `.gitignore`)
- Verify GitHub secrets are configured

### SonarCloud failing
- Ensure `SONAR_TOKEN` secret is set
- Check coverage threshold (default 80%)
- Verify `sonar-project.properties` exists

### Maestro E2E tests timing out
- Maestro is disabled by default
- Enable via workflow_dispatch inputs
- Ensure build stage completes successfully first
