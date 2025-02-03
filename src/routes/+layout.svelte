<!-- +layout.svelte -->
<script lang="ts">
	import '../app.css';
	import { modalStore } from '$lib/stores/modalStore';
	import KeyboardControls from '$lib/components/KeyboardControls.svelte';
	import Toast from '$lib/components/Toast.svelte';

	function handleModalClose() {
		modalStore.close();
	}
</script>

<!-- Layout structure -->
<Toast />

<div class="flex min-h-screen">
	<main class="flex-1">
		<slot />
	</main>
</div>

<!-- Modal management -->
{#if $modalStore === 'keyboard'}
	<div class="modal-overlay" role="dialog" aria-modal="true">
		<button type="button" class="overlay-button" aria-label="Close modal" onclick={handleModalClose}
		></button>
		<div class="modal-content">
			<KeyboardControls />
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.overlay-button {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: transparent;
		border: none;
		cursor: pointer;
	}

	.modal-content {
		position: relative;
		max-width: 90vw;
		max-height: 90vh;
		overflow-y: auto;
		z-index: 1;
	}
</style>
