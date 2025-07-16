#!/usr/bin/env node

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Checking Local JWT_SECRET Configuration');
console.log('');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.log('❌ JWT_SECRET not found in local environment');
    console.log('Check your .env file or environment variables');
} else if (JWT_SECRET === 'your_jwt_secret' || JWT_SECRET === 'your-jwt-secret-key-change-this-in-production') {
    console.log('⚠️  JWT_SECRET is using default value');
    console.log('Current value:', JWT_SECRET);
    console.log('This should be changed to a secure random string');
} else {
    console.log('✅ JWT_SECRET is configured');
    console.log('Secret preview:', JWT_SECRET.substring(0, 10) + '...');
    console.log('Secret length:', JWT_SECRET.length, 'characters');
}

console.log('');
console.log('📋 Next Steps:');
console.log('1. Copy this JWT_SECRET value');
console.log('2. Go to AWS App Runner Console');
console.log('3. Update JWT_SECRET environment variable');
console.log('4. Redeploy the service'); 