import { editorStore } from '../stores/editorStore';
import fs from 'fs';
import path from 'path';

// Read the example text
const exampleText = fs.readFileSync(path.join(__dirname, 'example.txt'), 'utf-8');

// Parse the content
editorStore.parseContent(exampleText);

// Subscribe to store to get the parsed content
editorStore.subscribe((state) => {
  console.log('Parsed Nodes:');
  state.nodeList.forEach((paragraph, i) => {
    console.log(`\nParagraph ${i + 1}:`);
    paragraph.nodes.forEach(node => {
      console.log({
        type: node.type,
        text: node.text,
        correctionText: node.correctionText,
        grammarNote: node.grammarNote,
        formatType: node.formatType,
        suggestionType: node.suggestionType,
        comment: node.comment
      });
    });
  });

  // Test round-trip conversion
  console.log('\nRound-trip test:');
  const regeneratedContent = editorStore.getContent();
  console.log(regeneratedContent);
  
  // Verify if the regenerated content matches the original
  console.log('\nMatches original:', regeneratedContent.trim() === exampleText.trim());
});
