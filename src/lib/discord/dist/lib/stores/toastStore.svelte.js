import { writable } from 'svelte/store';
function createToastStore() {
    const { subscribe, update } = writable([]);
    return {
        subscribe,
        show: (toast) => {
            const id = Date.now();
            update(toasts => [...toasts, { ...toast, id }]);
            // Auto-remove toast after 3 seconds
            setTimeout(() => {
                update(toasts => toasts.filter(t => t.id !== id));
            }, 3000);
        }
    };
}
export const toastStore = createToastStore();
