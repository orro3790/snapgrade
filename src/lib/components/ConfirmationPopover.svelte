<!-- src/lib/components/ConfirmationPopover.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { message, onConfirm, onCancel, children } = $props<{
		message: string;
		onConfirm: () => void;
		onCancel: () => void;
		children?: Snippet;
	}>();

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onCancel();
		} else if (event.key === 'Enter') {
			onConfirm();
		}
	}
</script>

<div class="confirmation-backdrop" role="presentation">
	<div
		role="alertdialog"
		aria-labelledby="confirmation-title"
		class="confirmation-popover"
		tabindex="-1"
	>
		<div class="confirmation-content">
			<p id="confirmation-title" class="message">{message}</p>

			{#if children}
				<div class="custom-content">
					{@render children()}
				</div>
			{/if}

			<div class="button-group">
				<button type="button" class="button secondary" onclick={onCancel} onkeydown={handleKeydown}>
					Cancel
				</button>
				<button type="button" class="button" onclick={onConfirm} onkeydown={handleKeydown}>
					Confirm
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.confirmation-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--background-modifier-cover);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: calc(var(--z-modal) + 1);
	}

	.confirmation-popover {
		background: var(--background-primary);
		border: var(--border-width-thin) solid var(--background-modifier-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		width: 90%;
		max-width: 320px;
		z-index: calc(var(--z-modal) + 2);
	}

	.confirmation-content {
		padding: var(--spacing-4);
	}

	.message {
		color: var(--text-normal);
		margin-bottom: var(--spacing-4);
		font-size: var(--font-size-base);
		line-height: var(--line-height-relaxed);
	}

	.custom-content {
		margin-bottom: var(--spacing-4);
	}

	.button-group {
		display: flex;
		gap: var(--spacing-2);
		justify-content: flex-end;
	}
</style>
