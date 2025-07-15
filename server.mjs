// server.mjs (handles starting the server)
import app from './index.mjs';
import { testConnection, closeConnection } from './src/utils/database.mjs';

const port = process.env.PORT || 3001;

// Test database connection on startup
const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('Failed to connect to database. Exiting...');
            process.exit(1);
        }

        // Start the server
        const server = app.listen(port, '0.0.0.0', () => {
            console.log(`Server is running on http://localhost:${port}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });

        // Graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('SIGTERM received, shutting down gracefully...');
            server.close(async () => {
                await closeConnection();
                process.exit(0);
            });
        });

        process.on('SIGINT', async () => {
            console.log('SIGINT received, shutting down gracefully...');
            server.close(async () => {
                await closeConnection();
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
