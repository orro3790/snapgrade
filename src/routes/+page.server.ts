// File: src/routes/+page.server.ts
// src/routes/+page.server.ts

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    return {
        user: locals.user || null,
        settings: locals.settings || null
    };
};
