<script lang="ts">
	import ExampleTextNode from './ExampleTextNode.svelte';
	import AltCap from '$lib/icons/AltCap.svelte';
	import CtrlCap from '$lib/icons/CtrlCap.svelte';
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

	let iconSize = '64px';
</script>

<div class="keyboard-controls">
	<!-- Make Correction -->
	<div class="control-row">
		<span class="label">Make Correction</span>
		<div class="steps">
			<div class="step">
				<ExampleTextNode text="misstake" />
			</div>
			<div class="step">
				<span class="pointer-container">
					<Pointer stroke="var(--text-normal)" />
				</span>
			</div>
			<div class="step">
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
			<div class="last-step">
				<ExampleTextNode type="correction" text="misstake" correctionText="mistake" />
			</div>
		</div>
	</div>

	<!-- Cross-out -->
	<div class="control-row">
		<span class="label">Cross-out</span>
		<div class="steps">
			<AltCap size={iconSize} />

			<PlusCap size={iconSize} />

			<ExampleTextNode text="word" />
		</div>
	</div>

	<!-- Insert Word -->
	<div class="control-row">
		<span class="label">Insert Word</span>
		<div class="steps">
			<CtrlCap size={iconSize} />
			<PlusCap size={iconSize} />
			<Mouse isLeftActive={true} size={iconSize} />
		</div>
	</div>

	<!-- Erase Word -->
	<div class="control-row">
		<span class="label">Erase Word</span>
		<div class="steps">
			<CtrlCap size={iconSize} />

			<PlusCap size={iconSize} />

			<Mouse isRightActive={true} size={iconSize} />
		</div>
	</div>

	<!-- Undo -->
	<div class="control-row">
		<span class="label">Undo</span>
		<div class="steps">
			<CtrlCap size={iconSize} />
			<PlusCap size={iconSize} />
			<KeyCapZ size={iconSize} />
		</div>
	</div>

	<!-- Redo -->
	<div class="control-row">
		<span class="label">Redo</span>
		<div class="steps">
			<CtrlCap size={iconSize} />
			<PlusCap size={iconSize} />
			<KeyCapY size={iconSize} />
		</div>
	</div>
</div>

<style>
	.keyboard-controls {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1rem;
		background: var(--background-secondary);
		border-radius: 0.5rem;
		margin: 0 auto;
		min-width: min-content;
	}

	.control-row {
		display: grid;
		align-items: center;
		gap: 0.5rem;
		border-radius: 0.25rem;
		border: 1px solid var(--background-modifier-border);
		padding: 0.5rem;
	}

	.steps {
		display: grid;
		grid-template-columns: repeat(4, max-content);
		align-items: center;
		justify-content: center;
		gap: var(--spacing-2);
	}

	.step {
		display: flex;
		align-items: center;
		position: relative;
		padding-right: 1rem;
		border-right: 1px solid var(--background-modifier-border);
	}

	.last-step {
		padding-left: 1rem;
	}

	.pointer-container {
		position: absolute;
		width: 0;
		left: -2.5rem;
		top: 0.5rem;
		z-index: 1;
	}

	.label {
		padding: 0.25em 0.75em;
		border-radius: 0.25rem;
		background: var(--background-primary);
		border: 1px solid var(--border-modifier-border);
		color: var(--text-normal);
		font-size: 0.75rem;
		font-weight: 600;
		font-family: var(--brand-font);
		text-transform: lowercase;
		letter-spacing: 0.05em;
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
