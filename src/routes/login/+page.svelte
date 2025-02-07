<!-- file: src/routes/login/+page.svelte -->
<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import type { LoginFormData } from '$lib/schemas/auth';
	import Button from '$lib/components/Button.svelte';

	let { data } = $props<{ data: LoginFormData }>();

	let isLoading = $state(false);
	let isSubmitting = $state(false);

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
</script>

<div class="page-container">
	<div class="login-container">
		<div class="login-header">
			<h2>Welcome Back</h2>
			<p class="subtitle">Sign in to continue to your account</p>
		</div>

		<form class="login-form" id="login" method="POST" action="?/login" use:enhance novalidate>
			{#if $allErrors.length}
				<div class="errors-container" role="alert">
					{#each $allErrors as error}
						{#each error.messages as message}
							<div class="error-message">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line
										x1="12"
										y1="16"
										x2="12.01"
										y2="16"
									/></svg
								>
								{message}
							</div>
						{/each}
					{/each}
				</div>
			{/if}

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

			<div class="form-group">
				<div class="password-label">
					<label for="password">Password</label>
					<a href="/reset-password" class="forgot-password">Forgot password?</a>
				</div>
				<input
					type="password"
					id="password"
					name="password"
					required
					placeholder="Enter your password"
					autocomplete="current-password"
					bind:value={$form.password}
					class:input-error={!!$errors.password}
				/>
			</div>

			<Button label="Sign In" {isLoading} isSubmit={true} formId="login" disabled={isSubmitting} />
		</form>

		<div class="signup-prompt">
			<span>Don't have an account?</span>
			<a href="/register">Create account</a>
		</div>
	</div>
</div>

<style>
	.page-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 1rem;
		background: var(--background-secondary);
	}

	.login-container {
		background: var(--background-primary);
		padding: 2rem;
		border-radius: 12px;
		width: 100%;
		max-width: 420px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		border: 1px solid var(--background-modifier-border);
	}

	.login-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	h2 {
		margin: 0;
		color: var(--text-normal);
		font-size: 1.75rem;
		font-weight: 600;
	}

	.subtitle {
		margin: 0.5rem 0 0;
		color: var(--text-muted);
		font-size: 0.925rem;
	}

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

	label {
		color: var(--text-normal);
		font-size: 0.875rem;
		font-weight: 500;
	}

	input {
		padding: 0.75rem 1rem;
		border-radius: 6px;
		border: 1px solid var(--background-modifier-border);
		background: var(--background-secondary);
		color: var(--text-normal);
		font-size: 0.925rem;
		transition: all 0.2s ease;
	}

	input:focus {
		outline: none;
		border-color: var(--interactive-accent);
		box-shadow: 0 0 0 2px var(--background-modifier-accent);
	}

	.input-error {
		border-color: var(--text-error);
	}

	.errors-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background: var(--background-modifier-error);
		color: var(--text-error);
		border-radius: 6px;
		font-size: 0.875rem;
	}

	.forgot-password {
		color: var(--interactive-accent);
		font-size: 0.875rem;
		text-decoration: none;
	}

	.forgot-password:hover {
		text-decoration: underline;
	}

	.signup-prompt {
		margin-top: 1.5rem;
		text-align: center;
		font-size: 0.875rem;
	}

	.signup-prompt span {
		color: var(--text-muted);
	}

	.signup-prompt a {
		color: var(--interactive-accent);
		text-decoration: none;
		margin-left: 0.5rem;
	}

	.signup-prompt a:hover {
		text-decoration: underline;
	}
</style>
