import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processSession, processImage } from '../../../lib/services/documentProcessing';
import type { PendingImage } from '../../../lib/schemas/pending-image';
import { Timestamp } from 'firebase-admin/firestore';
import * as claude from '../../../lib/services/claude';

// Mock Firebase Admin
vi.mock('../../../lib/discord/firebase', () => ({
    adminDb: {
        collection: vi.fn(() => ({
            doc: vi.fn(() => ({
                id: 'test-doc-id',
                get: vi.fn(),
                set: vi.fn(),
                update: vi.fn(),
                delete: vi.fn()
            })),
            where: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            get: vi.fn()
        })),
        batch: vi.fn(() => ({
            set: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            commit: vi.fn()
        }))
    }
}));

// Mock Claude service
vi.mock('../../../lib/services/claude', () => ({
    analyzeStructure: vi.fn(),
    verifyText: vi.fn()
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock crypto
vi.mock('crypto', () => ({
    randomUUID: () => 'test-uuid'
}));

describe('Document Processing Service', () => {
    const mockDate = new Date('2025-01-01T00:00:00Z');
    const mockUserId = 'user123';
    const mockSessionId = 'session123';

    beforeEach(() => {
        vi.clearAllMocks();
        vi.setSystemTime(mockDate);
    });

    describe('processSession', () => {
        it('should process all images in a session', async () => {
            const mockSession = {
                exists: true,
                data: () => ({
                    userId: mockUserId,
                    status: 'COLLECTING'
                })
            };

            const mockImages = [
                {
                    data: () => ({
                        sessionId: mockSessionId,
                        pageNumber: 1,
                        imageUrl: 'https://cdn.discordapp.com/test1.jpg'
                    }),
                    ref: { delete: vi.fn() }
                },
                {
                    data: () => ({
                        sessionId: mockSessionId,
                        pageNumber: 2,
                        imageUrl: 'https://cdn.discordapp.com/test2.jpg'
                    }),
                    ref: { delete: vi.fn() }
                }
            ];

            const { adminDb } = await import('../../../lib/discord/firebase');
            vi.mocked(adminDb.collection('').doc('').get).mockResolvedValueOnce(mockSession as any);
            vi.mocked(adminDb.collection('').get).mockResolvedValueOnce({
                empty: false,
                docs: mockImages
            } as any);

            // Mock Claude responses
            vi.mocked(claude.analyzeStructure).mockResolvedValue([
                { position: 0, type: 'title' }
            ]);
            vi.mocked(claude.verifyText).mockResolvedValue({
                hasDiscrepancies: false
            });

            // Mock successful image processing
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    arrayBuffer: () => Promise.resolve(Buffer.from('test-image-1'))
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ text: 'Processed text 1' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    arrayBuffer: () => Promise.resolve(Buffer.from('test-image-2'))
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ text: 'Processed text 2' })
                });

            await processSession(mockSessionId);

            // Verify batch operations
            const mockBatch = vi.mocked(adminDb.batch());
            expect(mockBatch.set).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    sessionId: mockSessionId,
                    userId: mockUserId,
                    status: 'ready_for_correction'
                })
            );
            expect(mockBatch.update).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    status: 'COMPLETED'
                })
            );
            expect(mockBatch.commit).toHaveBeenCalled();
        });

        it('should handle session not found', async () => {
            const { adminDb } = await import('../../../lib/discord/firebase');
            vi.mocked(adminDb.collection('').doc('').get).mockResolvedValueOnce({
                exists: false
            } as any);

            await expect(processSession('nonexistent')).rejects.toThrow('Session nonexistent not found');
        });

        it('should handle processing errors', async () => {
            const mockSession = {
                exists: true,
                data: () => ({
                    userId: mockUserId,
                    status: 'COLLECTING'
                })
            };

            const mockImages = [
                {
                    data: () => ({
                        sessionId: mockSessionId,
                        pageNumber: 1,
                        imageUrl: 'https://cdn.discordapp.com/test1.jpg'
                    }),
                    ref: { delete: vi.fn() }
                }
            ];

            const { adminDb } = await import('../../../lib/discord/firebase');
            vi.mocked(adminDb.collection('').doc('').get).mockResolvedValueOnce(mockSession as any);
            vi.mocked(adminDb.collection('').get).mockResolvedValueOnce({
                empty: false,
                docs: mockImages
            } as any);

            // Mock failed image processing
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await processSession(mockSessionId);

            // Verify error handling
            const mockBatch = vi.mocked(adminDb.batch());
            expect(mockBatch.update).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    status: 'FAILED',
                    error: expect.stringContaining('Failed to process page 1')
                })
            );
        });
    });

    describe('processImage', () => {
        const mockImage: PendingImage = {
            discordMessageId: 'msg123',
            channelId: 'channel123',
            userId: mockUserId,
            imageUrl: 'https://cdn.discordapp.com/test.jpg',
            filename: 'test.jpg',
            contentType: 'image/jpeg',
            size: 1024,
            status: 'PENDING',
            createdAt: mockDate,
            sessionId: mockSessionId,
            pageNumber: 1,
            isPartOfMultiPage: true
        };

        it('should process an image successfully', async () => {
            // Mock bot token retrieval
            const { adminDb } = await import('../../../lib/discord/firebase');
            vi.mocked(adminDb.collection('').get).mockResolvedValueOnce({
                empty: false,
                docs: [{
                    data: () => ({
                        token: 'test-token',
                        expiresAt: Timestamp.fromDate(new Date(mockDate.getTime() + 3600000))
                    })
                }]
            } as any);

            // Mock successful image processing
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    arrayBuffer: () => Promise.resolve(Buffer.from('test-image'))
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ text: 'Processed text' })
                });

            // Mock Claude responses
            vi.mocked(claude.analyzeStructure).mockResolvedValue([
                { position: 0, type: 'title' }
            ]);
            vi.mocked(claude.verifyText).mockResolvedValue({
                hasDiscrepancies: false
            });

            const result = await processImage(mockImage, mockUserId);

            expect(result).toEqual(expect.objectContaining({
                success: true,
                documentId: mockSessionId,
                text: 'Processed text',
                status: 'processing'
            }));
        });

        it('should handle missing bot token', async () => {
            const { adminDb } = await import('../../../lib/discord/firebase');
            vi.mocked(adminDb.collection('').get).mockResolvedValueOnce({
                empty: true,
                docs: []
            } as any);

            await expect(processImage(mockImage, mockUserId))
                .rejects.toThrow('No valid bot token found');
        });

        it('should handle LLM Whisperer errors', async () => {
            // Mock bot token retrieval
            const { adminDb } = await import('../../../lib/discord/firebase');
            vi.mocked(adminDb.collection('').get).mockResolvedValueOnce({
                empty: false,
                docs: [{
                    data: () => ({
                        token: 'test-token',
                        expiresAt: Timestamp.fromDate(new Date(mockDate.getTime() + 3600000))
                    })
                }]
            } as any);

            // Mock failed image processing
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    arrayBuffer: () => Promise.resolve(Buffer.from('test-image'))
                })
                .mockResolvedValueOnce({
                    ok: false,
                    statusText: 'Internal Server Error'
                });

            await expect(processImage(mockImage, mockUserId))
                .rejects.toThrow('LLM Whisperer error: Internal Server Error');
        });
    });
});