// File: src/routes/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { classSchema } from '$lib/schemas/class';
import { studentSchema } from '$lib/schemas/student';
import { createDocumentSchema } from '$lib/schemas/document';
import { activitySchema } from '$lib/schemas/activity';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { adminDb } from '$lib/firebase/admin';

export const load: PageServerLoad = async ({ locals, url }) => {
	const [classForm, studentForm, documentForm, activityForm] = await Promise.all([
		superValidate(zod(classSchema)),
		superValidate(zod(studentSchema)),
		superValidate(zod(createDocumentSchema)),
		superValidate(zod(activitySchema))
	]);

	// Get Discord connection status if user is logged in
	let discordStatus = null;
	let isConnected = false;

	if (locals.user) {
		const mappingQuery = await adminDb
			.collection('discord_mappings')
			.where('firebaseUid', '==', locals.user.id)
			.limit(1)
			.get();

		isConnected = !mappingQuery.empty;
		discordStatus = isConnected ? mappingQuery.docs[0].data().status : null;
	}

	// Check for modal parameter
	const modal = url.searchParams.get('modal');
	const error = url.searchParams.get('error');
	const discord = url.searchParams.get('discord');

	return {
		user: locals.user || null,
		settings: locals.settings || null,
		uid: locals.uid || null,
		classForm,
		studentForm,
		documentForm,
		activityForm,
		discord: {
			isConnected,
			status: discordStatus
		},
		modal: modal === 'discordSettings' ? {
			type: 'discordSettings' as const,
			error,
			discord
		} : null
	};
};

