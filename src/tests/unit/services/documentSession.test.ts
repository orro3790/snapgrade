import { describe, it, expect } from 'vitest';
import { testEnv } from '../../setup/testEnv';
import { mockDocumentSessions } from '../../fixtures/documentSession';
import { createSession } from '../../../lib/services/documentSession';

describe('Document Session Service', () => {
  it('should create a new session', async () => {
    const context = testEnv.authenticatedContext('test-user-1');
    const db = context.firestore();
    
    const result = await createSession('test-user-1', 3);
    
    const doc = await db.collection('document_sessions')
      .doc(result.sessionId)
      .get();
      
    expect(doc.exists).toBe(true);
    expect(doc.data()).toMatchObject({
      userId: 'test-user-1',
      status: 'COLLECTING',
      pageCount: 3
    });
  });

  it('should retrieve an existing session', async () => {
    const context = testEnv.authenticatedContext('test-user-1');
    const db = context.firestore();
    
    // Get the first mock session
    const mockSession = mockDocumentSessions[0];
    const doc = await db.collection('document_sessions')
      .doc(mockSession.sessionId)
      .get();
    
    expect(doc.exists).toBe(true);
    expect(doc.data()).toMatchObject({
      userId: mockSession.userId,
      status: mockSession.status,
      pageCount: mockSession.pageCount
    });
  });
});