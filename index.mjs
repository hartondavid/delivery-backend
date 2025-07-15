// app.js - Complete version with database functionality

import express from "express"
import dotenv from 'dotenv'
import cors from 'cors'
import databaseManager from './src/utils/database.mjs'

const app = express();

// Load environment variables (but don't crash if .env doesn't exist)
try {
    dotenv.config()
} catch (error) {
    console.log('No .env file found, using environment variables');
}

// Basic middleware
app.use(express.json());

// Add CORS for frontend access
app.use(cors({
    origin: '*', // In production, specify your frontend domain
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Run migrations before starting the server
const runMigrations = async () => {
    try {
        console.log('🔄 Starting database setup...');

        // First, test database connection
        console.log('🔌 Testing database connection...');
        const knex = await databaseManager.getKnex();
        console.log('✅ Database connection successful');

        // Check if database exists and show tables
        try {
            const tables = await knex.raw('SHOW TABLES');
            console.log('📋 Existing tables:', tables[0].map(table => Object.values(table)[0]));
        } catch (error) {
            console.log('⚠️ Could not check tables:', error.message);
        }

        console.log('🔄 Running migrations...');
        await databaseManager.runMigrations();
        console.log('✅ Migrations completed successfully');

        // Check tables after migrations
        try {
            const tablesAfter = await knex.raw('SHOW TABLES');
            console.log('📋 Tables after migrations:', tablesAfter[0].map(table => Object.values(table)[0]));
        } catch (error) {
            console.log('⚠️ Could not check tables after migrations:', error.message);
        }

        // Run seeds after migrations
        console.log('🌱 Running database seeds...');
        await databaseManager.runSeeds();
        console.log('✅ Seeds completed successfully');

        // Check data after seeds
        try {
            const users = await knex('users').select('id', 'name', 'email');
            console.log('👥 Users after seeds:', users);
        } catch (error) {
            console.log('⚠️ Could not check users after seeds:', error.message);
        }

        return true;
    } catch (error) {
        console.error('❌ Migration/Seed failed:', error.message);
        console.error('🔍 Error details:', error.stack);
        return false;
    }
};

// Import API routes (with error handling)
let apiRoutes = null;
try {
    // Run migrations first
    const migrationsSuccess = await runMigrations();
    if (!migrationsSuccess) {
        console.log('⚠️ Continuing without database migrations');
    }

    const { default: apiRoute } = await import('./src/routes/apiRoute.mjs');
    apiRoutes = apiRoute;
    console.log('✅ Database API routes loaded successfully');
} catch (error) {
    console.log('⚠️ Database API routes not available, using simplified version');
    console.log('🔍 Error:', error.message);
}

// Use API routes if available, otherwise use simplified routes
if (apiRoutes) {
    app.use('/api', apiRoutes);
    console.log('📡 Full API available at /api/*');
} else {
    console.log('📡 Using simplified API (no database)');
}

// Simple test route
app.get('/test', (req, res) => {
    console.log('Test route accessed');
    res.json({
        message: 'Test route working!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        port: process.env.PORT || 8080,
        database: apiRoutes ? 'connected' : 'not connected (simplified version)'
    });
});

// Root route
app.get('/', (req, res) => {
    console.log('Root route accessed');
    res.json({
        message: 'Delivery Backend API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        port: process.env.PORT || 8080,
        database: apiRoutes ? 'connected' : 'not connected (simplified version)',
        endpoints: {
            test: '/test',
            health: '/health',
            api: apiRoutes ? '/api/*' : 'not available (simplified version)'
        }
    });
});

// Simple health check route
app.get('/health', (req, res) => {
    console.log('Health route accessed');
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        port: process.env.PORT || 8080,
        database: apiRoutes ? 'connected' : 'not connected (simplified version)'
    });
});

// Test database endpoint (not protected)
app.get('/test-db', async (req, res) => {
    try {
        console.log('🔍 Testing database connection...');

        // Test database connection
        const knex = await databaseManager.getKnex();
        await knex.raw('SELECT 1');
        console.log('✅ Database connection successful');

        // Get all users
        const users = await knex('users').select('id', 'name', 'email', 'phone');
        console.log('📋 Found users:', users.length);

        res.json({
            success: true,
            message: "Database test successful",
            data: {
                connection: 'successful',
                usersCount: users.length,
                users: users
            }
        });
    } catch (error) {
        console.error("Database test error:", error);
        res.status(500).json({
            success: false,
            message: "Database test failed",
            data: {
                error: error.message,
                stack: error.stack
            }
        });
    }
});

// Manual seed endpoint (not protected) - for emergency use
app.post('/run-seeds', async (req, res) => {
    try {
        console.log('🌱 Manually running seeds...');

        // Run seeds
        await databaseManager.runSeeds();
        console.log('✅ Manual seeds completed successfully');

        // Get all users after seeding
        const knex = await databaseManager.getKnex();
        const users = await knex('users').select('id', 'name', 'email', 'phone');
        console.log('📋 Users after manual seeding:', users);

        res.json({
            success: true,
            message: "Manual seeding completed successfully",
            data: {
                usersCount: users.length,
                users: users
            }
        });
    } catch (error) {
        console.error("Manual seeding error:", error);
        res.status(500).json({
            success: false,
            message: "Manual seeding failed",
            data: {
                error: error.message,
                stack: error.stack
            }
        });
    }
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
    console.log('404 route accessed:', req.originalUrl);
    res.status(404).json({
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
        availableRoutes: {
            root: '/',
            test: '/test',
            health: '/health',
            testDb: '/test-db',
            runSeeds: '/run-seeds',
            api: apiRoutes ? '/api/*' : 'not available (simplified version)'
        }
    });
});

export default app;