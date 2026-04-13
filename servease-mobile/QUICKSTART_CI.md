# GitHub Actions Quick Reference Card

## 🎯 One-Time Setup (Required)

### Set Repository Variable in GitHub

**Location:** Settings → Secrets and variables → Actions → Variables tab

**Click:** "New repository variable"

**Name:**
```
MOBILE_SINGLE_SYSTEMS_JSON
```

**Value (copy exactly):**
```json
{"name":"ServEase-Mobile","dir":".","mobile_stack":"expo","enable_android_build":true,"enable_ios_build":false,"enable_lint":true,"enable_security_scan":true,"enable_governance":true,"coverage_threshold":80}
```

**That's it!** Once set, GitHub Actions will run automatically on every push to `test`, `uat`, or `main`.

---

## 🔑 Optional Secrets (Recommended)

**Location:** Settings → Secrets and variables → Actions → Secrets tab

### 1. SonarCloud (Code Quality)
```
Name:  SONAR_TOKEN
Value: <get from https://sonarcloud.io/account/security>
```

### 2. Supabase (E2E Tests)
```
Name:  EXPO_PUBLIC_SUPABASE_URL
Value: https://strtoeeidqnsmbszhjhe.supabase.co

Name:  EXPO_PUBLIC_SUPABASE_ANON_KEY
Value: <your-anon-key>
```

---

## ✅ Before Every Push

**Run locally:**
```bash
run-ci-checks.bat
```

**What it checks:**
- ✅ No `.env` files committed
- ✅ ESLint passes
- ✅ TypeScript compiles
- ✅ Tests pass with 80% coverage

---

## 🚀 Pipeline Triggers

**Automatic:**
- Push to `test`, `uat`, or `main`
- Pull request to `test`, `uat`, or `main`

**Manual:**
- Go to **Actions** → **Master Pipeline — Mobile** → **Run workflow**
- Customize options (enable/disable Maestro, SonarCloud, etc.)

---

## 📊 What Runs in CI

### Always Runs:
1. ✅ Lint (ESLint)
2. ✅ TypeCheck (tsc --noEmit)
3. ✅ Unit Tests (Jest with 80% coverage)
4. ✅ Security Scan (npm audit)

### Optional (requires secrets):
5. 🔍 SonarCloud Analysis (needs SONAR_TOKEN)
6. 📱 Android Build (debug APK)
7. 🧪 Maestro E2E Tests (Android/iOS)

---

## 🐛 Common Issues

### "Variable not found" error
→ Set `MOBILE_SINGLE_SYSTEMS_JSON` in GitHub repository variables

### Tests pass locally but fail in CI
→ Ensure `.env` is not committed (it's in `.gitignore`)

### Coverage below 80%
→ Add more unit tests or adjust threshold in `jest.config.js`

### SonarCloud fails
→ Set `SONAR_TOKEN` secret in GitHub

---

## 📚 Full Documentation

- **Setup Guide:** [CI_CD_SETUP.md](./CI_CD_SETUP.md)
- **Complete Summary:** [GITHUB_ACTIONS_COMPLETE.md](./GITHUB_ACTIONS_COMPLETE.md)
- **Workflow Details:** [.github/workflows/README.md](./.github/workflows/README.md)

---

## 🎯 TL;DR

1. Set `MOBILE_SINGLE_SYSTEMS_JSON` variable in GitHub Settings
2. Run `run-ci-checks.bat` before every push
3. Push to `test`, `uat`, or `main`
4. Check **Actions** tab for results

Done! 🚀
