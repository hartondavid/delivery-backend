// Entry point for Amplify - Simplified version for testing
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// Basic middleware
app.use(cors({
    origin: '*',
    exposedHeaders: ['X-Auth-Token', 'X-Message', 'Content-Disposition'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple test route
app.get('/test', (req, res) => {
    res.json({
        message: 'Test route working!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production'
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
            health: '/health'
        }
    });
});

// Health check route
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production'
    });
});

// Start server function
const startServer = async () => {
    try {
        console.log('🚀 Starting Delivery Backend Server (Amplify)...');
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
        console.log(`🔧 Port: ${port}`);
        console.log(`📡 Host: 0.0.0.0`);

        // Start the server
        const server = app.listen(port, '0.0.0.0', () => {
            console.log(`✅ Server is running on http://localhost:${port}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
            console.log(`📊 Health check: http://localhost:${port}/health`);
            console.log(`🏠 Root endpoint: http://localhost:${port}/`);
            console.log(`🔗 Test endpoint: http://localhost:${port}/test`);
        });

        // Add error handling for the server
        server.on('error', (error) => {
            console.error('❌ Server error:', error);
            if (error.code === 'EADDRINUSE') {
                console.error('💡 Port is already in use. Try a different port.');
            }
        });

        // Graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('\n🔄 SIGTERM received, shutting down gracefully...');
            server.close(() => {
                process.exit(0);
            });
        });

        process.on('SIGINT', async () => {
            console.log('\n🔄 SIGINT received, shutting down gracefully...');
            server.close(() => {
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        console.error('🔍 Error details:', error.stack);
        process.exit(1);
    }
};

// Start the server immediately
startServer();

// Export the app for Amplify
export default app; 