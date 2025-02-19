// File: src/lib/server/auth.ts
import { adminAuth, adminDb } from '$lib/firebase/admin';
import { settingsSchema } from '$lib/schemas/settings';
import { FirebaseAuthError } from 'firebase-admin/auth';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours expressed in milliseconds
export async function createSessionCookie(idToken) {
    try {
        const sessionCookie = await adminAuth.createSessionCookie(idToken, {
            expiresIn: SESSION_DURATION, // required in milliseconds
        });
        return sessionCookie;
    }
    catch (error) {
        console.error('Error creating session cookie:', error);
        throw error;
    }
}
export function setSessionCookie(cookies, sessionCookie) {
    cookies.set('session', sessionCookie, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: SESSION_DURATION / 1000, // required in seconds
    });
}
// https://firebase.google.com/docs/auth/admin/manage-cookies#verify_session_cookie_and_check_permissions
export async function verifySessionCookie(sessionCookie) {
    try {
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
        // Fetch both user and settings documents
        const [userDoc, settingsDoc] = await Promise.all([
            adminDb.collection('users').doc(decodedClaims.uid).get(),
            adminDb.collection('settings').doc(decodedClaims.uid).get()
        ]);
        if (!userDoc.exists) {
            throw new Error('User document not found');
        }
        const userData = userDoc.data();
        const settingsData = settingsDoc.exists ? settingsDoc.data() : null;
        // Combine everything into a single object for the app to use
        const mergedData = {
            ...userData,
            settings: settingsData,
        };
        return {
            valid: true,
            claims: mergedData
        };
    }
    catch (error) {
        // Granular error handling
        if (error instanceof FirebaseAuthError) {
            switch (error.code) {
                case 'auth/id-token-expired':
                    console.log('Session expired');
                    break;
                case 'auth/user-not-found':
                    console.log('User no longer exists');
                    break;
                default:
                    console.error('Verification error:', error);
            }
        }
        return { valid: false, claims: null };
    }
}
export async function logout(cookies, uid) {
    try {
        // Revoke all sessions for this user
        await adminAuth.revokeRefreshTokens(uid);
        // Clear local session cookie
        cookies.delete('session', { path: '/' });
    }
    catch (error) {
        console.error('Logout failed:', error);
    }
}
export async function createSettingsDocument(userId) {
    const settings = {
        userId,
        theme: 'dark'
    };
    // Validate settings before creating the document
    const validatedSettings = settingsSchema.parse(settings);
    // Create the settings document in Firestore
    const settingsRef = adminDb.collection('settings').doc(userId);
    await settingsRef.set(validatedSettings);
    return validatedSettings;
}
