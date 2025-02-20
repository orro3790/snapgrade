import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
const base64EncodedServiceAccount = ***REMOVED***
function initializeAdminApp() {
    if (getApps().length > 0) {
        return getApps()[0];
    }
    if (!base64EncodedServiceAccount) {
        throw new Error('Missing Firebase base64 encoded service account');
    }
    try {
        const decodedServiceAccount = Buffer.from(base64EncodedServiceAccount, 'base64').toString('utf-8');
        const credentials = JSON.parse(decodedServiceAccount);
        return initializeApp({
            credential: cert(credentials)
        });
    }
    catch (error) {
        console.error('Firebase admin initialization error:', error);
        throw error;
    }
}
const firebaseAdminApp = initializeAdminApp();
export const adminAuth = getAuth(firebaseAdminApp);
export const adminDb = getFirestore(firebaseAdminApp);
