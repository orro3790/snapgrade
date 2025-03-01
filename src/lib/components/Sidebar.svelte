<script lang="ts">
	import { modalStore } from '$lib/stores/modalStore.svelte';
	import { userStore } from '$lib/stores/userStore.svelte';
	import { sidebarStore } from '$lib/stores/sidebarStore.svelte';
	import { discordStore } from '$lib/stores/discordStore.svelte';

	// Import icons
	import Home from '$lib/icons/Home.svelte';
	import Files from '$lib/icons/Files.svelte';
	import Upload from '$lib/icons/Upload.svelte';
	import HowTo from '$lib/icons/HowTo.svelte';
	import Analytics from '$lib/icons/Analytics.svelte';
	import ClassManager from '$lib/icons/ClassManager.svelte';
	import Settings from '$lib/icons/Settings.svelte';
	import DocumentBay from '$lib/icons/DocumentBay.svelte';
	import Activity from '$lib/icons/Activity.svelte';
	import Login from '$lib/icons/Login.svelte';
	import UserMenu from '$lib/components/UserMenu.svelte';

	// Define the NavItem type
	type NavItem = {
		id: string;
		label: string;
		Icon: any;
		group: 'base' | 'authenticated';
	};

	// Get user from store
	let user = $derived(userStore.user);
	let activeItem = $state('home');

	// Define all nav items with their groups
	const navItems: NavItem[] = [
		{ id: 'home', label: 'Dashboard', Icon: Home, group: 'base' },
		{ id: 'how-to-use', label: 'How to use', Icon: HowTo, group: 'base' },
		{ id: 'files', label: 'File Manager', Icon: Files, group: 'authenticated' },
		{ id: 'direct-upload', label: 'Upload Document', Icon: Upload, group: 'authenticated' },
		{ id: 'document-bay', label: 'Document Bay', Icon: DocumentBay, group: 'authenticated' },
		{ id: 'activity', label: 'Activity', Icon: Activity, group: 'authenticated' },
		{ id: 'analytics', label: 'Analytics', Icon: Analytics, group: 'authenticated' },
		{ id: 'class-manager', label: 'Class Manager', Icon: ClassManager, group: 'authenticated' },
		{ id: 'settings', label: 'Settings', Icon: Settings, group: 'authenticated' }
	];

	// Filter nav items based on user authentication
	let filteredNavItems = $derived(
		navItems.filter((item) => item.group === 'base' || (user && item.group === 'authenticated'))
	);

	// Group nav items
	let groupedNavItems = $derived({
		base: filteredNavItems.filter((item) => item.group === 'base'),
		authenticated: filteredNavItems.filter((item) => item.group === 'authenticated')
	});

	// Effect to check if we're on mobile
	$effect(() => {
		const checkMobile = () => {
			sidebarStore.setMobile(window.innerWidth <= 768);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => window.removeEventListener('resize', checkMobile);
	});

	// Add effect to collapse sidebar on logout
	$effect(() => {
		if (!userStore.user) {
			sidebarStore.collapse();
		}
	});

	function handleNavClick(itemId: string) {
		activeItem = itemId;
		if (sidebarStore.state.isMobile) {
			sidebarStore.toggle();
		}
		if (itemId === 'how-to-use') {
			modalStore.open('keyboard');
		} else if (itemId === 'direct-upload') {
			modalStore.open('upload');
		} else if (itemId === 'class-manager') {
			modalStore.open('classManager');
		} else if (itemId === 'document-bay') {
			modalStore.open('documentBay');
		} else if (itemId === 'activity') {
			modalStore.open('activity');
		} else if (itemId === 'settings') {
			modalStore.open('discordSettings', $discordStore);
		}
	}

	function handleKeyNav(event: KeyboardEvent, itemId: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleNavClick(itemId);
		}
	}
</script>

<nav
	class="sidebar"
	class:expanded={sidebarStore.state.state === 'expanded'}
	class:mobile={sidebarStore.state.isMobile}
	aria-label="Main navigation"
