# AWS Deployment Guide

## Prerequisites

1. **AWS Account** - You need an AWS account with appropriate permissions
2. **AWS CLI** - Install and configure AWS CLI
3. **Amplify CLI** - Install Amplify CLI globally

```bash
npm install -g @aws-amplify/cli
amplify configure
```

## Step 1: Set up AWS RDS MariaDB

### 1.1 Create RDS Instance

1. Go to AWS RDS Console
2. Click "Create database"
3. Choose "Standard create"
4. Select "MariaDB" as engine
5. Choose "Free tier" for development (or appropriate tier for production)
6. Configure settings:
   - DB instance identifier: `delivery-backend-db`
   - Master username: `admin`
   - Master password: (create a strong password)
   - DB instance class: `db.t3.micro` (free tier)
   - Storage: 20 GB
   - Multi-AZ deployment: No (for free tier)
   - Public access: Yes (for development)
   - VPC security group: Create new or use default
   - Database name: `delivery_backend`

### 1.2 Configure Security Group

1. Go to EC2 → Security Groups
2. Find the security group attached to your RDS instance
3. Add inbound rule:
   - Type: MySQL/Aurora (3306)
   - Source: 0.0.0.0/0 (for development) or your specific IP

### 1.3 Get Connection Details

Note down:
- Endpoint: `your-db-instance.region.rds.amazonaws.com`
- Port: 3306
- Database name: `delivery_backend`
- Username: `admin`
- Password: (the one you created)

## Step 2: Initialize Amplify

```bash
# Initialize Amplify in your project
amplify init

# Follow the prompts:
# - Enter a name for the project: delivery-backend
# - Enter a name for the environment: dev
# - Choose your default editor
# - Choose JavaScript
# - Choose Node.js
# - Choose Express
# - Choose No for source control
```

## Step 3: Add API

```bash
# Add API to your project
amplify add api

# Follow the prompts:
# - Choose REST
# - Provide a friendly name: deliveryAPI
# - Provide a path: /api
# - Choose Create a new Lambda function
# - Provide a friendly name: deliveryFunction
# - Choose Node.js
# - Choose Express
# - Choose No for advanced settings
```

## Step 4: Configure Environment Variables

In the AWS Amplify Console:

1. Go to your app → Environment variables
2. Add the following variables:
   ```
   DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
   DB_USER=admin
   DB_PASSWORD=your-db-password
   DB_NAME=delivery_backend
   DB_PORT=3306
   JWT_SECRET=your-jwt-secret-key
   NODE_ENV=production
   ```

## Step 5: Deploy

```bash
# Push your changes to AWS
amplify push

# Or deploy directly from Git
# Connect your repository to Amplify Console and deploy
```

## Step 6: Run Migrations

After deployment, run migrations:

```bash
# Connect to your deployed environment
amplify console

# Or run migrations manually via SSH/terminal
npm run migrate
```

## Step 7: Verify Deployment

1. Check your API endpoints at: `https://your-app-id.amplifyapp.com/api/`
2. Test database connectivity
3. Verify all routes are working

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| DB_HOST | RDS endpoint | `delivery-backend-db.region.rds.amazonaws.com` |
| DB_USER | Database username | `admin` |
| DB_PASSWORD | Database password | `your-secure-password` |
| DB_NAME | Database name | `delivery_backend` |
| DB_PORT | Database port | `3306` |
| JWT_SECRET | JWT signing secret | `your-jwt-secret` |
| NODE_ENV | Environment | `production` |

## Troubleshooting

### Database Connection Issues
- Verify security group allows inbound traffic on port 3306
- Check if RDS instance is publicly accessible
- Verify credentials and endpoint

### Migration Issues
- Ensure database exists before running migrations
- Check if user has proper permissions
- Verify connection string format

### Amplify Deployment Issues
- Check build logs in Amplify Console
- Verify all dependencies are in package.json
- Ensure amplify.yml is properly configured

## Security Considerations

1. **Production**: Use private subnets for RDS
2. **Security Groups**: Restrict access to specific IPs
3. **SSL**: Enable SSL connections to RDS
4. **Secrets**: Use AWS Secrets Manager for sensitive data
5. **IAM**: Use IAM roles instead of access keys

## Cost Optimization

1. **RDS**: Use appropriate instance sizes
2. **Amplify**: Monitor usage and costs
3. **Data Transfer**: Minimize cross-region data transfer
4. **Storage**: Monitor RDS storage usage 