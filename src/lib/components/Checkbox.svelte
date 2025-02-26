<!-- File: src/lib/components/Checkbox.svelte -->
<script lang="ts">
	// Props
	let {
		checked = $bindable(false),
		indeterminate = false,
		disabled = false,
		label = '',
		id = `checkbox-${Math.random().toString(36).substring(2, 9)}`,
		children = undefined,
		onclick = undefined
	} = $props();
</script>

<label class="checkbox-container" class:disabled>
	<input
		type="checkbox"
		{id}
		onclick={(e: MouseEvent) => {
			checked = (e.currentTarget as HTMLInputElement).checked;
			if (onclick) onclick(e);
		}}
		checked={checked}
		{indeterminate}
		{disabled}
		class="custom-checkbox"
	/>
	{#if label}
		<span class="checkbox-label">{label}</span>
	{/if}
	{@render children?.()}
</label>

<style>
	.checkbox-container {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-2);
		cursor: pointer;
	}

	.checkbox-container.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.custom-checkbox {
		appearance: none;
		-webkit-appearance: none;
		width: 16px;
		height: 16px;
		border: 2px solid var(--background-modifier-border);
		border-radius: var(--radius-sm);
		background-color: var(--background-alt);
		display: inline-block;
		position: relative;
		cursor: pointer;
		transition: var(--transition-all);
		padding: 0;
	}
	
	.custom-checkbox:checked {
		background-color: var(--interactive-accent);
		border-color: var(--interactive-accent);
	}
	
	.custom-checkbox:checked::after {
		content: '';
		position: absolute;
		left: 4px;
		top: 1px;
		width: 4px;
		height: 8px;
		border: solid white;
		border-width: 0 2px 2px 0;
		transform: rotate(45deg);
	}

	.custom-checkbox:indeterminate {
		background-color: var(--interactive-accent);
		border-color: var(--interactive-accent);
	}

	.custom-checkbox:indeterminate::after {
		content: '';
		position: absolute;
		left: 3px;
		top: 6px;
		width: 8px;
		height: 2px;
		background-color: white;
	}

	.custom-checkbox:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--interactive-accent-secondary);
	}

	.checkbox-label {
		font-size: var(--font-size-sm);
		color: var(--text-normal);
	}
</style>