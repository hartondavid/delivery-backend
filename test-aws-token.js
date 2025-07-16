#!/usr/bin/env node

import jwt from 'jsonwebtoken';

// Test JWT token generation and validation for AWS
const testAWSToken = () => {
    console.log('🔐 Testing JWT Token for AWS Environment');
    console.log('');

    // Use the same JWT_SECRET as configured in AWS
    const JWT_SECRET = 'c69071f0fd4a2eca12e7bcc412600faf3d8501f58f72eccc12d3f9e4a7209504f58492203113776a87b43801a3107e52891d0a051912481cb2a06b3c29ffffaa1';

    console.log('✅ Using AWS JWT_SECRET');
    console.log('Secret preview:', JWT_SECRET.substring(0, 10) + '...');
    console.log('');

    // Test data matching your database
    const testUser = {
        id: 1,
        phone: '07254345', // David's phone from database
        guest: false,
        employee: true
    };

    try {
        // Generate token with the same structure as your backend
        console.log('🎫 Generating token for AWS...');
        const token = jwt.sign(
            { id: testUser.id, phone: testUser.phone, guest: testUser.guest, employee: testUser.employee },
            JWT_SECRET,
            { expiresIn: '1d' }
        );
        console.log('✅ Token generated:', token.substring(0, 50) + '...');
        console.log('');

        // Verify token
        console.log('🔍 Verifying token...');
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ Token verified:', decoded);
        console.log('');

        // Test token structure
        console.log('📋 Token structure analysis:');
        console.log('- id:', decoded.id);
        console.log('- phone:', decoded.phone);
        console.log('- guest:', decoded.guest);
        console.log('- employee:', decoded.employee);
        console.log('- iat (issued at):', new Date(decoded.iat * 1000).toISOString());
        console.log('- exp (expires at):', new Date(decoded.exp * 1000).toISOString());
        console.log('');

        // Test token with different verification methods
        console.log('🧪 Testing different verification scenarios...');

        // Test 1: Normal verification
        const test1 = jwt.verify(token, JWT_SECRET);
        console.log('✅ Normal verification: PASSED');

        // Test 2: Verify with ignoreExpiration
        const test2 = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
        console.log('✅ Ignore expiration verification: PASSED');

        // Test 3: Decode without verification
        const test3 = jwt.decode(token);
        console.log('✅ Decode without verification: PASSED');

        console.log('');
        console.log('🎉 All AWS JWT tests passed!');
        console.log('');
        console.log('📋 Next steps:');
        console.log('1. Use this token in your frontend');
        console.log('2. Test getUserRights and checkLogin endpoints');
        console.log('3. Verify Authorization header format: "Bearer <token>"');

    } catch (error) {
        console.error('❌ AWS JWT test failed:', error.message);
        console.error('Error details:', error);
    }
};

// Run the test
testAWSToken(); 