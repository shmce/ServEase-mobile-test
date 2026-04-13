@echo off
echo ========================================
echo Running Pre-Flight CI Checks
echo ========================================

echo.
echo [1/4] Checking for committed .env files...
git ls-files | findstr /R "\.env$"
if %ERRORLEVEL% EQU 0 (
    echo ERROR: .env files are committed! Remove them before pushing.
    exit /b 1
) else (
    echo OK: No .env files committed
)

echo.
echo [2/4] Running lint...
call npm run lint
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Lint failed!
    exit /b 1
)

echo.
echo [3/4] Running typecheck...
call npm run typecheck
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: TypeScript errors found!
    exit /b 1
)

echo.
echo [4/4] Running tests...
call npm run test:ci
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Tests failed!
    exit /b 1
)

echo.
echo ========================================
echo All checks passed! Ready to push.
echo ========================================
