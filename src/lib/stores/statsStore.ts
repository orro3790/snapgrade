// stores/statsStore.ts
import { derived, writable } from 'svelte/store';
import { editorStore } from './editorStore';

export interface Stats {
	total: number;
	deletions: number;
	additions: number;
	corrections: number;
	normal: number;
}

export type NodeType = 'normal' | 'deletion' | 'addition' | 'correction' | null;

// Store for tracking hovered node type
export const hoveredNodeType = writable<NodeType>(null);

// Create a derived store that updates whenever editorStore changes
export const statsStore = derived(editorStore, ($editorStore) => {
	const stats: Stats = {
		total: 0,
		deletions: 0,
		additions: 0,
		corrections: 0,
		normal: 0
	};

	$editorStore.nodeList.forEach((paragraph) => {
		paragraph.nodes.forEach((node) => {
			stats.total++;
			switch (node.type) {
				case 'deletion':
					stats.deletions++;
					break;
				case 'addition':
					stats.additions++;
					break;
				case 'correction':
					stats.corrections++;
					break;
				case 'normal':
					stats.normal++;
					break;
			}
		});
	});

	return stats;
});
