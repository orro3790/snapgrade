// File: src/routes/api/class/delete/+server.ts
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

    const { id } = await request.json();

    if (!id) {
      return json({ success: false, message: 'Class ID is required' }, { status: 400 });
    }

    // Get the class to check if the user has permission to delete it
    const classDoc = await adminDb.collection('classes').doc(id).get();
    
    if (!classDoc.exists) {
      return json({ success: false, message: 'Class not found' }, { status: 404 });
    }

    // Check if the user has permission to delete this class
    const userDoc = await adminDb.collection('users').doc(locals.uid).get();
    
    if (!userDoc.exists) {
      return json({ success: false, message: 'User not found' }, { status: 404 });
    }
    
    const userData = userDoc.data();
    
    if (!userData?.classes?.includes(id)) {
      return json({ success: false, message: 'You do not have permission to delete this class' }, { status: 403 });
    }

    // Get all students in this class
    const studentsSnapshot = await adminDb
      .collection('students')
      .where('classId', '==', id)
      .get();

    // Delete all students in this class
    const batch = adminDb.batch();
    
    studentsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete the class
    batch.delete(adminDb.collection('classes').doc(id));
    
    // Remove the class from the user's classes array
    batch.update(adminDb.collection('users').doc(locals.uid), {
      classes: FieldValue.arrayRemove(id)
    });
    
    await batch.commit();

    return json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    return json({ success: false, message: 'Failed to delete class' }, { status: 500 });
  }
};