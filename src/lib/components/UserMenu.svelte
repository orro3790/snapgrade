<script lang="ts">
	import { userStore } from '$lib/stores/userStore';
	import { toastStore } from '$lib/stores/toastStore';
	import { settingsStore } from '$lib/stores/settingsStore';
	import { invalidateAll, goto } from '$app/navigation';
	import Avatar from '$lib/icons/Avatar.svelte';
	import Logout from '$lib/icons/Logout.svelte';
	import CaretUpDown from '$lib/icons/CaretUpDown.svelte';

	let isOpen = $state(false);
	let isLoggingOut = $state(false);
	let user = $derived($userStore);

	let { collapsed = false } = $props<{
		collapsed?: boolean;
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
		class:collapsed
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
				<Avatar size="var(--icon-base)" />
			</div>
		{/if}

		{#if !collapsed}
			<span class="user-name">{user?.name ?? 'Guest'}</span>
			<CaretUpDown size="20" />
		{/if}
	</button>

	{#if isOpen}
		<div class="menu-content" role="menu" class:collapsed>
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
		gap: var(--spacing-2);
		background: none;
		border: none;
		padding: var(--spacing-2);
		border-radius: var(--radius-base);
		cursor: pointer;
		color: var(--text-normal);
		transition: var(--transition-all);
	}

	.user-trigger:hover {
		background: var(--background-modifier-hover);
	}

	.user-trigger.collapsed {
		justify-content: center;
		padding: 0;
	}

	.avatar {
		width: var(--spacing-8);
		height: var(--spacing-8);
		border-radius: var(--radius-base);
		background: var(--background-secondary);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		flex-shrink: 0;
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
		bottom: 0%;
		left: 100%;
		width: 220px;
		background: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		margin-left: var(--spacing-2);
		z-index: 50;
	}

	.menu-header {
		padding: var(--spacing-3);
		border-bottom: 1px solid var(--border-color);
	}

	.user-info {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-1);
	}

	.user-info strong {
		font-size: var(--text-sm);
		color: var(--text-normal);
	}

	.user-email {
		font-size: var(--text-xs);
		color: var(--text-muted);
	}

	.menu-items {
		padding: var(--spacing-1);
	}

	.menu-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		padding: var(--spacing-2) var(--spacing-3);
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		color: var(--text-normal);
		font-size: var(--text-sm);
		transition: var(--transition-all);
		justify-content: flex-start;
		text-align: left;
	}

	.menu-item:hover {
		background: var(--background-modifier-hover);
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
