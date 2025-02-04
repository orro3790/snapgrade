// File: src/hooks.server.ts
import { adminAuth, adminDb } from "$lib/firebase/admin";
import type { RequestHandler } from "./routes/api/documents/$types";


// Define all routes that require authentication and their specific requirements These routes will redirect to login if no session exists
const PROTECTED_ROUTES = [
  '/private'
]

// Define status-specific routes that users are redirected to when their account status changes
const STATUS_ROUTES = {
  SUSPENDED: '/suspended',
  INACTIVE: '/inactive'
} as const;

// Type guard to check if a given path is a protected route
const isProtectedRoute = (path: string): boolean => {
  return PROTECTED_ROUTES.includes(path);
};

export const handle = async ({ event, resolve }) => {
  const sessionCookie = event.cookies.get('session');
  const path = event.url.pathname;
  const routeConfig = isProtectedRoute(path) ? path : undefined;

  // Early return for unprotected routes without session
  if (!routeConfig && !sessionCookie) {
    return resolve(event);
  }

  // Handle unauthenticated access to protected routes
  if (routeConfig && !sessionCookie) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/login?redirect=' + encodeURIComponent(path) }
    });
  }

  try {
    if (sessionCookie) {
      const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
      const { accountStatus } = decodedToken;

      // Fetch both user and settings data
      const [userDoc, settingsDoc] = await Promise.all([
        adminDb.collection('users').doc(decodedToken.uid).get(),
        adminDb.collection('settings').doc(decodedToken.uid).get()
      ]);

      if (userDoc.exists && settingsDoc.exists) {
        const userData = userDoc.data();
        const settingsData = settingsDoc.data();

        console.log('Session restored - Updated locals:', { 
          userData, 
          settingsData 
        });

        // Store both user and settings in locals
        event.locals.user = userData;
        event.locals.settings = settingsData;

        // Status checks after we have full user data
        if (accountStatus === 'suspended' || accountStatus === 'inactive') {
          const statusRoute = accountStatus === 'suspended' 
            ? STATUS_ROUTES.SUSPENDED 
            : STATUS_ROUTES.INACTIVE;
            
          if (path !== statusRoute) {
            return new Response(null, {
              status: 302,
              headers: { Location: statusRoute }
            });
          }
          return resolve(event);
        }
      }
    }

    return resolve(event);

  } catch (error) {
    console.error('Session verification error:', error);
    event.cookies.delete('session', { path: '/' });
    
    if (routeConfig) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/login?redirect=' + encodeURIComponent(path) }
      });
    }
    
    return resolve(event);
  }
};
