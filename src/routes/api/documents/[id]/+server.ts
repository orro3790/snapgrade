import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/firebase/admin';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.uid) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const docId = params.id;
    const docRef = adminDb.collection('documents').doc(docId);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return json({ error: 'Document not found' }, { status: 404 });
    }
    
    const document = {
      id: docSnap.id,
      ...docSnap.data()
    };
    
    return json({ document });
  } catch (error) {
    console.error('Error loading document:', error);
    return json({ error: 'Failed to load document' }, { status: 500 });
  }
};