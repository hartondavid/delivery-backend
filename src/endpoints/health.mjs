import express from 'express';
import databaseManager from '../utils/database.mjs';

const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
    try {
        const dbHealth = await databaseManager.healthCheck();
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();

        const healthStatus = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: `${Math.floor(uptime / 60)} minutes`,
            memory: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`
            },
            database: dbHealth,
            environment: process.env.NODE_ENV || 'development'
        };

        const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(healthStatus);
    } catch (error) {
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message,
            database: { status: 'unhealthy', connected: false }
        });
    }
});

// Database status endpoint
router.get('/health/db', async (req, res) => {
    try {
        const dbHealth = await databaseManager.healthCheck();
        const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(dbHealth);
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            connected: false,
            error: error.message
        });
    }
});

// System info endpoint
router.get('/health/system', (req, res) => {
    const systemInfo = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    };

    res.json(systemInfo);
});

export default router; 