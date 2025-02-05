// File: src/routes/+page.server.ts

import type { PageServerLoad, Actions } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { createDocumentSchema } from '$lib/schemas/document';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
    const form = await superValidate(zod(createDocumentSchema));

    return {
        user: locals.user || null,
        settings: locals.settings || null,
        form
    };
};



export const actions = {
	uploadDocument: async ({ request, fetch, cookies }) => {
		const form = await superValidate(request, zod(createDocumentSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			// Get the session cookie
			const sessionCookie = cookies.get('session');
			if (!sessionCookie) {
				form.message = 'You must be logged in to upload documents';
				return fail(401, { form });
			}

			// Send the data to our API endpoint
			const response = await fetch('/api/documents/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Cookie': `session=${sessionCookie}`
				},
				body: JSON.stringify({
					data: {
						...form.data,
						status: 'staged' as const
					}
				})
			});

			const result = await response.json();

			if (!response.ok) {
				form.message = result.message || 'Failed to upload document';
				return fail(response.status, { form });
			}

			form.message = 'Document uploaded successfully';
			return { form };
		} catch (error) {
			console.error('Upload error:', error);
			form.message = 'An unexpected error occurred';
			return fail(500, { form });
		}
	}
} satisfies Actions;
