// file: src/lib/utils/context.ts

import { getContext, setContext } from 'svelte';
import type { UserContext } from '$lib/types/context';


// Use a Symbol as the context key for better encapsulation
export const USER_CONTEXT_KEY = Symbol('user-context');

// Type-safe context getter
export function getUserContext() {
  return getContext<UserContext>(USER_CONTEXT_KEY);
}

// Type-safe context setter
export function setUserContext(context: UserContext) {
  return setContext<UserContext>(USER_CONTEXT_KEY, context);
} 