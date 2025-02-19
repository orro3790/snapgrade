/**
 * Current user state
 */
let user = $state(null);
/**
 * Sets the current user
 * @param newUser - The user to set, or null to clear
 */
function setUser(newUser) {
    user = newUser;
}
/**
 * Clears the current user (logs out)
 */
function clearUser() {
    user = null;
}
// Export the store interface
export const userStore = {
    get user() {
        return user;
    },
    setUser,
    clearUser
};
