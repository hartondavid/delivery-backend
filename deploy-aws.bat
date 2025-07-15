@echo off
REM AWS Deployment Script for Delivery Backend (Windows)
REM This script helps automate the deployment process to AWS

echo 🚀 Starting AWS deployment for Delivery Backend...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install it first.
    echo Visit: https://nodejs.org/
    pause
    exit /b 1
)
echo [INFO] Node.js is installed

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not available. Please check your Node.js installation.
    pause
    exit /b 1
)
echo [INFO] npm is available

REM Check if .env file exists
if not exist .env (
    echo [WARNING] .env file not found. Creating from template...
    if exist env.example (
        copy env.example .env
        echo [WARNING] Please update .env file with your actual configuration
    ) else (
        echo [ERROR] env.example file not found. Please create .env file manually.
        pause
        exit /b 1
    )
) else (
    echo [INFO] .env file exists
)

REM Install dependencies
echo [INFO] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [INFO] Dependencies installed successfully

REM Build the application
echo [INFO] Building application...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)
echo [INFO] Application built successfully

REM Test database connection
echo [INFO] Testing database connection...
node -e "const knex = require('knex')(require('./knexfile.cjs')); knex.raw('SELECT 1').then(() => { console.log('Database connected successfully'); process.exit(0); }).catch(err => { console.error('Database connection failed:', err); process.exit(1); });"
if %errorlevel% neq 0 (
    echo [ERROR] Database connection test failed
    pause
    exit /b 1
)
echo [INFO] Database connection test passed

REM Run database migrations
echo [INFO] Running database migrations...
call npm run migrate
if %errorlevel% neq 0 (
    echo [ERROR] Migration failed. Please check your database configuration.
    pause
    exit /b 1
)
echo [INFO] Migrations completed successfully

echo.
echo ✅ Local deployment preparation completed!
echo.
echo [INFO] Next steps:
echo 1. Push your code to GitLab: git push origin main
echo 2. Set up AWS RDS database (see aws-deployment-guide.md)
echo 3. Configure AWS Amplify to connect to your repository
echo 4. Set environment variables in Amplify Console
echo 5. Deploy to Amplify
echo.
echo [INFO] For detailed instructions, see: aws-deployment-guide.md
echo.
pause 