<script lang="ts">
	import { toastStore } from '$lib/stores/toastStore.svelte';

	let toasts = $derived($toastStore);
</script>

<div class="toast-container">
	{#each toasts as toast (toast.id)}
		<div
			class="toast"
			class:success={toast.type === 'success'}
			class:error={toast.type === 'error'}
			class:info={toast.type === 'info'}
			role="alert"
		>
			{toast.message}
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		display: flex;
		flex-direction: column;
		pointer-events: none;
	}

	.toast {
		width: 100%;
		padding: 0.75rem;
		color: var(--text-on-accent);
		font-size: 0.875rem;
		font-weight: 500;
		text-align: center;
		opacity: 0;
		transform: scale(0.98);
		animation: fade-in 0.5s ease forwards;
		will-change: transform, opacity;
	}

	.toast.success {
		background: var(--interactive-accent);
	}

	.toast.error {
		background: var(--background-modifier-error);
	}

	.toast.info {
		background: var(--background-modifier-form-field);
		color: var(--text-normal);
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			transform: scale(0.98);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	:global(.toast-leaving) {
		animation: fade-out 0.5s ease forwards;
	}

	@keyframes fade-out {
		from {
			opacity: 1;
			transform: scale(1);
		}
		to {
			opacity: 0;
			transform: scale(0.98);
		}
	}
</style>
