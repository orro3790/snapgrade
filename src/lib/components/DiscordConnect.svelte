<script lang="ts">
	import type { DiscordConnection } from '$lib/schemas/discord';

	let { data } = $props<{ data: DiscordConnection }>();
</script>

<div class="discord-connect" class:connected={data.isConnected}>
	{#if data.isConnected && data.status === 'active'}
		<div class="success" role="status" aria-live="polite">
			<span class="icon">✅</span>
			<span>Discord account connected successfully!</span>

			<form method="POST" action="/api/auth/discord/disconnect">
				<button type="submit" class="disconnect-button" aria-label="Disconnect Discord account">
					Disconnect
				</button>
			</form>
		</div>
	{:else if data.isConnected && data.status !== 'active'}
		<div class="warning" role="status">
			<span class="icon">⚠️</span>
			<span>
				{#if data.status === 'inactive'}
					Your Discord connection is inactive. Please reconnect your account.
				{:else if data.status === 'suspended'}
					Your Discord connection has been suspended. Please contact support.
				{:else}
					Your Discord connection needs attention. Please try reconnecting.
				{/if}
			</span>
			<a href="/api/auth/discord" class="reconnect-button" role="button">Reconnect</a>
		</div>
	{:else}
		<div class="connect-prompt">
			<h3>Connect Discord Account</h3>
			<p>Connect your Discord account to use the Snapgrade bot for automatic essay processing.</p>

			<a
				href="/api/auth/discord"
				class="connect-button"
				role="button"
				aria-label="Connect Discord Account"
			>
				<span class="discord-logo">
					<svg
						viewBox="0 -28.5 256 256"
						version="1.1"
						xmlns="http://www.w3.org/2000/svg"
						preserveAspectRatio="xMidYMid"
					>
						<path
							d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z"
							fill="currentColor"
							fill-rule="nonzero"
						/>
					</svg>
				</span>
				<span>Connect Discord</span>
			</a>
		</div>
	{/if}
</div>

<style>
	.discord-connect {
		padding: 1.5rem;
		border-radius: 0.5rem;
		background: var(--surface-2);
		max-width: 32rem;
	}

	.connected {
		background: var(--surface-1);
	}

	.success {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: var(--success);
	}

	.warning {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: var(--warning);
	}

	.connect-prompt {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.connect-prompt h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.connect-prompt p {
		margin: 0;
		color: var(--text-2);
	}

	.connect-button,
	.reconnect-button {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1.5rem;
		background: #5865f2;
		color: white;
		border-radius: 0.25rem;
		text-decoration: none;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.connect-button:hover,
	.reconnect-button:hover {
		background: #4752c4;
	}

	.connect-button:focus,
	.reconnect-button:focus {
		outline: 2px solid #5865f2;
		outline-offset: 2px;
	}

	.discord-logo {
		width: 1.5rem;
		height: 1.5rem;
		color: currentColor;
	}

	.disconnect-button {
		margin-left: auto;
		padding: 0.5rem 1rem;
		background: var(--error-bg);
		color: var(--error);
		border: none;
		border-radius: 0.25rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.disconnect-button:hover {
		background: var(--error-bg-hover);
	}

	.icon {
		font-size: 1.25rem;
	}
</style>
