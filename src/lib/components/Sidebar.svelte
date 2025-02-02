<!-- src/lib/components/Sidebar.svelte -->
<script lang="ts">
	let { user } = $props<{
		user?: {
			displayName: string;
			photoURL?: string;
		};
	}>();

	const navItems = [
		{ id: 'home', label: 'Dashboard', icon: '🏠' },
		{ id: 'messages', label: 'Messages', icon: '✉️' },
		{ id: 'analytics', label: 'Analytics', icon: '📊' },
		{ id: 'schedules', label: 'Schedules', icon: '📅' },
		{ id: 'calendar', label: 'Calendar', icon: '📆' },
		{ id: 'how-to-use', label: 'How to use', icon: '💡' },
		{ id: 'files', label: 'File Manager', icon: '📁' },
		{ id: 'settings', label: 'Setting', icon: '⚙️' }
	];

	let isExpanded = $state(false);
	let activeItem = $state('home');

	function toggleSidebar() {
		isExpanded = !isExpanded;
	}

	function handleKeyNav(event: KeyboardEvent, itemId: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			activeItem = itemId;
		}
	}
</script>

<nav class="sidebar" class:expanded={isExpanded} aria-label="Main navigation">
	<div class="sidebar-content">
		<!-- Header -->
		<div class="header">
			<button
				type="button"
				class="menu-toggle"
				onclick={toggleSidebar}
				aria-label={isExpanded ? 'Collapse menu' : 'Expand menu'}
			>
				≡
			</button>
		</div>

		<!-- Main Content -->
		<div class="main-content">
			<!-- Search -->
			<!-- <button type="button" class="nav-item" aria-label="Search">
				<span class="icon">🔍</span>
				<input
					type="search"
					placeholder="Search..."
					aria-label="Search"
					class="search-input"
					tabindex={0}
					style:opacity={isExpanded ? 1 : 0}
					style:width={isExpanded ? 'auto' : '0'}
					style:padding={isExpanded ? '0.5rem' : '0'}
					style:margin={isExpanded ? '0' : '0'}
				/>
			</button> -->

			<!-- Navigation -->
			<div class="navigation-section">
				<div class="nav-items">
					{#each navItems as item}
						<button
							type="button"
							class="nav-item {activeItem === item.id ? 'active' : ''}"
							onclick={() => (activeItem = item.id)}
							onkeydown={(e) => handleKeyNav(e, item.id)}
							aria-label={item.label}
						>
							<span class="icon">{item.icon}</span>
							{#if isExpanded}
								<span class="label">{item.label}</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- User Section -->
		{#if user}
			<div class="user-section" class:expanded={isExpanded}>
				<img src={user.photoURL ?? '/default-avatar.png'} alt="Profile" class="avatar" />
				{#if isExpanded}
					<div class="user-info">
						<p class="greeting">Good noon,</p>
						<p class="name">{user.displayName}</p>
					</div>
					<button type="button" class="profile-arrow" aria-label="View profile options"> → </button>
				{/if}
			</div>
		{/if}
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
		--sidebar-width: 300px;
	}

	.sidebar-content {
		height: 100%;
		width: 300px;
		display: flex;
		flex-direction: column;
		padding: 1rem 0;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0 1rem;
		margin-bottom: 2rem;
		height: 48px;
	}

	.menu-toggle {
		color: var(--text-faint);
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.5rem;
		transition: color 0.2s;
		flex-shrink: 0;
	}

	.menu-toggle:hover {
		color: var(--text-normal);
	}

	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		overflow-y: auto;
	}

	.navigation-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.nav-items {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		transition: all 0.2s;
		width: 100%;
		text-align: left;
		border-radius: 6px;
		margin: 0 0.5rem;
		width: calc(100% - 1rem);
	}

	.nav-item:hover {
		background: var(--interactive-hover);
		color: var(--text-normal);
	}

	.nav-item.active {
		background: var(--interactive-accent);
		color: var(--text-on-accent);
	}

	.icon {
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.label {
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.user-section {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		margin-top: auto;
		border-top: 1px solid var(--background-modifier-border);
	}

	.user-section.expanded {
		background: var(--background-modifier-form-field);
		margin: 0 0.5rem;
		border-radius: 6px;
		border-top: none;
	}

	.avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}

	.user-info {
		flex: 1;
		min-width: 0;
	}

	.greeting {
		color: var(--text-muted);
		font-size: 0.75rem;
		margin: 0;
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

	.profile-arrow {
		color: var(--text-faint);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		transition: color 0.2s;
	}

	.profile-arrow:hover {
		color: var(--text-normal);
	}
</style>
