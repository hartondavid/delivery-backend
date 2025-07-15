#!/bin/bash

# AWS Deployment Script for Delivery Backend
# This script helps automate the deployment process to AWS

set -e

echo "🚀 Starting AWS deployment for Delivery Backend..."

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
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        echo "Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
    print_status "AWS CLI is installed"
}

# Check if user is authenticated with AWS
check_aws_auth() {
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi
    print_status "AWS CLI is configured"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm install
    print_status "Dependencies installed successfully"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    if npm run migrate; then
        print_status "Migrations completed successfully"
    else
        print_error "Migration failed. Please check your database configuration."
        exit 1
    fi
}

# Test database connection
test_database() {
    print_status "Testing database connection..."
    if node -e "
const knex = require('knex')(require('./knexfile.cjs'));
knex.raw('SELECT 1').then(() => {
  console.log('Database connected successfully');
  process.exit(0);
}).catch(err => {
  console.error('Database connection failed:', err);
  process.exit(1);
});
"; then
        print_status "Database connection test passed"
    else
        print_error "Database connection test failed"
        exit 1
    fi
}

# Build the application
build_app() {
    print_status "Building application..."
    if npm run build; then
        print_status "Application built successfully"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Check if .env file exists
check_env_file() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        if [ -f env.example ]; then
            cp env.example .env
            print_warning "Please update .env file with your actual configuration"
        else
            print_error "env.example file not found. Please create .env file manually."
            exit 1
        fi
    else
        print_status ".env file exists"
    fi
}

# Main deployment function
main() {
    print_status "Starting deployment process..."
    
    # Run checks
    check_aws_cli
    check_aws_auth
    check_env_file
    
    # Install and build
    install_dependencies
    build_app
    
    # Database operations
    test_database
    run_migrations
    
    print_status "✅ Local deployment preparation completed!"
    echo ""
    print_status "Next steps:"
    echo "1. Push your code to GitLab: git push origin main"
    echo "2. Set up AWS RDS database (see aws-deployment-guide.md)"
    echo "3. Configure AWS Amplify to connect to your repository"
    echo "4. Set environment variables in Amplify Console"
    echo "5. Deploy to Amplify"
    echo ""
    print_status "For detailed instructions, see: aws-deployment-guide.md"
}

# Run main function
main "$@" 