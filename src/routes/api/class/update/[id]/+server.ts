// File: src/routes/api/class/update/[id]/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/firebase/admin';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
  try {
    // Check authentication
    if (!locals.user || !locals.uid) {
      return json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const classId = params.id;
    if (!classId) {
      return json({ success: false, message: 'Class ID is required' }, { status: 400 });
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

    // Update existing class
    const classRef = adminDb.collection('classes').doc(classId);
    const classDoc = await classRef.get();
    
    if (!classDoc.exists) {
      return json({ success: false, message: 'Class not found' }, { status: 404 });
    }
    
    // Check if the user has permission to update this class
    const userDoc = await adminDb.collection('users').doc(locals.uid).get();
    
    if (!userDoc.exists) {
      return json({ success: false, message: 'User not found' }, { status: 404 });
    }
    
    const userData = userDoc.data();
    
    if (!userData?.classes?.includes(classId)) {
      return json({ success: false, message: 'You do not have permission to update this class' }, { status: 403 });
    }
    
    // Update the class
    await classRef.update({
      name: classData.name,
      description: classData.description || '',
      status: classData.status || 'active',
      'metadata.updatedAt': new Date()
    });

    return json({ 
      success: true, 
      message: 'Class updated successfully',
      data: {
        id: classId
      }
    });
  } catch (error) {
    console.error('Error updating class:', error);
    return json({ success: false, message: 'Failed to update class' }, { status: 500 });
  }
};