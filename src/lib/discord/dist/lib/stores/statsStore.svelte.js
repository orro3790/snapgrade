// src/lib/stores/statsStore.ts
import { writable } from 'svelte/store';
// Create the hoveredNodeType store
const hoveredNodeTypeBase = writable(null);
// Export with the same name as original for compatibility
export const hoveredNodeTypeStore = {
    subscribe: hoveredNodeTypeBase.subscribe
};
// Initialize stats with default values
const statsBase = writable({
    totalCorrections: 0,
    patternFrequency: new Map(),
    mostCommonErrors: []
});
// Update statistics based on corrections
export function updateStats(nodes) {
    statsBase.update(stats => {
        const patterns = new Map();
        let corrections = 0;
        nodes.forEach(node => {
            if (node.type === 'correction' && node.correctionData?.pattern) {
                corrections++;
                const pattern = node.correctionData.pattern;
                patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
            }
        });
        return {
            totalCorrections: corrections,
            patternFrequency: patterns,
            mostCommonErrors: Array.from(patterns.entries())
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([pattern]) => pattern)
        };
    });
}
// Track pattern usage
export function trackPatternUsage(pattern) {
    statsBase.update(stats => {
        const newPatternFrequency = new Map(stats.patternFrequency);
        newPatternFrequency.set(pattern, (newPatternFrequency.get(pattern) || 0) + 1);
        const newMostCommonErrors = Array.from(newPatternFrequency.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([pattern]) => pattern);
        return {
            ...stats,
            patternFrequency: newPatternFrequency,
            mostCommonErrors: newMostCommonErrors
        };
    });
}
// Export the stats store with the same interface
export const statsStore = {
    subscribe: statsBase.subscribe
};
// Export functions in the same structure
export const statsActions = {
    updateStats,
    trackPatternUsage
};
