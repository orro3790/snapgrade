import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateMultipleClassesWithStudents, generateRandomDocument } from '$lib/utils/seedGenerators';
import { randomUUID } from 'crypto';
import type { Class } from '$lib/schemas/class';
import type { Student } from '$lib/schemas/student';
import { adminDb } from '$lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const POST: RequestHandler = async ({ request }) => {
    const { userId } = await request.json();
    
    if (!userId) {
        return json({
            success: false,
            message: 'userId is required',
        }, { status: 400 });
    }
    try {
        // Generate 3 classes with their associated students for the specified user
        const classesWithStudents = generateMultipleClassesWithStudents(3, userId);

        // Create a batch with admin SDK
        const batch = adminDb.batch();

        // Add all classes, students, and documents to the batch
        for (const { class: classData, students } of classesWithStudents as Array<{ class: Class; students: Student[] }>) {
            // Add class document
            const classRef = adminDb.collection('classes').doc(classData.id);
            batch.set(classRef, classData);

            // Update user's classes array
            const userRef = adminDb.collection('users').doc(userId);
            batch.update(userRef, {
                classes: FieldValue.arrayUnion(classData.id)
            });

            // Add all students and their documents for this class
            for (const student of students) {
                const studentRef = adminDb.collection('students').doc(student.id);
                batch.set(studentRef, student);

                // Generate 1-3 random documents for each student
                const documentCount = Math.floor(Math.random() * 3) + 1;
                for (let i = 0; i < documentCount; i++) {
                    const document = generateRandomDocument({
                        studentId: student.id,
                        studentName: student.name,
                        className: classData.name,
                        userId,
                        id: randomUUID(),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        status: 'completed',
                        sourceType: 'manual'
                    });


                    const documentRef = adminDb.collection('documents').doc(document.id);
                    batch.set(documentRef, document);
                }
            }
        }

        // Commit all the batched operations
        await batch.commit();

        return json({
            success: true,
            message: 'Successfully seeded Snapgrade data',
            data: classesWithStudents
        });
    } catch (error) {
        console.error('Error seeding Snapgrade data:', error);
        return json({
            success: false,
            message: 'Failed to seed Snapgrade data',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
};
