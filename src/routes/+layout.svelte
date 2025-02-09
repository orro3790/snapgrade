<!-- +layout.svelte -->
<script lang="ts">
	import '../app.css';
	import { modalStore } from '$lib/stores/modalStore';
	import { sidebarStore } from '$lib/stores/sidebarStore';
	import KeyboardControls from '$lib/components/KeyboardControls.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';
	import DocumentLoadModal from '$lib/components/DocumentLoadModal.svelte';

	let {
		data,
		children
	}: {
		data: LayoutData;
		children: Snippet;
	} = $props();

	let documentToLoad = $state('');

	// Pass user data and uid to all child routes
	$effect(() => {
		if (data.user && data.uid) {
			console.log('User authenticated:', { user: data.user, uid: data.uid });
		}
	});

	// Handle keyboard shortcuts
	$effect(() => {
		const handleKeydown = (e: KeyboardEvent) => {
			// Toggle sidebar with Cmd/Ctrl + B
			if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
				e.preventDefault();
				sidebarStore.toggle();
			}
		};

		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});

	function handleModalClose() {
		modalStore.close();
	}
</script>

<!-- Layout structure -->
<Toast />

<div>
	<main class="main-content">
		{@render children()}
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
{:else if $modalStore === 'documentLoad'}
	<div class="modal-overlay" role="dialog" aria-modal="true">
		<button type="button" class="overlay-button" aria-label="Close modal" onclick={handleModalClose}
		></button>
		<div class="modal-content">
			<DocumentLoadModal documentBody={documentToLoad} />
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

	.main-content {
		width: 100%;
	}
</style>
