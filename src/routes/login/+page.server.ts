// File: src/routes/login/+page.server.ts
import { loginSchema, type LoginFormData } from "$lib/schemas/auth";
import { fail, superValidate } from "sveltekit-superforms/client";
import type { Actions, PageServerLoad } from "./$types"
import { zod } from "sveltekit-superforms/adapters";
import { adminDb } from "$lib/firebase/admin";
import type { User } from "$lib/schemas/user";
import type { Settings } from "$lib/schemas/settings";
import { createSessionCookie, setSessionCookie } from "$lib/server/auth";
import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "$lib/firebase/client";

export const load: PageServerLoad = async () => {
    const form = await superValidate(zod(loginSchema));

    return { form };
};

export const actions: Actions = {
  login: async ({ request, cookies }) => {
    console.log('Login action started');
    
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
      console.log('Attempting login for email:', email);
      
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Sign in successful, user:', userCredential.user.uid);
        
        const idToken = await userCredential.user.getIdToken();
        console.log('Got ID token');
        
        // Get user data from Firestore
        console.log('Fetching user data from Firestore...');
        const [userDoc, settingsDoc] = await Promise.all([
          adminDb.collection('users').doc(userCredential.user.uid).get(),
          adminDb.collection('settings').doc(userCredential.user.uid).get()
        ]);
        console.log('Firestore docs fetched:', {
          userExists: userDoc.exists,
          settingsExists: settingsDoc.exists
        });

        if (!userDoc.exists) {
          return fail(400, {
            form,
            error: 'User data not found'
          });
        }

        // Verify user exists (type check only)
        userDoc.data() as User;

        // Create default settings if they don't exist
        let settingsData: Settings;
        if (!settingsDoc.exists) {
          settingsData = {
            theme: 'dark',
            userId: userCredential.user.uid
          };
          
          // Create the settings document
          await adminDb.collection('settings')
            .doc(userCredential.user.uid)
            .set(settingsData);
          
        } else {
          settingsData = settingsDoc.data() as Settings;
        }

        // Create session cookie from the ID token
        const sessionCookie = await createSessionCookie(idToken);
        setSessionCookie(cookies, sessionCookie);

        return {
          form,
          success: true
        };

      } catch (authError: unknown) {
        if (authError instanceof Error) {
          console.error('Firebase Auth Error:', {
            code: (authError as FirebaseError).code,
            message: authError.message,
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
        fullError: firebaseError
      });

      if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
        return fail(400, {
          form,
          error: 'Invalid email or password'
        });
      }

      return fail(500, {
        form,
        error: 'Login failed. Please try again.'
      });
    }
  },
};
