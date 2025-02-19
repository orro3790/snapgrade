# Discord Bot Implementation (Completed)

This document outlines the implementation of the Discord bot, including authentication checks and image processing.

## Overview

The Discord bot receives images of essays from teachers via DM. It verifies the user's authentication by checking a Discord-Firebase mapping collection in Firestore. If a mapping exists, it checks the user's account status. If no mapping exists, it prompts the user to authenticate.

## Implementation Details

### Core Components

1. **DiscordBot Class** (`src/lib/discord/snapbot.ts`)

   - Direct WebSocket implementation for Discord Gateway
   - Heartbeat management with jitter
   - Automatic reconnection with session resuming
   - DM message handling with image validation
   - Graceful shutdown support

2. **Discord Mapping Schema** (`src/lib/schemas/discord.ts`)

   - Maps Discord IDs to Firebase UIDs
   - Tracks mapping status (ACTIVE/INACTIVE/SUSPENDED)
   - Includes timestamps for creation and last use

3. **Pending Image Schema** (`src/lib/schemas/pending-image.ts`)

   - Tracks image processing requests
   - Includes metadata like size, type, and status
   - Supports error tracking and completion timestamps

4. **Bot Initialization** (`src/lib/discord/init.ts`)
   - Sets up Gateway intents for DMs and message content
   - Handles process signals (SIGINT, SIGTERM)
   - Manages uncaught errors and rejections

### Authentication Flow

1. **First-Time Users**

   - User sends image to bot via DM
   - Bot checks Discord-Firebase mapping
   - If no mapping exists, prompts user to visit Snapgrade website
   - User authenticates with Discord OAuth on website
   - Website creates mapping in Firestore
   - User can now use bot

2. **Authenticated Users**
   - Bot receives DM with image
   - Checks Discord ID in mappings collection
   - Verifies account status (ACTIVE/INACTIVE/SUSPENDED)
   - If active, processes image
   - If inactive/suspended, sends appropriate message

### Image Processing Flow

1. **Validation**

   - Checks file is an image (JPEG, PNG, WEBP, GIF)
   - Validates single image per message
   - Verifies content type and size

2. **Storage**

   - Creates pending_images record in Firestore
   - Includes all image metadata and URLs
   - Sets initial status as PENDING

3. **Processing**
   - n8n workflow monitors pending_images collection
   - Updates status to PROCESSING
   - Handles OCR and analysis
   - Updates status to COMPLETED/FAILED

### Error Handling

1. **Gateway Errors**

   - Automatic reconnection for transient errors
   - Session resuming when possible
   - Graceful degradation for fatal errors

2. **Authentication Errors**

   - Clear user messaging for auth issues
   - Guidance for account linking
   - Status-specific error messages

3. **Processing Errors**
   - Detailed error tracking in Firestore
   - User-friendly error messages
   - Retry support for transient failures

## Deployment

### Environment Variables
```env
DISCORD_BOT_TOKEN=    # Discord bot token from Developer Portal
DISCORD_PUBLIC_KEY=   # Discord public key for request verification
```
Note: Firebase admin credentials are already configured in src/lib/firebase/admin.ts

### Required Permissions
1. **Discord Bot**
   - Read Messages/View Channels
   - Send Messages
   - Read Message History
   - Add Reactions
   - Use External Emojis
   - Attach Files

### Gateway Intents
- GUILDS (1 << 0)
- DIRECT_MESSAGES (1 << 9)
- MESSAGE_CONTENT (1 << 15)

## Monitoring

### Health Checks
1. **Gateway Connection**
   - Monitor heartbeat ACKs
   - Track reconnection attempts
   - Log connection state changes

2. **Processing Pipeline**
   - Track pending image counts
   - Monitor processing times
   - Alert on high failure rates

3. **Authentication**
   - Track failed auth attempts
   - Monitor mapping creation rate
   - Alert on suspicious activity

### Logging
1. **Gateway Events**
   - Connection lifecycle events
   - Authentication events
   - Error events with stack traces

2. **Processing Events**
   - Image validation results
   - Processing state transitions
   - Error details and context

3. **User Interactions**
   - Authentication attempts
   - Command usage
   - Error responses

### Metrics
1. **Performance**
   - Gateway latency
   - Processing time per image
   - Authentication response time

2. **Usage**
   - Active users per day
   - Images processed per hour
   - Error rate by type

3. **System**
   - Memory usage
   - WebSocket connection stability
   - Firestore operation latency

## Workflow

1.  **Receive Image:**
    - Bot receives a photo via DM.
    - Validates the file is an image (jpg, jpeg, png, webp, gif) and under 10 MiB.
