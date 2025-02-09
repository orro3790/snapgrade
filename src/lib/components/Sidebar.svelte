<!-- src/lib/components/Sidebar.svelte -->
<script lang="ts">
	import { modalStore } from '$lib/stores/modalStore';
	import { userStore } from '$lib/stores/userStore';
	import { sidebarStore } from '$lib/stores/sidebarStore';

	// Import icons
	import Home from '$lib/icons/Home.svelte';
	import Files from '$lib/icons/Files.svelte';
	import Upload from '$lib/icons/Upload.svelte';
	import HowTo from '$lib/icons/HowTo.svelte';
	import Analytics from '$lib/icons/Analytics.svelte';
	import ClassManager from '$lib/icons/ClassManager.svelte';
	import Settings from '$lib/icons/Settings.svelte';
	import StagingArea from '$lib/icons/StagingArea.svelte';
	import Login from '$lib/icons/Login.svelte';
	import UserMenu from '$lib/components/UserMenu.svelte';
	import SidebarToggle from '$lib/icons/SidebarToggle.svelte';

	// Define the NavItem type
	type NavItem = {
		id: string;
		label: string;
		Icon: any;
		group: 'base' | 'authenticated';
	};

	// Get user from store
	let user = $derived($userStore);
	let activeItem = $state('home');

	// Define all nav items with their groups
	const navItems: NavItem[] = [
		{ id: 'home', label: 'Dashboard', Icon: Home, group: 'base' },
		{ id: 'how-to-use', label: 'How to use', Icon: HowTo, group: 'base' },
		{ id: 'files', label: 'File Manager', Icon: Files, group: 'authenticated' },
		{ id: 'direct-upload', label: 'Upload Document', Icon: Upload, group: 'authenticated' },
		{ id: 'staging-area', label: 'Staging Area', Icon: StagingArea, group: 'authenticated' },
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

	function handleNavClick(itemId: string) {
		activeItem = itemId;
		if ($sidebarStore.isMobile) {
			sidebarStore.toggle();
		}
		if (itemId === 'how-to-use') {
			modalStore.open('keyboard');
		} else if (itemId === 'direct-upload') {
			modalStore.open('upload');
		} else if (itemId === 'class-manager') {
			modalStore.open('classManager');
		} else if (itemId === 'staging-area') {
			modalStore.open('stagingArea');
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
	class:expanded={$sidebarStore.state === 'expanded'}
	class:mobile={$sidebarStore.isMobile}
	aria-label="Main navigation"
>
	<!-- Header Section -->
	<div class="sidebar-header">
		<button
			type="button"
			class="toggle-button"
			onclick={() => sidebarStore.toggle()}
			aria-label={$sidebarStore.state === 'expanded' ? 'Collapse menu' : 'Expand menu'}
			aria-expanded={$sidebarStore.state === 'expanded'}
		>
			<SidebarToggle size={20} />
		</button>
	</div>

	<!-- Navigation Items -->
	<div class="nav-section">
		<!-- Base Group -->
		{#if groupedNavItems.base.length > 0}
			<div class="nav-group">
				<div class="nav-group-label">Base</div>
				{#each groupedNavItems.base as { id, label, Icon }}
					<button
						type="button"
						class="nav-item"
						class:active={activeItem === id}
						onclick={() => handleNavClick(id)}
						onkeydown={(e) => handleKeyNav(e, id)}
						aria-label={label}
					>
						<Icon
							size={20}
							stroke={activeItem === id ? 'var(--text-on-accent)' : 'var(--text-muted)'}
						/>
						{#if $sidebarStore.state === 'expanded'}
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
						<Icon
							size={20}
							stroke={activeItem === id ? 'var(--text-on-accent)' : 'var(--text-muted)'}
						/>
						{#if $sidebarStore.state === 'expanded'}
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
			<UserMenu />
		{:else}
			<a href="/login" class="nav-item" role="button" tabindex="0">
				<Login size={20} />
				{#if $sidebarStore.state === 'expanded'}
					<span class="nav-label">Login</span>
				{/if}
			</a>
		{/if}
	</div>
</nav>

<style>
	.sidebar {
		position: fixed;
		top: 0;
		left: 0;
		height: 100vh;
		width: 72px;
		background: var(--background-secondary-alt);
		border-right: 1px solid var(--background-modifier-border);
		display: flex;
		flex-direction: column;
		transition: width 0.2s ease;
		z-index: 50;
	}

	.sidebar.expanded {
		width: 280px;
	}

	.sidebar-header {
		height: 72px;
		padding: 1rem;
		display: flex;
		align-items: center;
		justify-content: right;
	}

	.toggle-button {
		padding: 0.5rem;
		color: var(--text-muted);
		background: none;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.toggle-button:hover {
		background: var(--interactive-hover);
		color: var(--text-normal);
	}

	.nav-section {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.nav-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.nav-group-label {
		padding: 0.5rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		width: 100%;
		border: none;
		border-radius: 4px;
		background: none;
		color: var(--text-muted);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.nav-item:hover {
		background: var(--interactive-hover);
		color: var(--text-normal);
	}

	.nav-item.active {
		background: var(--interactive-accent);
		color: var(--text-on-accent);
	}

	.nav-label {
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.sidebar-footer {
		padding: 0.5rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Mobile styles */
	.sidebar.mobile {
		width: 0;
		transform: translateX(-100%);
		transition:
			transform 0.2s ease,
			width 0s linear 0.2s;
	}

	.sidebar.mobile.expanded {
		width: 280px;
		transform: translateX(0);
		transition: transform 0.2s ease;
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
		pointer-events: none;
		transition: opacity 0.2s ease;
		z-index: -1;
	}

	.sidebar.mobile.expanded::after {
		opacity: 1;
		pointer-events: auto;
	}

	/* Hide group labels when collapsed */
	.sidebar:not(.expanded) .nav-group-label {
		display: none;
	}

	/* Center icons when collapsed */
	.sidebar:not(.expanded) .nav-item {
		justify-content: center;
	}

	/* Add hover effect to show labels */
	.sidebar:not(.expanded):not(.mobile) .nav-item:hover {
		position: relative;
	}

	.sidebar:not(.expanded):not(.mobile) .nav-item:hover .nav-label {
		position: absolute;
		left: calc(100% + 0.5rem);
		top: 50%;
		transform: translateY(-50%);
		background: var(--background-secondary);
		padding: 0.5rem 0.75rem;
		border-radius: 4px;
		box-shadow: 0 2px 4px var(--background-modifier-box-shadow);
		display: block;
		white-space: nowrap;
		z-index: 60;
	}
</style>
