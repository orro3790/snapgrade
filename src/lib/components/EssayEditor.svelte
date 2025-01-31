<script lang="ts">
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

		// Handle spelling corrections (exclamation marks)
		html = html.replace(
			/(\S+)\s+!([^!]+)!/g,
			(_match: string, word: string, correction: string) => {
				return `<span class="correction-container">
              <span class="correction-text">${correction}</span>
              <span class="underlined">${word}</span>
          </span>`;
			}
		);

		// Handle deletions and additions
		html = html.replace(/~~([^~]+)~~/g, '<span class="deleted">$1</span>');
		html = html.replace(/\[([^\]]+)\]/g, '<span class="added">$1</span>');

		// Double space lines
		html = html.replace(/\n/g, '\n\n');

		return html;
	}

	function exportToWord() {
		const html = `
          <!DOCTYPE html>
          <html>
              <head>
                  <meta charset="utf-8">
                  <title>Essay Corrections</title>
                  <style>
                      body {
                          line-height: 2.5;
                          font-size: 12pt;
                          font-family: "Times New Roman", serif;
                      }
                      .added { 
                          color: #008000; 
                      }
                      .deleted { 
                          color: #FF0000; 
                          text-decoration: line-through;
                      }
                      .correction-container {
                          position: relative;
                          display: inline-block;
                          margin: 0 2px;
                      }
                      .correction-text {
                          position: absolute;
                          top: -1.2em;
                          left: 0;
                          color: #0000FF;
                          font-size: 0.85em;
                          white-space: nowrap;
                      }
                      .underlined {
                          border-bottom: 1px wavy #FF0000;
                          text-decoration: underline;
                          text-decoration-style: wavy;
                          text-decoration-color: #FF0000;
                          display: inline-block;
                      }
                  </style>
              </head>
              <body>
                  ${generateHTML()}
              </body>
          </html>
      `;

		const blob = new Blob([html], { type: 'application/msword' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'essay-with-corrections.doc';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	function handleContentChange(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		essayStore.content = target.value;
		onContentChange(target.value);
	}
</script>

<div class="mx-auto max-w-4xl space-y-6 p-6">
	<div class="rounded-lg bg-white p-6 shadow-md">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="flex items-center gap-2 text-xl font-semibold">Enhanced Essay Editor</h2>
			<div class="space-x-2">
				<button
					onclick={exportToWord}
					class="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
				>
					Export as Word
				</button>
			</div>
		</div>

		<div class="mb-6">
			<h3 class="mb-2 text-lg font-medium">Correction Marks:</h3>
			<ul class="list-disc space-y-2 pl-6">
				<li>For major changes: Use <code>~~deleted text~~</code> and <code>[new text]</code></li>
				<li>
					For spelling corrections: Write the word, then the correction in exclamation marks:
					<code>word !correction!</code>
				</li>
			</ul>
		</div>

		<div class="prose mb-4 max-w-none rounded bg-gray-50 p-4">
			<h4 class="mb-2 text-sm font-medium">Preview:</h4>
			<div class="preview-content">
				{@html generateHTML()}
			</div>
		</div>

		<textarea
			bind:value={essayStore.content}
			oninput={handleContentChange}
			class="h-64 w-full rounded-md border p-4 font-mono text-sm"
			placeholder="Enter your essay here..."
		></textarea>
	</div>
</div>

<style>
	:global(.preview-content) {
		line-height: 2.5;
	}
	:global(.correction-container) {
		position: relative;
		display: inline-block;
		margin: 0 2px;
	}
	:global(.correction-text) {
		position: absolute;
		top: -1.2em;
		left: 0;
		color: #0000ff;
		font-size: 0.85em;
		white-space: nowrap;
	}
	:global(.underlined) {
		border-bottom: 1px wavy #ff0000;
		text-decoration: underline;
		text-decoration-style: wavy;
		text-decoration-color: #ff0000;
		display: inline-block;
	}
	:global(.added) {
		color: #008000;
	}
	:global(.deleted) {
		color: #ff0000;
		text-decoration: line-through;
	}
</style>
