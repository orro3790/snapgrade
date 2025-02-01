<script lang="ts">
	import ExampleTextNode from './ExampleTextNode.svelte';
	import AltCap from '$lib/icons/AltCap.svelte';
	import CommaCap from '$lib/icons/CommaCap.svelte';
	import CtrlCap from '$lib/icons/CtrlCap.svelte';
	import EnterCap from '$lib/icons/EnterCap.svelte';
	import KeyCapZ from '$lib/icons/KeyCapZ.svelte';
	import KeyCapY from '$lib/icons/KeyCapY.svelte';
	import PlusCap from '$lib/icons/PlusCap.svelte';
	import Mouse from '$lib/icons/Mouse.svelte';
</script>

<div class="keyboard-controls">
	<!-- Make Correction -->
	<div class="control-row">
		<span class="label">Make Correction</span>
		<div class="sequence">
			<ExampleTextNode text="word" />
			<CommaCap />
			<div class="modal-preview">correction</div>
		</div>
	</div>

	<!-- Cross-out -->
	<div class="control-row">
		<span class="label">Cross-out</span>
		<div class="sequence">
			<AltCap />
			<PlusCap />
			<ExampleTextNode text="word" />
		</div>
	</div>

	<!-- Insert Word -->
	<div class="control-row">
		<span class="label">Insert Word</span>
		<div class="sequence">
			<CtrlCap />
			<PlusCap />
			<Mouse isLeftActive={true} />
		</div>
	</div>

	<!-- Remove Word -->
	<div class="control-row">
		<span class="label">Erase Word</span>
		<div class="sequence">
			<CtrlCap />
			<PlusCap />
			<Mouse isRightActive={true} />
		</div>
	</div>

	<!-- Undo -->
	<div class="control-row">
		<span class="label">Undo</span>
		<div class="sequence">
			<CtrlCap />
			<PlusCap />
			<KeyCapZ />
		</div>
	</div>

	<!-- Redo -->
	<div class="control-row">
		<span class="label">Redo</span>
		<div class="sequence">
			<CtrlCap />
			<PlusCap />
			<KeyCapY />
		</div>
	</div>
</div>

<style>
	.keyboard-controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		background: var(--background-secondary);
		border-radius: 0.5rem;
		max-width: 600px;
		margin: 0 auto;
	}

	.control-row {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.label {
		color: var(--text-normal);
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		min-width: 120px;
		text-align: center;
	}

	.sequence {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex: 1;
	}

	.modal-preview {
		background: var(--background-secondary-alt);
		border: 2px solid var(--text-accent);
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-family: monospace;
		color: var(--text-normal);
	}
</style>
