import { adminDb } from '../firebase/admin';
import {
    userSchema
} from '../schemas/user';
import {
    classSchema
} from '../schemas/class';
import {
    studentSchema
} from '../schemas/student';
import {
    sendInteractiveMessage
} from './interactive-messages';
import {
    ComponentType,
    ButtonStyle,
    type Interaction
} from '../schemas/discord-consolidated';

/**
 * Show metadata dialog for document organization
 * @param channelId Discord channel ID
 * @param userId User's Discord ID
 * @param sessionId Document session ID
 */
export const showMetadataDialog = async (
    channelId: string,
    userId: string,
    sessionId: string
): Promise<void> => {
    try {
        console.log('Showing metadata dialog:', {
            channelId,
            userId,
            sessionId
        });

        // Get user's Firebase UID from Discord mapping
        const mappingSnapshot = await adminDb
            .collection('discord_mappings')
            .where('discordId', '==', userId)
            .limit(1)
            .get();

        if (mappingSnapshot.empty) {
            console.warn('No Discord mapping found for user:', userId);
            await sendInteractiveMessage(
                channelId,
                "Your document is being processed. You can organize it later in the Document Bay.",
                []
            );
            return;
        }

        const firebaseUid = mappingSnapshot.docs[0].data().firebaseUid;

        // Get user's classes from database
        const userDoc = await adminDb.collection('users').doc(firebaseUid).get();
        
        if (!userDoc.exists) {
            console.warn('User document not found:', firebaseUid);
            await sendInteractiveMessage(
                channelId,
                "Your document is being processed. You can organize it later in the Document Bay.",
                []
            );
            return;
        }

        const userData = userSchema.parse({
            ...userDoc.data(),
            id: userDoc.id
        });
        
        // Fetch class info for dropdown
        const classesSnapshot = await adminDb
            .collection('classes')
            .where('id', 'in', userData.classes)
            .where('status', '==', 'active')
            .get();
        
        if (classesSnapshot.empty) {
            console.warn('No active classes found for user:', firebaseUid);
            await sendInteractiveMessage(
                channelId,
                "Your document is being processed. You can organize it later in the Document Bay.",
                []
            );
            return;
        }

        const classes = classesSnapshot.docs.map(doc => {
            return classSchema.parse({
                ...doc.data(),
                id: doc.id
            });
        });
        
        // Create class selection dropdown with proper ActionRow structure
        // We need to use respondToInteraction directly with properly structured components
        // because sendInteractiveMessage puts all components in a single ActionRow
        const token = process.env.DISCORD_BOT_TOKEN;
        if (!token) {
            throw new Error('DISCORD_BOT_TOKEN not found in environment variables');
        }

        // Send message with properly structured components
        const response = await fetch(
            `https://discord.com/api/v10/channels/${channelId}/messages`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bot ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: "Quick document organization (can be done later):",
                    components: [
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    type: ComponentType.SelectMenu,
                                    custom_id: `class_select_${sessionId}`,
                                    placeholder: "Select class",
                                    options: classes.map(c => ({
                                        label: c.name,
                                        value: c.id,
                                        description: `${c.students.length} students`
                                    }))
                                }
                            ]
                        },
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    type: ComponentType.Button,
                                    custom_id: `skip_metadata_${sessionId}`,
                                    label: "Skip - Organize Later",
                                    style: ButtonStyle.Secondary
                                }
                            ]
                        }
                    ]
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to send message: ${response.status} ${response.statusText}\n${errorText}`);
        }

        console.log('Metadata dialog sent successfully');
    } catch (error) {
        console.error('Error showing metadata dialog:', error);
        await sendInteractiveMessage(
            channelId,
            'Failed to load classes. You can organize documents later in the web app.',
            []
        );
    }
};

/**
 * Handle class selection and show student dropdown
 * @param interaction Discord interaction
 * @param sessionId Document session ID
 */
export const handleClassSelection = async (
    interaction: Interaction,
    sessionId: string
): Promise<void> => {
    try {
        // Get selected class ID
        const classId = interaction.data?.values?.[0];
        
        if (!classId) {
            console.error('No class selected in interaction:', interaction.id);
            await respondToInteraction(
                interaction,
                {
                    type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
                    data: {
                        content: "No class selected. Please try again."
                    }
                }
            );
            return;
        }
        
        // Get students for selected class
        const studentsSnapshot = await adminDb
            .collection('students')
            .where('classId', '==', classId)
            .where('status', '==', 'active')
            .get();
        
        if (studentsSnapshot.empty) {
            await sendInteractiveMessage(
                interaction.channel_id,
                "No active students found in this class. You can organize documents later in the Document Bay.",
                []
            );
            return;
        }

        const students = studentsSnapshot.docs.map(doc => {
            return studentSchema.parse({
                ...doc.data(),
                id: doc.id
            });
        });
        
        // Show student selection dropdown
        await respondToInteraction(
            interaction,
            {
                type: 7, // UPDATE_MESSAGE
                data: {
                    content: "Quick document organization (can be done later):",
                    components: [
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    type: ComponentType.SelectMenu,
                                    custom_id: `student_select_${sessionId}_${classId}`,
                                    placeholder: "Select student",
                                    options: students.map(s => ({
                                        label: s.name,
                                        value: s.id,
                                        description: s.description || "Student"
                                    }))
                                }
                            ]
                        },
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    type: ComponentType.Button,
                                    custom_id: `skip_metadata_${sessionId}`,
                                    label: "Skip - Organize Later",
                                    style: ButtonStyle.Secondary
                                }
                            ]
                        }
                    ]
                }
            }
        );
    } catch (error) {
        console.error('Error handling class selection:', error);
        await respondToInteraction(
            interaction,
            {
                type: 7, // UPDATE_MESSAGE
                data: {
                    content: "Failed to load students. You can organize documents later in the web app.",
                    components: []
                }
            }
        );
    }
};

/**
 * Handle student selection and assign document to student
 * @param interaction Discord interaction
 * @param sessionId Document session ID
 * @param classId Class ID
 */
export const handleStudentSelection = async (
    interaction: Interaction,
    sessionId: string,
    classId: string
): Promise<void> => {
    try {
        // Get selected student ID
        const studentId = interaction.data?.values?.[0];
        
        if (!studentId) {
            console.error('No student selected in interaction:', interaction.id);
            await respondToInteraction(
                interaction,
                {
                    type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
                    data: {
                        content: "No student selected. Please try again."
                    }
                }
            );
            return;
        }
        
        // Update document session with metadata
        await adminDb
            .collection('document_sessions')
            .doc(sessionId)
            .update({
                metadata: {
                    classId,
                    studentId,
                    assignedAt: new Date()
                }
            });
        
        // Get class and student names for confirmation message
        let className = "Selected Class";
        let studentName = "Selected Student";
        
        try {
            const classDoc = await adminDb.collection('classes').doc(classId).get();
            if (classDoc.exists) {
                className = classDoc.data()?.name || "Selected Class";
            }
            
            const studentDoc = await adminDb.collection('students').doc(studentId).get();
            if (studentDoc.exists) {
                studentName = studentDoc.data()?.name || "Selected Student";
            }
        } catch (error) {
            console.warn('Error getting class/student names:', error);
        }
        
        // Show final confirmation dialog
        await respondToInteraction(
            interaction,
            {
                type: 7, // UPDATE_MESSAGE
                data: {
                    content: `Document will be assigned to ${studentName} in ${className}. Ready to process?`,
                    components: [
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    type: ComponentType.Button,
                                    custom_id: `confirm_final_process_${sessionId}`,
                                    label: "Yes, Process Document",
                                    style: ButtonStyle.Success
                                },
                                {
                                    type: ComponentType.Button,
                                    custom_id: `cancel_process_${sessionId}`,
                                    label: "Cancel",
                                    style: ButtonStyle.Danger
                                }
                            ]
                        }
                    ]
                }
            }
        );
    } catch (error) {
        console.error('Error handling student selection:', error);
        await respondToInteraction(
            interaction,
            {
                type: 7, // UPDATE_MESSAGE
                data: {
                    content: "Failed to assign document. You can organize it later in the Document Bay.",
                    components: []
                }
            }
        );
    }
};

/**
 * Type for Discord interaction response
 */
type InteractionResponse = {
    type: number;
    data?: {
        content?: string;
        components?: Array<Record<string, unknown>>;
        embeds?: Array<Record<string, unknown>>;
        flags?: number;
        [key: string]: unknown;
    };
};

/**
 * Respond to an interaction (button click, slash command, etc.)
 * @param interaction Discord interaction
 * @param response Response data
 */
export const respondToInteraction = async (
    interaction: Interaction,
    response: InteractionResponse
): Promise<void> => {
    try {
        await fetch(
            `https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(response)
            }
        );
    } catch (error) {
        console.error('Error responding to interaction:', error);
        throw error;
    }
};