// File: src/routes/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { classSchema } from '$lib/schemas/class';
import { studentSchema } from '$lib/schemas/student';
import { createDocumentSchema } from '$lib/schemas/document';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';

export const load: PageServerLoad = async ({ locals }) => {
	const [classForm, studentForm, documentForm] = await Promise.all([
		superValidate(zod(classSchema)),
		superValidate(zod(studentSchema)),
		superValidate(zod(createDocumentSchema)),
	]);


	return {
		user: locals.user || null,
		settings: locals.settings || null,
		uid: locals.uid || null,
		classForm,
		studentForm,
		documentForm,
	};
};

export const actions = {
	manageClass: async ({ request, fetch, cookies }) => {
		const form = await superValidate(request, zod(classSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const sessionCookie = cookies.get('session');
			if (!sessionCookie) {
				form.message = 'You must be logged in to manage classes';
				return fail(401, { form });
			}

			const response = await fetch('/api/class/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Cookie: `session=${sessionCookie}`
				},
				body: JSON.stringify({
					data: {
						...form.data,
						status: 'active' as const
					}
				})
			});

			const result = await response.json();

			if (!response.ok) {
				form.message = result.message || 'Failed to manage class';
				return fail(response.status, { form });
			}

			form.message = form.data?.id ? 'Class updated successfully' : 'Class created successfully';
			return { form };
		} catch (error) {
			console.error('Class management error:', error);
			form.message = 'An unexpected error occurred';
			return fail(500, { form });
		}
	},

	manageStudent: async ({ request, fetch, cookies }) => {
		const form = await superValidate(request, zod(studentSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const sessionCookie = cookies.get('session');
			if (!sessionCookie) {
				form.message = 'You must be logged in to manage students';
				return fail(401, { form });
			}

			const response = await fetch('/api/students/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Cookie: `session=${sessionCookie}`
				},
				body: JSON.stringify({
					data: {
						...form.data,
						status: 'active' as const
					}
				})
			});

			const result = await response.json();

			if (!response.ok) {
				form.message = result.message || 'Failed to manage student';
				return fail(response.status, { form });
			}

			form.message = form.data?.id
				? 'Student updated successfully'
				: 'Student created successfully';
			return { form };
		} catch (error) {
			console.error('Student management error:', error);
			form.message = 'An unexpected error occurred';
			return fail(500, { form });
		}
	},

	uploadDocument: async ({ request, fetch, cookies }) => {
		const form = await superValidate(request, zod(createDocumentSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const sessionCookie = cookies.get('session');
			if (!sessionCookie) {
				form.message = 'You must be logged in to upload documents';
				return fail(401, { form });
			}

			const response = await fetch('/api/documents/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Cookie: `session=${sessionCookie}`
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
	},
	stageDocument: async ({ request, fetch, cookies }) => {
		const form = await superValidate(request, zod(createDocumentSchema));
		console.log('Stage document form validation:', form);


		if (!form.valid) {
			console.log('Form validation failed:', form.errors);
			return fail(400, { form });
		}

		try {
			const sessionCookie = cookies.get('session');
			if (!sessionCookie) {
				return fail(401, {
					form,
					error: 'You must be logged in to stage documents'
				});
			}

			const response = await fetch(`/api/documents/create`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Cookie: `session=${sessionCookie}`
				},
				body: JSON.stringify({
					data: {
						...form.data,
						status: 'editing',
						title: form.data.title || '',
						subtitle: form.data.subtitle || '',
						headings: form.data.headings || []
					}
				})
			});

			const result = await response.json();

			if (!response.ok) {
				return fail(response.status, {
					form,
					error: result.message || 'Failed to stage document'
				});
			}

			return {
				form,
				success: true
			};
		} catch (error) {
			console.error('Staging error:', error);
			return fail(500, {
				form,
				error: 'An unexpected error occurred'
			});
		}
	}
} satisfies Actions;
