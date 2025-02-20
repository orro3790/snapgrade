import { adminDb } from './firebase';
import { discordMappingSchema, type DiscordMapping } from '../schemas/discord';

/**
 * Result of verifying a Discord user's authentication status
 */
interface AuthResult {
    authenticated: boolean;
    status?: DiscordMapping['status'];
    firebaseUid?: string;
    error?: string;
}

/**
 * Verify a Discord user's authentication status and mapping to Firebase
 * @param discordId The Discord user's ID
 * @returns Authentication result with status and Firebase UID if authenticated
 */
export const verifyDiscordUser = async (discordId: string): Promise<AuthResult> => {
    try {
        // Query for Discord mapping
        const mappingRef = adminDb
            .collection('discord_mappings')
            .where('discordId', '==', discordId);
        
        const snapshot = await mappingRef.get();

        // No mapping found
        if (snapshot.empty) {
            return {
                authenticated: false,
                error: 'Discord account not linked with Snapgrade'
            };
        }

        // Get and validate mapping data
        const mappingDoc = snapshot.docs[0];
        const mapping = discordMappingSchema.parse(mappingDoc.data());

        // Update last used timestamp
        await updateLastUsed(discordId);

        // Return auth result based on status
        return {
            authenticated: true,
            status: mapping.status,
            firebaseUid: mapping.firebaseUid
        };
    } catch (error) {
        console.error('Error verifying Discord user:', {
            discordId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        return {
            authenticated: false,
            error: 'Failed to verify Discord authentication'
        };
    }
};

/**
 * Update the lastUsed timestamp for a Discord mapping
 * @param discordId The Discord user's ID
 */
export const updateLastUsed = async (discordId: string): Promise<void> => {
    try {
        const mappingRef = adminDb
            .collection('discord_mappings')
            .where('discordId', '==', discordId);
        
        const snapshot = await mappingRef.get();
        
        if (!snapshot.empty) {
            await snapshot.docs[0].ref.update({
                lastUsed: new Date()
            });
        }
    } catch (error) {
        console.error('Error updating lastUsed timestamp:', {
            discordId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        // Don't throw - this is a non-critical update
    }
};

/**
 * Get user-friendly status message based on auth result
 * @param result Authentication result
 * @returns Message to send to user
 */
export const getAuthStatusMessage = (result: AuthResult): string => {
    if (!result.authenticated) {
        return result.error ?? 'You need to link your Discord account with Snapgrade first. Please visit the Snapgrade website and connect your Discord account.';
    }

    switch (result.status) {
        case 'SUSPENDED':
            return 'Your account has been suspended. Please contact support.';
        case 'INACTIVE':
            return 'Your subscription is inactive. Please renew your subscription to continue using Snapgrade.';
        case 'ACTIVE':
            return ''; // No message needed for active users
        default:
            return 'There was an error checking your account status. Please try again later.';
    }
};