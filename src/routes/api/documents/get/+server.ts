// file: src/routes/api/documents/get/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '../$types';

export const GET: RequestHandler = async () => {
    return json({ message: 'You found me ;)' });
};
