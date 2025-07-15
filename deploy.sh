#!/bin/bash

# AWS Amplify Deployment Script
# This script automates the deployment process for the delivery backend

set -e  # Exit on any error

echo "🚀 Starting AWS Amplify Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Amplify CLI is installed
if ! command -v amplify &> /dev/null; then
    print_warning "Amplify CLI is not installed. Installing now..."
    npm install -g @aws-amplify/cli
fi

# Check if user is authenticated with AWS
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

print_status "AWS credentials verified"

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating template..."
    cat > .env << EOF
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
EOF
    print_warning "Please update .env file with your actual values before continuing."
    exit 1
fi

print_status "Environment file found"

# Install dependencies
print_status "Installing dependencies..."
npm install

# Check if Amplify is already initialized
if [ ! -d "amplify" ]; then
    print_status "Initializing Amplify..."
    amplify init --yes \
        --name delivery-backend \
        --envName dev \
        --defaultEditor code \
        --type javascript \
        --framework node \
        --srcDir src \
        --distributionDir dist \
        --buildCommand "npm run build" \
        --startCommand "npm start"
else
    print_status "Amplify already initialized"
fi

# Add API if not already added
if [ ! -f "amplify/backend/api/deliveryAPI/api-params.json" ]; then
    print_status "Adding API..."
    amplify add api --yes \
        --apiName deliveryAPI \
        --apiType REST \
        --path /api \
        --functionName deliveryFunction \
        --runtime nodejs \
        --template express
else
    print_status "API already configured"
fi

# Push changes to AWS
print_status "Pushing changes to AWS..."
amplify push --yes

# Get the app URL
APP_URL=$(amplify status | grep "Hosting endpoint" | awk '{print $3}')

if [ -n "$APP_URL" ]; then
    print_status "Deployment completed successfully!"
    print_status "Your app is available at: $APP_URL"
    print_status "Health check: $APP_URL/health"
    print_status "API endpoints: $APP_URL/api/"
else
    print_warning "Could not retrieve app URL. Check Amplify Console for details."
fi

print_status "Deployment script completed!"
print_warning "Remember to:"
print_warning "1. Set up your RDS MariaDB instance"
print_warning "2. Configure environment variables in Amplify Console"
print_warning "3. Run database migrations"
print_warning "4. Test your endpoints"

echo ""
print_status "Next steps:"
echo "1. Go to AWS RDS Console and create a MariaDB instance"
echo "2. Update environment variables in Amplify Console"
echo "3. Run: npm run migrate (to set up database tables)"
echo "4. Test your API endpoints" 