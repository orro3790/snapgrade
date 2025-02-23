# Discord Bot Implementation

## Overview
This directory contains our Discord bot implementation that handles image processing requests from teachers. The bot is integrated directly into the main Snapgrade application, sharing types, utilities, and configuration.

## Structure
```
discord/
├── bot.ts      # Core bot implementation with WebSocket handling
├── handlers.ts # Message and image processing logic
├── index.ts    # Bot initialization and process management
└── README.md   # Documentation
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
The bot is structured into three main components:

1. **Core Bot (bot.ts)**
   - Handles Discord Gateway WebSocket connection
   - Manages authentication and heartbeat
   - Provides connection resilience and error recovery

2. **Message Handlers (handlers.ts)**
   - Processes incoming messages and attachments
   - Manages document sessions
   - Handles image processing workflow

3. **Entry Point (index.ts)**
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
- Uses shared schemas from `src/lib/schemas`
- Integrates with Firebase services from `src/lib/firebase`
- Leverages document processing services from `src/lib/services`

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