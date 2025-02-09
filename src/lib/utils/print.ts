// lib/utils/print.ts
/**
 * Prepares nodes for printing by adding appropriate spacing classes
 * This function runs once when print is triggered and cleans up afterward
 */
export function handlePrintSpacing() {
  // Get all text node elements
  const textNodes = document.querySelectorAll('.text-node');
  
  textNodes.forEach((node, index) => {
    // Get the next node if it exists
    const nextNode = textNodes[index + 1];
    
    // Check if the next node is a punctuation mark
    const nextIsPunctuation = nextNode?.classList.contains('punctuation');
    
    // If current node isn't punctuation and next node isn't punctuation,
    // add spacing class
    if (!node.classList.contains('punctuation') && !nextIsPunctuation) {
      node.classList.add('print-spacing');
    }
  });

  // Clean up after printing
  window.onafterprint = () => {
    textNodes.forEach(node => {
      node.classList.remove('print-spacing');
    });
  };
}