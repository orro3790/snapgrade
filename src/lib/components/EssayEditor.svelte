<!-- file: src/lib/components/EssayEditor.svelte -->
<script lang="ts">
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

		// First, escape any HTML to prevent XSS
		html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

		// Handle spelling corrections (exclamation marks) with spacing check
		html = html.replace(
			/(\S+)\s+!([^!]+)!/g,
			(_match: string, word: string, correction: string, offset: number, fullText: string) => {
				// Check if this is followed by another correction
				const isFollowedByCorrection = /^\s+\S+\s+!/.test(fullText.slice(offset + _match.length));
				const spacingClass = isFollowedByCorrection ? 'has-next-correction' : '';

				return `<span class="correction-container ${spacingClass}">
              <span class="correction-text">${correction}</span>
              <span class="underlined">${word}</span>
          </span>`;
			}
		);

		// Handle deletions and additions
		html = html.replace(/~~([^~]+)~~/g, '<span class="deleted">$1</span>');
		html = html.replace(/\[([^\]]+)\]/g, '<span class="added">$1</span>');

		// Convert line breaks to paragraphs
		html = html
			.split('\n\n')
			.map((paragraph: string) =>
				paragraph.trim() ? `<p class="">${paragraph.replace(/\n/g, '<br>')}</p>` : ''
			)
			.join('');

		return html;
	}

	async function exportAsImage() {
		const previewContent = document.querySelector('.a4-preview-content');
		if (!previewContent) return;

		try {
			const options = {
				scale: 2,
				backgroundColor: '#ffffff',
				logging: false,
				width: previewContent.scrollWidth,
				height: previewContent.scrollHeight,
				windowWidth: previewContent.scrollWidth,
				windowHeight: previewContent.scrollHeight
			};

			const canvas = await html2canvas(previewContent as HTMLElement, options);
			const image = canvas.toDataURL('image/png', 1.0);

			const link = document.createElement('a');
			link.download = 'essay-with-corrections.png';
			link.href = image;
			link.click();
		} catch (error) {
			console.error('Error generating image:', error);
			alert('Failed to generate image. Please try again.');
		}
	}

	function handleContentChange(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		essayStore.content = target.value;
		onContentChange(target.value);
	}
</script>

<div class="mx-auto max-w-4xl space-y-6 p-6">
	<div class="editor-container">
		<div class="header">
			<h2>Enhanced Essay Editor</h2>
			<div class="controls">
				<button onclick={exportAsImage} class="export-button"> Export as Image </button>
			</div>
		</div>

		<div class="instructions">
			<h3>Correction Marks:</h3>
			<ul>
				<li>For major changes: Use <code>~~deleted text~~</code> and <code>[new text]</code></li>
				<li>
					For spelling corrections: Write the word, then the correction in exclamation marks:
					<code>word !correction!</code>
				</li>
			</ul>
		</div>

		<div class="a4-container">
			<h4 class="preview-title">Preview:</h4>
			<div class="a4-preview-content">
				<div class="a4-content">
					{@html generateHTML()}
				</div>
			</div>
		</div>

		<textarea
			bind:value={essayStore.content}
			oninput={handleContentChange}
			class="essay-textarea"
			placeholder="Enter your essay here..."
		></textarea>
	</div>
</div>

<style>
	/* Main container styling */
	.editor-container {
		background-color: var(--background-secondary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 0.5rem;
		padding: 1.5rem;
		box-shadow: 0 4px 6px var(--background-modifier-box-shadow);
	}

	/* Header section */
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

	/* Export button */
	.export-button {
		background-color: var(--interactive-accent);
		color: var(--text-on-accent);
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		border: none;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.2s ease;
	}

	.export-button:hover {
		background-color: var(--interactive-accent-hover);
	}

	/* Instructions section */
	.instructions {
		margin-bottom: 1.5rem;
	}

	h3 {
		color: var(--text-normal);
		font-size: 1rem;
		font-weight: 500;
		margin-bottom: 0.75rem;
	}

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

	/* A4 Preview styling */
	.a4-container {
		background-color: var(--background-primary-alt);
		border: 1px solid var(--background-modifier-border);
		border-radius: 0.375rem;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.preview-title {
		color: var(--text-muted);
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}

	.a4-preview-content {
		background-color: var(--background-primary) !important;
		box-shadow: 0 0 10px var(--background-modifier-box-shadow);
		width: 210mm;
		min-height: 297mm;
		margin: 0 auto;
		transform: scale(0.7);
		transform-origin: top left;
	}

	.a4-content {
		color: var(--text-normal);
		padding: 20mm;
		font-size: 12pt;
		line-height: 1.5;
		font-family: 'Times New Roman', serif;
	}

	/* Textarea styling */
	.essay-textarea {
		width: 100%;
		height: 16rem;
		background-color: var(--background-secondary-alt);
		color: var(--text-normal);
		border: 1px solid var(--background-modifier-border);
		border-radius: 0.375rem;
		padding: 1rem;
		font-family: monospace;
		resize: vertical;
	}

	/* Correction styling */
	:global(.correction-container) {
		position: relative;
		display: inline-flex;
		margin-right: 0.25em; /* Default spacing */
	}

	:global(.correction-container.has-next-correction) {
		margin-right: 1em; /* Increased spacing when followed by another correction */
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

	/* Responsive scaling */
	@media screen and (min-width: 1200px) {
		.a4-preview-content {
			transform: scale(0.8);
		}
	}

	@media screen and (min-width: 1600px) {
		.a4-preview-content {
			transform: scale(0.9);
		}
	}

	/* Scrollbar styling */
	::-webkit-scrollbar {
		width: 8px;
		background-color: var(--scrollbar-bg);
	}

	::-webkit-scrollbar-thumb {
		background-color: var(--scrollbar-thumb-bg);
		border-radius: 4px;
	}

	::-webkit-scrollbar-thumb:active {
		background-color: var(--scrollbar-active-thumb-bg);
	}
</style>
