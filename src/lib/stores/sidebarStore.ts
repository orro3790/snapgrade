// stores/sidebarStore.ts
import { writable } from 'svelte/store';

type SidebarState = {
  state: 'expanded' | 'collapsed';
  isMobile: boolean;
};

function createSidebarStore() {
  const { subscribe, set, update } = writable<SidebarState>({
    state: 'collapsed',
    isMobile: false
  });

  return {
    subscribe,
    toggle: () => update(store => ({
      ...store,
      state: store.state === 'expanded' ? 'collapsed' : 'expanded'
    })),
    collapse: () => update(store => ({
      ...store,
      state: 'collapsed'
    })),
    setMobile: (isMobile: boolean) => update(store => ({
      ...store,
      isMobile
    })),
    reset: () => set({ state: 'collapsed', isMobile: false })
  };
}

export const sidebarStore = createSidebarStore();
