#!/usr/bin/env node

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
const AWS_BASE_URL = process.env.AWS_BASE_URL || 'https://your-app-runner-url.amazonaws.com';
const TEST_EMAIL = 'david@gmail.com';
const TEST_PASSWORD = 'password123';

// Test AWS endpoints
const testAWSEndpoints = async () => {
    console.log('🔐 Testing AWS Endpoints');
    console.log('Base URL:', AWS_BASE_URL);
    console.log('');

    try {
        // Step 1: Test login on AWS
        console.log('1️⃣ Testing login on AWS...');
        const loginResponse = await simpleFetch(`${AWS_BASE_URL}/login`, {
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
            console.error('❌ Login failed on AWS');
            return;
        }

        const awsToken = loginData.data.token;
        console.log('✅ Login successful on AWS');
        console.log('AWS Token received:', awsToken.substring(0, 50) + '...');
        console.log('');

        // Step 2: Test checkLogin endpoint on AWS
        console.log('2️⃣ Testing checkLogin endpoint on AWS...');
        const checkLoginResponse = await simpleFetch(`${AWS_BASE_URL}/api/users/checkLogin`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${awsToken}`,
                'Content-Type': 'application/json'
            }
        });

        const checkLoginData = await checkLoginResponse.json();
        console.log('CheckLogin response status:', checkLoginResponse.status);
        console.log('CheckLogin response:', JSON.stringify(checkLoginData, null, 2));
        console.log('');

        // Step 3: Test getUserRights endpoint on AWS
        console.log('3️⃣ Testing getUserRights endpoint on AWS...');
        const getUserRightsResponse = await simpleFetch(`${AWS_BASE_URL}/api/rights/getUserRights`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${awsToken}`,
                'Content-Type': 'application/json'
            }
        });

        const getUserRightsData = await getUserRightsResponse.json();
        console.log('GetUserRights response status:', getUserRightsResponse.status);
        console.log('GetUserRights response:', JSON.stringify(getUserRightsData, null, 2));
        console.log('');

        // Step 4: Test with manually generated token
        console.log('4️⃣ Testing with manually generated token...');
        const jwt = await import('jsonwebtoken');
        const JWT_SECRET = 'c69071f0fd4a2eca12e7bcc412600faf3d8501f58f72eccc12d3f9e4a7209504f58492203113776a87b43801a3107e52891d0a051912481cb2a06b3c29ffffaa1';

        const manualToken = jwt.default.sign(
            { id: 1, phone: '07254345', guest: false, employee: true },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        const manualResponse = await simpleFetch(`${AWS_BASE_URL}/api/users/checkLogin`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${manualToken}`,
                'Content-Type': 'application/json'
            }
        });

        const manualData = await manualResponse.json();
        console.log('Manual token response status:', manualResponse.status);
        console.log('Manual token response:', JSON.stringify(manualData, null, 2));
        console.log('');

        // Summary
        console.log('📊 AWS Test Summary:');
        console.log('✅ Login:', loginData.success ? 'PASSED' : 'FAILED');
        console.log('✅ CheckLogin:', checkLoginData.success ? 'PASSED' : 'FAILED');
        console.log('✅ GetUserRights:', getUserRightsData.success ? 'PASSED' : 'FAILED');
        console.log('✅ Manual Token:', manualData.success ? 'PASSED' : 'FAILED');

    } catch (error) {
        console.error('❌ AWS endpoint test failed:', error.message);
        console.error('Error details:', error);
    }
};

// Run tests
testAWSEndpoints(); 