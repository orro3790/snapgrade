import type { User } from '$lib/schemas/user';
import type { Document } from '$lib/schemas/document';

const generateRandomEmail = () => {
    const names = ['john', 'jane', 'alex', 'emma', 'michael', 'sarah'];
    const domains = ['example.com', 'test.edu', 'school.org', 'mail.com'];
    const name = names[Math.floor(Math.random() * names.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${name}${Math.floor(Math.random() * 1000)}@${domain}`;
};

const generateRandomString = (length: number = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const generateLoremIpsum = () => {
    const paragraphs = [
        'Me and my friend go to school in Busan.  We learn many thing, like English and math.  Sometimes, English is very difficult, but I try my bestest.  After school, we play soccer and eat kimchi with my family.'

    ];
    return paragraphs.join('\n\n');
};

export const generateRandomUser = (partialData: Partial<User> = {}): User => {
    const defaultData: User = {
        name: generateRandomEmail(),
        id: generateRandomString(),
        metadata: {
            accountStatus: ['ACTIVE', 'INACTIVE', 'SUSPENDED'][Math.floor(Math.random() * 3)] as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
            telegramId: Math.random() > 0.5 ? generateRandomString() : undefined,
            telegramLinkCode: Math.random() > 0.5 ? generateRandomString(6) : undefined,
            telegramLinkExpiry: Math.random() > 0.5 ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined
        },
        photoUrl: Math.random() > 0.5 ? `https://example.com/photos/${generateRandomString()}.jpg` : undefined
    };

    return {
        ...defaultData,
        ...partialData,
        metadata: {
            ...defaultData.metadata,
            ...partialData.metadata
        }
    };
};

export const generateRandomDocument = (partialData: Partial<Document> = {}): Document => {
    const defaultData: Document = {
        studentName: generateRandomEmail(),
        className: `Class ${Math.floor(Math.random() * 100)}`,
        documentName: `Assignment ${Math.floor(Math.random() * 1000)}`,
        documentBody: generateLoremIpsum(),
        userId: generateRandomString(),
        status: ['staged', 'editing', 'completed'][Math.floor(Math.random() * 3)] as 'staged' | 'editing' | 'completed',
        sourceType: ['telegram', 'manual'][Math.floor(Math.random() * 2)] as 'telegram' | 'manual',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sourceMetadata: Math.random() > 0.5 ? {
            telegramMessageId: generateRandomString(),
            telegramChatId: generateRandomString(),
            telegramFileId: generateRandomString()
        } : undefined
    };

    return {
        ...defaultData,
        ...partialData,
        sourceMetadata: partialData.sourceMetadata === undefined ? defaultData.sourceMetadata : {
            ...defaultData.sourceMetadata,
            ...partialData.sourceMetadata
        }
    };
};
