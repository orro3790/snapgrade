import { adminDb } from './firebase';
import { 
    discordMappingSchema,
    type AuthResult
} from '../schemas/discord';

/**
 * Verify a Discord user's authentication status and mapping to Firebase
 */
export const verifyDiscordUser = async (discordId: string): Promise<AuthResult> => {
    try {
        console.log('Verifying Discord user:', discordId);
        
        // Query for Discord mapping
        const mappingRef = adminDb
            .collection('discord_mappings')
            .where('discordId', '==', discordId);
        
        const snapshot = await mappingRef.get();

        // No mapping found
        if (snapshot.empty) {
            console.log('No mapping found for Discord ID:', discordId);
            return {
                authenticated: false,
                error: 'Discord account not linked with Snapgrade'
            };
        }

        // Get and validate mapping data
        const mappingDoc = snapshot.docs[0];
        const rawData = mappingDoc.data();
        console.log('Raw Firestore data:', JSON.stringify(rawData, null, 2));

        const mapping = discordMappingSchema.parse(rawData);
        console.log('Parsed mapping:', mapping);

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