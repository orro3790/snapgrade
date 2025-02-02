// File: src/lib/stores/userStore.ts
import { writable } from 'svelte/store';
import type { User } from '$lib/schemas/user';


export const userStore = writable<User | null>(null);
