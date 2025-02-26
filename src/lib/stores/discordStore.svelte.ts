import { writable } from 'svelte/store';
import { discordConnectionSchema, type DiscordConnection } from '$lib/schemas/discord-consolidated';

function createDiscordStore() {
	const { subscribe, set } = writable<DiscordConnection>(
		discordConnectionSchema.parse({
			isConnected: false,
			status: null
		})
	);

	return {
		subscribe,
		set: (state: DiscordConnection) => set(discordConnectionSchema.parse(state)),
		reset: () =>
			set(
				discordConnectionSchema.parse({
					isConnected: false,
					status: null
				})
			)
	};
}

export const discordStore = createDiscordStore();