// File: src/lib/stores/settingsStore.ts
import { writable } from 'svelte/store';
import type { Settings } from '$lib/schemas/settings';

export const settingsStore = writable<Settings | null>(null);
