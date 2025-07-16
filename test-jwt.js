#!/usr/bin/env node

import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables from .env file
dotenv.config();

// Test JWT token generation and validation
const testJWT = () => {
    console.log('🔐 Testing JWT Token Generation and Validation');
    console.log('');

    // Get JWT_SECRET from environment
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET || JWT_SECRET === 'your_jwt_secret') {
        console.error('❌ JWT_SECRET not properly configured!');
        console.log('Please set JWT_SECRET environment variable');
        return;
    }

    console.log('✅ JWT_SECRET is configured');
    console.log('Secret preview:', JWT_SECRET.substring(0, 10) + '...');
    console.log('');

    // Test data
    const testUser = {
        id: 1,
        phone: '+40123456789',
        guest: false,
        employee: true
    };

    try {
        // Generate token (like in getAuthToken function)
        console.log('🎫 Generating token with getAuthToken format...');
        const token1 = jwt.sign(
            { id: testUser.id, phone: testUser.phone, guest: testUser.guest, employee: testUser.employee },
            JWT_SECRET,
            { expiresIn: '1d' }
        );
        console.log('✅ Token 1 generated:', token1.substring(0, 20) + '...');

        // Generate token (like in index.mjs)
        console.log('🎫 Generating token with index.mjs format...');
        const token2 = jwt.sign(
            { id: testUser.id, phone: testUser.phone, guest: false, employee: true },
            JWT_SECRET,
            { expiresIn: '1d' }
        );
        console.log('✅ Token 2 generated:', token2.substring(0, 20) + '...');

        // Verify tokens
        console.log('');
        console.log('🔍 Verifying tokens...');

        const decoded1 = jwt.verify(token1, JWT_SECRET);
        console.log('✅ Token 1 verified:', decoded1);

        const decoded2 = jwt.verify(token2, JWT_SECRET);
        console.log('✅ Token 2 verified:', decoded2);

        // Test if tokens are compatible
        console.log('');
        console.log('🔍 Testing token compatibility...');

        // Try to verify token1 with the same secret
        const testDecode1 = jwt.verify(token1, JWT_SECRET);
        console.log('✅ Token 1 can be verified with current secret');

        // Try to verify token2 with the same secret  
        const testDecode2 = jwt.verify(token2, JWT_SECRET);
        console.log('✅ Token 2 can be verified with current secret');

        console.log('');
        console.log('🎉 All JWT tests passed!');
        console.log('');
        console.log('📋 Token structure comparison:');
        console.log('Token 1 payload:', JSON.stringify(decoded1, null, 2));
        console.log('Token 2 payload:', JSON.stringify(decoded2, null, 2));

    } catch (error) {
        console.error('❌ JWT test failed:', error.message);
        console.error('Error details:', error);
    }
};

// Run the test
testJWT(); 