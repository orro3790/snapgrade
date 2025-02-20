import { type DocumentSession } from '../../lib/schemas/documentSession';

export const mockDocumentSessions: DocumentSession[] = [
  {
    sessionId: 'test-session-1',
    userId: 'test-user-1',
    status: 'COLLECTING',
    pageCount: 3,
    receivedPages: 1,
    pageOrder: ['page1'],
    createdAt: new Date('2025-01-01T00:00:00Z'),
    expiresAt: new Date('2025-01-01T00:10:00Z'),
    totalSize: 1024
  },
  {
    sessionId: 'test-session-2',
    userId: 'test-user-2',
    status: 'PROCESSING',
    pageCount: 1,
    receivedPages: 1,
    pageOrder: ['page1'],
    createdAt: new Date('2025-01-01T00:05:00Z'),
    expiresAt: new Date('2025-01-01T00:15:00Z'),
    totalSize: 2048
  }
];