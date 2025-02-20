import { type PendingImage } from '../../lib/schemas/pending-image';

export const mockPendingImages: PendingImage[] = [
  {
    discordMessageId: 'msg1',
    channelId: 'channel1',
    userId: 'test-user-1',
    imageUrl: 'https://cdn.discordapp.com/test1.jpg',
    filename: 'test1.jpg',
    contentType: 'image/jpeg',
    size: 1024,
    status: 'PENDING',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    sessionId: 'test-session-1',
    pageNumber: 1,
    isPartOfMultiPage: true,
    cdnUrlExpiry: 'ff00ff'
  },
  {
    discordMessageId: 'msg2',
    channelId: 'channel1',
    userId: 'test-user-1',
    imageUrl: 'https://cdn.discordapp.com/test2.jpg',
    filename: 'test2.jpg',
    contentType: 'image/jpeg',
    size: 2048,
    status: 'PROCESSING',
    createdAt: new Date('2025-01-01T00:01:00Z'),
    sessionId: 'test-session-1',
    pageNumber: 2,
    isPartOfMultiPage: true,
    cdnUrlExpiry: 'ff00ff'
  }
];