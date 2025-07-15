import jwt from 'jsonwebtoken';
import databaseManager from '../database.mjs'; // Adjust the path as necessary


const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const userAuthMiddleware = async (req, res, next) => {
    console.log('🔐 Auth middleware called for:', req.originalUrl);

    const authHeader = req.headers['authorization'];
    console.log('📋 Auth header:', authHeader ? authHeader.substring(0, 20) + '...' : 'missing');

    const token = authHeader && authHeader.split(' ')[1];
    console.log('🎫 Token extracted:', token ? token.substring(0, 20) + '...' : 'missing');

    if (!token) {
        console.log('❌ No token provided');
        return res.status(422).json({ error: 'Missing Auth Token' });
    }

    try {
        console.log('🔍 Verifying token with secret:', JWT_SECRET.substring(0, 10) + '...');
        const decodedToken = jwt.verify(token, JWT_SECRET);
        console.log('✅ Token verified, user ID:', decodedToken.id);

        const userId = decodedToken.id;

        // Fetch the user from the database based on the ID from the token
        console.log('👤 Fetching user from database...');
        const user = await (await databaseManager.getKnex())('users').where({ id: userId }).first();

        if (!user) {
            console.log('❌ User not found in database for ID:', userId);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('✅ User found:', { id: user.id, name: user.name, email: user.email });

        // Attach the user to the request object
        req.user = user;
        req.token = token;
        next();
    } catch (err) {
        console.error('❌ Token verification failed:', err.message);
        console.error('🔍 Error details:', err.stack);
        return res.status(422).json({ error: 'Invalid token' });
    }
};
