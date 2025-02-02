import type { User } from '$lib/schemas/user';
import type { Settings } from '$lib/schemas/settings';

export type UserContext = {
  user: User | null;
  settings: Settings | null;
} 