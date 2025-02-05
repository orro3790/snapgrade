import { writable } from 'svelte/store';

type ModalType = 'login' | 'keyboard' | 'upload' | null;

function createModalStore() {
    const { subscribe, set } = writable<ModalType>(null);

    return {
        subscribe,
        open: (modalType: ModalType) => set(modalType),
        close: () => set(null)
    };
}

export const modalStore = createModalStore();
