// stores/sidebarStore.ts
import { writable } from 'svelte/store';

export const sidebarStore = writable({
  isOpen: true // Start with sidebar open
});

// Helper function to toggle sidebar state
export function toggleSidebar() {
  sidebarStore.update(state => ({
    ...state,
    isOpen: !state.isOpen
  }));
}
