import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { 
    documentProcessRequestSchema, 
    type StructuralAnalysis, 
    structuralAnalysisSchema,
    type TextVerification,
    textVerificationSchema
} from '$lib/schemas/documentProcessing';
import { createDocumentSchema, DocumentStatus, type CreateDocument } from '$lib/schemas/document';
import { Anthropic } from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';
import { error } from '@sveltejs/kit';
import { nodeSchema, type Node } from '$lib/schemas/textNode';
import { editorStore } from '$lib/stores/editorStore.svelte';
import { adminDb } from '$lib/firebase/admin';

const anthropic = new Anthropic({
    apiKey: ANTHROPIC_API_KEY
});

/**
 * Validate bot token and return user data if valid
 */
async function validateBotToken(uid: string, token: string) {
    const userDoc = await adminDb
        .collection('users')
        .doc(uid)
        .get();

    if (!userDoc.exists) {
        throw error(401, 'User not found');
    }

    const userData = userDoc.data();
    if (!userData?.botToken?.token || userData.botToken.token !== token) {
        throw error(401, 'Invalid bot token');
    }

    // Check token expiration
    if (userData.botToken.expiresAt && new Date(userData.botToken.expiresAt.toDate()) < new Date()) {
        throw error(401, 'Bot token expired');
    }

    // Check account status
    if (userData.accountStatus !== 'active') {
        throw error(403, 'Account not active');
    }

    // Update last used timestamp
    await adminDb
        .collection('users')
        .doc(uid)
        .update({
            'botToken.lastUsed': new Date()
        });

    return userData;
}

/**
 * Process a document by analyzing its structure using Claude
 */
export const POST: RequestHandler = async ({ request }) => {
    try {
        // Parse and validate request body
        const rawBody = await request.json();
        const body = documentProcessRequestSchema.parse(rawBody);

        // Validate bot token
        await validateBotToken(body.uid, body.botToken);

        // Start parallel processing
        const [textVerification, structuralAnalysis] = await Promise.all([
            // Verify text accuracy
            verifyText(body.image, body.text),
            // Get structural analysis
            analyzeStructure(body.image, body.text)
        ]);

        // Process the structural analysis into nodes
        const nodes = await processStructuralAnalysis(body.text, structuralAnalysis);

        // Create document using schema
        const documentData: CreateDocument = {
            studentId: 'Unassigned',
            studentName: 'Unassigned Student',
            classId: 'Unassigned',
            className: 'Unassigned',
            documentName: `Untitled - ${new Date().toLocaleDateString()}`,
            documentBody: body.text,
            sourceType: 'llmwhisperer',
            status: DocumentStatus.CORRECTING,
            createdAt: new Date(),
            updatedAt: new Date(),
            sourceMetadata: {
                rawOcrOutput: body.text
            }
        };

        // Add structural elements if found
        const titleNode = nodes.find(node => node.structuralRole === 'title');
        if (titleNode) {
            documentData.title = titleNode.text;
        }

        const subtitleNode = nodes.find(node => node.structuralRole === 'subtitle');
        if (subtitleNode) {
            documentData.subtitle = subtitleNode.text;
        }

        const headingNodes = nodes.filter(node => node.structuralRole === 'heading');
        if (headingNodes.length > 0) {
            documentData.headings = headingNodes.map(node => node.text);
        }

        // Validate document data
        const validatedData = createDocumentSchema.parse(documentData);

        // Store in Firestore
        const docRef = await adminDb.collection('documents').add({
            ...validatedData,
            userId: body.uid,
            nodes: nodes,
            // Include alternative text only if discrepancies found
            ...(textVerification.hasDiscrepancies && textVerification.alternativeText ? {
                alternativeText: textVerification.alternativeText,
                discrepancies: textVerification.discrepancies
            } : {})
        });

        return json({
            success: true,
            documentId: docRef.id,
            text: body.text,
            nodes,
            ...(textVerification.hasDiscrepancies && textVerification.alternativeText ? {
                alternativeText: textVerification.alternativeText
            } : {})
        });

    } catch (err) {
        console.error('Document processing error:', err);
        
        if (err instanceof Error) {
            throw error(400, err.message);
        }
        
        throw error(500, 'Internal server error');
    }
};

