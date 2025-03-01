// File: src/routes/api/students/delete/+server.ts
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
      return json({ success: false, message: 'Student ID is required' }, { status: 400 });
    }

    // Get the student to check if the user has permission to delete it
    const studentDoc = await adminDb.collection('students').doc(id).get();
    
    if (!studentDoc.exists) {
      return json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const studentData = studentDoc.data();
    if (!studentData) {
      return json({ success: false, message: 'Student data not found' }, { status: 404 });
    }

    // Get the class to check if the user has permission to delete this student
    const classDoc = await adminDb.collection('classes').doc(studentData.classId).get();
    
    if (!classDoc.exists) {
      return json({ success: false, message: 'Class not found' }, { status: 404 });
    }

    // Check if the user has permission to delete this student
    const userDoc = await adminDb.collection('users').doc(locals.uid).get();
    
    if (!userDoc.exists) {
      return json({ success: false, message: 'User not found' }, { status: 404 });
    }
    
    const userData = userDoc.data();
    
    if (!userData?.classes?.includes(studentData.classId)) {
      return json({ success: false, message: 'You do not have permission to delete this student' }, { status: 403 });
    }

    // Delete the student
    const batch = adminDb.batch();
    
    // Delete the student
    batch.delete(adminDb.collection('students').doc(id));
    
    // Remove the student from the class's students array
    batch.update(adminDb.collection('classes').doc(studentData.classId), {
      students: FieldValue.arrayRemove(id)
    });
    
    await batch.commit();

    return json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    return json({ success: false, message: 'Failed to delete student' }, { status: 500 });
  }
};