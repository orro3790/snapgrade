// File: src/routes/api/documents/+server.ts
import { json } from '@sveltejs/kit';
import { documentSchema } from '$lib/schemas/document';

export async function POST({ request }) {
    try {
        const { data } = await request.json();
        // Add to firestore collections "Documents", data should be in the shape of documentSchema
        return json({ 
            status: 'success',
            data: data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error:', error);
        return json(
            { status: 'error', message: 'Invalid request' },
            { status: 400 }
        );
    }
} 