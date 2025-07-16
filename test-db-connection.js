#!/usr/bin/env node

import dotenv from 'dotenv';
import databaseManager from './src/utils/database.mjs';

// Load environment variables
dotenv.config();

const testDatabase = async () => {
    console.log('🗄️ Testing Database Connection');
    console.log('');

    try {
        // Test database connection
        console.log('1️⃣ Testing database connection...');
        const knex = await databaseManager.getKnex();
        await knex.raw('SELECT 1');
        console.log('✅ Database connection successful');
        console.log('');

        // Check if users table exists
        console.log('2️⃣ Checking users table...');
        const tables = await knex.raw('SHOW TABLES');
        const tableNames = tables[0].map(row => Object.values(row)[0]);
        console.log('Available tables:', tableNames);

        if (tableNames.includes('users')) {
            console.log('✅ Users table exists');
        } else {
            console.log('❌ Users table not found');
            return;
        }
        console.log('');

        // Get all users
        console.log('3️⃣ Fetching users from database...');
        const users = await knex('users').select('id', 'name', 'email', 'phone');
        console.log(`Found ${users.length} users:`);

        if (users.length > 0) {
            users.forEach((user, index) => {
                console.log(`  ${index + 1}. ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Phone: ${user.phone}`);
            });
        } else {
            console.log('❌ No users found in database');
            console.log('You may need to run database seeds');
        }
        console.log('');

        // Test specific user login
        console.log('4️⃣ Testing specific user credentials...');
        const testEmail = 'david@gmail.com';
        const user = await knex('users').where({ email: testEmail }).first();

        if (user) {
            console.log(`✅ User found: ${user.name} (${user.email})`);
            console.log(`User ID: ${user.id}`);
            console.log(`Phone: ${user.phone}`);
            console.log(`Password hash: ${user.password.substring(0, 10)}...`);
        } else {
            console.log(`❌ User with email ${testEmail} not found`);
            console.log('Available emails:');
            users.forEach(u => console.log(`  - ${u.email}`));
        }

    } catch (error) {
        console.error('❌ Database test failed:', error.message);
        console.error('Error details:', error);
    }
};

testDatabase(); 