2.  **Authentication Check:**
    - Extract Discord user ID from the message.
    - Query the Discord-Firebase mapping collection in Firestore.
    - If mapping exists:
      - Use the Firebase UID to get the user document.
      - Check `accountStatus` in the user document.
    - If no mapping exists:
      - Send instructions for first-time authentication.
3.  **Process or Reject:**
    - If authenticated and active:
      - Allow n8n workflow to proceed.
    - If not authenticated or inactive/suspended:
      - Send appropriate error message.
4.  **First-Time Authentication:**
    - User visits Snapgrade web app.
    - Authenticates with Discord OAuth.
    - Web app creates mapping in Firestore:
      ```typescript
      interface DiscordMapping {
        discordId: string;
        firebaseUid: string;
        createdAt: Timestamp;
        lastUsed: Timestamp;
      }
      ```

## Implementation Steps

1.  **Setup:**
    - Create Discord bot application and set environment variables:
      - `DISCORD_BOT_TOKEN`: The Discord bot's token.
      - `DISCORD_PUBLIC_KEY`: The public key for verifying interactions.
2.  **Basic Bot Structure (`dm-bot.ts`):**
    - Initialize Discord client.
    - Event handlers:
      - `ready`: Log connection.
      - `messageCreate`: Handle DM messages.
3.  **Message Handling:**
    - Check if message is a DM (`context === 1` for BOT_DM).
    - Validate any attachments:
      - Must be an image (check MIME type).
      - Must be under 10 MiB.
    - If invalid, send error message with supported formats.
4.  **Authentication System:**
    - Create `discord-mappings` collection in Firestore.
    - Functions:
      - `findDiscordMapping(discordId: string)`: Query mapping.
      - `checkUserStatus(firebaseUid: string)`: Get user status.
      - `createDiscordMapping(discordId: string, firebaseUid: string)`: Store new mapping.
5.  **Web App Integration:**
    - Add Discord OAuth to web app.
    - After successful OAuth:
      - Get Discord user ID.
      - Create mapping with Firebase UID.
6.  **Error Handling:**
    - Clear error messages for:
      - Invalid file types
      - File too large
      - Authentication required
      - Account inactive/suspended

## Further Considerations

- **Security:**
  - Validate Discord interaction signatures.
  - Regular cleanup of unused mappings.
- **Performance:**
  - Cache frequently used mappings.
  - Batch Firestore operations where possible.
- **User Experience:**
  - Clear instructions for first-time setup.
  - Helpful error messages.
- **n8n Integration:**
  - n8n workflow should only proceed after successful authentication check.

## API VS DISCORD.JS LIBRARY

# Discord Integration: API Implementation vs discord.js Library Analysis

## Direct API Implementation - Pros

1. **Complete Control Over Gateway Lifecycle**

   - Can implement precise connection handling
   - Custom heartbeat management
   - Fine-tuned error recovery

2. **Minimal Dependencies**

   - Only need WebSocket and HTTP libraries
   - Smaller deployment footprint

3. **Deep Understanding**

   - Forces understanding of Discord's protocols
   - Better debugging capabilities

4. **Performance Optimization**
   - Can optimize for our specific use case
   - No unused features/overhead

## Direct API Implementation - Cons

1. **Complex Implementation Requirements**

   - Must handle WebSocket connection lifecycle
   - Need to implement heartbeat system (45s intervals)
   - Must manage sequence numbers for resuming
   - Need to handle compression

2. **Error Handling Complexity**

   - Various disconnect scenarios
   - Resume vs. re-identify logic
   - Rate limit management

3. **Maintenance Burden**
   - Need to keep up with API changes
   - Must implement new features ourselves

## Using discord.js - Pros

1. **Proven Implementation**

   - Battle-tested WebSocket handling
   - Reliable heartbeat management
   - Built-in rate limiting

2. **Easier Maintenance**

   - Library handles API updates
   - Community-supported fixes

3. **Time Saving**
   - Immediate implementation
   - Focus on business logic

## Using discord.js - Cons

1. **Less Control**

   - Abstract error handling
   - Fixed retry strategies

2. **Dependency Risk**

   - Version updates might break things
   - Potential security vulnerabilities

3. **Overhead**
   - Includes unused features
   - Larger bundle size

## Recommendation

Given our specific use case (DM message handling and authentication), I recommend implementing the direct API approach because:

1. **Focused Scope:** We only need:
   - WebSocket connection
   - DM message handling
   - Basic heartbeat system
2. **Critical System Component:**

   - Authentication is crucial
   - Need precise error handling
   - Must control retry strategies

3. **Long-term Maintainability:**

   - Simpler to debug issues
   - Easier to optimize
   - No dependency on third-party updates

4. **Documentation Support:**
   - Discord's WebSocket protocol is well-documented
   - Clear connection lifecycle
   - Detailed event structure

The implementation complexity is justified by the control and reliability we gain, especially for a production system handling user authentication.
