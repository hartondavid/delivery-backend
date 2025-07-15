require('dotenv').config();

// Update this with your database configuration
module.exports = {
    client: 'mysql2',
    connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        timezone: 'Z',  // Ensures all dates are treated as UTC
        decimalNumbers: true,
        ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false
        } : false,
        // Connection pooling for better performance
        acquireConnectionTimeout: 60000,
        timeout: 60000,
        // Enable connection pooling
        pool: {
            min: 2,
            max: 10,
            acquireTimeoutMillis: 30000,
            createTimeoutMillis: 30000,
            destroyTimeoutMillis: 5000,
            idleTimeoutMillis: 30000,
            reapIntervalMillis: 1000,
            createRetryIntervalMillis: 100
        }
    },
    migrations: {
        directory: './migrations'
    },
    seeds: {
        directory: './seeds'
    },
    debug: process.env.NODE_ENV === 'development'
};
