<!-- src/lib/components/FormattingSidebar.svelte -->
<script lang="ts">
	import { editorStore } from '$lib/stores/editorStore.svelte';
	import type { StructuralRole } from '$lib/schemas/textNode';

	// Import icons
	import Heading from '$lib/icons/Heading.svelte';
	import List from '$lib/icons/List.svelte';
	import Indent from '$lib/icons/Indent.svelte';
	import Paragraph from '$lib/icons/Paragraph.svelte';

	// Define the FormatAction type
	type FormatAction = {
		id: string;
		Icon: any;
		role: StructuralRole;
		action: () => void;
	};

	let activeAction = $state<string | null>(null);
	let selectedNodes = $derived(editorStore.selectedNodes);

	// Helper function to insert spacer node
	function insertSpacer(nodeId: string, subtype: 'newline' | 'indent') {
		// First create the spacer node
		const spacerId = crypto.randomUUID();
		editorStore.insertNodeAfter(nodeId, '', 'spacer');
		// Then update it with the spacer data
		editorStore.updateNode(spacerId, '', undefined, { subtype });
		return spacerId;
	}

	// Define formatting actions
	const formatActions: FormatAction[] = [
		{
			id: 'heading',
			Icon: Heading,
			role: 'heading',
			action: () => {
				if (selectedNodes.length > 0) {
					const firstNode = selectedNodes[0];
					// Add newline before heading
					insertSpacer(firstNode.id, 'newline');
					// Update node with heading role
					editorStore.updateNode(
						firstNode.id,
						firstNode.text,
						undefined,
						undefined,
						'normal',
						'heading'
					);
				}
			}
		},
		{
			id: 'list',
			Icon: List,
			role: 'listItem',
			action: () => {
				if (selectedNodes.length > 0) {
					selectedNodes.forEach((node) => {
						// Add indent before list item
						insertSpacer(node.id, 'indent');
						// Update node with list role
						editorStore.updateNode(node.id, node.text, undefined, undefined, 'normal', 'listItem');
					});
				}
			}
		},
		{
			id: 'indent',
			Icon: Indent,
			role: 'paragraphStart',
			action: () => {
				if (selectedNodes.length > 0) {
					selectedNodes.forEach((node) => {
						// Add indent spacer
						insertSpacer(node.id, 'indent');
					});
				}
			}
		},
		{
			id: 'paragraph',
			Icon: Paragraph,
			role: 'paragraphStart',
			action: () => {
				if (selectedNodes.length > 0) {
					const firstNode = selectedNodes[0];
					// Add newline before paragraph
					insertSpacer(firstNode.id, 'newline');
					// Update node with paragraph role
					editorStore.updateNode(
						firstNode.id,
						firstNode.text,
						undefined,
						undefined,
						'normal',
						'paragraphStart'
					);
				}
			}
		}
	];

	function handleActionClick(action: FormatAction) {
		if (editorStore.isOperationAllowed('format')) {
			activeAction = activeAction === action.id ? null : action.id;
			action.action();
		}
	}

	function handleKeyNav(event: KeyboardEvent, action: FormatAction) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleActionClick(action);
		}
	}
</script>

<nav class="formatting-sidebar" aria-label="Formatting controls">
	<div class="nav-section">
		{#each formatActions as action}
			<button
				type="button"
				class="nav-item"
				class:active={activeAction === action.id}
				onclick={() => handleActionClick(action)}
				onkeydown={(e) => handleKeyNav(e, action)}
				aria-label={action.id}
			>
				<action.Icon
					stroke={activeAction === action.id ? 'var(--text-on-accent)' : 'var(--text-muted)'}
					size={20}
				/>
			</button>
		{/each}
	</div>
</nav>

<style>
	.formatting-sidebar {
		position: sticky;
		top: var(--spacing-4);
		height: fit-content;
		/* Remove width/min-width and let it be determined by content */
		padding: var(--spacing-2); /* Add padding around all sides */
		background: var(--background-primary);
		border: var(--border-width-thin) solid var(--background-modifier-border);
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		z-index: var(--z-drawer);
		margin-right: var(--spacing-4);
	}

	.nav-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-1);
		/* Add alignment */
		align-items: center;
	}

	.nav-item {
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		border-radius: var(--radius-base);
		background: none;
		color: var(--text-normal);
		cursor: pointer;
		transition: var(--transition-all);
		/* Adjust size to match icon size plus some minimal padding */
		width: 28px; /* 20px icon + 8px padding */
		height: 28px; /* 20px icon + 8px padding */
		padding: 4px; /* var(--spacing-1) equivalent */
	}
	.nav-item:hover {
		background: var(--background-modifier-hover);
		color: var(--text-normal);
	}

	.nav-item.active {
		background: var(--interactive-accent);
		color: var(--text-on-accent);
	}

	/* Print styles */
	@media print {
		.formatting-sidebar {
			display: none;
		}
	}
</style>
