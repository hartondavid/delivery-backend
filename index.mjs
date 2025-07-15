// app.js

import express from "express"
import dotenv from 'dotenv'
import apiRouter from './src/routes/apiRoute.mjs'
import healthRouter from './src/endpoints/health.mjs'
import cors from 'cors'
import databaseManager from './src/utils/database.mjs'

const app = express();

dotenv.config()

app.set('trust proxy', true);

app.use(cors({
    origin: '*', // Allow any origin
    exposedHeaders: ['X-Auth-Token', 'X-Message', 'Content-Disposition'], // Expose the custom header

}));
// Serve static files from the 'public' directory
app.use(express.static('public'));

// Middleware to parse x-www-form-urlencoded data
app.use(express.urlencoded({ extended: true }));

// Other middlewares
app.use(express.json());

// Initialize database connection (but don't block requests if it fails)
app.use(async (req, res, next) => {
    try {
        await databaseManager.connect();
        next();
    } catch (error) {
        console.warn('Database connection failed for request:', req.path, error.message);
        // Continue with the request even if database fails
        next();
    }
});

// Simple test route
app.get('/test', (req, res) => {
    res.json({
        message: 'Test route working!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        database: 'connected'
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Delivery Backend API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        endpoints: {
            test: '/test',
            health: '/health',
            api: '/api/',
            database: '/health/db',
            system: '/health/system'
        }
    });
});

// Health check routes
app.use('/health', healthRouter);

// API routes
app.use('/api/', apiRouter);

// 404 handler for undefined routes
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
        availableRoutes: {
            root: '/',
            test: '/test',
            health: '/health',
            api: '/api/'
        }
    });
});

export default app;