import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_SNAPGRADE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_SNAPGRADE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_SNAPGRADE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_SNAPGRADE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_SNAPGRADE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_SNAPGRADE_FIREBASE_APP_ID
};

// Initialize Firebase
let firebaseApp: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Initialize only if there isn't already an instance
if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
}

export { firebaseApp, auth, db };