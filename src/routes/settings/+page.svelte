<script lang="ts">
	import DiscordConnect from '$lib/components/DiscordConnect.svelte';
	import { type PageData } from '../$types';

	let { data } = $props<{ data: PageData }>();

	const discordStatus = $derived(data.discord.status);
	const isConnected = $derived(data.discord.connected);
</script>

<div class="settings">
	<header>
		<h1>Settings</h1>
		<p>Manage your account settings and integrations.</p>
	</header>

	<section class="integrations">
		<h2>Integrations</h2>
		<div class="integration-list">
			<div class="integration-item">
				<DiscordConnect {isConnected} {discordStatus} />
			</div>
		</div>
	</section>
</div>

<style>
	.settings {
		max-width: 64rem;
		margin: 0 auto;
		padding: 2rem;
	}

	header {
		margin-bottom: 3rem;
	}

	h1 {
		font-size: 2rem;
		font-weight: 600;
		margin: 0;
	}

	header p {
		margin: 0.5rem 0 0;
		color: var(--text-2);
	}

	.integrations {
		background: var(--surface-1);
		border-radius: 0.5rem;
		padding: 2rem;
	}

	h2 {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 1.5rem;
	}

	.integration-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.integration-item {
		border-radius: 0.5rem;
		overflow: hidden;
	}
</style>
