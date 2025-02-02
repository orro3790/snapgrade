<script lang="ts">
	import { statsStore, hoveredNodeType, type NodeType } from '$lib/stores/statsStore';

	let stats = $derived($statsStore);

	function handleInteraction(type: NodeType | null) {
		hoveredNodeType.set(type);
	}

	function handleKeydown(event: KeyboardEvent, type: NodeType) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleInteraction(type);
		}
	}
</script>

<div class="stats-container print-hide" role="complementary" aria-label="Document statistics">
	<div class="stat">
		<span class="label">Total:</span>
		<span class="value">{stats.total}</span>
	</div>

	<div
		class="stat"
		role="button"
		tabindex="0"
		aria-label="Show correction annotations"
		onmouseenter={() => handleInteraction('correction')}
		onmouseleave={() => handleInteraction(null)}
		onkeydown={(e) => handleKeydown(e, 'correction')}
	>
		<span class="label">Corrections:</span>
		<span class="value">{stats.corrections}</span>
	</div>

	<div
		class="stat"
		role="button"
		tabindex="0"
		aria-label="Show deletion annotations"
		onmouseenter={() => handleInteraction('deletion')}
		onmouseleave={() => handleInteraction(null)}
		onkeydown={(e) => handleKeydown(e, 'deletion')}
	>
		<span class="label">Deletions:</span>
		<span class="value">{stats.deletions}</span>
	</div>

	<div
		class="stat"
		role="button"
		tabindex="0"
		aria-label="Show addition annotations"
		onmouseenter={() => handleInteraction('addition')}
		onmouseleave={() => handleInteraction(null)}
		onkeydown={(e) => handleKeydown(e, 'addition')}
	>
		<span class="label">Additions:</span>
		<span class="value">{stats.additions}</span>
	</div>
</div>

<style>
	.stats-container {
		position: fixed;
		top: 1rem;
		right: 1rem;
		background-color: var(--background-secondary);
		padding: 0.75rem;
		border-radius: 0.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		font-size: 0.875rem;
		z-index: 100;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.stat {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.stat:hover {
		background-color: var(--interactive-hover);
	}

	.label {
		color: var(--text-muted);
	}

	.value {
		font-weight: 500;
		color: var(--text-normal);
	}

	/* Skip hover effects for total count */
	.stat:first-child {
		cursor: default;
	}

	.stat:first-child:hover {
		background-color: transparent;
	}

	/* Add print styles */
	:global(.print-hide) {
		@media print {
			display: none !important;
		}
	}
</style>
