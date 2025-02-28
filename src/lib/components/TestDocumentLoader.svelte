<script lang="ts">
	import { onMount } from 'svelte';
	import TextEditor from './TextEditor.svelte';
	import { editorStore } from '$lib/stores/editorStore.svelte';
	import { decompressNodes } from '$lib/utils/nodeCompressor';

	// Props
	const { documentId = '' } = $props<{
		documentId?: string;
	}>();

	let document = $state<any>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		if (!documentId) {
			// Use the sample document from the task for testing
			document = {
				compressedNodes: `[  {"i":"n1","t":"normal","x":"Lastly,","m":{"p":0,"w":false,"u":false,"s":0,"e":7}},  {"i":"n2","t":"normal","x":"both","m":{"p":8,"w":false,"u":false,"s":8,"e":12}},  {"i":"n3","t":"normal","x":"family","m":{"p":13,"w":false,"u":false,"s":13,"e":19}},  {"i":"n4","t":"normal","x":"and","m":{"p":20,"w":false,"u":false,"s":20,"e":23}},  {"i":"n5","t":"spacer","s":"newline","m":{"p":23,"w":true,"u":false,"s":23,"e":24}},  {"i":"n6","t":"normal","x":"friends","m":{"p":24,"w":false,"u":false,"s":24,"e":31}},  {"i":"n7","t":"normal","x":"can","m":{"p":32,"w":false,"u":false,"s":32,"e":35}},  {"i":"n8","t":"spacer","s":"newline","m":{"p":35,"w":true,"u":false,"s":35,"e":36}},  {"i":"n9","t":"normal","x":"help","m":{"p":36,"w":false,"u":false,"s":36,"e":40}},  {"i":"n10","t":"normal","x":"me.","m":{"p":41,"w":false,"u":false,"s":41,"e":44}},  {"i":"n11","t":"normal","x":"when","m":{"p":45,"w":false,"u":false,"s":45,"e":50}},  {"i":"n12","t":"normal","x":"I'm","m":{"p":51,"w":false,"u":false,"s":51,"e":54}},  {"i":"n13","t":"spacer","s":"newline","m":{"p":54,"w":true,"u":false,"s":54,"e":55}},  {"i":"n14","t":"normal","x":"sad","m":{"p":55,"w":false,"u":false,"s":55,"e":58}},  {"i":"n15","t":"normal","x":"or","m":{"p":59,"w":false,"u":false,"s":59,"e":61}},  {"i":"n16","t":"normal","x":"angry,","m":{"p":62,"w":false,"u":false,"s":62,"e":68}},  {"i":"n17","t":"normal","x":"they","m":{"p":69,"w":false,"u":false,"s":69,"e":73}},  {"i":"n18","t":"spacer","s":"newline","m":{"p":73,"w":true,"u":false,"s":73,"e":74}},  {"i":"n19","t":"normal","x":"usually","m":{"p":74,"w":false,"u":false,"s":74,"e":81}},  {"i":"n20","t":"normal","x":"console","m":{"p":82,"w":false,"u":false,"s":82,"e":89}},  {"i":"n21","t":"normal","x":"me.","m":{"p":90,"w":false,"u":false,"s":90,"e":93}},  {"i":"n22","t":"normal","x":"For","m":{"p":94,"w":false,"u":false,"s":94,"e":97}},  {"i":"n23","t":"normal","x":"instance,","m":{"p":98,"w":false,"u":false,"s":98,"e":107}},  {"i":"n24","t":"normal","x":"when","m":{"p":108,"w":false,"u":false,"s":108,"e":112}},  {"i":"n25","t":"normal","x":"A","m":{"p":113,"w":false,"u":false,"s":113,"e":114}},  {"i":"n26","t":"spacer","s":"newline","m":{"p":114,"w":true,"u":false,"s":114,"e":115}},  {"i":"n27","t":"normal","x":"feel","m":{"p":115,"w":false,"u":false,"s":115,"e":119}},  {"i":"n28","t":"normal","x":"bad","m":{"p":120,"w":false,"u":false,"s":120,"e":123}},  {"i":"n29","t":"normal","x":"9+","m":{"p":124,"w":false,"u":false,"s":124,"e":126}},  {"i":"n30","t":"normal","x":"school,","m":{"p":127,"w":false,"u":false,"s":127,"e":134}},  {"i":"n31","t":"normal","x":"my","m":{"p":135,"w":false,"u":false,"s":135,"e":137}},  {"i":"n32","t":"normal","x":"best","m":{"p":138,"w":false,"u":false,"s":138,"e":142}},  {"i":"n33","t":"normal","x":"friend","m":{"p":143,"w":false,"u":false,"s":143,"e":149}},  {"i":"n34","t":"spacer","s":"newline","m":{"p":149,"w":true,"u":false,"s":149,"e":150}},  {"i":"n35","t":"normal","x":"can","m":{"p":150,"w":false,"u":false,"s":150,"e":153}},  {"i":"n36","t":"normal","x":"make","m":{"p":154,"w":false,"u":false,"s":154,"e":158}},  {"i":"n37","t":"normal","x":"me","m":{"p":159,"w":false,"u":false,"s":159,"e":161}},  {"i":"n38","t":"normal","x":"feel","m":{"p":162,"w":false,"u":false,"s":162,"e":166}},  {"i":"n39","t":"normal","x":"better","m":{"p":167,"w":false,"u":false,"s":167,"e":173}},  {"i":"n40","t":"normal","x":"and","m":{"p":174,"w":false,"u":false,"s":174,"e":177}},  {"i":"n41","t":"spacer","s":"newline","m":{"p":177,"w":true,"u":false,"s":177,"e":178}},  {"i":"n42","t":"normal","x":"Also,","m":{"p":178,"w":false,"u":false,"s":178,"e":183}},  {"i":"n43","t":"normal","x":"when","m":{"p":184,"w":false,"u":false,"s":184,"e":188}},  {"i":"n44","t":"normal","x":"A","m":{"p":189,"w":false,"u":false,"s":189,"e":190}},  {"i":"n45","t":"normal","x":"was","m":{"p":191,"w":false,"u":false,"s":191,"e":194}},  {"i":"n46","t":"normal","x":"sad","m":{"p":195,"w":false,"u":false,"s":195,"e":198}},  {"i":"n47","t":"normal","x":"at","m":{"p":199,"w":false,"u":false,"s":199,"e":201}},  {"i":"n48","t":"normal","x":"home,","m":{"p":202,"w":false,"u":false,"s":202,"e":207}},  {"i":"n49","t":"normal","x":"my","m":{"p":208,"w":false,"u":false,"s":208,"e":210}},  {"i":"n50","t":"normal","x":"Sister","m":{"p":211,"w":false,"u":false,"s":211,"e":217}},  {"i":"n51","t":"spacer","s":"newline","m":{"p":217,"w":true,"u":false,"s":217,"e":218}},  {"i":"n52","t":"normal","x":"can","m":{"p":218,"w":false,"u":false,"s":218,"e":221}},  {"i":"n53","t":"normal","x":"try","m":{"p":222,"w":false,"u":false,"s":222,"e":225}},  {"i":"n54","t":"spacer","s":"newline","m":{"p":225,"w":true,"u":false,"s":225,"e":226}},  {"i":"n55","t":"normal","x":"play","m":{"p":226,"w":false,"u":false,"s":226,"e":230}},  {"i":"n56","t":"normal","x":"together,","m":{"p":231,"w":false,"u":false,"s":231,"e":240}},  {"i":"n57","t":"spacer","s":"newline","m":{"p":240,"w":true,"u":false,"s":240,"e":241}},  {"i":"n58","t":"normal","x":"to","m":{"p":241,"w":false,"u":false,"s":241,"e":243}},  {"i":"n59","t":"normal","x":"cheer","m":{"p":244,"w":false,"u":false,"s":244,"e":249}},  {"i":"n60","t":"normal","x":"me","m":{"p":250,"w":false,"u":false,"s":250,"e":252}},  {"i":"n61","t":"spacer","s":"newline","m":{"p":252,"w":true,"u":false,"s":252,"e":253}},  {"i":"n62","t":"normal","x":"UP,","m":{"p":253,"w":false,"u":false,"s":253,"e":256}},  {"i":"n63","t":"normal","x":"In","m":{"p":257,"w":false,"u":false,"s":257,"e":259}},  {"i":"n64","t":"spacer","s":"newline","m":{"p":259,"w":true,"u":false,"s":259,"e":260}},  {"i":"n65","t":"normal","x":"addition,","m":{"p":260,"w":false,"u":false,"s":260,"e":269}},  {"i":"n66","t":"normal","x":"such","m":{"p":270,"w":false,"u":false,"s":270,"e":274}},  {"i":"n67","t":"spacer","s":"newline","m":{"p":274,"w":true,"u":false,"s":274,"e":275}},  {"i":"n68","t":"normal","x":"they","m":{"p":275,"w":false,"u":false,"s":275,"e":279}},  {"i":"n69","t":"normal","x":"help","m":{"p":280,"w":false,"u":false,"s":280,"e":284}},  {"i":"n70","t":"normal","x":"difficult","m":{"p":285,"w":false,"u":false,"s":285,"e":294}},  {"i":"n71","t":"normal","x":"things.","m":{"p":295,"w":false,"u":false,"s":295,"e":302}},  {"i":"n72","t":"normal","x":"In","m":{"p":303,"w":false,"u":false,"s":303,"e":305}},  {"i":"n73","t":"normal","x":"one","m":{"p":306,"w":false,"u":false,"s":306,"e":309}},  {"i":"n74","t":"spacer","s":"newline","m":{"p":309,"w":true,"u":false,"s":309,"e":310}},  {"i":"n75","t":"normal","x":"case,","m":{"p":310,"w":false,"u":false,"s":310,"e":315}},  {"i":"n76","t":"normal","x":"when","m":{"p":316,"w":false,"u":false,"s":316,"e":320}},  {"i":"n77","t":"normal","x":"I","m":{"p":321,"w":false,"u":false,"s":321,"e":322}},  {"i":"n78","t":"spacer","s":"newline","m":{"p":322,"w":true,"u":false,"s":322,"e":323}},  {"i":"n79","t":"normal","x":"was","m":{"p":323,"w":false,"u":false,"s":323,"e":326}},  {"i":"n80","t":"normal","x":"thinking","m":{"p":327,"w":false,"u":false,"s":327,"e":335}},  {"i":"n81","t":"normal","x":"and","m":{"p":336,"w":false,"u":false,"s":336,"e":339}},  {"i":"n82","t":"normal","x":"thinking","m":{"p":340,"w":false,"u":false,"s":340,"e":348}},  {"i":"n83","t":"spacer","s":"newline","m":{"p":348,"w":true,"u":false,"s":348,"e":349}},  {"i":"n84","t":"normal","x":"about","m":{"p":349,"w":false,"u":false,"s":349,"e":354}},  {"i":"n85","t":"normal","x":"the","m":{"p":355,"w":false,"u":false,"s":355,"e":358}},  {"i":"n86","t":"normal","x":"math","m":{"p":359,"w":false,"u":false,"s":359,"e":363}},  {"i":"n87","t":"normal","x":"problem","m":{"p":364,"w":false,"u":false,"s":364,"e":371}},  {"i":"n88","t":"normal","x":"at","m":{"p":372,"w":false,"u":false,"s":372,"e":374}},  {"i":"n89","t":"normal","x":"school,","m":{"p":375,"w":false,"u":false,"s":375,"e":382}},  {"i":"n90","t":"normal","x":"my","m":{"p":383,"w":false,"u":false,"s":383,"e":385}},  {"i":"n91","t":"normal","x":"friend","m":{"p":386,"w":false,"u":false,"s":386,"e":392}},  {"i":"n92","t":"spacer","s":"newline","m":{"p":392,"w":true,"u":false,"s":392,"e":393}},  {"i":"n93","t":"normal","x":"told","m":{"p":393,"w":false,"u":false,"s":393,"e":397}},  {"i":"n94","t":"normal","x":"how","m":{"p":398,"w":false,"u":false,"s":398,"e":401}},  {"i":"n95","t":"normal","x":"to","m":{"p":402,"w":false,"u":false,"s":402,"e":404}},  {"i":"n96","t":"normal","x":"solve","m":{"p":405,"w":false,"u":false,"s":405,"e":410}},  {"i":"n97","t":"normal","x":"this","m":{"p":411,"w":false,"u":false,"s":411,"e":415}},  {"i":"n98","t":"normal","x":"problem.","m":{"p":416,"w":false,"u":false,"s":416,"e":424}},  {"i":"n99","t":"normal","x":"Also","m":{"p":425,"w":false,"u":false,"s":425,"e":429}},  {"i":"n100","t":"normal","x":"when","m":{"p":430,"w":false,"u":false,"s":430,"e":434}},  {"i":"n101","t":"spacer","s":"newline","m":{"p":434,"w":true,"u":false,"s":434,"e":435}},  {"i":"n102","t":"normal","x":"I","m":{"p":435,"w":false,"u":false,"s":435,"e":436}},  {"i":"n103","t":"normal","x":"can't","m":{"p":437,"w":false,"u":false,"s":437,"e":442}},  {"i":"n104","t":"normal","x":"white","m":{"p":443,"w":false,"u":false,"s":443,"e":448}},  {"i":"n105","t":"normal","x":"the","m":{"p":449,"w":false,"u":false,"s":449,"e":452}},  {"i":"n106","t":"normal","x":"essay,","m":{"p":453,"w":false,"u":false,"s":453,"e":459}},  {"i":"n107","t":"normal","x":"my","m":{"p":460,"w":false,"u":false,"s":460,"e":462}},  {"i":"n108","t":"normal","x":"mom","m":{"p":463,"w":false,"u":false,"s":463,"e":466}},  {"i":"n109","t":"normal","x":"can","m":{"p":467,"w":false,"u":false,"s":467,"e":470}},  {"i":"n110","t":"spacer","s":"newline","m":{"p":470,"w":true,"u":false,"s":470,"e":471}},  {"i":"n111","t":"normal","x":",","m":{"p":471,"w":false,"u":true,"s":471,"e":472}},  {"i":"n112","t":"spacer","s":"newline","m":{"p":472,"w":true,"u":false,"s":472,"e":473}},  {"i":"n113","t":"normal","x":"give","m":{"p":473,"w":false,"u":false,"s":473,"e":477}},  {"i":"n114","t":"spacer","s":"newline","m":{"p":477,"w":true,"u":false,"s":477,"e":478}},  {"i":"n115","t":"normal","x":"some","m":{"p":478,"w":false,"u":false,"s":478,"e":482}},  {"i":"n116","t":"normal","x":"Ideas","m":{"p":483,"w":false,"u":false,"s":483,"e":488}},  {"i":"n117","t":"normal","x":"for","m":{"p":489,"w":false,"u":false,"s":489,"e":492}},  {"i":"n118","t":"normal","x":"writing","m":{"p":493,"w":false,"u":false,"s":493,"e":500}},  {"i":"n119","t":"normal","x":"it.","m":{"p":501,"w":false,"u":false,"s":501,"e":504}}]`,
				documentBody: "Lastly, both family and friends can help me. when I'm sad or angry, they usually console me. For instance, when I feel bad 9+ school, my best friend can make me feel better and Also, when I was sad at home, my Sister can try play together, to cheer me UP, In addition, such they help difficult things. In one case, when I was thinking and thinking about the math problem at school, my friend told how to solve this problem. Also when I can't white the essay, my mom can , give some Ideas for writing it. <<<  ",
				documentName: "Test Document"
			};
			isLoading = false;
		} else {
			// Fetch document from API
			try {
				const response = await fetch(`/api/documents/${documentId}`);
				if (!response.ok) {
					throw new Error(`Error ${response.status}: ${response.statusText}`);
				}
				document = await response.json();
				isLoading = false;
			} catch (err) {
				console.error('Error loading document:', err);
				error = 'Failed to load document. Please try again.';
				isLoading = false;
			}
		}
	});

	// Debug function to log the parsed nodes
	function logParsedNodes() {
		if (document?.compressedNodes) {
			try {
				const nodes = JSON.parse(document.compressedNodes);
				console.log('Parsed nodes from JSON (first 25):', nodes.slice(0, 25));
				
				// Log the IDs of the original nodes
				console.log('Original node IDs (first 25):', nodes.slice(0, 25).map((n: any) => n.i));
				
				// Check if there are any spacer nodes with IDs like 's1', 's2', etc.
				const spacerNodes = nodes.filter((n: any) => n.i.startsWith('s'));
				console.log('Spacer nodes with "s" prefix:', spacerNodes.length);
				if (spacerNodes.length > 0) {
					console.log('First few spacer nodes with "s" prefix:', spacerNodes.slice(0, 5));
				}
				
				// Now log decompressed nodes to compare
				const decompressed = decompressNodes(document.compressedNodes);
				console.log('Decompressed nodes (first 25):', decompressed.slice(0, 25));
				
				// Check if there are any spacer nodes with IDs like 's1', 's2', etc. after decompression
				const decompressedSpacerNodes = decompressed.filter(n => n.id.startsWith('s'));
				console.log('Decompressed spacer nodes with "s" prefix:', decompressedSpacerNodes.length);
				if (decompressedSpacerNodes.length > 0) {
					console.log('First few decompressed spacer nodes with "s" prefix:', decompressedSpacerNodes.slice(0, 5));
				}
				
				return true;
			} catch (err) {
				console.error('Error parsing nodes:', err);
				return false;
			}
		}
		return false;
	}
