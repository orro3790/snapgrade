import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { mockDocumentSessions } from '../fixtures/documentSession';
import { mockPendingImages } from '../fixtures/pendingImage';

export async function seedTestData() {
  const testEnv = await initializeTestEnvironment({
    projectId: 'snapgrade-test'
  });

  const adminContext = testEnv.authenticatedContext('admin');
  const db = adminContext.firestore();

  // Seed document sessions
  for (const session of mockDocumentSessions) {
    await db.collection('document_sessions').doc(session.sessionId).set(session);
  }

  // Seed pending images
  for (const image of mockPendingImages) {
    await db.collection('pending_images').doc().set(image);
  }

  return testEnv;
}