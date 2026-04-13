# GitHub Repository Variable Configuration

## Required Setup

To enable the CI/CD pipeline, you need to configure a GitHub repository variable.

### Steps:

1. Go to your GitHub repository
2. Navigate to **Settings** -> **Secrets and variables** -> **Actions** -> **Variables** tab
3. Click **New repository variable**
4. Add the following variable:

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

### Configuration Explanation:

- **name**: Display name for the mobile app
- **dir**: Root directory (`.` means current directory)
- **mobile_stack**: Technology stack (`expo` for Expo/React Native)
- **enable_android_build**: Build Android debug APK for Maestro E2E tests
- **enable_ios_build**: Build iOS simulator app for Maestro (set to `false` for now)
- **enable_lint**: Run ESLint checks
- **enable_security_scan**: Run security vulnerability scans
- **enable_governance**: Run governance checks
- **coverage_threshold**: Minimum code coverage percentage (80%)

### Notes:

- iOS builds are disabled by default since they require macOS runners
- Android builds will create a debug APK for Maestro E2E testing
- SonarCloud analysis will run automatically if `SONAR_TOKEN` is configured
- Maestro E2E tests are disabled by default but can be enabled via workflow_dispatch

### Recommended GitHub Secrets

You may also need to add these secrets in **Settings** -> **Secrets and variables** -> **Actions** -> **Secrets**:

1. **SONAR_TOKEN** - SonarCloud authentication token
2. **EXPO_PUBLIC_SUPABASE_URL** - Your Supabase project URL for E2E coverage
3. **EXPO_PUBLIC_SUPABASE_ANON_KEY** - Your Supabase anonymous key for E2E coverage

### Testing the Workflow:

After setting up the variable:
1. Push to `test`, `uat`, or `main` branch to trigger the workflow
2. Or manually trigger via **Actions** -> **Master Pipeline - Mobile** -> **Run workflow**
