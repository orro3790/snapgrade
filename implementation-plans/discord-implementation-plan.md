# Simplified Discord Bot Implementation Plan

## 1. Core Components

### 1.1 Document Processor

```typescript
// src/lib/services/document-processor.ts
import { logger } from '../utils/logger';
import { LLMWhisperer } from './llm-whisperer';
import { StructureLLM } from './structure-llm';
import { firebase } from '../firebase';

export class DocumentProcessor {
    constructor(
        private llmWhisperer: LLMWhisperer,
        private structureLLM: StructureLLM
    ) {}

    async processImage(message: Message, image: MessageAttachment) {
        try {
            // 1. Process OCR
            const ocrResult = await withRetry(() =>
                this.llmWhisperer.processImage(image.url)
            );

            // 2. Analyze structure
            const structure = await withRetry(() =>
                this.structureLLM.analyze(ocrResult.text)
            );

            // 3. Store in Firestore
            const docRef = await firebase.firestore()
                .collection('documents')
                .add({
                    userId: message.author.id,
                    text: ocrResult.text,
                    structure,
                    status: 'ready',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            return docRef;

        } catch (error) {
            logger.error({
                error,
                userId: message.author.id,
                imageId: image.id
            });
            throw error;
        }
    }
}

// Simple retry utility
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
    throw new Error('Max retries reached');
}
1.2 Message Handler
// src/lib/discord/handlers/message.ts
import { DocumentProcessor } from '../../services/document-processor';
import { isImageAttachment } from '../utils';
import { logger } from '../../utils/logger';

export async function handleMessage(message: Message) {
    // Ignore bot messages
    if (message.author.bot) return;

    // Only process DMs
    if (message.channel.type !== ChannelType.DM) return;

    // Check for image attachments
    const images = message.attachments.filter(isImageAttachment);
    if (images.size === 0) {
        await message.reply("Please send an image of the essay to process.");
        return;
    }

    // Process first image only for now
    const image = images.first();
    const processor = new DocumentProcessor(
        new LLMWhisperer(),
        new StructureLLM()
    );

    try {
        await message.reply("Processing your essay...");
        const docRef = await processor.processImage(message, image);

        await message.reply(
            "Essay processed successfully! Open Snapgrade to review and edit: " +
            `https://snapgrade.app/documents/${docRef.id}`
        );
    } catch (error) {
        logger.error('Failed to process essay:', error);
        await message.reply(
            "Sorry, there was an error processing your essay. Please try again later."
        );
    }
}
1.3 Basic Utilities
// src/lib/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: 'error.log',
            level: 'error'
        })
    ]
});

// src/lib/discord/utils.ts
export function isImageAttachment(attachment: MessageAttachment): boolean {
    return attachment.contentType?.startsWith('image/') ?? false;
}
2. Implementation Steps
Set up basic Discord bot

Connect to Discord
Handle DM events
Basic error handling
Implement document processing

OCR integration
Structure analysis
Firestore storage
Add user feedback

Processing status messages
Error messages
Success with document link
3. Future Considerations (Only When Needed)
Performance Monitoring

Add Firebase Performance monitoring when we have real usage
Track processing times and success rates
Advanced Error Handling

Add more sophisticated retry strategies if needed
Implement better error recovery
Multiple Image Support

Process multiple images in sequence
Batch processing capabilities
Queue System

Add job queue if processing volume increases
Implement rate limiting
4. Testing Plan
Basic Functionality

Test DM handling
Verify image detection
Check error messages
Integration Tests

OCR processing
Structure analysis
Document storage
Error Cases

Invalid images
Service failures
Network issues
Next Steps
Implement message handler
Set up document processor
Add basic logging
Test core functionality
Deploy and monitor
This simplified approach:

Focuses on core functionality
Uses built-in Firebase features
Maintains good error handling
Easy to understand and maintain
Can be extended when needed
```
