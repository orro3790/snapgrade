import { writable } from 'svelte/store';

type Toast = {
    message: string;
    type: 'success' | 'error' | 'info';
    id?: number;
};

function createToastStore() {
    const { subscribe, update } = writable<Toast[]>([]);

    return {
        subscribe,
        show: (toast: Toast) => {
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