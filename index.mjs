// app.js - Complete version with database functionality

import express from "express"
import dotenv from 'dotenv'
import cors from 'cors'

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

// Import API routes (with error handling)
let apiRoutes = null;
try {
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
            api: apiRoutes ? '/api/*' : 'not available (simplified version)'
        }
    });
});

export default app;