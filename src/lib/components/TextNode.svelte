<!-- TextNode.svelte -->
<script lang="ts">
	import { editorStore } from '$lib/stores/editorStore';
	import { hoveredNodeType } from '$lib/stores/statsStore';
	import EditModal from './EditModal.svelte';
	import type { CorrectionType, CorrectionTag } from '$lib/stores/editorStore';

	const { node, isActive = false } = $props<{
		node: {
			id: string;
			text: string;
			type: CorrectionType;
			tag?: CorrectionTag;
			correctionText?: string;
			hasNextCorrection?: boolean;
			isPunctuation?: boolean;
			mispunctuation?: boolean;
			grammarNote?: string;
			formatType?: string;
			suggestionType?: string;
			footnotes?: string[];
		};
		isActive?: boolean;
	}>();

	// Helper function to get correction text for grammar types
	function getGrammarText(tag: CorrectionTag): string {
		switch (tag) {
			case 'plural':
				return 'pl.';
			case 'verb-tense':
				return 'v. tense';
			case 'subject-verb':
				return 'S.V.A';
			default:
				return '';
		}
	}

	// Helper function to get spacing correction text
	function getSpacingText(text: string): string {
		return text.includes('  ') ? '><' : '<>';
	}

	let isEditing = $state(false);
	let isSaved = $state(false);

	function handleContextMenu(event: MouseEvent) {
		event.preventDefault();
		if (event.ctrlKey && event.button === 2) {
			editorStore.removeNode(node.id);
			return false;
		}
	}

	function handleClick(event: MouseEvent) {
		if (event.button !== 0) return;

		if (event.ctrlKey) {
			editorStore.insertNodeAfter(node.id, '', 'empty');
			return;
		}

		if (event.altKey) {
			if (node.type === 'empty') return;

			if (node.type === 'deletion') {
				editorStore.updateNode(node.id, node.text, undefined, 'normal');
			} else {
				editorStore.updateNode(node.id, node.text, undefined, 'deletion');
			}
			return;
		}

		if (node.type === 'deletion') {
			editorStore.updateNode(node.id, node.text, undefined, 'normal');
			return;
		}

		editorStore.setActiveNode(node.id);
		if (isActive) {
			isEditing = true;
		}
	}

	function showSaveEffect() {
		isSaved = true;
		setTimeout(() => {
			isSaved = false;
		}, 300);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === '`' && !isEditing) {
			event.preventDefault();
			editorStore.updateNode(node.id, node.text, undefined, 'deletion');
			return;
		}

		if (event.key === 'Enter') {
			if (event.ctrlKey) {
				handleClick(new MouseEvent('click', { ctrlKey: true }));
			} else {
				isEditing = true;
			}
		}

		if (event.key === 'Delete' && event.ctrlKey) {
			editorStore.removeNode(node.id);
		}
	}

	function handleEditClose() {
		isEditing = false;
		editorStore.setActiveNode(null);
		showSaveEffect();
	}

	let classList = $derived(
		[
			'text-node',
			node.type,
			isActive ? 'active' : '',
			node.hasNextCorrection ? 'has-next-correction' : '',
			isEditing ? 'highlighted' : '',
			node.isPunctuation ? 'punctuation' : '',
			isSaved ? 'saved-flash' : '',
			$hoveredNodeType === node.type || $hoveredNodeType === node.tag
				? `highlight-${node.type}`
				: ''
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

<div
	class={classList}
	onclick={handleClick}
	oncontextmenu={handleContextMenu}
	onkeydown={handleKeydown}
	role="button"
	tabindex="0"
>
	{#if node.type === 'correction' || (node.type === 'correction' && node.tag === 'article')}
		<div class="correction-wrapper">
			<div class="correction-text">{node.correctionText}</div>
			<div class="text-content">{node.text}</div>
		</div>
	{:else if node.type === 'correction' && (node.tag === 'plural' || node.tag === 'verb-tense' || node.tag === 'subject-verb')}
		<div class="grammar-correction">
			<div class="grammar-text">{getGrammarText(node.tag)}</div>
			<div class="text-content">{node.text}</div>
		</div>
	{:else if node.type === 'correction' && node.tag === 'capital'}
		<div class="text-content">
			<span class="capital-first-letter">{node.text.charAt(0)}</span>
			<span>{node.text.slice(1)}</span>
		</div>
	{:else if node.type === 'correction' && node.tag === 'spacing'}
		<div class="spacing">
			<div class="spacing-text">{getSpacingText(node.text)}</div>
			<div class="text-content">{node.text}</div>
		</div>
	{:else if node.type === 'correction' && node.tag === 'punctuation'}
		<div class="correction-wrapper">
			<div class="correction-text">{node.correctionText}</div>
			<div class="text-content">{node.text}</div>
		</div>
	{:else if node.type === 'correction' && node.tag === 'paragraph'}
		<div class="correction-wrapper">
			<div class="correction-text">¶</div>
			<div class="text-content">{node.text}</div>
		</div>
	{:else if node.type === 'correction' && node.tag === 'merge'}
		<div class="merge-marker">
			<span class="merge-text">↑ Merge</span>
		</div>
	{:else if node.type === 'correction' && node.tag === 'reference'}
		<div class="reference-correction">
			<div class="reference-text">[citation needed]</div>
			<div class="text-content">{node.text}</div>
		</div>
	{:else if node.type === 'addition' && node.tag === 'wordchoice'}
		<div class="text-content wordchoice">{node.text}</div>
	{:else if node.type === 'deletion' && node.tag === 'redundant'}
		<div class="text-content redundant">{node.text}</div>
	{:else if node.type === 'deletion'}
		<div class="text-content deleted">{node.text}</div>
	{:else if node.type === 'empty'}
		<div class="text-content">+</div>
	{:else}
		<div class="text-content">{node.text}</div>
	{/if}
</div>

{#if isEditing}
	<EditModal {node} onClose={handleEditClose} />
{/if}

<style>
	/* Grammar correction styles */
	.grammar-correction {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}
	.grammar-text {
		color: var(--text-accent);
		font-size: 0.8em;
		font-weight: bold;
		white-space: nowrap;
		min-width: max-content;
	}

	/* Formatting correction styles */
	.capital-first-letter {
		text-decoration: underline;
		text-decoration-style: solid;
		text-decoration-thickness: 3px;
		text-decoration-color: var(--text-error);
	}
	.spacing {
		position: relative;
	}
	.spacing-text {
		position: absolute;
		top: -1em;
		font-size: 0.8em;
		color: var(--text-accent);
	}

	/* Organization styles */
	.merge-marker {
		display: flex;
		justify-content: center;
		color: var(--text-accent);
		margin: 0.5em 0;
	}
	.merge-text {
		font-size: 0.8em;
	}

	/* Reference styles */
	.reference-correction {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}
	.reference-text {
		color: var(--text-muted);
		font-size: 0.8em;
		font-style: italic;
	}

	/* Additional type styles */
	.wordchoice {
		border-bottom: 2px dotted var(--text-warning);
	}
	.redundant {
		text-decoration: line-through;
		text-decoration-color: var(--text-error);
	}

	/* Base text node styling */
	.text-node {
		display: flex;
		position: relative;
		cursor: pointer;
		padding: 0 0.25em 0 0.25em;
		border-radius: 0.2em;
		transition: all 0.2s ease;
		border: 2px dotted var(--interactive-normal);
		min-width: 1em;
	}

	/* Special node types get solid borders */
	.text-node.deletion,
	.text-node.addition {
		border: 2px solid var(--background-secondary);
	}

	.text-node.correction {
		border: 2px solid var(--background-secondary);
		border-bottom: 2px dotted var(--text-error-hover);
	}

	/* Punctuation nodes */
	.punctuation {
		min-width: 1.5em;
		border: none;
		border-radius: 0;
		display: flex;
		justify-content: center;
	}

	/* Hover state */
	.text-node:hover {
		background-color: var(--interactive-hover);
	}

	/* Active state */
	.text-node.active {
		background-color: var(--interactive-active);
	}

	/* Editing state */
	.text-node.highlighted {
		border: 2px dotted var(--interactive-highlight);
		z-index: 1;
	}

	/* Save animation */
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

	/* Correction node styling */
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

	/* Base text content */
	.text-content {
		display: flex;
		align-items: end;
	}

	/* Highlight states */
	.text-node[class*='highlight-'] {
		border: 2px solid var(--text-accent);
		transition: border-color 0.2s ease;
	}

	/* Deleted text */
	.deleted {
		color: var(--text-error);
		opacity: 0.75;
		position: relative;
		min-width: min-content;
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

	.punctuation .deleted::before {
		width: 1.75em;
		left: 0%;
	}

	/* Empty node */
	.empty {
		width: 2em;
		border: 2px dotted var(--interactive-success);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--interactive-success);
	}

	/* Print styles */
	@media print {
		* {
			color: #000000 !important;
		}
	}
</style>
