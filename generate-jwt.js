// Script temporar pentru generarea JWT_SECRET
const crypto = require('crypto');
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET generat:');
console.log(jwtSecret);
console.log('\nCopiază această valoare în variabila de mediu JWT_SECRET din Amplify Console.'); 