<script lang="ts">
	const {
		text = 'Example',
		type = 'normal',
		correctionText = 'mistake'
	} = $props<{
		text?: string;
		type?: 'normal' | 'deletion' | 'addition' | 'correction' | 'empty';
		correctionText?: string;
	}>();

	// Compute classes based on node type
	let classList = $derived(['text-node', type, 'example'].filter(Boolean).join(' '));
</script>

<span class={classList}>
	{#if type === 'correction'}
		<span class="correction-text">{correctionText}</span>
		<span class="underlined">{text}</span>
	{:else if type === 'deletion'}
		<span class="deleted">{text}</span>
	{:else if type === 'addition'}
		<span class="added">{text}</span>
	{:else if type === 'empty'}
		<span class="empty-placeholder">+</span>
	{:else}
		{text}
	{/if}
</span>

<style>
	/* Base container styling */
	.text-node {
		display: inline-flex;
		align-items: center;
		position: relative;
		min-height: 2em;
		margin: 0.5em 0.1em;
		padding: 0.1em 0.2em;
		border-radius: 0.2em;
		border: 2px dotted var(--interactive-normal);
		vertical-align: middle;
		cursor: pointer;
	}

	/* Example specific styling */
	.example {
		pointer-events: none;
		position: relative;
	}

	.example::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		cursor: pointer;
		z-index: 1;
	}

	/* Specific node type styling */
	.text-node.correction,
	.text-node.deletion,
	.text-node.addition {
		border: 2px solid var(--background-secondary);
	}

	/* Correction styling */
	.correction-text {
		position: absolute;
		top: -16px;
		left: 4px;
		color: var(--text-accent);
		font-weight: bold;
		white-space: nowrap;
		padding: 0 4px;
		z-index: 2;
	}

	.underlined {
		border-bottom: 1px dashed var(--text-error);
		opacity: 0.7;
		position: relative;
	}

	/* Deletion and addition styling */
	.deleted {
		color: var(--text-error);
		opacity: 0.75;
		position: relative;
	}

	.deleted::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: min(100%, 1.75em);
		height: 1px;
		background: var(--text-error);
		transform: translate(-50%, 0) rotate(135deg);
		transform-origin: center;
	}

	.added {
		color: var(--background-modifier-success);
		font-weight: bold;
	}

	/* Empty node styling */
	.empty {
		min-width: 1.5em;
		border: 2px dotted var(--interactive-normal);
		display: inline-flex;
		justify-content: center;
		align-items: center;
	}

	.empty-placeholder {
		color: var(--text-muted);
		font-size: 1.2em;
		font-weight: bold;
	}
</style>
