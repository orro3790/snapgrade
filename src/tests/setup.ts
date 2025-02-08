import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/svelte';

// Setup mock for crypto.randomUUID
beforeAll(() => {
    let mockIdCounter = 0;
    const mockUUID = vi.fn(() => 
        `00000000-0000-0000-0000-${mockIdCounter++}`.padStart(12, '0')
    ) as unknown as () => `${string}-${string}-${string}-${string}-${string}`;

    vi.spyOn(crypto, 'randomUUID').mockImplementation(mockUUID);
});

// Clean up after each test
afterEach(() => {
    cleanup(); // Clean up any mounted Svelte components
    vi.clearAllMocks(); // Reset all mocks
});

// Reset all mocks after all tests
afterAll(() => {
    vi.resetAllMocks();
});

// Global test utilities
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
