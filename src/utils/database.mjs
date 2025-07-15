import knex from 'knex';
import knexConfig from '../../knexfile.cjs';

class DatabaseManager {
    constructor() {
        this.knex = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            if (!this.knex) {
                this.knex = knex(knexConfig);

                // Test the connection
                await this.knex.raw('SELECT 1');
                this.isConnected = true;
                console.log('✅ Database connected successfully');
            }
            return this.knex;
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            throw error;
        }
    }

    async disconnect() {
        try {
            if (this.knex) {
                await this.knex.destroy();
                this.knex = null;
                this.isConnected = false;
                console.log('✅ Database disconnected successfully');
            }
        } catch (error) {
            console.error('❌ Database disconnection failed:', error.message);
            throw error;
        }
    }

    async healthCheck() {
        try {
            if (!this.knex) {
                await this.connect();
            }
            await this.knex.raw('SELECT 1');
            return { status: 'healthy', connected: true };
        } catch (error) {
            return {
                status: 'unhealthy',
                connected: false,
                error: error.message
            };
        }
    }

    getKnex() {
        if (!this.knex) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.knex;
    }

    async runMigrations() {
        try {
            if (!this.knex) {
                await this.connect();
            }
            await this.knex.migrate.latest();
            console.log('✅ Migrations completed successfully');
        } catch (error) {
            console.error('❌ Migration failed:', error.message);
            throw error;
        }
    }

    async runSeeds() {
        try {
            if (!this.knex) {
                await this.connect();
            }
            await this.knex.seed.run();
            console.log('✅ Seeds completed successfully');
        } catch (error) {
            console.error('❌ Seeding failed:', error.message);
            throw error;
        }
    }
}

// Create a singleton instance
const databaseManager = new DatabaseManager();

// Graceful shutdown handling
process.on('SIGINT', async () => {
    console.log('\n🔄 Shutting down gracefully...');
    await databaseManager.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🔄 Shutting down gracefully...');
    await databaseManager.disconnect();
    process.exit(0);
});

export default databaseManager;