>
	<!-- Navigation Items -->
	<div class="nav-section">
		<!-- Base Group -->
		{#if groupedNavItems.base.length > 0}
			<div class="nav-group">
				<div class="nav-group-label">Snapgrade</div>
				{#each groupedNavItems.base as { id, label, Icon }}
					<button
						type="button"
						class="nav-item"
						class:active={activeItem === id}
						onclick={() => handleNavClick(id)}
						onkeydown={(e) => handleKeyNav(e, id)}
						aria-label={label}
					>
						<span class="nav-item-icon">
							<Icon
								stroke={activeItem === id ? 'var(--text-on-accent)' : 'var(--text-muted)'}
								size="var(--icon-sm)"
							/>
						</span>
						{#if sidebarStore.state.state === 'expanded'}
							<span class="nav-label">{label}</span>
						{/if}
					</button>
				{/each}
			</div>
		{/if}

		<!-- Authenticated Group -->
		{#if groupedNavItems.authenticated.length > 0}
			<div class="nav-group">
				<div class="nav-group-label">Features</div>
				{#each groupedNavItems.authenticated as { id, label, Icon }}
					<button
						type="button"
						class="nav-item"
						class:active={activeItem === id}
						onclick={() => handleNavClick(id)}
						onkeydown={(e) => handleKeyNav(e, id)}
						aria-label={label}
					>
						<span class="nav-item-icon">
							<Icon
								stroke={activeItem === id ? 'var(--text-on-accent)' : 'var(--text-muted)'}
								size="var(--icon-sm)"
							/>
						</span>
						{#if sidebarStore.state.state === 'expanded'}
							<span class="nav-label">{label}</span>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Footer Actions -->
	<div class="sidebar-footer">
		{#if user}
			<UserMenu collapsed={sidebarStore.state.state !== 'expanded'} />
		{:else}
			<a href="/login" class="nav-item" role="button" tabindex="0">
				<span class="nav-item-icon">
					<Login size="var(--icon-sm)" />
				</span>
				{#if sidebarStore.state.state === 'expanded'}
					<span class="nav-label">Login</span>
				{/if}
			</a>
		{/if}
	</div>
</nav>

<style>
	.sidebar {
		position: relative;
		height: 100vh;
		width: var(--spacing-12);
		min-width: var(--spacing-12);
		background: var(--background-primary);
		border-right: var(--border-width-thin) solid var(--background-modifier-border);
		display: flex;
		flex-direction: column;
		transition: var(--transition-sidebar);
		z-index: var(--z-drawer);
		transform: translateX(0);
	}

	.sidebar.expanded {
		width: 280px;
		min-width: 280px;
	}

	.nav-section {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding: var(--spacing-2);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4);
	}

	.nav-group {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-1);
	}

	.nav-group-label {
		padding: var(--spacing-2);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: var(--letter-spacing-wide);
	}

	.nav-item {
		display: flex;
		align-items: center;
		justify-content: start;
		gap: var(--spacing-4);
		padding: var(--spacing-2);
		border: none;
		border-radius: var(--radius-base);
		background: none;
		color: var(--text-normal);
		cursor: pointer;
		transition: var(--transition-all);
		min-height: var(--spacing-8);
		height: var(--spacing-8);
	}

	/* Add an icon wrapper to control size */
	.nav-item-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--icon-sm);
		height: var(--icon-sm);
		flex: 0 0 var(--icon-sm); /* shorthand for flex-grow: 0, flex-shrink: 0, flex-basis: var(--icon-sm) */
	}

	.sidebar.expanded .nav-item {
		width: 100%;
	}

	.sidebar:not(.expanded) .nav-item {
		width: var(--spacing-8);
		padding: var(--spacing-2);
		justify-content: center;
	}

	.nav-item:hover {
		background: var(--background-modifier-hover);
		color: var(--text-normal);
	}

	.nav-item.active {
		background: var(--interactive-accent);
		color: var(--text-on-accent);
	}

	.nav-label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.sidebar-footer {
		padding: var(--spacing-2);
		position: relative;
		overflow: visible;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Mobile styles */
	.sidebar.mobile {
		position: fixed;
		width: 280px;
		transform: translateX(-100%);
		transition: var(--transition-transform);
	}

	.sidebar.mobile.expanded {
		transform: translateX(0);
	}

	/* Backdrop for mobile */
	.sidebar.mobile::after {
		content: '';
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: var(--background-modifier-cover);
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
		transition: var(--transition-opacity), var(--transition-visibility);
		z-index: calc(var(--z-drawer) - 1);
	}

	.sidebar.mobile.expanded::after {
		opacity: 1;
		visibility: visible;
		pointer-events: auto;
	}

	/* Hide group labels when collapsed */
	.sidebar:not(.expanded) .nav-group-label {
		display: none;
	}

	/* Center icons when collapsed */
	.sidebar:not(.expanded):not(.mobile) .nav-item:hover {
		position: relative;
	}

	.sidebar:not(.expanded):not(.mobile) .nav-item:hover .nav-label {
		left: var(--spacing-8);
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background: var(--background-primary);
		padding: var(--spacing-2);
		border-radius: var(--radius-base);
		box-shadow: var(--shadow-md);
		display: block;
		white-space: nowrap;
		z-index: var(--z-popover);
		height: auto;
		min-height: unset;
	}
</style>
