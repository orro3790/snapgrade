<!-- src/lib/components/Sidebar.svelte -->
<script lang="ts">
	import { modalStore } from '$lib/stores/modalStore';
	import { userStore } from '$lib/stores/userStore';
	import { toastStore } from '$lib/stores/toastStore';
	import { settingsStore } from '$lib/stores/settingsStore';
	import { invalidateAll } from '$app/navigation';

	// Import icons
	import Home from '$lib/icons//Home.svelte';
	import Files from '$lib/icons//Files.svelte';
	import Upload from '$lib/icons//Upload.svelte';
	import HowTo from '$lib/icons//HowTo.svelte';
	import Analytics from '$lib/icons//Analytics.svelte';
	import ClassManager from '$lib/icons//ClassManager.svelte';
	import Settings from '$lib/icons//Settings.svelte';
	import Menu from '$lib/icons//Menu.svelte';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import Logout from '$lib/icons/Logout.svelte';
	import Login from '$lib/icons/Login.svelte';
	import Avatar from '$lib/icons/Avatar.svelte';

	// Define the NavItem type
	type NavItem = {
		id: string;
		label: string;
		Icon: any; // You might want to define a more specific type for the Icon component
	};

	// Get user from store
	let user = $derived($userStore);
	let isLoggingOut = $state(false);

	// Define base nav items
	const baseNavItems: NavItem[] = [
		{ id: 'home', label: 'Dashboard', Icon: Home },
		{ id: 'how-to-use', label: 'How to use', Icon: HowTo }
	];

	// Define authenticated nav items
	const authenticatedNavItems: NavItem[] = [
		{ id: 'files', label: 'File Manager', Icon: Files },
		{ id: 'direct-upload', label: 'Upload Document', Icon: Upload },
		{ id: 'analytics', label: 'Analytics', Icon: Analytics },
		{ id: 'class-manager', label: 'Class Manager', Icon: ClassManager },
		{ id: 'settings', label: 'Setting', Icon: Settings }
	];

	// Use $derived for navItems
	let navItems = $derived(user ? [...baseNavItems, ...authenticatedNavItems] : baseNavItems);

	let isExpanded = $state(false);
	let activeItem = $state('home');

	function toggleSidebar() {
		isExpanded = !isExpanded;
	}

	function handleNavClick(itemId: string) {
		activeItem = itemId;
		if (itemId === 'how-to-use') {
			modalStore.open('keyboard');
		} else if (itemId === 'direct-upload') {
			modalStore.open('upload');
		} else if (itemId === 'class-manager') {
			modalStore.open('classManager');
		}
	}

	function handleKeyNav(event: KeyboardEvent, itemId: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleNavClick(itemId);
		}
	}

	async function handleLogout() {
		isLoggingOut = true;
		const response = await fetch('/api/auth/logout', {
			method: 'POST'
		});

		if (response.ok) {
			// Clear all stores
			userStore.set(null);
			settingsStore.set(null);
			invalidateAll();

			// Reset active item to home
			activeItem = 'home';

			// Show success toast
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
	}
</script>

<nav class="sidebar" class:expanded={isExpanded} aria-label="Main navigation">
	<div class="sidebar-content">
		<!-- User Profile Section -->
		<div class="user-section" class:expanded={isExpanded}>
			{#if user?.photoUrl}
				<img src={user.photoUrl} class="avatar" alt="User avatar" />
			{:else}
				<div class="avatar">
					<Avatar size={48} />
				</div>
			{/if}
			{#if isExpanded}
				<div class="user-info">
					<p class="name">{user?.name ?? 'Guest'}</p>
				</div>
			{/if}
		</div>

		<!-- Toggle Button -->
		<button
			type="button"
			class="menu-toggle"
			onclick={toggleSidebar}
			onkeydown={(e) => e.key === 'Enter' && toggleSidebar()}
			aria-label={isExpanded ? 'Collapse menu' : 'Expand menu'}
			aria-expanded={isExpanded}
		>
			<Menu size={24} />
		</button>

		<!-- Navigation Items -->
		<div class="nav-items">
			{#each navItems as { id, label, Icon }}
				<button
					type="button"
					class="nav-item"
					class:active={activeItem === id}
					onclick={() => handleNavClick(id)}
					onkeydown={(e) => handleKeyNav(e, id)}
					aria-label={label}
				>
					<span class="icon">
						<Icon
							size={24}
							stroke={activeItem === id ? 'var(--text-on-accent)' : 'var(--text-muted)'}
						/>
					</span>
					{#if isExpanded}
						<span class="label">{label}</span>
					{/if}
				</button>
			{/each}

			<!-- Login/Logout Button -->
			{#if user}
				<button
					type="button"
					class="nav-item"
					class:active={activeItem === 'logout'}
					aria-label="Logout"
					onclick={handleLogout}
				>
					<span class="icon">
						{#if isLoggingOut}
							<div class="spinner"></div>
						{:else}
							<Logout
								size={24}
								stroke={activeItem === 'logout' ? 'var(--text-on-accent)' : 'var(--text-muted)'}
							/>
						{/if}
					</span>
					{#if isExpanded}
						<span class="label">Logout</span>
					{/if}
				</button>
			{:else}
				<a
					href="/login"
					class="nav-item"
					class:active={activeItem === 'login'}
					role="button"
					tabindex="0"
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							window.location.href = '/login';
						}
					}}
					aria-label="Login"
				>
					<span class="icon">
						<Login
							size={24}
							stroke={activeItem === 'login' ? 'var(--text-on-accent)' : 'var(--text-muted)'}
						/>
					</span>
					{#if isExpanded}
						<span class="label">Login</span>
					{/if}
				</a>
			{/if}
		</div>
	</div>
</nav>

<style>
	.sidebar {
		position: fixed;
		top: 0;
		left: 0;
		width: var(--sidebar-width, 80px);
		height: 100vh;
		background: var(--background-secondary-alt);
		transition: width 0.3s ease;
		z-index: 50;
		overflow: hidden;
	}

	.sidebar.expanded {
		--sidebar-width: 280px;
	}

	.sidebar-content {
		height: 100%;
		width: 280px;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		gap: 2rem;
	}

	.user-section {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: var(--background-modifier-form-field);
		border-radius: 8px;
		transition: all 0.3s ease;
	}

	.avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
		border: 1px solid var(--interactive-accent);
		box-shadow: 0 0 8px var(--interactive-accent);
		transition: box-shadow 0.2s ease;
	}

	.user-info {
		flex: 1;
		min-width: 0;
	}

	.name {
		color: var(--text-normal);
		font-size: 0.875rem;
		font-weight: 500;
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.menu-toggle {
		color: var(--text-muted);
		background: none;
		border: none;
		padding: 0.75rem 1rem;
		cursor: pointer;
		transition: color 0.2s ease;
		border-radius: 6px;
	}

	.menu-toggle:hover {
		color: var(--text-normal);
		background: var(--interactive-hover);
	}

	.nav-items {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.5rem 0;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		width: 100%;
		padding: 0.75rem 1rem;
		border: none;
		border-radius: 6px;
		background: none;
		color: var(--text-muted);
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
	}

	.nav-item:hover {
		color: var(--text-normal);
		background: var(--interactive-hover);
	}

	.nav-item.active {
		color: var(--text-on-accent);
		background: var(--interactive-accent);
	}

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		flex-shrink: 0;
	}

	.label {
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 3px solid var(--text-normal);
		border-top: 3px solid transparent;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.sidebar {
			--sidebar-width: 0;
		}

		.sidebar.expanded {
			--sidebar-width: 100%;
		}
	}
</style>
