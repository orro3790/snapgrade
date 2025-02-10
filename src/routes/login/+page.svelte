<!-- file: src/routes/login/+page.svelte -->
<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import type { LoginFormData } from '$lib/schemas/auth';
	import Button from '$lib/components/Button.svelte';
	import Eye from '$lib/icons/Eye.svelte';
	import EyeOff from '$lib/icons/EyeOff.svelte';

	// Props
	let { data } = $props<{ data: LoginFormData }>();

	// State
	let isLoading = $state(false);
	let isSubmitting = $state(false);
	let showPassword = $state(false);

	// Form initialization
	const { form, errors, enhance, message, allErrors } = superForm(data, {
		resetForm: false,
		dataType: 'json',

		async onSubmit() {
			console.log('onSubmit');
			isSubmitting = true;
			isLoading = true;
		},
		onResult: async ({ result }) => {
			if (result.type === 'success') {
				// Redirect to root on successful login
				window.location.href = '/';
			} else {
				isSubmitting = false;
				isLoading = false;
			}
		},
		onError() {
			isSubmitting = false;
			isLoading = false;
		}
	});

	/**
	 * Toggles password visibility between plain text and hidden
	 */
	function handlePasswordToggle() {
		showPassword = !showPassword;
	}

	/**
	 * Handles keyboard events for the modal backdrop
	 * @param {KeyboardEvent} event - The keyboard event
	 */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			// Handle escape key if needed
		}
	}
</script>

<!-- Modal backdrop with blur effect -->
<div class="modal-backdrop" role="presentation" onclick={() => {}} onkeydown={handleKeydown}></div>

<!-- Main container -->
<div class="page-container">
	<!-- Login form container -->
	<div class="login-container">
		<div class="login-header">
			<h2>Welcome Back</h2>
			<p class="subtitle">Sign in to continue to your account</p>
		</div>

		<!-- Login form -->
		<form class="login-form" id="login" method="POST" action="?/login" use:enhance novalidate>
			<!-- Error messages -->
			{#if $allErrors.length}
				<div class="errors-container" role="alert">
					{#each $allErrors as error}
						{#each error.messages as message}
							<div class="error-message">
								{message}
							</div>
						{/each}
					{/each}
				</div>
			{/if}

			<!-- Email input -->
			<div class="form-group">
				<label for="email">Email address</label>
				<input
					type="email"
					id="email"
					name="email"
					required
					placeholder="name@example.com"
					autocomplete="email"
					bind:value={$form.email}
					class:input-error={!!$errors.email}
				/>
			</div>

			<!-- Password input with visibility toggle -->
			<div class="form-group">
				<div class="password-label">
					<label for="password">Password</label>
					<a href="/reset-password" class="forgot-password">Forgot password?</a>
				</div>
				<div class="password-input-wrapper">
					<input
						type={showPassword ? 'text' : 'password'}
						id="password"
						name="password"
						required
						placeholder="Enter your password"
						autocomplete="current-password"
						bind:value={$form.password}
						class:input-error={!!$errors.password}
					/>
					<button
						type="button"
						class="password-toggle"
						onclick={handlePasswordToggle}
						aria-label="Toggle password visibility"
					>
						{#if showPassword}
							<EyeOff size="20px" stroke="var(--text-muted)" />
						{:else}
							<Eye size="20px" stroke="var(--text-muted)" />
						{/if}
					</button>
				</div>
			</div>

			<!-- Remember me checkbox -->
			<div class="form-group remember-me">
				<label class="checkbox-label">
					<input type="checkbox" name="remember" />
					<span>Remember me for 30 days</span>
				</label>
			</div>

			<!-- Submit button -->
			<Button label="Sign In" {isLoading} isSubmit={true} formId="login" disabled={isSubmitting} />
		</form>

		<!-- Sign up prompt -->
		<div class="signup-prompt">
			<span>Don't have an account?</span>
			<a href="/register">Create account</a>
		</div>
	</div>
</div>

<style>
	/* Modal backdrop */
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: var(--modal-backdrop-bg);
		z-index: 998;
		backdrop-filter: blur(2px);
	}

	/* Main container */
	.page-container {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: var(--component-padding);
		background: var(--background-secondary-alt);
		z-index: 999;
	}

	/* Login container */
	.login-container {
		background: var(--background-primary);
		padding: calc(var(--component-padding) * 2);
		border-radius: var(--component-border-radius);
		width: 100%;
		max-width: 420px;
		box-shadow: var(--component-box-shadow);
		border: var(--component-border);
	}

	/* Header styles */
	.login-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	h2 {
		margin: 0;
		color: var(--text-normal);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-semibold);
		font-family: var(--brand);
	}

	.subtitle {
		margin: 0.5rem 0 0;
		color: var(--text-muted);
		font-size: var(--font-size-base);
		font-family: var(--brand);
	}

	/* Form styles */
	.login-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.password-label {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.password-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.password-toggle {
		position: absolute;
		right: 0.75rem;
		background: none;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
		color: var(--text-muted);
		transition: color 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.password-toggle:hover {
		color: var(--text-accent);
	}

	/* Input styles */
	label {
		color: var(--text-muted);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-normal);
	}

	input {
		padding: 0.75rem;
		border-radius: var(--component-border-radius);
		background: var(--background-secondary);
		border: var(--component-border);
		color: var(--text-normal);
		font-size: var(--font-size-base);
		font-family: var(--brand);
		transition: all 0.2s ease;
		width: 100%;
	}

	input:hover {
		background: var(--background-modifier-form-field-highlighted);
	}

	input:focus {
		outline: none;
		border-color: var(--interactive-accent);
		box-shadow: 0 0 0 2px var(--background-modifier-accent);
	}

	.input-error {
		border-color: var(--text-error);
	}

	/* Checkbox styles */
	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: var(--font-size-sm);
		color: var(--text-muted);
	}

	.checkbox-label input[type='checkbox'] {
		width: 1rem;
		height: 1rem;
		margin: 0;
	}

	/* Error message styles */
	.errors-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.error-message {
		padding: 0.75rem;
		background: var(--background-modifier-error);
		color: var(--text-error);
		border-radius: var(--component-border-radius);
		font-size: var(--font-size-sm);
	}

	/* Link styles */
	.forgot-password {
		color: var(--interactive-accent);
		font-size: var(--font-size-sm);
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.forgot-password:hover {
		color: var(--interactive-accent-hover);
	}

	.signup-prompt {
		margin-top: 1.5rem;
		text-align: center;
		font-size: var(--font-size-sm);
	}

	.signup-prompt span {
		color: var(--text-muted);
	}

	.signup-prompt a {
		color: var(--interactive-accent);
		text-decoration: none;
		margin-left: 0.5rem;
		transition: color 0.2s ease;
	}

	.signup-prompt a:hover {
		color: var(--interactive-accent-hover);
	}
</style>
