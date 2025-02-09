// stores/sidebarStore.ts
import { writable } from 'svelte/store';

type SidebarState = {
  state: 'expanded' | 'collapsed';
  isMobile: boolean;
};

function createSidebarStore() {
  const { subscribe, set, update } = writable<SidebarState>({
    state: 'expanded',
    isMobile: false
  });

  return {
    subscribe,
    toggle: () => update(state => ({
      ...state,
      state: state.state === 'expanded' ? 'collapsed' : 'expanded'
    })),
    setMobile: (isMobile: boolean) => update(state => ({ ...state, isMobile })),
    reset: () => set({ state: 'expanded', isMobile: false })
  };
}

export const sidebarStore = createSidebarStore();