</script>

<div class="test-container">
	<h1>Document Loader Test</h1>
	
	{#if isLoading}
		<div class="loading">Loading document...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else if document}
		<div class="document-info">
			<h2>{document.documentName}</h2>
			<div class="debug-info">
				<button onclick={logParsedNodes}>Log Parsed Nodes</button>
				<p>Has compressedNodes: {Boolean(document.compressedNodes)}</p>
				<p>Document body length: {document.documentBody?.length || 0} characters</p>
			</div>
		</div>
		
		<div class="editor-container">
			<TextEditor compressedNodes={document.compressedNodes} initialContent={document.documentBody} />
		</div>
	{:else}
		<div class="error">No document data available</div>
	{/if}
</div>

<style>
	.test-container {
		padding: var(--spacing-4);
		max-width: 1200px;
		margin: 0 auto;
	}
	
	h1 {
		font-size: var(--font-size-2xl);
		margin-bottom: var(--spacing-6);
	}
	
	.loading, .error {
		padding: var(--spacing-4);
		border-radius: var(--radius-md);
		text-align: center;
	}
	
	.loading {
		background-color: var(--background-secondary);
	}
	
	.error {
		background-color: var(--background-error);
		color: var(--text-error);
	}
	
	.document-info {
		margin-bottom: var(--spacing-6);
		padding: var(--spacing-4);
		background-color: var(--background-secondary);
		border-radius: var(--radius-md);
	}
	
	.debug-info {
		margin-top: var(--spacing-4);
		padding-top: var(--spacing-4);
		border-top: 1px solid var(--border-color);
	}
	
	.debug-info button {
		margin-bottom: var(--spacing-2);
	}
	
	.editor-container {
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		overflow: hidden;
	}
</style>