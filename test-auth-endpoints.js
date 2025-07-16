#!/usr/bin/env node

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Use built-in fetch (Node.js 18+) or https module
import https from 'https';
import http from 'http';
import { URL } from 'url';

// Simple fetch implementation
const simpleFetch = async (url, options = {}) => {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;

        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = client.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        json: () => Promise.resolve(jsonData),
                        text: () => Promise.resolve(data)
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        json: () => Promise.reject(error),
                        text: () => Promise.resolve(data)
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
};

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const TEST_EMAIL = 'david@gmail.com';
const TEST_PASSWORD = 'password123';

// Test authentication flow
const testAuthFlow = async () => {
    console.log('🔐 Testing Authentication Flow');
    console.log('Base URL:', BASE_URL);
    console.log('');

    try {
        // Step 1: Test login
        console.log('1️⃣ Testing login...');
        const loginResponse = await simpleFetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            })
        });

        const loginData = await loginResponse.json();
        console.log('Login response status:', loginResponse.status);
        console.log('Login response:', JSON.stringify(loginData, null, 2));

        if (!loginData.success) {
            console.error('❌ Login failed');
            return;
        }

        const token = loginData.data.token;
        console.log('✅ Login successful');
        console.log('Token received:', token.substring(0, 20) + '...');
        console.log('');

        // Step 2: Test checkLogin endpoint
        console.log('2️⃣ Testing checkLogin endpoint...');
        const checkLoginResponse = await simpleFetch(`${BASE_URL}/api/users/checkLogin`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const checkLoginData = await checkLoginResponse.json();
        console.log('CheckLogin response status:', checkLoginResponse.status);
        console.log('CheckLogin response:', JSON.stringify(checkLoginData, null, 2));
        console.log('');

        // Step 3: Test getUserRights endpoint
        console.log('3️⃣ Testing getUserRights endpoint...');
        const getUserRightsResponse = await simpleFetch(`${BASE_URL}/api/rights/getUserRights`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const getUserRightsData = await getUserRightsResponse.json();
        console.log('GetUserRights response status:', getUserRightsResponse.status);
        console.log('GetUserRights response:', JSON.stringify(getUserRightsData, null, 2));
        console.log('');

        // Step 4: Test token validation endpoint
        console.log('4️⃣ Testing token validation endpoint...');
        const testTokenResponse = await simpleFetch(`${BASE_URL}/test-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token
            })
        });

        const testTokenData = await testTokenResponse.json();
        console.log('TestToken response status:', testTokenResponse.status);
        console.log('TestToken response:', JSON.stringify(testTokenData, null, 2));
        console.log('');

        // Summary
        console.log('📊 Test Summary:');
        console.log('✅ Login:', loginData.success ? 'PASSED' : 'FAILED');
        console.log('✅ CheckLogin:', checkLoginData.success ? 'PASSED' : 'FAILED');
        console.log('✅ GetUserRights:', getUserRightsData.success ? 'PASSED' : 'FAILED');
        console.log('✅ TokenValidation:', testTokenData.success ? 'PASSED' : 'FAILED');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Error details:', error);
    }
};

// Test with different endpoints
const testAlternativeEndpoints = async () => {
    console.log('');
    console.log('🔄 Testing Alternative Endpoints');
    console.log('');

    try {
        // Test direct API endpoint
        console.log('Testing direct API endpoint...');
        const response = await fetch(`${BASE_URL}/api/users/checkLogin`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Direct API response status:', response.status);
        const data = await response.text();
        console.log('Direct API response:', data.substring(0, 200) + '...');

    } catch (error) {
        console.error('Alternative endpoint test failed:', error.message);
    }
};

// Run tests
const runTests = async () => {
    await testAuthFlow();
    await testAlternativeEndpoints();
};

runTests(); 