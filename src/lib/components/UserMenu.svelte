<script lang="ts">
	import { userStore } from '$lib/stores/userStore';
	import { sidebarStore } from '$lib/stores/sidebarStore';
	import { toastStore } from '$lib/stores/toastStore';
	import { settingsStore } from '$lib/stores/settingsStore';
	import { invalidateAll, goto } from '$app/navigation';
	import Avatar from '$lib/icons/Avatar.svelte';
	import Logout from '$lib/icons/Logout.svelte';
	import CaretUpDown from '$lib/icons/CaretUpDown.svelte';

	let isOpen = $state(false);
	let isLoggingOut = $state(false);
	let user = $derived($userStore);

	const {
		size = 'var(--icon-base)',
		stroke = 'currentColor',
		strokeWidth = 'var(--icon-stroke-normal)'
	} = $props<{
		size?: string;
		stroke?: string;
		strokeWidth?: string;
	}>();

	function toggleMenu() {
		isOpen = !isOpen;
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.user-menu')) {
			isOpen = false;
		}
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});

	async function handleLogout() {
		isLoggingOut = true;
		const response = await fetch('/api/auth/logout', {
			method: 'POST'
		});

		if (response.ok) {
			userStore.set(null);
			settingsStore.set(null);
			invalidateAll();

			// Navigate to home page
			goto('/');

			toastStore.show({
				message: 'Successfully logged out',
				type: 'success'
			});
		} else {
			toastStore.show({
				message: 'Logout failed. Please try again.',
				type: 'error'
			});
		}
		isLoggingOut = false;
		isOpen = false;
	}
</script>

<div class="user-menu">
	<button
		type="button"
		class="user-trigger"
		onclick={toggleMenu}
		aria-expanded={isOpen}
		aria-haspopup="true"
		aria-label="User menu"
		style={isOpen ? 'background: var(--interactive-hover)' : ''}
	>
		{#if user?.photoUrl}
			<img src={user.photoUrl} alt="User avatar" class="avatar" />
		{:else}
			<div class="avatar">
				<Avatar {size} />
			</div>
		{/if}

		{#if $sidebarStore.state === 'expanded'}
			<span class="user-name">{user?.name ?? 'Guest'}</span>
		{/if}
		<CaretUpDown size="20" />
	</button>

	{#if isOpen}
		<div class="menu-content" role="menu">
			<div class="menu-header">
				<div class="user-info">
					<strong>{user?.name ?? 'Guest'}</strong>
					<span class="user-email">{user?.email ?? ''}</span>
				</div>
			</div>
			<div class="menu-items">
				<button
					type="button"
					class="menu-item"
					onclick={handleLogout}
					disabled={isLoggingOut}
					role="menuitem"
				>
					{#if isLoggingOut}
						<div class="spinner"></div>
					{:else}
						<Logout size="var(--icon-sm)" />
					{/if}
					<span>Logout</span>
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.user-menu {
		position: relative;
		width: 100%;
	}

	.user-trigger {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem;
		background: none;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		color: var(--text-normal);
		transition: background-color 0.2s ease;
	}

	.user-trigger:hover {
		background: var(--interactive-hover);
	}

	.avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--interactive-accent);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.user-name {
		flex: 1;
		text-align: left;
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.menu-content {
		position: absolute;
		bottom: 100%;
		left: 100%;
		width: 100%;
		min-width: 200px;
		background: var(--background-secondary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 4px;
		box-shadow: 0 2px 4px var(--background-modifier-box-shadow);
		margin-bottom: 0.5rem;
	}

	.menu-header {
		padding: 1rem;
		border-bottom: 1px solid var(--background-modifier-border);
	}

	.user-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.user-email {
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	.menu-items {
		padding: 0.5rem;
	}

	.menu-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: none;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		color: var(--text-normal);
		transition: background-color 0.2s ease;
	}

	.menu-item:hover {
		background: var(--interactive-hover);
	}

	.menu-item:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid var(--text-normal);
		border-top: 2px solid transparent;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
