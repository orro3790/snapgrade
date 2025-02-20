<script lang="ts">
	import { modalStore } from '$lib/stores/modalStore.svelte';
	import DiscordConnect from './DiscordConnect.svelte';
	import type { DiscordConnection } from '$lib/schemas/discord';

	let { data } = $props<{ data: DiscordConnection }>();
</script>

<div class="modal-backdrop" role="presentation" onclick={() => modalStore.close()}></div>

<div class="discord-settings-modal" role="dialog" aria-labelledby="modal-title">
	<div class="modal-header">
		<h2 id="modal-title">Discord Settings</h2>
		<button
			type="button"
			class="close-button"
			onclick={() => modalStore.close()}
			aria-label="Close settings"
		>
			×
		</button>
	</div>

	<div class="modal-content">
		<DiscordConnect {data} />
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: var(--background-modifier-cover);
		z-index: var(--z-modal);
		backdrop-filter: blur(2px);
	}

	.discord-settings-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: var(--background-secondary);
		border-radius: var(--radius-lg);
		border: var(--border-width-thin) solid var(--background-modifier-border);
		box-shadow: var(--shadow-xl);
		z-index: var(--z-modal);
		width: 90%;
		max-width: 32rem;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-4);
		border-bottom: var(--border-width-thin) solid var(--background-modifier-border);
		background: var(--background-primary);
	}

	h2 {
		margin: 0;
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-medium);
		color: var(--text-normal);
	}

	.close-button {
		background: none;
		border: none;
		font-size: var(--font-size-2xl);
		cursor: pointer;
		padding: var(--spacing-2);
		color: var(--text-muted);
		transition: var(--transition-all);
		line-height: var(--line-height-none);
		border-radius: var(--radius-base);
	}

	.close-button:hover {
		color: var(--text-normal);
		background: var(--background-modifier-hover);
	}

	.modal-content {
		padding: var(--spacing-4);
		overflow-y: auto;
	}
</style>
