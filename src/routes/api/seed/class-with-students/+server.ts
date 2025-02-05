import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateMultipleClassesWithStudents } from '$lib/utils/seedGenerators';
import { adminDb } from '$lib/firebase/admin';

export const POST: RequestHandler = async () => {
    try {
        // Generate 3 classes with their associated students
        const classesWithStudents = generateMultipleClassesWithStudents(3);

        // Create a batch with admin SDK
        const batch = adminDb.batch();

        // Add all classes and students to the batch
        for (const { class: classData, students } of classesWithStudents) {
            // Add class document
            const classRef = adminDb.collection('classes').doc(classData.metadata.id);
            batch.set(classRef, classData);

            // Add all students for this class
            for (const student of students) {
                const studentRef = adminDb.collection('students').doc(student.metadata.id);
                batch.set(studentRef, student);
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