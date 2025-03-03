<!-- src/lib/components/ConfirmationPopover.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from '$lib/components/Button.svelte';

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

<div class="confirmation-backdrop" role="presentation" onkeydown={handleKeydown}>
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
				<Button
					label="Cancel"
					type="secondary"
					size="small"
					ClickFunction={onCancel}
				/>
				<Button
					label="Confirm"
					type="primary"
					size="small"
					ClickFunction={onConfirm}
				/>
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
		backdrop-filter: blur(2px);
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
		animation: fadeIn var(--transition-duration-200) var(--transition-timing-ease-out);
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
	
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
