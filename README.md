# Delivery Backend

A Node.js Express API backend for delivery management with MariaDB database, designed for deployment on AWS Amplify with RDS.

## 🚀 Quick Deploy to AWS

### Prerequisites

1. **AWS Account** - Sign up at [AWS Console](https://aws.amazon.com/)
2. **AWS CLI** - Install from [AWS CLI](https://aws.amazon.com/cli/)
3. **Node.js** - Version 16 or higher

### Windows Deployment (Recommended)

```powershell
# Run the automated deployment script
.\deploy.ps1
```

### Manual Deployment

1. **Install Amplify CLI**
   ```bash
   npm install -g @aws-amplify/cli
   amplify configure
   ```

2. **Set up AWS RDS MariaDB**
   - Go to AWS RDS Console
   - Create a new MariaDB instance
   - Note down the endpoint, username, and password

3. **Configure Environment Variables**
   ```bash
   # Create .env file
   cp .env.example .env
   # Edit .env with your RDS credentials
   ```

4. **Deploy with Amplify**
   ```bash
   amplify init
   amplify add api
   amplify push
   ```

## 📋 Environment Variables

Create a `.env` file with the following variables:

```env
# Database Configuration (AWS RDS)
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=your-secure-password
DB_NAME=delivery_backend
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-jwt-secret-key

# Environment
NODE_ENV=production
```

## 🗄️ Database Setup

### Local Development
```bash
# Install MariaDB locally or use Docker
docker run --name mariadb -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=delivery_backend -p 3306:3306 -d mariadb:latest
```

### AWS RDS Setup
1. Create MariaDB instance in RDS Console
2. Configure security group to allow inbound traffic on port 3306
3. Update environment variables with RDS endpoint

### Run Migrations
```bash
# Set up database tables
npm run migrate

# Seed initial data (optional)
npm run seed
```

## 🏗️ Project Structure

```
delivery-backend/
├── src/
│   ├── endpoints/          # API endpoints
│   ├── routes/            # Route definitions
│   └── utils/             # Utility functions
├── migrations/            # Database migrations
├── seeds/                 # Database seeds
├── public/                # Static files
├── amplify.yml           # Amplify build configuration
├── knexfile.cjs          # Database configuration
├── deploy.ps1            # Windows deployment script
└── DEPLOYMENT.md         # Detailed deployment guide
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm start               # Start production server

# Database
npm run migrate         # Run database migrations
npm run seed           # Run database seeds

# Deployment
.\deploy.ps1           # Deploy to AWS (Windows)
```

## 🌐 API Endpoints

### Health Checks
- `GET /health` - Application health status
- `GET /health/db` - Database connectivity
- `GET /health/system` - System information

### API Routes
- `GET /api/` - API root
- Additional routes defined in `src/routes/`

## 🔍 Monitoring

### Health Check
```bash
curl https://your-app.amplifyapp.com/health
```

### Database Status
```bash
curl https://your-app.amplifyapp.com/health/db
```

## 🛠️ Development

### Local Setup
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Start development server
npm run dev
```

### Database Migrations
```bash
# Create new migration
npx knex migrate:make migration_name

# Run migrations
npm run migrate

# Rollback migrations
npx knex migrate:rollback
```

## 🔒 Security Considerations

1. **RDS Security Groups** - Restrict access to specific IPs
2. **SSL Connections** - Enable SSL for production database connections
3. **Environment Variables** - Use AWS Secrets Manager for sensitive data
4. **CORS Configuration** - Update CORS settings for production domains

## 📊 Performance Optimization

1. **Connection Pooling** - Configured in knexfile.cjs
2. **Database Indexing** - Add indexes for frequently queried columns
3. **Caching** - Consider Redis for session storage
4. **CDN** - Use CloudFront for static assets

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify RDS endpoint and credentials
   - Check security group settings
   - Ensure database exists

2. **Migration Errors**
   - Check database permissions
   - Verify connection string format
   - Review migration files

3. **Amplify Deployment Issues**
   - Check build logs in Amplify Console
   - Verify amplify.yml configuration
   - Ensure all dependencies are in package.json

### Support

- Check the [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions
- Review AWS Amplify documentation
- Check RDS troubleshooting guide

## 📈 Scaling

### Horizontal Scaling
- Use multiple Amplify environments
- Implement load balancing
- Consider AWS Lambda for serverless functions

### Database Scaling
- Use RDS read replicas
- Implement connection pooling
- Consider Aurora Serverless for variable workloads

## 📝 License

ISC License - see package.json for details

