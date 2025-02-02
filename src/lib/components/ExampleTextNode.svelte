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
		<div class="correction-wrapper">
			<div class="correction-text">{correctionText}</div>
			<div class="text-content">{text}</div>
		</div>
	{:else if type === 'deletion'}
		<div class="text-content deleted">{text}</div>
	{:else if type === 'addition'}
		<div class="text-content">{text}</div>
	{:else if type === 'empty'}
		<div class="text-content">+</div>
	{:else}
		<div class="text-content">{text}</div>
	{/if}
</span>

<style>
	/* Base text node styling - applies to all node types */
	.text-node {
		/* Use flexbox for better content alignment */
		display: flex;
		position: relative;
		cursor: pointer;

		/* Consistent padding for all nodes */
		padding: 0 0.25em 0 0.25em;
		border-radius: 0.2em;

		/* Smooth transitions for hover/active states */
		transition: all 0.2s ease;

		/* Default border style */
		border: 2px dotted var(--interactive-normal);

		/* Establish minimum dimensions */
		min-width: 1em;
	}

	/* Special node types (correction, deletion, addition) get solid borders */
	.text-node.correction {
		border: 2px solid var(--background-secondary);
		border-bottom: 2px dotted var(--text-error-hover);
	}

	.text-node.deletion,
	.text-node.addition {
		border: 2px solid var(--background-secondary);
	}

	/* Correction node specific styling */
	.correction-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		min-width: max-content;
		justify-content: center;
	}

	.correction-text {
		color: var(--text-accent);
		font-weight: bold;
		white-space: nowrap;
		min-width: max-content;
	}

	/* Base text content styling */
	.text-content {
		display: flex;
		align-items: end;
	}

	/* Deleted text styling */
	.deleted {
		color: var(--text-error);
		opacity: 0.75;
		position: relative;
		min-width: min-content;
	}

	/* Strikethrough line for deleted text */
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

	/* Punctuation nodes get special treatment */
	.punctuation {
		min-width: 1.5em;
		border: none;
		border-radius: 0;

		/* Only show border on bottom for subtle indication */
		border-bottom: 2px dotted var(--text-accent);

		/* Center punctuation marks */
		display: flex;
		justify-content: center;
	}

	/* Hover state for all nodes */
	.text-node:hover {
		background-color: var(--interactive-hover);
	}

	/* Active (selected) node state */
	.text-node.active {
		background-color: var(--interactive-active);
	}

	/* Currently editing node state */
	.text-node.highlighted {
		border: 2px dotted var(--interactive-highlight);
		z-index: 1; /* Ensure highlighted node appears above others */
	}

	/* Animation for save confirmation */
	.saved-flash {
		animation: saveFlash 0.3s ease-out;
	}

	@keyframes saveFlash {
		0% {
			background-color: var(--interactive-highlight);
		}
		100% {
			background-color: transparent;
		}
	}

	/* Highlight states for different node types */
	.text-node.highlight-correction,
	.text-node.highlight-deletion,
	.text-node.highlight-addition,
	.text-node.highlight-normal {
		border: 2px solid var(--text-accent);
		transition: border-color 0.2s ease;
	}

	/* Special case for punctuation deletion */
	.punctuation .deleted::before {
		width: 1.75em;
		left: 0%;
	}

	/* Added text styling */
	.addition {
		color: var(--background-modifier-success);
	}

	/* Empty node styling */
	.empty {
		width: 2em;
		border: 2px dotted var(--interactive-success);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--interactive-success);
	}

	/* Print-specific styles */
	@media print {
		* {
			color: #000000 !important;
		}
	}
</style>
