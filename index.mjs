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

// Initialize database connection
app.use(async (req, res, next) => {
    try {
        await databaseManager.connect();
        next();
    } catch (error) {
        console.error('Database connection failed:', error);
        res.status(503).json({ error: 'Database connection failed' });
    }
});

// Simple test route
app.get('/test', (req, res) => {
    res.json({
        message: 'Test route working!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Delivery Backend API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
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

app.use('/api/', apiRouter)

export default app;