// Entry point for Amplify
import app from './index.mjs';
import databaseManager from './src/utils/database.mjs';

const port = process.env.PORT || 8080;

// Start server function
const startServer = async () => {
    try {
        console.log('🚀 Starting Delivery Backend Server (Amplify)...');
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
        console.log(`🔧 Port: ${port}`);
        console.log(`📡 Host: 0.0.0.0`);

        // Test database connection (but don't exit if it fails)
        console.log('🔌 Testing database connection...');
        try {
            const dbConnected = await databaseManager.connect();
            if (dbConnected) {
                console.log('✅ Database connected successfully');

                // Run migrations on startup (only in production)
                if (process.env.NODE_ENV === 'production') {
                    try {
                        console.log('🔄 Running database migrations...');
                        await databaseManager.runMigrations();
                        console.log('✅ Migrations completed successfully');
                    } catch (migrationError) {
                        console.warn('⚠️ Migration failed, but continuing startup:', migrationError.message);
                    }
                }
            } else {
                console.warn('⚠️ Database connection failed, but continuing startup');
            }
        } catch (dbError) {
            console.warn('⚠️ Database connection error, but continuing startup:', dbError.message);
        }

        // Start the server
        const server = app.listen(port, '0.0.0.0', () => {
            console.log(`✅ Server is running on http://localhost:${port}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
            console.log(`📊 Health check: http://localhost:${port}/health`);
            console.log(`🏠 Root endpoint: http://localhost:${port}/`);
            console.log(`🔗 API endpoints: http://localhost:${port}/api/`);
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
            server.close(async () => {
                try {
                    await databaseManager.disconnect();
                } catch (error) {
                    console.log('Database disconnect error:', error.message);
                }
                process.exit(0);
            });
        });

        process.on('SIGINT', async () => {
            console.log('\n🔄 SIGINT received, shutting down gracefully...');
            server.close(async () => {
                try {
                    await databaseManager.disconnect();
                } catch (error) {
                    console.log('Database disconnect error:', error.message);
                }
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