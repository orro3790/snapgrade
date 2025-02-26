# Discord Bot Implementation

## Overview
This directory contains our Discord bot implementation that handles image processing requests from teachers. The bot is integrated directly into the main Snapgrade application, sharing types, utilities, and configuration.

## Structure
```
discord/
├── bot.ts                     # Core bot implementation with WebSocket handling
├── document-session-handler.ts # Document session management
├── interaction-handler.ts     # Handles Discord interactions (buttons, commands)
├── interactive-messages.ts    # Utilities for sending interactive messages
├── metadata-handler.ts        # Handles document metadata assignment
├── index.ts                   # Bot initialization and process management
└── README.md                  # Documentation
```

## Running the Bot

### Development
```bash
npm run dev:bot
```
This will start the bot in development mode with automatic reloading on file changes.

### Production
```bash
npm run start:bot
```
This will start the bot in production mode.

## Environment Variables
The bot requires one environment variable:
- `DISCORD_BOT_TOKEN`: Discord bot authentication token

## Architecture
The bot is structured into several main components:

1. **Core Bot (bot.ts)**
   - Handles Discord Gateway WebSocket connection
   - Manages authentication and heartbeat
   - Provides connection resilience and error recovery
   - Processes incoming messages and attachments

2. **Interaction Handler (interaction-handler.ts)**
   - Processes Discord interactions (button clicks, slash commands)
   - Routes interactions to appropriate handlers
   - Manages response formatting

3. **Document Session Handler (document-session-handler.ts)**
   - Manages document sessions
   - Handles image uploads and processing
   - Coordinates session state transitions

4. **Interactive Messages (interactive-messages.ts)**
   - Utilities for sending messages with buttons and components
   - Handles message formatting and delivery

5. **Metadata Handler (metadata-handler.ts)**
   - Manages document metadata (class, student assignment)
   - Provides UI for metadata selection

6. **Entry Point (index.ts)**
   - Initializes the bot
   - Sets up error handling
   - Manages process lifecycle

## Error Handling
- Comprehensive error logging
- Automatic reconnection on connection issues
- Graceful shutdown on process termination
- User-friendly error messages

## Development Notes
- The bot shares the main project's TypeScript configuration
- Uses consolidated schemas from `src/lib/schemas/discord-consolidated.ts`
- Integrates with Firebase services from `src/lib/firebase`
- Leverages functional document processing services from `src/lib/services`

## Type Safety
All bot code is fully typed using TypeScript, ensuring:
- Type safety when handling Discord events
- Proper schema validation for messages and attachments
- Consistent interface with shared services

## Deployment
The bot runs as a separate process but shares the same codebase as the main application. This allows for:
- Independent operation and restart
- Shared code and types
- Simplified deployment
- Consistent development experience