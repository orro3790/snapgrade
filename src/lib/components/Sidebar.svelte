<!-- file: src/lib/components/Sidebar.svelte -->
<script lang="ts">
	import { sidebarStore, toggleSidebar } from '$lib/stores/sidebarStore';
	import { editorStore } from '$lib/stores/editorStore';

	// Use derived values for reactive state
	let isOpen = $derived($sidebarStore.isOpen);
	let canUndo = $derived($editorStore.undoStack.length > 0);
	let canRedo = $derived($editorStore.redoStack.length > 0);
	let canReset = $derived(!!$editorStore.initialState);

	// Handle keyboard navigation for the toggle button
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggleSidebar();
		}
	}
</script>

<aside
	class="sidebar"
	class:collapsed={!isOpen}
	role="navigation"
	aria-label="Editor controls and instructions"
>
	<div class="sidebar-content">
		<!-- Header -->
		<div class="header">
			<h2>Snapgrade</h2>
			<button
				type="button"
				class="toggle-button"
				onclick={() => toggleSidebar()}
				onkeydown={handleKeyDown}
				aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
				aria-expanded={isOpen}
				tabindex="0"
			>
				{isOpen ? '◀' : '▶'}
			</button>
		</div>

		<!-- Controls -->
		<div class="controls" aria-label="Editor controls">
			<div class="edit-controls">
				<button
					type="button"
					class="control-button"
					disabled={!canUndo}
					onclick={() => editorStore.undo()}
					title="Undo last change"
					aria-label="Undo"
				>
					↺
					{#if isOpen}
						<span class="button-text">Undo</span>
					{/if}
				</button>
				<button
					type="button"
					class="control-button"
					disabled={!canRedo}
					onclick={() => editorStore.redo()}
					title="Redo last undone change"
					aria-label="Redo"
				>
					↻
					{#if isOpen}
						<span class="button-text">Redo</span>
					{/if}
				</button>
				<button
					type="button"
					class="control-button reset-button"
					disabled={!canReset}
					onclick={() => console.log('Reset to original text function not yet implemented')}
					title="Reset to original text"
					aria-label="Reset"
				>
					⟲
					{#if isOpen}
						<span class="button-text">Reset</span>
					{/if}
				</button>
			</div>
		</div>

		<!-- Instructions -->
		{#if isOpen}
			<div class="instructions" role="region" aria-label="Correction instructions">
				<h3>Correction Marks:</h3>
				<ul>
					<li>
						For major changes: Use <code>-deleted text-</code> and <code>[new text]</code>
					</li>
					<li>
						For spelling corrections: Write the word, then the correction in exclamation marks:
						<code>word !correction!</code>
					</li>
				</ul>
			</div>
		{/if}

		<!-- Print Button -->
		<div class="print-section">
			<button
				type="button"
				class="print-button"
				onclick={() => window.print()}
				aria-label="Print document"
			>
				🖨️
				{#if isOpen}
					<span class="button-text">Print Document</span>
				{/if}
			</button>
		</div>
	</div>
</aside>

<style>
	.sidebar {
		position: fixed;
		left: 0;
		top: 0;
		height: 100vh;
		width: 300px;
		background-color: var(--background-secondary);
		border-right: 1px solid var(--background-modifier-border);
		transition:
			width 0.3s ease,
			transform 0.3s ease;
		overflow-x: hidden;
		z-index: 100;
	}

	.sidebar.collapsed {
		width: 60px;
	}

	.sidebar-content {
		width: 300px;
		height: 100%;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	h2 {
		color: var(--text-normal);
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
		opacity: 1;
		transition: opacity 0.2s ease;
	}

	.collapsed h2 {
		opacity: 0;
	}

	.toggle-button {
		background: var(--interactive-accent);
		border: none;
		color: var(--text-on-accent);
		width: 24px;
		height: 24px;
		border-radius: 4px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s ease;
	}

	.toggle-button:hover {
		background-color: var(--interactive-accent-hover);
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.edit-controls {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.control-button {
		background-color: var(--interactive-normal);
		color: var(--text-normal);
		border: 1px solid var(--background-modifier-border);
		padding: 0.5rem;
		border-radius: 4px;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: background-color 0.2s ease;
		width: 100%;
	}

	.control-button:hover:not(:disabled) {
		background-color: var(--interactive-hover);
	}

	.control-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.button-text {
		transition: opacity 0.2s ease;
	}

	.collapsed .button-text {
		display: none;
	}

	.instructions {
		color: var(--text-normal);
		transition: opacity 0.2s ease;
	}

	.instructions h3 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.instructions ul {
		list-style-type: none;
		padding: 0;
	}

	.instructions li {
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}

	code {
		background-color: var(--background-modifier-form-field);
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-family: monospace;
	}

	.print-section {
		margin-top: auto;
	}

	.print-button {
		background-color: var(--interactive-accent);
		color: var(--text-on-accent);
		border: none;
		padding: 0.5rem;
		border-radius: 4px;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		transition: background-color 0.2s ease;
	}

	.print-button:hover {
		background-color: var(--interactive-accent-hover);
	}

	@media print {
		.sidebar {
			display: none;
		}
	}
</style>
