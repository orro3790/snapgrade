<script lang="ts">
	import { statsStore, hoveredNodeType } from '$lib/stores/statsStore';
	import type { NodeType } from '$lib/stores/statsStore';

	let stats = $derived($statsStore);

	// Only show groups that have at least one item with a count > 0
	let visibleGroups = $derived(
		stats.groups.filter((group) => group.items.some((item) => item.count > 0))
	);

	function handleInteraction(type: NodeType) {
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
	<div class="stat total">
		<span class="label">Total Corrections:</span>
		<span class="value">{stats.total}</span>
	</div>

	{#each visibleGroups as group}
		<div class="group">
			<h3 class="group-title">{group.title}</h3>
			{#each group.items as item}
				{#if item.count > 0}
					<div
						class="stat"
						role="button"
						tabindex="0"
						aria-label="Show {item.label.toLowerCase()} annotations"
						onmouseenter={() => handleInteraction(item.type)}
						onmouseleave={() => handleInteraction(null)}
						onkeydown={(e) => handleKeydown(e, item.type)}
					>
						<span class="label">{item.label}:</span>
						<span class="value">{item.count}</span>
					</div>
				{/if}
			{/each}
		</div>
	{/each}
</div>

<style>
	.stats-container {
		position: fixed;
		top: 1rem;
		right: 1rem;
		background-color: var(--background-secondary);
		padding: 1rem;
		border-radius: 0.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		font-size: 0.875rem;
		z-index: 100;
		max-height: calc(100vh - 2rem);
		overflow-y: auto;
	}

	.group {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--border);
	}

	.group-title {
		font-size: 0.75rem;
		text-transform: uppercase;
		color: var(--text-muted);
		margin: 0 0 0.5rem;
		font-weight: 600;
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

	.stat:hover:not(.total) {
		background-color: var(--interactive-hover);
	}

	.total {
		font-weight: 500;
		cursor: default;
		margin-bottom: 0.5rem;
	}

	.label {
		color: var(--text-muted);
	}

	.value {
		font-weight: 500;
		color: var(--text-normal);
	}

	@media print {
		.print-hide {
			display: none !important;
		}
	}
</style>
