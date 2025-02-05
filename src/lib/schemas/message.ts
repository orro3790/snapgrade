import { z } from 'zod';

const messageSchema = z.object({
	studentName: z.string().min(1),
});

export type Message = typeof messageSchema;

export { messageSchema };


