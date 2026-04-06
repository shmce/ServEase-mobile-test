@echo off
REM GitHub Actions Pre-Flight Validation Script (Windows)
REM Run this before setting up GitHub Actions to verify everything is ready

echo ========================================
echo GitHub Actions CI/CD Readiness Check
echo ========================================
echo.

set ERRORS=0
set WARNINGS=0

REM Check 1: Node modules installed
echo [1/10] Checking Node modules...
if not exist "node_modules\" (
    echo X ERROR: node_modules not found. Run: npm install
    set /a ERRORS+=1
) else (
    echo OK: node_modules exists
)

REM Check 2: package.json has required scripts
echo.
echo [2/10] Checking package.json scripts...
findstr /C:"\"lint\":" package.json >nul
if %ERRORLEVEL% EQU 0 (
    echo OK: lint script exists
) else (
    echo X ERROR: lint script missing in package.json
    set /a ERRORS+=1
)

findstr /C:"\"test\":" package.json >nul
if %ERRORLEVEL% EQU 0 (
    echo OK: test script exists
) else (
    echo X ERROR: test script missing in package.json
    set /a ERRORS+=1
)

findstr /C:"\"test:ci\":" package.json >nul
if %ERRORLEVEL% EQU 0 (
    echo OK: test:ci script exists
) else (
    echo X ERROR: test:ci script missing in package.json
    set /a ERRORS+=1
)

findstr /C:"\"typecheck\":" package.json >nul
if %ERRORLEVEL% EQU 0 (
    echo OK: typecheck script exists
) else (
    echo X ERROR: typecheck script missing in package.json
    set /a ERRORS+=1
)

REM Check 3: TypeScript config
echo.
echo [3/10] Checking tsconfig.json...
if exist "tsconfig.json" (
    findstr /C:"\"strict\": true" tsconfig.json >nul
    if %ERRORLEVEL% EQU 0 (
        echo OK: tsconfig.json exists with strict mode
    ) else (
        echo WARNING: tsconfig.json exists but strict mode is disabled
        set /a WARNINGS+=1
    )
) else (
    echo X ERROR: tsconfig.json not found
    set /a ERRORS+=1
)

REM Check 4: Jest config
echo.
echo [4/10] Checking jest.config.js...
if exist "jest.config.js" (
    findstr /C:"coverageThreshold" jest.config.js >nul
    if %ERRORLEVEL% EQU 0 (
        echo OK: jest.config.js exists with coverage threshold
    ) else (
        echo WARNING: jest.config.js exists but no coverage threshold
        set /a WARNINGS+=1
    )
) else (
    echo X ERROR: jest.config.js not found
    set /a ERRORS+=1
)

REM Check 5: ESLint config
echo.
echo [5/10] Checking ESLint config...
if exist "eslint.config.js" (
    echo OK: ESLint config exists
) else if exist ".eslintrc.js" (
    echo OK: ESLint config exists
) else if exist ".eslintrc.json" (
    echo OK: ESLint config exists
) else (
    echo X ERROR: ESLint config not found
    set /a ERRORS+=1
)

REM Check 6: .env files not committed
echo.
echo [6/10] Checking for committed .env files...
git ls-files | findstr /R "\.env$" >nul
if %ERRORLEVEL% EQU 0 (
    echo X ERROR: .env files are committed! Remove them before pushing.
    set /a ERRORS+=1
) else (
    echo OK: No .env files committed
)

REM Check 7: .gitignore includes coverage
echo.
echo [7/10] Checking .gitignore...
findstr /C:"coverage/" .gitignore >nul
if %ERRORLEVEL% EQU 0 (
    echo OK: .gitignore includes coverage/
) else (
    echo WARNING: .gitignore doesn't include coverage/
    set /a WARNINGS+=1
)

REM Check 8: GitHub workflows exist
echo.
echo [8/10] Checking GitHub workflows...
if exist ".github\workflows\ci.yml" (
    echo OK: .github/workflows/ci.yml exists
) else (
    echo X ERROR: .github/workflows/ci.yml not found
    set /a ERRORS+=1
)

REM Check 9: SonarCloud config (optional)
echo.
echo [9/10] Checking SonarCloud config...
if exist "sonar-project.properties" (
    echo OK: sonar-project.properties exists
) else (
    echo WARNING: sonar-project.properties not found (optional for SonarCloud^)
    set /a WARNINGS+=1
)

REM Check 10: Expo app.json
echo.
echo [10/10] Checking app.json...
if exist "app.json" (
    findstr /C:"\"package\":" app.json >nul
    if %ERRORLEVEL% EQU 0 (
        echo OK: app.json exists with Android package
    ) else (
        echo WARNING: app.json exists but no Android package identifier
        set /a WARNINGS+=1
    )
) else (
    echo X ERROR: app.json not found
    set /a ERRORS+=1
)

REM Summary
echo.
echo ========================================
echo Summary
echo ========================================
echo Errors: %ERRORS%
echo Warnings: %WARNINGS%
echo.

if %ERRORS% EQU 0 (
    echo OK: All critical checks passed!
    echo.
    echo Next steps:
    echo 1. Set MOBILE_SINGLE_SYSTEMS_JSON repository variable in GitHub
    echo 2. (Optional^) Set SONAR_TOKEN secret for SonarCloud
    echo 3. Push to 'test', 'uat', or 'main' branch to trigger CI
    echo.
    echo See CI_CD_SETUP.md for detailed instructions.
    exit /b 0
) else (
    echo X %ERRORS% critical issue(s^) found. Fix them before enabling CI/CD.
    exit /b 1
)
