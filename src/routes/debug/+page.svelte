<script lang="ts">
	import { onMount } from 'svelte';
	import TextEditor from '$lib/components/TextEditor.svelte';
	
	// Sample document data from the task
	const sampleDocument = {
		compressedNodes: `[ {"i":"n1","t":"normal","x":"Lastly,","m":{"p":0,"w":false,"u":false,"s":0,"e":7}}, {"i":"s1","t":"spacer","x":" ","m":{"p":7,"w":true,"u":false,"s":7,"e":8}}, {"i":"n2","t":"normal","x":"both","m":{"p":8,"w":false,"u":false,"s":8,"e":12}}, {"i":"s2","t":"spacer","x":" ","m":{"p":12,"w":true,"u":false,"s":12,"e":13}}, {"i":"n3","t":"normal","x":"family","m":{"p":13,"w":false,"u":false,"s":13,"e":19}}, {"i":"s3","t":"spacer","x":" ","m":{"p":19,"w":true,"u":false,"s":19,"e":20}}, {"i":"n4","t":"normal","x":"and","m":{"p":20,"w":false,"u":false,"s":20,"e":23}}, {"i":"s4","t":"spacer","s":"newline","m":{"p":23,"w":true,"u":false,"s":23,"e":24}}, {"i":"n5","t":"normal","x":"friends","m":{"p":24,"w":false,"u":false,"s":24,"e":31}}, {"i":"s5","t":"spacer","x":" ","m":{"p":31,"w":true,"u":false,"s":31,"e":32}}, {"i":"n6","t":"normal","x":"can","m":{"p":32,"w":false,"u":false,"s":32,"e":35}}, {"i":"s6","t":"spacer","s":"newline","m":{"p":35,"w":true,"u":false,"s":35,"e":36}}, {"i":"n7","t":"normal","x":"help","m":{"p":36,"w":false,"u":false,"s":36,"e":40}}, {"i":"s7","t":"spacer","x":" ","m":{"p":40,"w":true,"u":false,"s":40,"e":41}}, {"i":"n8","t":"normal","x":"me.","m":{"p":41,"w":false,"u":true,"s":41,"e":44}}, {"i":"s8","t":"spacer","x":" ","m":{"p":44,"w":true,"u":false,"s":44,"e":45}}, {"i":"n9","t":"normal","x":"when","m":{"p":45,"w":false,"u":false,"s":45,"e":50}}, {"i":"s9","t":"spacer","x":" ","m":{"p":50,"w":true,"u":false,"s":50,"e":51}}, {"i":"n10","t":"normal","x":"I'm","m":{"p":51,"w":false,"u":false,"s":51,"e":54}}, {"i":"s10","t":"spacer","s":"newline","m":{"p":54,"w":true,"u":false,"s":54,"e":55}}, {"i":"n11","t":"normal","x":"sad","m":{"p":55,"w":false,"u":false,"s":55,"e":58}}, {"i":"s11","t":"spacer","x":" ","m":{"p":58,"w":true,"u":false,"s":58,"e":59}}, {"i":"n12","t":"normal","x":"or","m":{"p":59,"w":false,"u":false,"s":59,"e":61}}, {"i":"s12","t":"spacer","x":" ","m":{"p":61,"w":true,"u":false,"s":61,"e":62}}, {"i":"n13","t":"normal","x":"angry,","m":{"p":62,"w":false,"u":true,"s":62,"e":68}}, {"i":"s13","t":"spacer","x":" ","m":{"p":68,"w":true,"u":false,"s":68,"e":69}}, {"i":"n14","t":"normal","x":"they","m":{"p":69,"w":false,"u":false,"s":69,"e":73}}, {"i":"s14","t":"spacer","s":"newline","m":{"p":73,"w":true,"u":false,"s":73,"e":74}}, {"i":"n15","t":"normal","x":"usually","m":{"p":74,"w":false,"u":false,"s":74,"e":81}}, {"i":"s15","t":"spacer","x":" ","m":{"p":81,"w":true,"u":false,"s":81,"e":82}}, {"i":"n16","t":"normal","x":"console","m":{"p":82,"w":false,"u":false,"s":82,"e":89}}, {"i":"s16","t":"spacer","x":" ","m":{"p":89,"w":true,"u":false,"s":89,"e":90}}, {"i":"n17","t":"normal","x":"me.","m":{"p":90,"w":false,"u":true,"s":90,"e":93}}, {"i":"s17","t":"spacer","x":" ","m":{"p":93,"w":true,"u":false,"s":93,"e":94}}, {"i":"n18","t":"normal","x":"For","m":{"p":94,"w":false,"u":false,"s":94,"e":97}}, {"i":"s18","t":"spacer","x":" ","m":{"p":97,"w":true,"u":false,"s":97,"e":98}}, {"i":"n19","t":"normal","x":"instance,","m":{"p":98,"w":false,"u":true,"s":98,"e":107}}, {"i":"s19","t":"spacer","x":" ","m":{"p":107,"w":true,"u":false,"s":107,"e":108}}, {"i":"n20","t":"normal","x":"when","m":{"p":108,"w":false,"u":false,"s":108,"e":112}}, {"i":"s20","t":"spacer","x":" ","m":{"p":112,"w":true,"u":false,"s":112,"e":113}}, {"i":"n21","t":"normal","x":"I","m":{"p":113,"w":false,"u":false,"s":113,"e":114}}, {"i":"s21","t":"spacer","s":"newline","m":{"p":114,"w":true,"u":false,"s":114,"e":115}}, {"i":"n22","t":"normal","x":"feel","m":{"p":115,"w":false,"u":false,"s":115,"e":119}}, {"i":"s22","t":"spacer","x":" ","m":{"p":119,"w":true,"u":false,"s":119,"e":120}}, {"i":"n23","t":"normal","x":"bad","m":{"p":120,"w":false,"u":false,"s":120,"e":123}}, {"i":"s23","t":"spacer","x":" ","m":{"p":123,"w":true,"u":false,"s":123,"e":124}}, {"i":"n24","t":"normal","x":"9+","m":{"p":124,"w":false,"u":false,"s":124,"e":126}}, {"i":"s24","t":"spacer","x":" ","m":{"p":126,"w":true,"u":false,"s":126,"e":127}}, {"i":"n25","t":"normal","x":"school,","m":{"p":127,"w":false,"u":true,"s":127,"e":134}}, {"i":"s25","t":"spacer","x":" ","m":{"p":134,"w":true,"u":false,"s":134,"e":135}}, {"i":"n26","t":"normal","x":"my","m":{"p":135,"w":false,"u":false,"s":135,"e":137}}, {"i":"s26","t":"spacer","x":" ","m":{"p":137,"w":true,"u":false,"s":137,"e":138}}, {"i":"n27","t":"normal","x":"best","m":{"p":138,"w":false,"u":false,"s":138,"e":142}}, {"i":"s27","t":"spacer","x":" ","m":{"p":142,"w":true,"u":false,"s":142,"e":143}}, {"i":"n28","t":"normal","x":"friend","m":{"p":143,"w":false,"u":false,"s":143,"e":149}}, {"i":"s28","t":"spacer","s":"newline","m":{"p":149,"w":true,"u":false,"s":149,"e":150}}, {"i":"n29","t":"normal","x":"can","m":{"p":150,"w":false,"u":false,"s":150,"e":153}}, {"i":"s29","t":"spacer","x":" ","m":{"p":153,"w":true,"u":false,"s":153,"e":154}}, {"i":"n30","t":"normal","x":"make","m":{"p":154,"w":false,"u":false,"s":154,"e":158}}, {"i":"s30","t":"spacer","x":" ","m":{"p":158,"w":true,"u":false,"s":158,"e":159}}, {"i":"n31","t":"normal","x":"me","m":{"p":159,"w":false,"u":false,"s":159,"e":161}}, {"i":"s31","t":"spacer","x":" ","m":{"p":161,"w":true,"u":false,"s":161,"e":162}}, {"i":"n32","t":"normal","x":"feel","m":{"p":162,"w":false,"u":false,"s":162,"e":166}}, {"i":"s32","t":"spacer","x":" ","m":{"p":166,"w":true,"u":false,"s":166,"e":167}}, {"i":"n33","t":"normal","x":"better","m":{"p":167,"w":false,"u":false,"s":167,"e":173}}, {"i":"s33","t":"spacer","x":" ","m":{"p":173,"w":true,"u":false,"s":173,"e":174}}, {"i":"n34","t":"normal","x":"and","m":{"p":174,"w":false,"u":false,"s":174,"e":177}}, {"i":"s34","t":"spacer","s":"newline","m":{"p":177,"w":true,"u":false,"s":177,"e":178}}, {"i":"n35","t":"normal","x":"Also,","m":{"p":178,"w":false,"u":true,"s":178,"e":183}}, {"i":"s35","t":"spacer","x":" ","m":{"p":183,"w":true,"u":false,"s":183,"e":184}}, {"i":"n36","t":"normal","x":"when","m":{"p":184,"w":false,"u":false,"s":184,"e":188}}, {"i":"s36","t":"spacer","x":" ","m":{"p":188,"w":true,"u":false,"s":188,"e":189}}, {"i":"n37","t":"normal","x":"I","m":{"p":189,"w":false,"u":false,"s":189,"e":190}}, {"i":"s37","t":"spacer","x":" ","m":{"p":190,"w":true,"u":false,"s":190,"e":191}}, {"i":"n38","t":"normal","x":"was","m":{"p":191,"w":false,"u":false,"s":191,"e":194}}, {"i":"s38","t":"spacer","x":" ","m":{"p":194,"w":true,"u":false,"s":194,"e":195}}, {"i":"n39","t":"normal","x":"sad","m":{"p":195,"w":false,"u":false,"s":195,"e":198}}, {"i":"s39","t":"spacer","x":" ","m":{"p":198,"w":true,"u":false,"s":198,"e":199}}, {"i":"n40","t":"normal","x":"at","m":{"p":199,"w":false,"u":false,"s":199,"e":201}}, {"i":"s40","t":"spacer","x":" ","m":{"p":201,"w":true,"u":false,"s":201,"e":202}}, {"i":"n41","t":"normal","x":"home,","m":{"p":202,"w":false,"u":true,"s":202,"e":207}}, {"i":"s41","t":"spacer","x":" ","m":{"p":207,"w":true,"u":false,"s":207,"e":208}}, {"i":"n42","t":"normal","x":"my","m":{"p":208,"w":false,"u":false,"s":208,"e":210}}, {"i":"s42","t":"spacer","x":" ","m":{"p":210,"w":true,"u":false,"s":210,"e":211}}, {"i":"n43","t":"normal","x":"Sister","m":{"p":211,"w":false,"u":false,"s":211,"e":217}}, {"i":"s43","t":"spacer","s":"newline","m":{"p":217,"w":true,"u":false,"s":217,"e":218}}, {"i":"n44","t":"normal","x":"can","m":{"p":218,"w":false,"u":false,"s":218,"e":221}}, {"i":"s44","t":"spacer","x":" ","m":{"p":221,"w":true,"u":false,"s":221,"e":222}}, {"i":"n45","t":"normal","x":"try","m":{"p":222,"w":false,"u":false,"s":222,"e":225}}, {"i":"s45","t":"spacer","s":"newline","m":{"p":225,"w":true,"u":false,"s":225,"e":226}}, {"i":"n46","t":"normal","x":"play","m":{"p":226,"w":false,"u":false,"s":226,"e":230}}, {"i":"s46","t":"spacer","x":" ","m":{"p":230,"w":true,"u":false,"s":230,"e":231}}, {"i":"n47","t":"normal","x":"together,","m":{"p":231,"w":false,"u":true,"s":231,"e":240}}, {"i":"s47","t":"spacer","s":"newline","m":{"p":240,"w":true,"u":false,"s":240,"e":241}}, {"i":"n48","t":"normal","x":"to","m":{"p":241,"w":false,"u":false,"s":241,"e":243}}, {"i":"s48","t":"spacer","x":" ","m":{"p":243,"w":true,"u":false,"s":243,"e":244}}, {"i":"n49","t":"normal","x":"cheer","m":{"p":244,"w":false,"u":false,"s":244,"e":249}}, {"i":"s49","t":"spacer","x":" ","m":{"p":249,"w":true,"u":false,"s":249,"e":250}}, {"i":"n50","t":"normal","x":"me","m":{"p":250,"w":false,"u":false,"s":250,"e":252}}, {"i":"s50","t":"spacer","s":"newline","m":{"p":252,"w":true,"u":false,"s":252,"e":253}}, {"i":"n51","t":"normal","x":"UP,","m":{"p":253,"w":false,"u":true,"s":253,"e":256}}, {"i":"s51","t":"spacer","x":" ","m":{"p":256,"w":true,"u":false,"s":256,"e":257}}, {"i":"n52","t":"normal","x":"In","m":{"p":257,"w":false,"u":false,"s":257,"e":259}}, {"i":"s52","t":"spacer","s":"newline","m":{"p":259,"w":true,"u":false,"s":259,"e":260}}, {"i":"n53","t":"normal","x":"addition,","m":{"p":260,"w":false,"u":true,"s":260,"e":269}}, {"i":"s53","t":"spacer","x":" ","m":{"p":269,"w":true,"u":false,"s":269,"e":270}}, {"i":"n54","t":"normal","x":"such","m":{"p":270,"w":false,"u":false,"s":270,"e":274}}, {"i":"s54","t":"spacer","s":"newline","m":{"p":274,"w":true,"u":false,"s":274,"e":275}}, {"i":"n55","t":"normal","x":"they","m":{"p":275,"w":false,"u":false,"s":275,"e":279}}, {"i":"s55","t":"spacer","x":" ","m":{"p":279,"w":true,"u":false,"s":279,"e":280}}, {"i":"n56","t":"normal","x":"help","m":{"p":280,"w":false,"u":false,"s":280,"e":284}}, {"i":"s56","t":"spacer","x":" ","m":{"p":284,"w":true,"u":false,"s":284,"e":285}}, {"i":"n57","t":"normal","x":"difficult","m":{"p":285,"w":false,"u":false,"s":285,"e":294}}, {"i":"s57","t":"spacer","x":" ","m":{"p":294,"w":true,"u":false,"s":294,"e":295}}, {"i":"n58","t":"normal","x":"things.","m":{"p":295,"w":false,"u":true,"s":295,"e":302}}, {"i":"s58","t":"spacer","x":" ","m":{"p":302,"w":true,"u":false,"s":302,"e":303}}, {"i":"n59","t":"normal","x":"In","m":{"p":303,"w":false,"u":false,"s":303,"e":305}}, {"i":"s59","t":"spacer","x":" ","m":{"p":305,"w":true,"u":false,"s":305,"e":306}}, {"i":"n60","t":"normal","x":"one","m":{"p":306,"w":false,"u":false,"s":306,"e":309}}, {"i":"s60","t":"spacer","s":"newline","m":{"p":309,"w":true,"u":false,"s":309,"e":310}}, {"i":"n61","t":"normal","x":"case,","m":{"p":310,"w":false,"u":true,"s":310,"e":315}}, {"i":"s61","t":"spacer","x":" ","m":{"p":315,"w":true,"u":false,"s":315,"e":316}}, {"i":"n62","t":"normal","x":"when","m":{"p":316,"w":false,"u":false,"s":316,"e":320}}, {"i":"s62","t":"spacer","x":" ","m":{"p":320,"w":true,"u":false,"s":320,"e":321}}, {"i":"n63","t":"normal","x":"I","m":{"p":321,"w":false,"u":false,"s":321,"e":322}}, {"i":"s63","t":"spacer","s":"newline","m":{"p":322,"w":true,"u":false,"s":322,"e":323}}, {"i":"n64","t":"normal","x":"was","m":{"p":323,"w":false,"u":false,"s":323,"e":326}}, {"i":"s64","t":"spacer","x":" ","m":{"p":326,"w":true,"u":false,"s":326,"e":327}}, {"i":"n65","t":"normal","x":"thinking","m":{"p":327,"w":false,"u":false,"s":327,"e":335}}, {"i":"s65","t":"spacer","x":" ","m":{"p":335,"w":true,"u":false,"s":335,"e":336}}, {"i":"n66","t":"normal","x":"and","m":{"p":336,"w":false,"u":false,"s":336,"e":339}}, {"i":"s66","t":"spacer","x":" ","m":{"p":339,"w":true,"u":false,"s":339,"e":340}}, {"i":"n67","t":"normal","x":"thinking","m":{"p":340,"w":false,"u":false,"s":340,"e":348}}, {"i":"s67","t":"spacer","s":"newline","m":{"p":348,"w":true,"u":false,"s":348,"e":349}}, {"i":"n68","t":"normal","x":"about","m":{"p":349,"w":false,"u":false,"s":349,"e":354}}, {"i":"s68","t":"spacer","x":" ","m":{"p":354,"w":true,"u":false,"s":354,"e":355}}, {"i":"n69","t":"normal","x":"the","m":{"p":355,"w":false,"u":false,"s":355,"e":358}}, {"i":"s69","t":"spacer","x":" ","m":{"p":358,"w":true,"u":false,"s":358,"e":359}}, {"i":"n70","t":"normal","x":"math","m":{"p":359,"w":false,"u":false,"s":359,"e":363}}, {"i":"s70","t":"spacer","x":" ","m":{"p":363,"w":true,"u":false,"s":363,"e":364}}, {"i":"n71","t":"normal","x":"problem","m":{"p":364,"w":false,"u":false,"s":364,"e":371}}, {"i":"s71","t":"spacer","x":" ","m":{"p":371,"w":true,"u":false,"s":371,"e":372}}, {"i":"n72","t":"normal","x":"at","m":{"p":372,"w":false,"u":false,"s":372,"e":374}}, {"i":"s72","t":"spacer","x":" ","m":{"p":374,"w":true,"u":false,"s":374,"e":375}}, {"i":"n73","t":"normal","x":"school,","m":{"p":375,"w":false,"u":true,"s":375,"e":382}}, {"i":"s73","t":"spacer","x":" ","m":{"p":382,"w":true,"u":false,"s":382,"e":383}}, {"i":"n74","t":"normal","x":"my","m":{"p":383,"w":false,"u":false,"s":383,"e":385}}, {"i":"s74","t":"spacer","x":" ","m":{"p":385,"w":true,"u":false,"s":385,"e":386}}, {"i":"n75","t":"normal","x":"friend","m":{"p":386,"w":false,"u":false,"s":386,"e":392}}, {"i":"s75","t":"spacer","s":"newline","m":{"p":392,"w":true,"u":false,"s":392,"e":393}}, {"i":"n76","t":"normal","x":"told","m":{"p":393,"w":false,"u":false,"s":393,"e":397}}, {"i":"s76","t":"spacer","x":" ","m":{"p":397,"w":true,"u":false,"s":397,"e":398}}, {"i":"n77","t":"normal","x":"how","m":{"p":398,"w":false,"u":false,"s":398,"e":401}}, {"i":"s77","t":"spacer","x":" ","m":{"p":401,"w":true,"u":false,"s":401,"e":402}}, {"i":"n78","t":"normal","x":"to","m":{"p":402,"w":false,"u":false,"s":402,"e":404}}, {"i":"s78","t":"spacer","x":" ","m":{"p":404,"w":true,"u":false,"s":404,"e":405}}, {"i":"n79","t":"normal","x":"solve","m":{"p":405,"w":false,"u":false,"s":405,"e":410}}, {"i":"s79","t":"spacer","x":" ","m":{"p":410,"w":true,"u":false,"s":410,"e":411}}, {"i":"n80","t":"normal","x":"this","m":{"p":411,"w":false,"u":false,"s":411,"e":415}}, {"i":"s80","t":"spacer","x":" ","m":{"p":415,"w":true,"u":false,"s":415,"e":416}}, {"i":"n81","t":"normal","x":"problem.","m":{"p":416,"w":false,"u":true,"s":416,"e":424}}, {"i":"s81","t":"spacer","x":" ","m":{"p":424,"w":true,"u":false,"s":424,"e":425}}, {"i":"n82","t":"normal","x":"Also","m":{"p":425,"w":false,"u":false,"s":425,"e":429}}, {"i":"s82","t":"spacer","x":" ","m":{"p":429,"w":true,"u":false,"s":429,"e":430}}, {"i":"n83","t":"normal","x":"when","m":{"p":430,"w":false,"u":false,"s":430,"e":434}}, {"i":"s83","t":"spacer","s":"newline","m":{"p":434,"w":true,"u":false,"s":434,"e":435}}, {"i":"n84","t":"normal","x":"I","m":{"p":435,"w":false,"u":false,"s":435,"e":436}}, {"i":"s84","t":"spacer","x":" ","m":{"p":436,"w":true,"u":false,"s":436,"e":437}}, {"i":"n85","t":"normal","x":"can't","m":{"p":437,"w":false,"u":false,"s":437,"e":442}}, {"i":"s85","t":"spacer","x":" ","m":{"p":442,"w":true,"u":false,"s":442,"e":443}}, {"i":"n86","t":"normal","x":"white","m":{"p":443,"w":false,"u":false,"s":443,"e":448}}, {"i":"s86","t":"spacer","x":" ","m":{"p":448,"w":true,"u":false,"s":448,"e":449}}, {"i":"n87","t":"normal","x":"the","m":{"p":449,"w":false,"u":false,"s":449,"e":452}}, {"i":"s87","t":"spacer","x":" ","m":{"p":452,"w":true,"u":false,"s":452,"e":453}}, {"i":"n88","t":"normal","x":"essay,","m":{"p":453,"w":false,"u":true,"s":453,"e":459}}, {"i":"s88","t":"spacer","x":" ","m":{"p":459,"w":true,"u":false,"s":459,"e":460}}, {"i":"n89","t":"normal","x":"my","m":{"p":460,"w":false,"u":false,"s":460,"e":462}}, {"i":"s89","t":"spacer","x":" ","m":{"p":462,"w":true,"u":false,"s":462,"e":463}}, {"i":"n90","t":"normal","x":"mom","m":{"p":463,"w":false,"u":false,"s":463,"e":466}}, {"i":"s90","t":"spacer","x":" ","m":{"p":466,"w":true,"u":false,"s":466,"e":467}}, {"i":"n91","t":"normal","x":"can","m":{"p":467,"w":false,"u":false,"s":467,"e":470}}, {"i":"s91","t":"spacer","s":"newline","m":{"p":470,"w":true,"u":false,"s":470,"e":471}}, {"i":"n92","t":"normal","x":",","m":{"p":471,"w":false,"u":true,"s":471,"e":472}}, {"i":"s92","t":"spacer","s":"newline","m":{"p":472,"w":true,"u":false,"s":472,"e":473}}, {"i":"n93","t":"normal","x":"give","m":{"p":473,"w":false,"u":false,"s":473,"e":477}}, {"i":"s93","t":"spacer","s":"newline","m":{"p":477,"w":true,"u":false,"s":477,"e":478}}, {"i":"n94","t":"normal","x":"some","m":{"p":478,"w":false,"u":false,"s":478,"e":482}}, {"i":"s94","t":"spacer","x":" ","m":{"p":482,"w":true,"u":false,"s":482,"e":483}}, {"i":"n95","t":"normal","x":"Ideas","m":{"p":483,"w":false,"u":false,"s":483,"e":488}}, {"i":"s95","t":"spacer","x":" ","m":{"p":488,"w":true,"u":false,"s":488,"e":489}}, {"i":"n96","t":"normal","x":"for","m":{"p":489,"w":false,"u":false,"s":489,"e":492}}, {"i":"s96","t":"spacer","x":" ","m":{"p":492,"w":true,"u":false,"s":492,"e":493}}, {"i":"n97","t":"normal","x":"writing","m":{"p":493,"w":false,"u":false,"s":493,"e":500}}, {"i":"s97","t":"spacer","x":" ","m":{"p":500,"w":true,"u":false,"s":500,"e":501}}, {"i":"n98","t":"normal","x":"it.","m":{"p":501,"w":false,"u":true,"s":501,"e":504}} ]`,
		documentBody: "Lastly, both family and friends can help me. when I'm sad or angry, they usually console me. For instance, when I feel bad 9+ school, my best friend can make me feel better and Also, when I was sad at home, my Sister can try play together, to cheer me UP, In addition, such they help difficult things. In one case, when I was thinking and thinking about the math problem at school, my friend told how to solve this problem. Also when I can't white the essay, my mom can , give some Ideas for writing it. <<<  ",
		documentName: "Test Document"
	};
	
	// State for debugging
	let showDebugInfo = $state(true);
	let showEditor = $state(true);
	
	// Function to toggle debug info
	function toggleDebugInfo() {
		showDebugInfo = !showDebugInfo;
	}
	
	// Function to toggle editor
	function toggleEditor() {
		showEditor = !showEditor;
	}
	
	// Function to check if JSON is valid
	function isValidJson(str: string) {
		try {
			JSON.parse(str);
			return true;
		} catch (e) {
			return false;
		}
	}
	
	// Check if the compressedNodes is valid JSON
	const isValidCompressedNodes = isValidJson(sampleDocument.compressedNodes);