export const actions = {
	getActivity: async ({ request, fetch, cookies }) => {
		const form = await superValidate(request, zod(activitySchema));
		
		if (!form.valid) {
			return fail(400, { form });
		}
		
		try {
			const sessionCookie = cookies.get('session');
			if (!sessionCookie) {
				form.message = 'You must be logged in to view activity';
				return fail(401, { form });
			}
			
			// If a specific session ID is requested, return it
			if (form.data.sessionId) {
				return { form };
			}
			
			// Otherwise, apply filters and return activity list
			const filter = form.data.filter || { limit: 10 };
			const queryParams = new URLSearchParams();
			
			if (filter && 'status' in filter && filter.status) {
				queryParams.set('status', filter.status);
			}
			
			if (filter && 'dateRange' in filter && filter.dateRange?.start) {
				queryParams.set('startDate', filter.dateRange.start.toISOString());
			}
			
			if (filter && 'dateRange' in filter && filter.dateRange?.end) {
				queryParams.set('endDate', filter.dateRange.end.toISOString());
			}
			
			if (filter && 'limit' in filter && filter.limit) {
				queryParams.set('limit', filter.limit.toString());
			}
			
			const response = await fetch(`/api/document-sessions?${queryParams.toString()}`, {
				headers: {
					Cookie: `session=${sessionCookie}`
				}
			});
			
			if (!response.ok) {
				form.message = 'Failed to fetch activity data';
				return fail(response.status, { form });
			}
			
			return { form };
		} catch (error) {
			console.error('Activity fetch error:', error);
			form.message = 'An unexpected error occurred';
			return fail(500, { form });
		}
	},
	
	manageClass: async ({ request, fetch, cookies }) => {
		const form = await superValidate(request, zod(classSchema));
		console.log('Class form data received:', form.data);
		console.log('Class form ID present:', Boolean(form.data.id), 'ID value:', form.data.id);

		if (!form.valid) {
			console.log('Class form validation failed:', form.errors);
			return fail(400, { form });
		}

		try {
			const sessionCookie = cookies.get('session');
			if (!sessionCookie) {
				form.message = 'You must be logged in to manage classes';
				return fail(401, { form });
			}

			// Check if we're updating or creating
			const isUpdating = form.data.id && form.data.id.trim() !== '';
			console.log('Is updating class:', isUpdating, 'ID:', form.data.id);
			
			// Prepare metadata properly
			const metadata = form.data.metadata || {};
			
			// Ensure we're sending the correct data format and preserving ID
			const requestData = {
				data: {
					...form.data,
					status: 'active',
					// For updates, ensure ID is preserved exactly as is
					// For creates, either use empty string or null
					id: isUpdating ? form.data.id : '',
					metadata: {
						createdAt: isUpdating ? metadata.createdAt : new Date(), // Preserve createdAt for existing items
						updatedAt: new Date() // Always update the timestamp
					}
				}
			};
			
			console.log('Class data being sent to API:', JSON.stringify(requestData));

			// Use different endpoints based on operation
			const endpoint = isUpdating 
				? `/api/class/update/${form.data.id}`
				: '/api/class/create';
				
			const method = isUpdating ? 'PUT' : 'POST';
			
			console.log(`Using endpoint: ${endpoint} with method: ${method}`);

			const response = await fetch(endpoint, {
				method,
				headers: {
					'Content-Type': 'application/json',
					Cookie: `session=${sessionCookie}`
				},
				body: JSON.stringify(requestData)
			});

			// Handle non-JSON responses
			let result;
			const contentType = response.headers.get('content-type');
			if (contentType && contentType.includes('application/json')) {
				result = await response.json();
			} else {
				const text = await response.text();
				console.error('Non-JSON response:', text);
				throw new Error('Invalid response format from server');
			}

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
		console.log('Student form data received:', form.data);
		console.log('Student form ID present:', Boolean(form.data.id), 'ID value:', form.data.id);

		if (!form.valid) {
			console.log('Student form validation failed:', form.errors);
			return fail(400, { form });
		}

		try {
			const sessionCookie = cookies.get('session');
			if (!sessionCookie) {
				form.message = 'You must be logged in to manage students';
				return fail(401, { form });
			}

			// Check if we're updating or creating
			const isUpdating = form.data.id && form.data.id.trim() !== '';
			console.log('Is updating student:', isUpdating, 'ID:', form.data.id);
			
			// Prepare metadata properly
			const metadata = form.data.metadata || {};
			
			// Ensure we're sending the correct data format and preserving ID
			const requestData = {
				data: {
					...form.data,
					status: 'active',
					// For updates, ensure ID is preserved exactly as is
					// For creates, either use empty string or null
					id: isUpdating ? form.data.id : '',
					metadata: {
						createdAt: isUpdating ? metadata.createdAt : new Date(),
						updatedAt: new Date()
					}
				}
			};
			
			console.log('Student data being sent to API:', requestData);

			// Note: We always use the create endpoint, which handles both create and update
			const response = await fetch('/api/students/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Cookie: `session=${sessionCookie}`
				},
				body: JSON.stringify(requestData)
			});

			// Handle non-JSON responses
			let result;
			const contentType = response.headers.get('content-type');
			if (contentType && contentType.includes('application/json')) {
				result = await response.json();
			} else {
				const text = await response.text();
				console.error('Non-JSON response:', text);
				throw new Error('Invalid response format from server');
			}

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
	},
	
	manageDocuments: async ({ request, fetch, cookies }) => {
		try {
			const data = await request.json();
			const { action, documentIds, classId, className, studentId, studentName } = data;
			
			const sessionCookie = cookies.get('session');
			if (!sessionCookie) {
				return fail(401, {
					error: 'You must be logged in to manage documents'
				});
			}
			
			const response = await fetch(`/api/documents/batch`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Cookie: `session=${sessionCookie}`
				},
				body: JSON.stringify({
					action,
					documentIds,
					classId,
					className,
					studentId,
					studentName
				})
			});
			
			const result = await response.json();
			
			if (!response.ok) {
				return fail(response.status, {
					error: result.error?.message || 'Failed to process documents'
				});
			}
			
			return {
				success: true,
				message: result.message || `Successfully ${action}ed ${documentIds.length} document(s)`
			};
		} catch (error) {
			console.error('Document management error:', error);
			return fail(500, {
				error: 'An unexpected error occurred'
			});
		}
	}
} satisfies Actions;
