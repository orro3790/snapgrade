<script lang="ts">
	import type { PageData } from './$types';
	import TextEditor from '$lib/components/TextEditor.svelte';
	import { userStore } from '$lib/stores/userStore.svelte';
	import { settingsStore } from '$lib/stores/settingsStore.svelte';
	import { modalStore } from '$lib/stores/modalStore.svelte';
	import { sidebarStore } from '$lib/stores/sidebarStore.svelte';
	import { editorStore, EditorMode } from '$lib/stores/editorStore.svelte';
	import { discordStore } from '$lib/stores/discordStore.svelte';
	import UploadDocument from './UploadDocument.svelte';
	import ClassManager from './ClassManager.svelte';
	import DiscordSettingsModal from '$lib/components/DiscordSettingsModal.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import SidebarToggle from '$lib/icons/SidebarToggle.svelte';
	import Pencil from '$lib/icons/Pencil.svelte';
	import Paragraph from '$lib/icons/Paragraph.svelte';

	let { data } = $props<{ data: PageData }>();

	// Initialize state and stores
	let user = $state(data?.user ?? null);
	let settings = $state(data?.settings ?? null);
	let documentName = $derived(editorStore.documentName);
	let currentMode = $derived(editorStore.mode);

	// Initialize stores with data
	$effect(() => {
		userStore.setUser(user);
		settingsStore.set(settings);
		discordStore.set(data.discord);

		// Open Discord settings modal if redirected from OAuth
		if (data.modal?.type === 'discordSettings') {
			modalStore.open('discordSettings', {
				...data.discord,
				error: data.modal.error,
				discord: data.modal.discord
			});
		}
	});

	// Add a keyboard event handler to the window instead
	$effect(() => {
		function handleGlobalKeyDown(e: KeyboardEvent) {
			// Toggle mode with Ctrl+M
			if (e.ctrlKey && e.key === 'm') {
				e.preventDefault();
				editorStore.toggleMode();
			}
		}

		// Add event listener
		window.addEventListener('keydown', handleGlobalKeyDown);

		// Cleanup on component destroy
		return () => {
			window.removeEventListener('keydown', handleGlobalKeyDown);
		};
	});
</script>

<div class="app-wrapper">
	<main aria-label="Document editor">
		<div class="sidebar-editor-wrapper">
			<Sidebar />
			<div class="content-wrapper">
				<header class="editor-header">
					<button
						type="button"
						class="toggle-button"
						onclick={() => sidebarStore.toggle()}
						aria-label={sidebarStore.state.state === 'expanded' ? 'Collapse menu' : 'Expand menu'}
						aria-expanded={sidebarStore.state.state === 'expanded'}
					>
						<SidebarToggle size="var(--icon-sm)" />
					</button>
					<div class="header-content">
						<div class="title-container">
							<h1>{documentName || 'No Document Loaded'}</h1>
							<div class="mode-buttons">
								<button
									type="button"
									class="toggle-button"
									class:active={currentMode === EditorMode.FORMATTING}
									onclick={() => (editorStore.mode = EditorMode.FORMATTING)}
									aria-pressed={currentMode === EditorMode.FORMATTING}
									aria-label="Formatting mode"
								>
									<Paragraph
										stroke={currentMode === EditorMode.FORMATTING
											? 'var(--text-on-accent)'
											: 'var(--text-muted)'}
										size="var(--icon-sm)"
									/>
								</button>
								<button
									type="button"
									class="toggle-button"
									class:active={currentMode === EditorMode.CORRECTING}
									onclick={() => (editorStore.mode = EditorMode.CORRECTING)}
									aria-pressed={currentMode === EditorMode.CORRECTING}
									aria-label="Correcting mode"
								>
									<Pencil
										stroke={currentMode === EditorMode.CORRECTING
											? 'var(--text-on-accent)'
											: 'var(--text-muted)'}
										size="var(--icon-sm)"
									/>
								</button>
							</div>
						</div>
					</div>
				</header>
				<div class="editor-container">
					<TextEditor initialContent="" />
				</div>
			</div>
		</div>
		{#if $modalStore?.type === 'upload'}
			<UploadDocument data={data.documentForm} />
		{:else if $modalStore?.type === 'classManager'}
			<ClassManager
				data={{
					classForm: data.classForm,
					studentForm: data.studentForm,
					user: data.user,
					uid: data.uid
				}}
			/>
		{:else if $modalStore?.type === 'discordSettings'}
			<DiscordSettingsModal data={$discordStore} />
		{/if}
	</main>
</div>

<style>
	.app-wrapper {
		width: 100%;
		min-height: 100vh;
		display: block;
	}

	.sidebar-editor-wrapper {
		display: flex;
		width: 100%;
		height: 100vh;
	}

	.content-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.editor-header {
		height: var(--spacing-12);
		display: flex;
		align-items: center;
		padding: 0 var(--spacing-4);
		gap: var(--spacing-4);
		background: var(--background-primary);
		border-bottom: var(--border-width-thin) solid var(--background-modifier-border);
	}

	.header-content {
		flex: 1;
	}

	.title-container {
		display: flex;
		align-items: center;
		gap: var(--spacing-4);
	}

	.title-container h1 {
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-medium);
		color: var(--text-normal);
		margin: 0;
	}

	.mode-buttons {
		display: flex;
		gap: var(--spacing-1);
	}

	.toggle-button {
		padding: var(--spacing-2);
		color: var(--text-muted);
		background: none;
		border: none;
		border-radius: var(--radius-base);
		cursor: pointer;
		transition: var(--transition-colors);
	}

	.toggle-button:hover {
		background: var(--interactive-hover);
		color: var(--text-normal);
	}

	.toggle-button.active {
		background: var(--background-modifier-active);
		color: var(--text-on-accent);
	}

	.editor-container {
		flex: 1;
		overflow-y: auto;
		background-color: var(--background-secondary);
	}

	/* Print styles */
	@media print {
		.mode-buttons {
			display: none;
		}
	}
</style>
