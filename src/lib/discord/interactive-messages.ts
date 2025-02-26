import {
    type ActionRow,
    ComponentType,
    ButtonStyle,
    type Interaction
} from '../schemas/discord-consolidated';

/**
 * Type for Discord message component
 */
type MessageComponent = {
    type: number;
    custom_id?: string;
    label?: string;
    style?: number;
    options?: Array<{
        label: string;
        value: string;
        description?: string;
    }>;
    [key: string]: unknown;
};

/**
 * Send an interactive message with buttons or other components
 * @param channelId Discord channel ID
 * @param content Message content
 * @param components Array of message components (buttons, select menus, etc.)
 */
export const sendInteractiveMessage = async (
    channelId: string,
    content: string,
    components: MessageComponent[]
): Promise<void> => {
    try {
        console.log('Sending interactive message:', {
            channelId,
            content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
            componentCount: components.length
        });

        const token = process.env.DISCORD_BOT_TOKEN;
        if (!token) {
            throw new Error('DISCORD_BOT_TOKEN not found in environment variables');
        }

        const body: Record<string, unknown> = { content };
        
        // Add components if provided
        if (components.length > 0) {
            // Discord expects components to be wrapped in ActionRows
            body.components = [{
                type: ComponentType.ActionRow,
                components
            }];
        }

        const response = await fetch(
            `https://discord.com/api/v10/channels/${channelId}/messages`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bot ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to send message: ${response.status} ${response.statusText}\n${errorText}`);
        }

        console.log('Interactive message sent successfully');
    } catch (error) {
        console.error('Error sending interactive message:', error);
        throw error;
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
 * Create a button component
 * @param customId Button custom ID
 * @param label Button label
 * @param style Button style (from ButtonStyle enum)
 * @returns Button component
 */
export const createButton = (
    customId: string,
    label: string,
    style: number = ButtonStyle.Primary
): MessageComponent => {
    return {
        type: ComponentType.Button,
        custom_id: customId,
        label,
        style
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
        console.log('Responding to interaction:', {
            type: interaction.type,
            id: interaction.id,
            responseType: response.type,
            tokenPreview: interaction.token.substring(0, 5) + '...'
        });

        // Log the full response for debugging
        console.log('Response payload:', JSON.stringify(response, null, 2));

        const url = `https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`;
        console.log('Sending to URL:', url);

        const fetchResponse = await fetch(
            url,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(response)
            }
        );

        if (!fetchResponse.ok) {
            const errorText = await fetchResponse.text();
            console.error(`Failed to respond to interaction: ${fetchResponse.status} ${fetchResponse.statusText}\n${errorText}`);
            throw new Error(`Failed to respond to interaction: ${fetchResponse.status} ${fetchResponse.statusText}\n${errorText}`);
        }

        console.log('Interaction response sent successfully');
    } catch (error) {
        console.error('Error responding to interaction:', error);
        throw error;
    }
};

/**
 * Send a direct message to a Discord channel
 * @param channelId Discord channel ID
 * @param content Message content
 * @param components Optional message components
 */
export const sendDirectMessage = async (
    channelId: string,
    content: string,
    components?: ActionRow[]
): Promise<void> => {
    try {
        console.log('Sending message:', {
            channelId,
            content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
        });

        const body: { content: string; components?: ActionRow[] } = { content };
        if (components) {
            body.components = components;
        }

        const token = process.env.DISCORD_BOT_TOKEN;
        if (!token) {
            throw new Error('DISCORD_BOT_TOKEN not found in environment variables');
        }

        const response = await fetch(
            `https://discord.com/api/v10/channels/${channelId}/messages`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bot ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to send message: ${response.status} ${response.statusText}\n${errorText}`);
        }

        console.log('Message sent successfully');
    } catch (error) {
        console.error('Error sending direct message:', error);
        throw error;
    }
};