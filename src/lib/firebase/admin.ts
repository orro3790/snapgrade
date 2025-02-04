import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Get environment variables with fallbacks for type safety
const {
    FIREBASE_ADMIN_PROJECT_ID = '',
    FIREBASE_ADMIN_CLIENT_EMAIL = '',
    FIREBASE_ADMIN_PRIVATE_KEY = ''
} = process.env;

function initializeAdminApp(): App {
    // Check for existing apps first
    if (getApps().length > 0) {
        return getApps()[0];
    }

    if (!FIREBASE_ADMIN_PROJECT_ID || !FIREBASE_ADMIN_CLIENT_EMAIL || !FIREBASE_ADMIN_PRIVATE_KEY) {
        throw new Error('Missing Firebase Admin SDK environment variables');
    }

    try {
        return initializeApp({
            credential: cert({
                projectId: FIREBASE_ADMIN_PROJECT_ID,
                clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
                privateKey: FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
            })
        });
    } catch (error) {
        console.error('Firebase admin initialization error:', error);
        throw error;
    }
}

// Initialize the app using our function
const firebaseAdminApp = initializeAdminApp();

// Export the admin services
export const adminAuth = getAuth(firebaseAdminApp);
export const adminDb = getFirestore(firebaseAdminApp);