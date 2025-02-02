// typewriter.ts
interface TypewriterParams {
	speed: number;
	deleteSpeed?: number;
  }
  
  export function typewriter(node: HTMLElement, { speed = 1, deleteSpeed = 2 }: TypewriterParams) {
	const valid = node.childNodes.length === 1 && node.childNodes[0].nodeType === Node.TEXT_NODE;
  
	if (!valid) {
	  throw new Error(`This transition only works on elements with a single text node child`);
	}
  
	const text = node.textContent ?? '';
	// Find if there's a correction needed by looking for a '|' character
	const [initial, correction] = text.split('|');
	const hasCorrection = text.includes('|');
	
	// Calculate total duration including deletion if there's a correction
	const typingDuration = text.length / (speed * 0.01);
	const deletionDuration = hasCorrection ? initial.length / (deleteSpeed * 0.01) : 0;
	const duration = typingDuration + deletionDuration;
  
	return {
	  duration,
	  tick: (t: number) => {
		if (!hasCorrection) {
		  // Simple forward typing for messages without corrections
		  const i = Math.trunc(text.length * t);
		  node.textContent = text.slice(0, i);
		} else {
		  // Handle typing with corrections
		  const deleteStart = initial.length / text.length;
		  
		  if (t < deleteStart) {
			// Initial typing phase
			const i = Math.trunc(initial.length * (t / deleteStart));
			node.textContent = initial.slice(0, i);
		  } else if (t < deleteStart + 0.3) {
			// Deletion phase
			const deleteProgress = (t - deleteStart) / 0.3;
			const charsToKeep = Math.trunc(initial.length * (1 - deleteProgress));
			node.textContent = initial.slice(0, Math.max(0, charsToKeep));
		  } else {
			// Final typing phase
			const typeProgress = (t - deleteStart - 0.3) / (1 - deleteStart - 0.3);
			const finalText = correction || '';
			const i = Math.trunc(finalText.length * typeProgress);
			node.textContent = finalText.slice(0, i);
		  }
		}
	  }
	};
  }
  
