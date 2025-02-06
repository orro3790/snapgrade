// stores/statsStore.ts
import { derived, writable } from 'svelte/store';
import { editorStore } from './editorStore';
import type { CorrectionType, CorrectionTag } from './editorStore';

// Define the types we'll track
export type NodeType = CorrectionType | CorrectionTag | null;

interface StatItem {
  count: number;
  label: string;
  type: NodeType;
}

interface StatGroup {
  title: string;
  items: StatItem[];
}

interface Stats {
  total: number;
  groups: StatGroup[];
}

// Store for tracking hovered node type
export const hoveredNodeType = writable<NodeType>(null);

// Helper to create a stat item with initial count of 0
const createStatItem = (type: NodeType, label: string): StatItem => ({
  count: 0,
  label,
  type
});

// Define our stat groups structure
const createInitialStatGroups = (): StatGroup[] => [
  {
    title: 'Basic',
    items: [
      createStatItem('correction', 'Corrections'),
      createStatItem('deletion', 'Deletions'),
      createStatItem('addition', 'Additions')
    ]
  },
  {
    title: 'Grammar',
    items: [
      createStatItem('plural', 'Plural'),
      createStatItem('verb-tense', 'Verb Tense'),
      createStatItem('subject-verb', 'Subject-Verb'),
      createStatItem('article', 'Article')
    ]
  },
  {
    title: 'Formatting',
    items: [
      createStatItem('capital', 'Capitalization'),
      createStatItem('spacing', 'Spacing'),
      createStatItem('punctuation', 'Punctuation')
    ]
  },
  {
    title: 'Organization',
    items: [
      createStatItem('paragraph', 'Paragraph'),
      createStatItem('merge', 'Merge'),
      createStatItem('reference', 'Reference')
    ]
  },
  {
    title: 'Additional',
    items: [
      createStatItem('wordchoice', 'Word Choice'),
      createStatItem('redundant', 'Redundant')
    ]
  }
];

// Create a derived store that updates whenever editorStore changes
export const statsStore = derived(editorStore, ($editorStore) => {
  const groups = createInitialStatGroups();
  let total = 0;

  // Early return if no paragraphs
  if (!$editorStore?.paragraphs?.length) {
    return { total: 0, groups };
  }

  // Count corrections
  $editorStore.paragraphs.forEach(paragraph => {
    if (!paragraph?.corrections?.length) return;

    paragraph.corrections.forEach(node => {
      if (!node?.type || node.type === 'normal' || node.type === 'empty') return;

      // First try to find by tag
      if (node.tag) {
        for (const group of groups) {
          const item = group.items.find(item => item.type === node.tag);
          if (item) {
            item.count++;
            total++;
            break;
          }
        }
      } else {
        // If no tag, find by core type
        for (const group of groups) {
          const item = group.items.find(item => item.type === node.type);
          if (item) {
            item.count++;
            total++;
            break;
          }
        }
      }
    });
  });

  return { total, groups };
});
