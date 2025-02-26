import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Try to get the service account from different sources
let base64EncodedServiceAccount: string | undefined;

// Try to import from SvelteKit's env
try {
  const { BASE64_ENCODED_SERVICE_ACCOUNT } = await import('$env/static/private');
  base64EncodedServiceAccount = BASE64_ENCODED_SERVICE_ACCOUNT;
} catch {
  // If that fails, use process.env (for GitHub Codespaces)
  console.log('Could not import from $env/static/private, falling back to process.env');
  base64EncodedServiceAccount = process.env.BASE64_ENCODED_SERVICE_ACCOUNT;
}

export function initializeAdminApp(): App {
    // Check for existing apps first
    if (getApps().length > 0) {
        return getApps()[0];
    }

    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development' ||
                         process.env.NODE_ENV === undefined;

    if (!base64EncodedServiceAccount) {
        if (isDevelopment) {
            console.warn('Running in development mode without Firebase Admin credentials');
            // Return a mock app for development
            return initializeApp({
                projectId: 'snapgrade-dev-mock'
            }, 'mock-admin-app');
        }
        throw new Error('Missing Firebase base64 encoded service account in both process.env and $env/dynamic/private');
    }

    try {
        // Decode and parse the base64 service account
        const decodedServiceAccount = Buffer.from(
            base64EncodedServiceAccount,
            'base64'
        ).toString('utf-8');
        
        const credentials = JSON.parse(decodedServiceAccount);

        return initializeApp({
            credential: cert(credentials)
        });
    } catch (error) {
        console.error('Firebase admin initialization error:', error);
        if (isDevelopment) {
            console.warn('Falling back to mock app in development mode');
            return initializeApp({
                projectId: 'snapgrade-dev-mock'
            }, 'mock-admin-app');
        }
        throw error;
    }
}

// Initialize the app using our function
const firebaseAdminApp = initializeAdminApp();

// Export the admin services
export const adminAuth = getAuth(firebaseAdminApp);
export const adminDb = getFirestore(firebaseAdminApp);