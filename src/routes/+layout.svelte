<!-- +layout.svelte -->
<script lang="ts">
	import '../app.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { modalStore } from '$lib/stores/modalStore';
	import { userStore } from '$lib/stores/userStore';
	import { settingsStore } from '$lib/stores/settingsStore';
	import LoginModal from '$lib/components/LoginModal.svelte';
	import KeyboardControls from '$lib/components/KeyboardControls.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import type { PageData } from './$types';
	import { setUserContext } from '$lib/utils/context';
	import type { User } from '$lib/schemas/user';
	import type { Settings } from '$lib/schemas/settings';

	let { children, data } = $props<{
		data: PageData & {
			user?: User | null;
			settings?: Settings | null;
		};
	}>();

	// Initialize state and stores
	let user = $state(data?.user ?? null);
	let settings = $state(data?.settings ?? null);

	// Initialize stores with data
	$effect(() => {
		userStore.set(user);
		settingsStore.set(settings);
	});

	// Create derived context
	let context = $derived({
		user,
		settings
	});

	// Set and update context when changes occur
	$effect(() => {
		setUserContext(context);
	});

	// Modal handlers
	function handleModalClose() {
		modalStore.close();
	}
</script>

<!-- Layout structure -->
<div class="flex min-h-screen">
	{#if true}
		<Sidebar />
	{/if}
	<main class="flex-1">
		{@render children()}
	</main>
</div>

<Toast />

<!-- Modal management -->
{#if $modalStore === 'login'}
	<div class="modal-overlay" role="dialog" aria-modal="true">
		<button type="button" class="overlay-button" aria-label="Close modal" onclick={handleModalClose}
		></button>
		<div class="modal-content">
			<LoginModal {data} />
		</div>
	</div>
{:else if $modalStore === 'keyboard'}
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
