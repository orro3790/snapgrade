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
	import Pointer from '$lib/icons/Pointer.svelte';
	import { typewriter } from '$lib/utils/typewriter';

	// Update messages to use the | character to indicate where corrections should happen
	const exampleTextNodeText = ['mistake', 'misstake'];

	let i = $state(exampleTextNodeText.length - 1); // Start at last index

	$effect(() => {
		const interval = setInterval(() => {
			i += 1;
			i %= exampleTextNodeText.length;
		}, 5000); // Increased interval to account for deletion animation

		return () => {
			clearInterval(interval);
		};
	});
</script>

<div class="keyboard-controls">
	<!-- Make Correction -->
	<div class="control-row">
		<span class="label">Make Correction</span>
		<ExampleTextNode type="correction" text="misstake" correctionText="mistake" />
		<div class="sequence">
			<ExampleTextNode text="word" />
			<span class="pointer-container">
				<Pointer stroke="var(--text-normal)" />
			</span>
			<CommaCap />
			<div class="modal-preview">
				<div class="inner-wrapper">
					{#key i}
						<p in:typewriter={{ speed: 1, deleteSpeed: 2 }}>
							{exampleTextNodeText[i] || ''}
						</p>
					{/key}
				</div>
			</div>
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

	.pointer-container {
		position: relative;
		/* Hide the container */
		width: 0;
		left: -1.4rem;
		top: 1.2rem;
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
		border: 0.125rem solid var(--text-accent); /* 2px → 0.125rem */
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-family: monospace;
		color: var(--text-normal);
		position: relative;
		width: 6.25rem;
		height: 2.25rem;
	}

	.modal-preview .inner-wrapper {
		display: flex;
		height: 100%;
		width: fit-content;
		position: relative;
	}

	.modal-preview .inner-wrapper ::after {
		content: '';
		position: absolute;
		top: 0.25rem;
		bottom: 0.25rem;
		width: 0.1rem;
		background-color: var(--text-normal);
		animation: blink 1s step-end infinite;
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
</style>
