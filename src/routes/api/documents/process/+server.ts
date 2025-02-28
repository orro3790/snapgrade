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
            status: DocumentStatus.unedited,
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
 * Verify text accuracy using Claude with tool use
 */
async function verifyText(image: string, text: string): Promise<TextVerification> {
    const message = await anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1024,
        system: "You are a text verification assistant that identifies discrepancies and suggests improvements.",
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
                        text: `Here is an image and its OCR-extracted text. Please compare them and identify any discrepancies:

Extracted text:
${text}`
                    }
                ]
            }
        ],
        tools: [{
            name: "text_verification",
            description: "Verifies text accuracy and suggests improvements",
            input_schema: {
                type: "object",
                properties: {
                    hasDiscrepancies: {
                        type: "boolean",
                        description: "Whether the text has discrepancies"
                    },
                    alternativeText: {
                        type: "string",
                        description: "Corrected version of the full text (optional)"
                    },
                    discrepancies: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                original: {
                                    type: "string",
                                    description: "The original text"
                                },
                                suggested: {
                                    type: "string",
                                    description: "The suggested correction"
                                },
                                explanation: {
                                    type: "string",
                                    description: "Why this change is suggested"
                                }
                            },
                            required: ["original", "suggested", "explanation"]
                        }
                    }
                },
                required: ["hasDiscrepancies"]
            }
        }],
        tool_choice: {
            type: "tool",
            name: "text_verification"
        }
    });

    // Parse Claude's response
    try {
        // First try to find a tool use response
        const toolUseResponse = message.content.find(block =>
            'type' in block && block.type === 'tool_use'
        );
        
        if (toolUseResponse && 'input' in toolUseResponse) {
            // We have a tool use response, validate it
            const input = toolUseResponse.input as Record<string, unknown>;
            return textVerificationSchema.parse(input);
        }
        
        // Fallback to text parsing if tool use response is not found
        const textBlock = message.content.find(block =>
            'type' in block && block.type === 'text' && 'text' in block
        );
        
        if (textBlock && 'text' in textBlock) {
            try {
                // Try to extract JSON from text response
                const jsonMatch = textBlock.text.match(/\{\s*"[\s\S]*"\s*:[\s\S]*\}/);
                if (jsonMatch) {
                    const parsedResponse = JSON.parse(jsonMatch[0]);
                    return textVerificationSchema.parse(parsedResponse);
                }
            } catch (parseError) {
                console.error('Failed to parse text as JSON:', parseError);
            }
        }
        
        throw new Error('No valid response received from Claude');
    } catch (err) {
        console.error('Failed to parse text verification:', err);
        throw new Error('Failed to verify text accuracy');
    }
}

/**
 * Get structural analysis from Claude using tool use
 */
async function analyzeStructure(image: string, text: string): Promise<StructuralAnalysis> {
    const message = await anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1024,
        system: "You are a document structure analyzer that identifies structural elements in text. Be precise and thorough in your analysis.",
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

Please analyze the structural elements of this text.`
                    }
                ]
            }
        ],
        tools: [{
            name: "document_structure_analyzer",
            description: "Analyzes the structural elements of text such as titles, headings, and paragraph starts",
            input_schema: {
                type: "object",
                properties: {
                    elements: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                type: {
                                    type: "string",
                                    enum: ["title", "subtitle", "heading", "paragraphStart"],
                                    description: "The type of structural element"
                                },
                                position: {
                                    type: "number",
                                    description: "Character index where the element starts"
                                }
                            },
                            required: ["type", "position"]
                        }
                    }
                },
                required: ["elements"]
            }
        }],
        tool_choice: {
            type: "tool",
            name: "document_structure_analyzer"
        }
    });

    // Parse Claude's response
    try {
        // First try to find a tool use response
        const toolUseResponse = message.content.find(block =>
            'type' in block && block.type === 'tool_use'
        );
        
        if (toolUseResponse && 'input' in toolUseResponse) {
            // We have a tool use response, validate it
            const input = toolUseResponse.input as Record<string, unknown>;
            if (input.elements) {
                return structuralAnalysisSchema.parse(input.elements);
            }
        }
        
        // Fallback to text parsing if tool use response is not found
        const textBlock = message.content.find(block =>
            'type' in block && block.type === 'text' && 'text' in block
        );
        
        if (textBlock && 'text' in textBlock) {
            try {
                // Try to extract JSON from text response
                const jsonMatch = textBlock.text.match(/\[\s*{[\s\S]*}\s*\]/);
                if (jsonMatch) {
                    const parsedResponse = JSON.parse(jsonMatch[0]);
                    return structuralAnalysisSchema.parse(parsedResponse);
                }
            } catch (parseError) {
                console.error('Failed to parse text as JSON:', parseError);
            }
        }
        
        throw new Error('No valid response received from Claude');
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