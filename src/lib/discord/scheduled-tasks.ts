import { cleanupOrphanedImages } from './document-session-handler';

/**
 * Schedule and manage periodic tasks for the Discord bot
 */

/**
 * Initialize scheduled tasks
 * This should be called when the bot starts
 */
export const initScheduledTasks = (): void => {
    // Schedule orphaned image cleanup to run every 4 hours
    setInterval(async () => {
        console.log('Running scheduled task: cleanup orphaned images');
        try {
            await cleanupOrphanedImages();
        } catch (error) {
            console.error('Error in scheduled orphaned image cleanup:', error);
        }
    }, 4 * 60 * 60 * 1000); // 4 hours in milliseconds
    
    console.log('Scheduled tasks initialized');
};