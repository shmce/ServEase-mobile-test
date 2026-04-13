#!/bin/bash
# GitHub Actions Pre-Flight Validation Script
# Run this before setting up GitHub Actions to verify everything is ready

echo "========================================"
echo "GitHub Actions CI/CD Readiness Check"
echo "========================================"
echo ""

ERRORS=0
WARNINGS=0

echo "[1/10] Checking Node modules..."
if [ ! -d "node_modules" ]; then
    echo "ERROR: node_modules not found. Run: npm install"
    ERRORS=$((ERRORS + 1))
else
    echo "OK: node_modules exists"
fi

echo ""
echo "[2/10] Checking package.json scripts..."
REQUIRED_SCRIPTS=("lint" "test" "test:ci" "typecheck")
for script in "${REQUIRED_SCRIPTS[@]}"; do
    if grep -q "\"$script\":" package.json; then
        echo "OK: $script script exists"
    else
        echo "ERROR: $script script missing in package.json"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "[3/10] Checking tsconfig.json..."
if [ -f "tsconfig.json" ]; then
    if grep -q '"strict": true' tsconfig.json; then
        echo "OK: tsconfig.json exists with strict mode"
    else
        echo "WARNING: tsconfig.json exists but strict mode is disabled"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "ERROR: tsconfig.json not found"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "[4/10] Checking jest.config.js..."
if [ -f "jest.config.js" ]; then
    if grep -q "coverageThreshold" jest.config.js; then
        echo "OK: jest.config.js exists with coverage threshold"
    else
        echo "WARNING: jest.config.js exists but no coverage threshold"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "ERROR: jest.config.js not found"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "[5/10] Checking ESLint config..."
if [ -f "eslint.config.js" ] || [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ]; then
    echo "OK: ESLint config exists"
else
    echo "ERROR: ESLint config not found"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "[6/10] Checking for committed .env files..."
if git ls-files | grep -E "\.env$" > /dev/null; then
    echo "ERROR: .env files are committed! Remove them before pushing."
    ERRORS=$((ERRORS + 1))
else
    echo "OK: No .env files committed"
fi

echo ""
echo "[7/10] Checking .gitignore..."
if grep -q "coverage/" .gitignore; then
    echo "OK: .gitignore includes coverage/"
else
    echo "WARNING: .gitignore doesn't include coverage/"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "[8/10] Checking GitHub workflows..."
if [ -f ".github/workflows/ci.yml" ]; then
    echo "OK: .github/workflows/ci.yml exists"
else
    echo "ERROR: .github/workflows/ci.yml not found"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "[9/10] Checking SonarCloud config..."
if [ -f "sonar-project.properties" ]; then
    echo "OK: sonar-project.properties exists"
else
    echo "WARNING: sonar-project.properties not found (optional for SonarCloud)"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "[10/10] Checking app.json..."
if [ -f "app.json" ]; then
    if grep -q '"package":' app.json; then
        echo "OK: app.json exists with Android package"
    else
        echo "WARNING: app.json exists but no Android package identifier"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "ERROR: app.json not found"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "========================================"
echo "Summary"
echo "========================================"
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "OK: All critical checks passed!"
    echo ""
    echo "Next steps:"
    echo "1. Set MOBILE_SINGLE_SYSTEMS_JSON repository variable in GitHub"
    echo "2. (Optional) Set SONAR_TOKEN secret for SonarCloud"
    echo "3. Push to 'test', 'uat', or 'main' branch to trigger CI"
    echo ""
    echo "See CI_CD_SETUP.md for detailed instructions."
    exit 0
else
    echo "ERROR: $ERRORS critical issue(s) found. Fix them before enabling CI/CD."
    exit 1
fi
