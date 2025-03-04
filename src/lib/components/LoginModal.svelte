<!-- File: src/lib/components/LoginModal.svelte -->

<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import type { LoginFormData } from '$lib/schemas/auth';
	import { userStore } from '$lib/stores/userStore.svelte';
	import { settingsStore } from '$lib/stores/settingsStore.svelte';
	import { toastStore } from '$lib/stores/toastStore.svelte';
	import { modalStore } from '$lib/stores/modalStore.svelte';
	import Button from './Button.svelte';

	let { data } = $props<{ data: LoginFormData }>();

	let isLoading = $state(false);
	let isSubmitting = $state(false);

	const { form, errors, enhance, message, allErrors } = superForm(data, {
		resetForm: false,
		dataType: 'json',

		async onSubmit() {
			isSubmitting = true;
			isLoading = true;
		},
		onResult: async ({ result }) => {
			if (result.type === 'success') {
				// User account successfully created. Set user and settings state immediately
				userStore.setUser(result.data?.user);
				settingsStore.set(result.data?.settings);
			} else if (result.type === 'failure' && result.data?.error) {
				// Handle server-side error messages
				isSubmitting = false;
				isLoading = false;
			}
		},
		onError({ result }) {
			$message = result.error.message || 'Unknown error';
			isSubmitting = false;
			isLoading = false;
		},
		onUpdate({ form }) {
			// Reset loading states if there are client-side validation errors
			if (form.valid === false) {
				isSubmitting = false;
				isLoading = false;
			}
		},
		applyAction: true
	});
</script>

<div class="login-modal">
	<h2>Sign In</h2>

	<form class="login-form" id="login" method="POST" action="?/login" use:enhance novalidate>
		{#if $allErrors.length}
			<ul class="errors-list" role="alert">
				{#each $allErrors as error}
					{#each error.messages as message}
						<li class="error-message">
							{message}
						</li>
					{/each}
				{/each}
			</ul>
		{/if}

		<div class="form-group">
			<label for="email">Email</label>
			<input
				type="email"
				id="email"
				name="email"
				required
				placeholder="Enter your email"
				autocomplete="email"
				bind:value={$form.email}
				class:input-error={!!$errors.email}
			/>
		</div>

		<div class="form-group">
			<label for="password">Password</label>
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
</div>

<style>
	.login-modal {
		background: var(--background-primary);
		padding: 1rem;
		border-radius: 8px;
		width: 100%;
		max-width: 400px;
	}

	h2 {
		margin: 0 0 1.5rem;
		color: var(--text-normal);
		font-size: 1.5rem;
		font-weight: 600;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	input {
		padding: 0.75rem;
		border-radius: 4px;
		border: 1px solid var(--background-modifier-border);
		background: var(--background-secondary);
		color: var(--text-normal);
	}

	input:focus {
		outline: none;
		border-color: var(--interactive-accent);
	}

	.input-error {
		outline-color: var(--text-error-hover);
		color: var(--text-error-hover);
	}

	.error-message {
		padding: 0.75rem;
		background: var(--background-modifier-error);
		color: var(--text-error);
		border-radius: 4px;
		font-size: 0.875rem;
	}
</style>
