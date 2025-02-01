<script lang="ts">
	// Script section remains the same
	import html2canvas from 'html2canvas';

	const { initialContent = '', onContentChange = () => {} } = $props<{
		initialContent?: string;
		onContentChange?: (content: string) => void;
	}>();

	const essayStore = $state({
		content:
			initialContent ||
			`Here are examples of the different correction types:

This is a ~~incorrect sentence~~ [better sentence].

This sentense !sentence! has a spelling error.

You can have multiple speling !spelling! erors !errors! in one line.

The ~~old text~~ [new text] can be mixed with speling !spelling! corrections.`
	});

	$effect(() => {
		if (initialContent) {
			essayStore.content = initialContent;
		}
	});

	function generateHTML() {
		let html = essayStore.content;
		html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		html = html.replace(
			/(\S+)\s+!([^!]+)!/g,
			(_match: string, word: string, correction: string, offset: number, fullText: string) => {
				const isFollowedByCorrection = /^\s+\S+\s+!/.test(fullText.slice(offset + _match.length));
				const spacingClass = isFollowedByCorrection ? 'has-next-correction' : '';
				return `<span class="correction-container ${spacingClass}">
                    <span class="correction-text">${correction}</span>
                    <span class="underlined">${word}</span>
                </span>`;
			}
		);
		html = html.replace(/~~([^~]+)~~/g, '<span class="deleted">$1</span>');
		html = html.replace(/\[([^\]]+)\]/g, '<span class="added">$1</span>');
		html = html
			.split('\n\n')
			.map((paragraph: string) =>
				paragraph.trim() ? `<p class="">${paragraph.replace(/\n/g, '<br>')}</p>` : ''
			)
			.join('');
		return html;
	}

	function handleContentChange(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		essayStore.content = target.value;
		onContentChange(target.value);
	}

	function handlePrint() {
		window.print();
	}
</script>

<div class="editor-wrapper">
	<div class="split-view">
		<!-- Editor UI (left side) -->
		<div class="editor-ui">
			<div class="editor-container">
				<div class="header">
					<h2>Snapgrade</h2>
					<div class="controls">
						<button onclick={handlePrint} class="print-button">Print Document</button>
					</div>
				</div>

				<div class="instructions">
					<h3>Correction Marks:</h3>
					<ul>
						<li>
							For major changes: Use <code>~~deleted text~~</code> and <code>[new text]</code>
						</li>
						<li>
							For spelling corrections: Write the word, then the correction in exclamation marks:
							<code>word !correction!</code>
						</li>
					</ul>
				</div>

				<textarea
					bind:value={essayStore.content}
					oninput={handleContentChange}
					class="essay-textarea"
					placeholder="Enter your essay here..."
				></textarea>
			</div>
		</div>

		<!-- Preview/Print content (right side) -->
		<div class="preview-container">
			<div class="a4-content">
				{@html generateHTML()}
			</div>
		</div>
	</div>
</div>

<style>
	/* Base layout */
	.editor-wrapper {
		width: 100%;
		min-height: 100vh;
		padding: 1rem;
	}

	.split-view {
		display: grid;
		grid-template-columns: minmax(300px, 1fr) auto;
		gap: 2rem;
		max-width: 1800px;
		margin: 0 auto;
		align-items: start;
	}

	/* Editor section */
	.editor-container {
		background-color: var(--background-secondary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 0.5rem;
		padding: 1.5rem;
		box-shadow: 0 4px 6px var(--background-modifier-box-shadow);
		position: sticky;
		top: 1rem;
	}

	/* Preview section */
	.preview-container {
		background-color: var(--background-secondary);
		width: 210mm;
		min-height: 297mm;
		padding: 20mm;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
		border-radius: 0.5rem;
	}

	.a4-content {
		color: var(--text-normal);
		font-size: 12pt;
		line-height: 1.5;
		font-family: 'Times New Roman', serif;
	}

	/* Editor UI elements */
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 2rem;
	}

	h2 {
		color: var(--text-normal);
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
	}

	.print-button {
		background-color: var(--interactive-accent);
		color: var(--text-on-accent);
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		border: none;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.2s ease;
	}

	.print-button:hover {
		background-color: var(--interactive-accent-hover);
	}

	.instructions {
		margin-bottom: 1.5rem;
	}

	h3 {
		color: var(--text-normal);
		font-size: 1rem;
		font-weight: 500;
		margin-bottom: 0.75rem;
	}

	.essay-textarea {
		width: 100%;
		height: calc(100vh - 300px);
		min-height: 16rem;
		background-color: var(--background-secondary-alt);
		color: var(--text-normal);
		border: 1px solid var(--background-modifier-border);
		border-radius: 0.375rem;
		padding: 1rem;
		font-family: monospace;
		resize: vertical;
	}

	/* Correction styles */
	:global(.correction-container) {
		position: relative;
		display: inline-flex;
		margin-right: 0.25em;
	}

	:global(.correction-container.has-next-correction) {
		margin-right: 1em;
	}

	:global(.correction-text) {
		position: absolute;
		top: -1em;
		left: 0;
		color: var(--text-accent) !important;
		font-size: 1em;
		font-weight: bold;
		white-space: nowrap;
	}

	:global(.underlined) {
		border-bottom: 2px dashed var(--text-error);
		opacity: 0.7;
		text-decoration: none;
	}

	:global(.added) {
		color: var(--background-modifier-success) !important;
		font-weight: bold;
	}

	:global(.deleted) {
		color: var(--text-error) !important;
		text-decoration: line-through;
		opacity: 0.75;
	}

	/* Print styles */
	@media print {
		.editor-wrapper {
			padding: 0;
		}

		.split-view {
			display: block;
		}

		.editor-ui {
			display: none !important;
		}

		.preview-container {
			background-color: white;
			width: 100%;
			min-height: 0;
			padding: 0;
			box-shadow: none;
			border-radius: 0;
		}

		.a4-content {
			color: black;
		}

		@page {
			size: A4;
			margin: 20mm;
		}

		/* Print-specific correction styles */
		:global(.correction-text) {
			color: var(--interactive-success) !important;
			print-color-adjust: exact;
			-webkit-print-color-adjust: exact;
		}

		:global(.underlined) {
			border-bottom: 2px dashed var(--interactive-success);
			print-color-adjust: exact;
			-webkit-print-color-adjust: exact;
		}

		:global(.added) {
			color: var(--interactive-success) !important;
			print-color-adjust: exact;
			-webkit-print-color-adjust: exact;
		}

		:global(.deleted) {
			color: var(--interactive-success) !important;
			print-color-adjust: exact;
			-webkit-print-color-adjust: exact;
		}
	}

	/* Utility classes */
	ul {
		list-style-type: disc;
		padding-left: 1.5rem;
		color: var(--text-muted);
	}

	code {
		background-color: var(--background-modifier-form-field);
		color: var(--text-accent);
		padding: 0.2em 0.4em;
		border-radius: 0.25rem;
		font-family: monospace;
	}
</style>