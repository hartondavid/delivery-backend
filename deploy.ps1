# AWS Amplify Deployment Script for Windows
# This script automates the deployment process for the delivery backend

param(
    [switch]$SkipChecks
)

Write-Host "🚀 Starting AWS Amplify Deployment..." -ForegroundColor Green

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if AWS CLI is installed
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Error "AWS CLI is not installed. Please install it first."
    Write-Host "Download from: https://aws.amazon.com/cli/" -ForegroundColor Cyan
    exit 1
}

# Check if Amplify CLI is installed
if (-not (Get-Command amplify -ErrorAction SilentlyContinue)) {
    Write-Warning "Amplify CLI is not installed. Installing now..."
    npm install -g @aws-amplify/cli
}

# Check if user is authenticated with AWS
try {
    aws sts get-caller-identity | Out-Null
    Write-Status "AWS credentials verified"
} catch {
    Write-Error "AWS credentials not configured. Please run 'aws configure' first."
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Warning ".env file not found. Creating template..."
    @"
# Database Configuration
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=your-secure-password
DB_NAME=delivery_backend
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-jwt-secret-key

# Environment
NODE_ENV=production
"@ | Out-File -FilePath ".env" -Encoding UTF8
    
    Write-Warning "Please update .env file with your actual values before continuing."
    exit 1
}

Write-Status "Environment file found"

# Install dependencies
Write-Status "Installing dependencies..."
npm install

# Check if Amplify is already initialized
if (-not (Test-Path "amplify")) {
    Write-Status "Initializing Amplify..."
    amplify init --yes `
        --name delivery-backend `
        --envName dev `
        --defaultEditor code `
        --type javascript `
        --framework node `
        --srcDir src `
        --distributionDir dist `
        --buildCommand "npm run build" `
        --startCommand "npm start"
} else {
    Write-Status "Amplify already initialized"
}

# Add API if not already added
if (-not (Test-Path "amplify/backend/api/deliveryAPI/api-params.json")) {
    Write-Status "Adding API..."
    amplify add api --yes `
        --apiName deliveryAPI `
        --apiType REST `
        --path /api `
        --functionName deliveryFunction `
        --runtime nodejs `
        --template express
} else {
    Write-Status "API already configured"
}

# Push changes to AWS
Write-Status "Pushing changes to AWS..."
amplify push --yes

# Get the app URL
$amplifyStatus = amplify status
$appUrl = ($amplifyStatus | Select-String "Hosting endpoint").ToString().Split(" ")[-1]

if ($appUrl) {
    Write-Status "Deployment completed successfully!"
    Write-Status "Your app is available at: $appUrl"
    Write-Status "Health check: $appUrl/health"
    Write-Status "API endpoints: $appUrl/api/"
} else {
    Write-Warning "Could not retrieve app URL. Check Amplify Console for details."
}

Write-Status "Deployment script completed!"
Write-Warning "Remember to:"
Write-Warning "1. Set up your RDS MariaDB instance"
Write-Warning "2. Configure environment variables in Amplify Console"
Write-Warning "3. Run database migrations"
Write-Warning "4. Test your endpoints"

Write-Host ""
Write-Status "Next steps:"
Write-Host "1. Go to AWS RDS Console and create a MariaDB instance" -ForegroundColor Cyan
Write-Host "2. Update environment variables in Amplify Console" -ForegroundColor Cyan
Write-Host "3. Run: npm run migrate (to set up database tables)" -ForegroundColor Cyan
Write-Host "4. Test your API endpoints" -ForegroundColor Cyan 