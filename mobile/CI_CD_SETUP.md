# ServEase Mobile - CI/CD Setup Checklist

## ✅ Repository Configuration

### Step 1: Set GitHub Repository Variables

Go to **Settings** → **Secrets and variables** → **Actions** → **Variables** tab

Create this variable:

**Name:** `MOBILE_SINGLE_SYSTEMS_JSON`

**Value:**
```json
{
  "name": "ServEase-Mobile",
  "dir": ".",
  "mobile_stack": "expo",
  "enable_android_build": true,
  "enable_ios_build": false,
  "enable_lint": true,
  "enable_security_scan": true,
  "enable_governance": true,
  "coverage_threshold": 80
}
```

### Step 2: Set GitHub Secrets (if needed)

Go to **Settings** → **Secrets and variables** → **Actions** → **Secrets** tab

Optional secrets for enhanced CI/CD:

1. **SONAR_TOKEN** - For SonarCloud code quality analysis
   - Get from: https://sonarcloud.io/account/security
   
2. **EXPO_PUBLIC_SUPABASE_URL** - Your Supabase project URL
   - Example: `https://strtoeeidqnsmbszhjhe.supabase.co`
   
3. **EXPO_PUBLIC_SUPABASE_ANON_KEY** - Your Supabase anonymous key
   - Get from: Supabase Dashboard → Settings → API

### Step 3: SonarCloud Setup (Optional but Recommended)

1. Go to https://sonarcloud.io
2. Sign in with GitHub
3. Click **+** → **Analyze new project**
4. Select your repository: `ServEase/ServEase-mobile`
5. Choose **GitHub Actions** as the analysis method
6. Copy the `SONAR_TOKEN` and add it as a GitHub secret
7. Update `sonar-project.properties` with your project key and organization

## 🚀 Workflow Triggers

The CI/CD pipeline runs on:
- ✅ Push to `test`, `uat`, or `main` branches
- ✅ Pull requests to `test`, `uat`, or `main` branches
- ✅ Manual workflow dispatch (Actions tab → Run workflow)

## 🧪 Pipeline Stages

### 1. **Lint & Type Check**
- Runs `npm run lint` (ESLint)
- Runs `npx tsc --noEmit` (TypeScript validation)
- ❌ Fails if: Linting errors or TypeScript errors exist

### 2. **Unit Tests**
- Runs `npm run test:ci`
- Generates coverage reports (LCOV format)
- ❌ Fails if: Tests fail or coverage < 80%

### 3. **Security Scan**
- Checks `npm audit` for vulnerabilities
- Scans dependencies for known security issues
- ❌ Fails if: High/critical vulnerabilities found

### 4. **Android Build** (Optional)
- Creates debug APK for Maestro E2E tests
- Only runs if `enable_android_build: true`
- ⏭️ Skipped by default in this config

### 5. **SonarCloud Analysis** (Optional)
- Code quality and security analysis
- Requires `SONAR_TOKEN` secret
- ⏭️ Skipped on `test` branch pushes

### 6. **Maestro E2E Tests** (Optional)
- End-to-end testing on Android/iOS
- Disabled by default
- Enable via workflow_dispatch inputs

## 🔧 Local Testing

Before pushing, run local CI checks:

```bash
# Windows
run-ci-checks.bat

# Manual steps
npm run lint
npm run typecheck
npm test
```

## 📊 Coverage Requirements

- **Global threshold**: 80% for branches, functions, lines, and statements
- Coverage reports are in `coverage/` directory
- LCOV report: `coverage/lcov.info` (for SonarCloud)
- HTML report: `coverage/lcov-report/index.html` (open in browser)

## 🐛 Troubleshooting

### Pipeline fails with "Variable not found"
→ Set `MOBILE_SINGLE_SYSTEMS_JSON` in GitHub repository variables (Step 1)

### Tests pass locally but fail in CI
→ Check that `.env` is not committed (it should be in `.gitignore`)
→ Verify GitHub secrets are set correctly

### SonarCloud analysis fails
→ Ensure `SONAR_TOKEN` is set as a GitHub secret
→ Update `sonar-project.properties` with correct project key

### Coverage threshold fails
→ Add more unit tests to increase coverage above 80%
→ Or temporarily lower threshold in `jest.config.js`

### Maestro E2E tests fail
→ Maestro is disabled by default
→ Enable only when Android build is working
→ Requires build artifacts from previous stage

## 🎯 Next Steps

- [ ] Set `MOBILE_SINGLE_SYSTEMS_JSON` repository variable
- [ ] (Optional) Set `SONAR_TOKEN` secret for code quality
- [ ] (Optional) Set Supabase secrets for E2E tests
- [ ] Push to `test` branch to trigger first CI run
- [ ] Review GitHub Actions results
- [ ] Add more unit tests if coverage is below 80%

## 📚 Documentation

- **Workflow details**: [.github/workflows/README.md](./.github/workflows/README.md)
- **Systems JSON config**: [.github/workflows/SYSTEMS_JSON_CONFIG.md](./.github/workflows/SYSTEMS_JSON_CONFIG.md)
- **Project handover**: [docs/PROJECT_HANDOVER.md](./docs/PROJECT_HANDOVER.md)
