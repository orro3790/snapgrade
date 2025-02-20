# Firebase Emulator Setup and Test Data Plan

## Overview

Instead of migrating existing tests, we'll set up the Firebase emulator with test data that matches our schemas, then write new tests against this environment.

## 1. Initial Setup (Day 1)

1. Install Firebase Emulator Suite:
   ```bash
   npm install -D firebase-tools @firebase/rules-unit-testing
   ```

2. Create firebase.json configuration:
   ```json
   {
     "firestore": {
       "rules": "firestore.rules",
       "indexes": "firestore.indexes.json"
     },
     "emulators": {
       "firestore": {
         "port": 8080
       },
       "auth": {
         "port": 9099
       },
       "ui": {
         "enabled": true,
         "port": 4000
       }
     }
   }
   ```

3. Create initial security rules (firestore.rules):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow read/write access during testing
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

## 2. Test Data Setup (Day 1)

1. Create test data fixtures matching our schemas:

```typescript
// src/tests/fixtures/documentSession.ts
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
  // Add more test sessions...
];

// src/tests/fixtures/pendingImage.ts
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
    cdnUrlExpiry: 'ff00ff' // Hex timestamp
  }
];
```

2. Create test data seeding script:

```typescript
// src/tests/setup/seedTestData.ts
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { mockDocumentSessions, mockPendingImages } from '../fixtures';

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
```

## 3. Test Implementation (Days 2-3)

1. Create test environment setup:

```typescript
// src/tests/setup/testEnv.ts
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { seedTestData } from './seedTestData';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'snapgrade-test'
  });
  await seedTestData();
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seedTestData();
});
```

2. Write tests using the emulator:

```typescript
// src/tests/unit/services/documentSession.test.ts
import { testEnv } from '../../setup/testEnv';
import { mockDocumentSessions } from '../../fixtures/documentSession';

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
});
```

## 4. CI Integration (Day 4)

1. Update GitHub Actions workflow:

```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Firebase Emulators
        run: npm install -g firebase-tools
        
      - name: Start Firebase Emulators
        run: firebase emulators:start --only firestore,auth &
        
      - name: Run Tests
        run: npm test
```

## Success Criteria

1. Firebase emulator running locally
2. Test data fixtures matching our schemas
3. Tests running against emulator
4. CI pipeline using emulator
5. No production data dependencies

## Next Steps

1. Set up initial emulator configuration
2. Create test data fixtures
3. Implement test environment setup
4. Write first test against emulator
5. Verify CI pipeline

Would you like me to proceed with implementing the first phase of this setup?