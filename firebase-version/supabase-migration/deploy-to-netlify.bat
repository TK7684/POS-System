@echo off
REM Quick Netlify Deployment Script for Windows
REM This script helps you deploy your POS system to Netlify

echo.
echo 🚀 POS System - Netlify Deployment Helper
echo ==========================================
echo.

REM Check if Netlify CLI is installed
where netlify >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 📦 Netlify CLI not found. Installing...
    npm install -g netlify-cli
    echo ✅ Netlify CLI installed!
) else (
    echo ✅ Netlify CLI is already installed
)

echo.
echo Choose deployment method:
echo 1. Quick Deploy (using Netlify Drop - no CLI needed)
echo 2. Deploy via CLI (requires login)
echo 3. Check current deployment status
echo.

set /p choice="Enter choice (1-3): "

if "%choice%"=="1" goto quick_deploy
if "%choice%"=="2" goto cli_deploy
if "%choice%"=="3" goto check_status
goto invalid_choice

:quick_deploy
echo.
echo 📋 Quick Deploy Instructions:
echo ==============================
echo.
echo 1. Open: https://app.netlify.com/drop
echo 2. Drag and drop this folder: %CD%
echo 3. Wait 30-60 seconds
echo 4. You'll get a URL like: https://random-name.netlify.app
echo.
echo ✅ That's it! Your app is live!
echo.
echo 📝 Don't forget to:
echo    - Add your Netlify URL to Supabase redirect URLs
echo    - Test authentication on the deployed site
goto end

:cli_deploy
echo.
echo 🔐 Logging in to Netlify...
netlify login

echo.
echo 🏗️  Initializing Netlify site...
netlify init

echo.
echo 🚀 Deploying to production...
netlify deploy --prod

echo.
echo ✅ Deployment complete!
echo.
echo 📝 Next steps:
echo    1. Add your Netlify URL to Supabase redirect URLs
echo    2. Test the deployed site
echo    3. Share the URL with your team
goto end

:check_status
echo.
echo 📊 Checking deployment status...
netlify status
goto end

:invalid_choice
echo ❌ Invalid choice
exit /b 1

:end
echo.
echo 📚 For more details, see: NETLIFY_DEPLOYMENT_GUIDE.md
pause

