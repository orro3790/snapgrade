import { botStatusSchema, statusStateSchema, type BotStatus, type StatusState } from '../schemas/discord';

// Initial state
let state: StatusState = {
    status: 'disconnected',
    lastError: null,
    lastUpdate: new Date()
};

/**
 * Update the bot's status
 */
export const updateStatus = (status: BotStatus, error?: Error): void => {
    const newState = statusStateSchema.parse({
        status,
        lastError: error || null,
        lastUpdate: new Date()
    });
    
    state = newState;
    logStatus();
};

/**
 * Get the current status
 */
export const getStatus = (): Readonly<StatusState> => ({ ...state });

/**
 * Check if the bot is currently connected
 */
export const isConnected = (): boolean => 
    botStatusSchema.parse(state.status) === 'connected';

/**
 * Log the current status
 */
const logStatus = (): void => {
    console.log('[Bot Status]', {
        status: state.status,
        lastUpdate: state.lastUpdate.toISOString(),
        ...(state.lastError && {
            error: {
                name: state.lastError.name,
                message: state.lastError.message,
                stack: state.lastError.stack
            }
        })
    });
};