</script>

<div class="debug-page">
	<h1>TextEditor Debug Page</h1>
	
	<div class="controls">
		<button onclick={toggleDebugInfo} class="toggle-button">
			{showDebugInfo ? 'Hide' : 'Show'} Debug Info
		</button>
		
		<button onclick={toggleEditor} class="toggle-button">
			{showEditor ? 'Hide' : 'Show'} Editor
		</button>
	</div>
	
	{#if showDebugInfo}
		<div class="debug-section">
			<h2>Document Information</h2>
			<div class="info-item">
				<strong>Document Name:</strong> {sampleDocument.documentName}
			</div>
			<div class="info-item">
				<strong>Document Body Length:</strong> {sampleDocument.documentBody.length} characters
			</div>
			<div class="info-item">
				<strong>Compressed Nodes Length:</strong> {sampleDocument.compressedNodes.length} characters
			</div>
			<div class="info-item">
				<strong>Valid JSON</strong> {isValidCompressedNodes ? 'Yes' : 'No'}
			</div>
			
			<h3>Node Deserializer Debug</h3>
		</div>
	{/if}
	
	{#if showEditor}
		<div class="editor-section">
			<h2>TextEditor Component</h2>
			<div class="editor-container">
				<TextEditor
					compressedNodes={sampleDocument.compressedNodes}
					initialContent={sampleDocument.documentBody}
				/>
			</div>
		</div>
	{/if}
</div>

<style>
	.debug-page {
		padding: var(--spacing-6);
		max-width: 1200px;
		margin: 0 auto;
	}
	
	h1 {
		margin-bottom: var(--spacing-6);
	}
	
	.controls {
		display: flex;
		gap: var(--spacing-4);
		margin-bottom: var(--spacing-6);
	}
	
	.toggle-button {
		padding: var(--spacing-2) var(--spacing-4);
		background-color: var(--background-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		cursor: pointer;
	}
	
	.debug-section {
		margin-bottom: var(--spacing-6);
		padding: var(--spacing-4);
		background-color: var(--background-secondary);
		border-radius: var(--radius-md);
	}
	
	.info-item {
		margin-bottom: var(--spacing-2);
	}
	
	.editor-section {
		margin-bottom: var(--spacing-6);
	}
	
	.editor-container {
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		overflow: hidden;
		height: 600px;
	}
</style>