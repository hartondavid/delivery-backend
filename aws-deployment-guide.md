# AWS Deployment Guide for Delivery Backend

## Overview
This guide will help you deploy your Node.js delivery backend to AWS using Amplify and migrate your MariaDB database to AWS RDS.

## Prerequisites
- AWS Account
- AWS CLI installed and configured
- Git repository with your code

## Step 1: Set up AWS RDS Database

### 1.1 Create RDS Instance
1. Go to AWS RDS Console
2. Click "Create database"
3. Choose "Standard create"
4. Select "MariaDB" or "MySQL" (recommended: MariaDB 10.6)
5. Choose "Free tier" for development or "Production" for production
6. Configure:
   - DB instance identifier: `delivery-db`
   - Master username: `admin`
   - Master password: (create a strong password)
   - DB instance class: `db.t3.micro` (free tier) or `db.t3.small` (production)
   - Storage: 20 GB (free tier) or as needed
   - Multi-AZ deployment: No (free tier) or Yes (production)

### 1.2 Configure Security Group
1. Create a new security group or use default
2. Add inbound rule:
   - Type: MySQL/Aurora (3306)
   - Source: Custom
   - IP: Your application's IP or 0.0.0.0/0 (not recommended for production)

### 1.3 Get Connection Details
After creation, note down:
- Endpoint: `your-db-name.region.rds.amazonaws.com`
- Port: 3306
- Database name: `delivery_db`

## Step 2: Deploy to AWS Amplify

### 2.1 Connect Repository
1. Go to AWS Amplify Console
2. Click "New app" → "Host web app"
3. Choose your Git provider (GitLab)
4. Connect your repository: `davidharton/delivery-backend`
5. Select the main branch

### 2.2 Configure Build Settings
Amplify will auto-detect the build settings from `amplify.yml`. If needed, configure:
- Build image: Amazon Linux:2023
- Build commands: Use the ones in `amplify.yml`

### 2.3 Set Environment Variables
In Amplify Console → App settings → Environment variables, add:
```
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=your_db_password
DB_NAME=delivery_db
DB_PORT=3306
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
```

## Step 3: Database Migration

### 3.1 Local Migration (if you have existing data)
```bash
# Export your local database
mysqldump -u root -p delivery_db > backup.sql

# Import to RDS (after connecting to RDS)
mysql -h your-rds-endpoint -u admin -p delivery_db < backup.sql
```

### 3.2 Run Migrations on RDS
```bash
# Set environment variables
export DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
export DB_USER=admin
export DB_PASSWORD=your_db_password
export DB_NAME=delivery_db
export NODE_ENV=production

# Run migrations
npm run migrate

# Run seeds (if any)
npm run seed
```

## Step 4: Update Application Configuration

### 4.1 Update knexfile.cjs
The knexfile has been updated to support AWS RDS with SSL connections.

### 4.2 Test Database Connection
```bash
# Test connection locally
node -e "
const knex = require('knex')(require('./knexfile.cjs'));
knex.raw('SELECT 1').then(() => {
  console.log('Database connected successfully');
  process.exit(0);
}).catch(err => {
  console.error('Database connection failed:', err);
  process.exit(1);
});
"
```

## Step 5: Deploy and Test

### 5.1 Deploy to Amplify
1. Push your changes to GitLab
2. Amplify will automatically build and deploy
3. Monitor the build process in Amplify Console

### 5.2 Test the Application
1. Use the Amplify-provided URL to test your API
2. Test database operations
3. Verify all endpoints work correctly

## Step 6: Production Considerations

### 6.1 Security
- Use AWS Secrets Manager for sensitive data
- Configure proper IAM roles
- Use VPC for database isolation
- Enable SSL for database connections

### 6.2 Monitoring
- Set up CloudWatch alarms
- Monitor RDS performance
- Set up application logging

### 6.3 Scaling
- Configure auto-scaling for RDS
- Set up read replicas if needed
- Consider using Aurora for better performance

## Troubleshooting

### Common Issues
1. **Database Connection Failed**
   - Check security group rules
   - Verify endpoint and credentials
   - Ensure SSL is properly configured

2. **Build Failures**
   - Check Amplify build logs
   - Verify all dependencies are in package.json
   - Ensure build commands are correct

3. **Environment Variables**
   - Verify all required variables are set in Amplify
   - Check variable names match your code

### Useful Commands
```bash
# Check database connection
npm run migrate

# View Amplify build logs
aws amplify get-job --app-id your-app-id --branch-name main --job-id your-job-id

# Test API endpoints
curl https://your-amplify-url/api/health
```

## Cost Optimization
- Use RDS free tier for development
- Monitor usage with AWS Cost Explorer
- Set up billing alerts
- Consider reserved instances for production

## Next Steps
1. Set up custom domain
2. Configure CDN with CloudFront
3. Set up CI/CD pipeline
4. Implement monitoring and alerting
5. Set up backup and disaster recovery 