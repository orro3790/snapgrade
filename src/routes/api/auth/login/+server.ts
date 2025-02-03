// routes/api/auth/login/+server.ts
import { loginSchema } from '$lib/schemas/auth';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { actionResult } from 'sveltekit-superforms';
import type { RequestHandler } from './$types';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { adminAuth, adminDb } from '$lib/firebase/admin';
import { createSessionCookie, setSessionCookie } from '$lib/server/auth';
import type { User } from '$lib/schemas/user';
import type { Settings } from '$lib/schemas/settings';
import { FirebaseError } from 'firebase/app';

export const GET: RequestHandler = async () => {
  const form = await superValidate(zod(loginSchema));
  return actionResult('success', { form });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
  console.log('API endpoint reached:', request.url);

  const form = await superValidate(request, zod(loginSchema));

  if (!form.valid) {
    return actionResult('failure', { form }, {
      status: 400
    });
  }

  try {
    const { email, password } = form.data;
    const auth = getAuth();
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    
    // Get user data from Firestore
    const [userDoc, settingsDoc] = await Promise.all([
      adminDb.collection('users').doc(userCredential.user.uid).get(),
      adminDb.collection('settings').doc(userCredential.user.uid).get()
    ]);

    if (!userDoc.exists) {
      return actionResult('failure', { 
        form,
        message: 'User data not found'
      }, {
        status: 400
      });
    }
    
    const userData = userDoc.data() as User;

    // Create default settings if they don't exist
    let settingsData: Settings;
    if (!settingsDoc.exists) {
      settingsData = {
        theme: 'dark',
        userId: userCredential.user.uid
      };
      
      await adminDb.collection('settings')
        .doc(userCredential.user.uid)
        .set(settingsData);
    } else {
      settingsData = settingsDoc.data() as Settings;
    }

    await adminAuth.setCustomUserClaims(userCredential.user.uid, {
      accountStatus: userData.metadata.accountStatus,
    });

    // Create session cookie
    const sessionCookie = await createSessionCookie(idToken);
    setSessionCookie(cookies, sessionCookie);

    return actionResult('success', {
      form,
      user: userData,
      settings: settingsData
    });

  } catch (error: unknown) {
    const firebaseError = error as FirebaseError;
    console.error('Login error:', {
      code: firebaseError.code,
      message: firebaseError.message
    });

    if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
      return actionResult('failure', { 
        form,
        message: 'Invalid email or password'
      }, {
        status: 400
      });
    }

    return actionResult('error', 'Login failed. Please try again.', {
      status: 500
    });
  }
};
