import { writable } from 'svelte/store';
import { z } from 'zod';

/**
 * Defines all possible modal types in the application. This provides
 * type safety for our modal system by ensuring we only use valid modal names.
 */
export const modalTypeSchema = z.enum([
	'login',
	'keyboard',
	'upload',
	'classManager',
	'stagingArea',
	'documentLoad',
	'discordSettings'
]);

/**
 * Defines the shape of data that can be passed to any modal. Each modal can
 * have its own specific data requirements while maintaining type safety.
 */
export const modalDataSchema = z
	.object({
		documentToLoad: z.string().optional(),
		documentName: z.string().optional(),
		showConfirmation: z.boolean().optional(),
		confirmationMessage: z.string().optional()
	})
	.and(
		z
			.object({
				isConnected: z.boolean(),
				status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).nullable()
			})
			.partial()
	)
	.optional();

/**
 * Combines type and data into a complete modal state. This ensures our modal
 * always has a valid type and optional data that matches our schema.
 */
export const modalStateSchema = z.object({
	type: modalTypeSchema,
	data: modalDataSchema
});

export type ModalType = z.infer<typeof modalTypeSchema>;
export type ModalState = z.infer<typeof modalStateSchema> | null;

function createModalStore() {
	const { subscribe, set, update } = writable<ModalState>(null);

	return {
		subscribe,
		/**
		 * Opens a modal with optional data
		 */
		open: (type: ModalType, data?: z.infer<typeof modalDataSchema>) => {
			set({ type, data });
		},
		/**
		 * Shows a confirmation within the current modal
		 */
		showConfirmation: (message: string) => {
			update((state: ModalState): ModalState => {
				if (!state) return null;
				return {
					...state,
					data: {
						...state.data,
						showConfirmation: true,
						confirmationMessage: message
					}
				};
			});
		},
		/**
		 * Hides the current confirmation
		 */
		hideConfirmation: () => {
			update((state: ModalState): ModalState => {
				if (!state) return null;
				const { data, ...rest } = state;
				const newData = { ...data };
				delete newData.showConfirmation;
				delete newData.confirmationMessage;
				return {
					...rest,
					data: Object.keys(newData).length > 0 ? newData : undefined
				};
			});
		},
		/**
		 * Closes the modal and resets state
		 */
		close: () => set(null)
	};
}

export const modalStore = createModalStore();
