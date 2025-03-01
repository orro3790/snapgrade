// File: src/routes/api/students/create/+server.ts
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

    const studentData = body.data;
    
    // Validate required fields
    if (!studentData.name) {
      return json({ success: false, message: 'Student name is required' }, { status: 400 });
    }

    if (!studentData.classId) {
      return json({ success: false, message: 'Class ID is required' }, { status: 400 });
    }

    // Check if the class exists and the user has permission to add students to it
    const classRef = adminDb.collection('classes').doc(studentData.classId);
    const classDoc = await classRef.get();
    
    if (!classDoc.exists) {
      return json({ success: false, message: 'Class not found' }, { status: 404 });
    }
    
    const classData = classDoc.data();
    
    if (classData?.userId !== locals.uid) {
      return json({ success: false, message: 'You do not have permission to add students to this class' }, { status: 403 });
    }

    // Create or update student
    const batch = adminDb.batch();
    
    if (studentData.id) {
      // Update existing student
      const studentRef = adminDb.collection('students').doc(studentData.id);
      const studentDoc = await studentRef.get();
      
      if (!studentDoc.exists) {
        return json({ success: false, message: 'Student not found' }, { status: 404 });
      }
      
      const existingStudentData = studentDoc.data();
      
      // Check if the student belongs to a class owned by the user
      if (existingStudentData?.classId !== studentData.classId) {
        // If the class ID is changing, check if the user owns both classes
        const oldClassRef = adminDb.collection('classes').doc(existingStudentData?.classId);
        const oldClassDoc = await oldClassRef.get();
        
        if (oldClassDoc.exists && oldClassDoc.data()?.userId !== locals.uid) {
          return json({ success: false, message: 'You do not have permission to update this student' }, { status: 403 });
        }
        
        // Remove the student from the old class
        if (oldClassDoc.exists) {
          batch.update(oldClassRef, {
            students: FieldValue.arrayRemove(studentData.id)
          });
        }
        
        // Add the student to the new class
        batch.update(classRef, {
          students: FieldValue.arrayUnion(studentData.id)
        });
      }
      
      // Update the student
      batch.update(studentRef, {
        name: studentData.name,
        description: studentData.description || '',
        classId: studentData.classId,
        notes: studentData.notes || [],
        status: studentData.status || 'active',
        metadata: {
          ...existingStudentData?.metadata,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new student
      const newStudentRef = adminDb.collection('students').doc();
      const newStudentData = {
        id: newStudentRef.id,
        name: studentData.name,
        description: studentData.description || '',
        classId: studentData.classId,
        notes: studentData.notes || [],
        status: studentData.status || 'active',
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
      
      batch.set(newStudentRef, newStudentData);
      
      // Add the student to the class's students array
      batch.update(classRef, {
        students: FieldValue.arrayUnion(newStudentRef.id)
      });
    }
    
    await batch.commit();

    return json({ 
      success: true, 
      message: studentData.id ? 'Student updated successfully' : 'Student created successfully' 
    });
  } catch (error) {
    console.error('Error creating/updating student:', error);
    return json({ success: false, message: 'Failed to create/update student' }, { status: 500 });
  }
};