// // File: src/routes/api/seed/users/+server.ts
// import { userSchema } from '$lib/schemas/user';
// import { adminDb } from '$lib/firebase/admin';
// import { json, type RequestHandler } from '@sveltejs/kit';
// import { z } from 'zod';
// import { FirebaseError } from 'firebase/app';
// import { generateRandomUser } from '$lib/utils/seedGenerators';


// export const POST: RequestHandler = async ({ request }) => {
//     try {
//         const { data = {} } = await request.json();
        
//         // Generate Firestore document reference first
//         const docRef = adminDb.collection('users').doc();
        
//         // Generate random data merged with provided data
//         const documentData = generateRandomUser({
//             ...data,
//             id: docRef.id
//         });
        
//         // Validate the merged data
//         const validatedUser = userSchema.parse(documentData);
        
//         // Store in Firestore
//         await docRef.set(validatedUser);
        
//         return json({
//             status: 'success' as const,
//             data: validatedUser
//         });
        
//     } catch (error) {
//         console.error('Error:', error);
        
//         // Handle validation errors
//         if (error instanceof z.ZodError) {
//             return json(
//                 { 
//                     status: 'error' as const,
//                     message: 'Invalid user data format',
//                     errors: error.errors
//                 },
//                 { status: 400 }
//             );
//         }
        
//         // Handle Firebase errors
//         if (error instanceof FirebaseError) {
//             return json(
//                 { 
//                     status: 'error' as const,
//                     message: error.message,
//                     code: error.code
//                 },
//                 { status: 500 }
//             );
//         }
        
//         // Handle unknown errors
//         return json(
//             { 
//                 status: 'error' as const,
//                 message: error instanceof Error ? error.message : 'Unknown error',
//                 code: 'internal/unknown'
//             },
//             { status: 500 }
//         );
//     }
// };
