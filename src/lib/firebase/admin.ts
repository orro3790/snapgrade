// src/lib/server/firebase.ts
import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function initializeAdminApp(): App {
    // Check for existing apps first
    if (getApps().length > 0) {
        return getApps()[0];
    }

    // Validate environment variables
    const projectId = import.meta.env.VITE_FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = import.meta.env.VITE_FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = import.meta.env.VITE_FIREBASE_ADMIN_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Missing Firebase Admin SDK environment variables');
    }

    try {
        return initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                // Handle newlines in the private key
                privateKey: privateKey.replace(/\\n/g, '\n')
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