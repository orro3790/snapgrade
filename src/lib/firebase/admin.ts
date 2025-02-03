// src/lib/server/firebase.ts
import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { FIREBASE_SNAPGRADE_ADMIN_PROJECT_ID, FIREBASE_SNAPGRADE_ADMIN_CLIENT_EMAIL, FIREBASE_SNAPGRADE_ADMIN_PRIVATE_KEY } from '$env/static/private';

function initializeAdminApp(): App {
    // Check for existing apps first
    if (getApps().length > 0) {
        return getApps()[0];
    }

    // Validate environment variables
    if (!FIREBASE_SNAPGRADE_ADMIN_PROJECT_ID || !FIREBASE_SNAPGRADE_ADMIN_CLIENT_EMAIL || !FIREBASE_SNAPGRADE_ADMIN_PRIVATE_KEY) {
        throw new Error('Missing Firebase Admin SDK environment variables');
    }

    try {
        return initializeApp({
            credential: cert({
                projectId: FIREBASE_SNAPGRADE_ADMIN_PROJECT_ID,
                clientEmail: FIREBASE_SNAPGRADE_ADMIN_CLIENT_EMAIL,
                // Handle newlines in the private key
                privateKey: FIREBASE_SNAPGRADE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
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