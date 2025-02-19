// Create the state using $state rune
const state = $state({
    state: 'collapsed',
    isMobile: false
});
/**
 * Toggles the sidebar between expanded and collapsed states
 */
function toggle() {
    state.state = state.state === 'expanded' ? 'collapsed' : 'expanded';
}
/**
 * Collapses the sidebar
 */
function collapse() {
    state.state = 'collapsed';
}
/**
 * Sets the mobile state of the sidebar
 * @param isMobile - Whether the sidebar is in mobile mode
 */
function setMobile(isMobile) {
    state.isMobile = isMobile;
}
/**
 * Resets the sidebar to its default state
 */
function reset() {
    state.state = 'collapsed';
    state.isMobile = false;
}
// Export the store interface
export const sidebarStore = {
    get state() {
        return state;
    },
    toggle,
    collapse,
    setMobile,
    reset
};
