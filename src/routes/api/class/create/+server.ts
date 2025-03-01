// File: src/routes/api/class/create/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.user || !locals.uid) {
      return json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    
    if (!body.data) {
      return json({ success: false, message: 'Invalid request format' }, { status: 400 });
    }

    const classData = body.data;
    
    // Validate required fields
    if (!classData.name) {
      return json({ success: false, message: 'Class name is required' }, { status: 400 });
    }

    // Create new class - this endpoint now only handles creation
    const batch = adminDb.batch();
    
    // If an ID is provided, reject the request - updates should use the update endpoint
    if (classData.id && classData.id.trim() !== '') {
      return json({
        success: false,
        message: 'To update an existing class, use the /api/class/update/[id] endpoint'
      }, { status: 400 });
    }
    
    // Create new class
    const newClassRef = adminDb.collection('classes').doc();
    const newClassData = {
      id: newClassRef.id,
      name: classData.name,
      description: classData.description || '',
      status: classData.status || 'active',
      students: [],
      userId: locals.uid,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
    
    batch.set(newClassRef, newClassData);
    
    // Add the class to the user's classes array
    const userRef = adminDb.collection('users').doc(locals.uid);
    batch.update(userRef, {
      classes: FieldValue.arrayUnion(newClassRef.id)
    });
    
    await batch.commit();

    return json({ 
      success: true, 
      message: 'Class created successfully',
      data: {
        id: newClassRef.id
      }
    });
  } catch (error) {
    console.error('Error creating class:', error);
    return json({ success: false, message: 'Failed to create class' }, { status: 500 });
  }
};