/**
 * Verify text accuracy using Claude
 */
async function verifyText(image: string, text: string): Promise<TextVerification> {
    const message = await anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1024,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "image",
                        source: {
                            type: "base64",
                            media_type: "image/jpeg",
                            data: image
                        }
                    },
                    {
                        type: "text",
                        text: `Here is an image and its OCR-extracted text. Please:
1. Compare the extracted text with the image content
2. Only provide an alternative extraction if there are significant discrepancies
3. Explain any important differences found

Extracted text:
${text}

Return your analysis as a JSON object with:
- hasDiscrepancies: boolean
- alternativeText: string (only if significant differences found)
- discrepancies: array of {original, suggested, explanation} (only if differences found)`
                    }
                ]
            }
        ]
    });

    // Parse Claude's response
    try {
        const textBlock = message.content.find(block => 
            'type' in block && block.type === 'text'
        );
        
        if (!textBlock || !('text' in textBlock)) {
            throw new Error('No text response from Claude');
        }

        const jsonResponse = JSON.parse(textBlock.text);
        return textVerificationSchema.parse(jsonResponse);
    } catch (err) {
        console.error('Failed to parse text verification:', err);
        throw new Error('Failed to verify text accuracy');
    }
}

/**
 * Get structural analysis from Claude
 */
async function analyzeStructure(image: string, text: string): Promise<StructuralAnalysis> {
    const message = await anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1024,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "image",
                        source: {
                            type: "base64",
                            media_type: "image/jpeg",
                            data: image
                        }
                    },
                    {
                        type: "text",
                        text: `Here is the extracted text from this image:
${text}

Please analyze the structural elements of this text and identify:
1. The title (if any)
2. Any subtitles or headings
3. Paragraph boundaries

Return the analysis as a JSON array of objects with the following properties:
- position: number (word position in text)
- type: "title" | "subtitle" | "heading" | "paragraphStart"`
                    }
                ]
            }
        ]
    });

    // Parse Claude's response
    try {
        const textBlock = message.content.find(block => 
            'type' in block && block.type === 'text'
        );
        
        if (!textBlock || !('text' in textBlock)) {
            throw new Error('No text response from Claude');
        }

        const jsonResponse = JSON.parse(textBlock.text);
        return structuralAnalysisSchema.parse(jsonResponse);
    } catch (err) {
        console.error('Failed to parse structural analysis:', err);
        throw new Error('Failed to analyze document structure');
    }
}

/**
 * Process structural analysis into text nodes
 */
async function processStructuralAnalysis(text: string, analysis: StructuralAnalysis): Promise<Node[]> {
    // First parse the text into basic nodes
    editorStore.parseContent(text);
    const baseNodes = [...editorStore.nodes]; // Create a copy to modify

    // Process each structural element
    for (const element of analysis) {
        const node = baseNodes[element.position];
        if (!node) continue;

        // Create a new node with the structural role
        const updatedNode: Node = {
            ...node,
            structuralRole: element.type
        };
        baseNodes[element.position] = updatedNode;

        // Add appropriate spacer nodes
        switch (element.type) {
            case 'title':
            case 'subtitle':
            case 'heading':
                // Add newlines before and after
                insertSpacerNode(baseNodes, element.position, 'newline');
                insertSpacerNode(baseNodes, element.position + 2, 'newline');
                break;

            case 'paragraphStart':
                // Add newline and indent
                insertSpacerNode(baseNodes, element.position, 'newline');
                insertSpacerNode(baseNodes, element.position + 1, 'indent');
                break;
        }
    }

    // Validate final node array
    return baseNodes.map(node => nodeSchema.parse(node));
}

/**
 * Insert a spacer node at the specified position
 */
function insertSpacerNode(nodes: Node[], position: number, subtype: 'newline' | 'indent') {
    const spacerNode: Node = {
        id: crypto.randomUUID(),
        text: '',
        type: 'spacer',
        spacerData: { subtype },
        metadata: {
            position,
            isPunctuation: false,
            isWhitespace: true,
            startIndex: 0,
            endIndex: 0
        }
    };
    nodes.splice(position, 0, spacerNode);
}