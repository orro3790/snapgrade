import { loginSchema, type LoginFormData } from "$lib/schemas/auth";
import { fail, superValidate } from "sveltekit-superforms/client";
import type { Actions, PageServerLoad } from "./$types"
import { zod } from "sveltekit-superforms/adapters";
import { adminAuth, adminDb } from "$lib/firebase/admin";
import type { User } from "$lib/schemas/user";
import type { Settings } from "$lib/schemas/settings";
import { createSessionCookie, setSessionCookie } from "$lib/server/auth";
import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "$lib/firebase/client";

export const load: PageServerLoad = async () => {
    console.log('Loading login page');
    const form = await superValidate(zod(loginSchema));
    return { form };
};

export const actions: Actions = {
  login: async ({ request, cookies }) => {
    console.log('Login action started');
    
    // Form validation
    const form = await superValidate<LoginFormData>(request, zod(loginSchema));
    console.log('Form validation result:', { 
      valid: form.valid, 
      data: form.data,
      errors: form.errors 
    });
    
    if (!form.valid) {
      console.log('Form validation failed:', form.errors);
      return fail(400, { form });
    }

    try {
      const { email, password } = form.data;
      console.log('Starting authentication for email:', email);
      
      try {
        // Firebase Authentication
        console.log('Attempting Firebase signInWithEmailAndPassword...');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Sign in successful, user ID:', userCredential.user.uid);
        
        // Get ID Token
        console.log('Requesting ID token...');
        const idToken = await userCredential.user.getIdToken();
        console.log('ID token received, length:', idToken.length);
        
        // Fetch Firestore Data
        console.log('Fetching user data from Firestore...');
        const [userDoc, settingsDoc] = await Promise.all([
          adminDb.collection('users').doc(userCredential.user.uid).get(),
          adminDb.collection('settings').doc(userCredential.user.uid).get()
        ]);
        console.log('Firestore docs fetched:', {
          userExists: userDoc.exists,
          settingsExists: settingsDoc.exists,
          userId: userCredential.user.uid
        });

        if (!userDoc.exists) {
          console.log('User document not found in Firestore');
          return fail(400, {
            form,
            error: 'User data not found'
          });
        }

        const userData = userDoc.data() as User;
        console.log('User data retrieved:', { 
          userId: userData.id,
      
        });

        // Handle Settings
        let settingsData: Settings;
        if (!settingsDoc.exists) {
          console.log('Creating default settings for user');
          settingsData = {
            theme: 'dark',
            userId: userCredential.user.uid
          };
          
          console.log('Saving default settings to Firestore...');
          await adminDb.collection('settings')
            .doc(userCredential.user.uid)
            .set(settingsData);
          console.log('Default settings saved');
        } else {
          console.log('Existing settings found');
          settingsData = settingsDoc.data() as Settings;
        }

        // Set Custom Claims
        console.log('Setting custom user claims...');
        await adminAuth.setCustomUserClaims(userCredential.user.uid, {
          accountStatus: userData.metadata.accountStatus,
        });
        console.log('Custom claims set successfully');

        // Session Management
        console.log('Creating session cookie...');
        const sessionCookie = await createSessionCookie(idToken);
        console.log('Session cookie created successfully');

        console.log('Setting session cookie...');
        setSessionCookie(cookies, sessionCookie);
        console.log('Session cookie set successfully');

        console.log('Login process completed successfully');
        return {
          form,
          success: true,
          user: userData,
          settings: settingsData
        };

      } catch (authError: unknown) {
        if (authError instanceof Error) {
          console.error('Firebase Auth Error:', {
            code: (authError as FirebaseError).code,
            message: authError.message,
            stack: authError.stack,
            fullError: authError
          });
        }
        throw authError;
      }

    } catch (error: unknown) {
      const firebaseError = error as FirebaseError;
      console.error('Login error details:', {
        code: firebaseError.code,
        message: firebaseError.message,
        stack: firebaseError.stack,
        fullError: firebaseError
      });

      if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
        console.log('Invalid credentials provided');
        return fail(400, {
          form,
          error: 'Invalid email or password'
        });
      }

      console.log('Unhandled error during login');
      return fail(500, {
        form,
        error: 'Login failed. Please try again.'
      });
    }
  },
};