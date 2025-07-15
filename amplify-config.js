// Amplify configuration for backend application
import app from './index.mjs';

// Ensure the app is properly configured for Amplify
app.set('trust proxy', true);

// Additional Amplify-specific configurations
app.set('env', process.env.NODE_ENV || 'production');

// Export for Amplify
export default app; 