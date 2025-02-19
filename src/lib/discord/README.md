# Discord Bot Implementation

## Overview
This directory contains our Discord bot implementation that handles image processing requests. The bot uses Discord's Gateway API for real-time communication and integrates with Firebase for user authentication and data storage.

## File Structure
```
discord/
├── src/
│   ├── firebase.ts     # Firebase admin initialization
│   ├── schemas.ts      # Zod schemas for type validation
│   ├── snapbot.ts      # Main bot implementation
│   ├── init.ts         # Bot initialization logic
│   └── start.ts        # Entry point
├── dist/              # Compiled JavaScript files
├── package.json       # Project configuration and scripts
├── tsconfig.bot.json  # TypeScript configuration
└── README.md         # Documentation
```

## Scripts
- `npm run build` - Build TypeScript files to dist/
- `npm start` - Run the compiled bot
- `npm run dev` - Build and start the bot

## TypeScript and Module Resolution Journey

### Initial Approach: Direct ts-node Execution
We initially tried to run the TypeScript files directly using ts-node, but ran into several challenges:

1. **Module Resolution**: Our project uses SvelteKit's module resolution ($lib imports), which doesn't work well with standalone TypeScript files.
2. **Environment Variables**: SvelteKit's $env imports weren't accessible outside the SvelteKit context.
3. **Type Dependencies**: The bot needed access to types from our main project (schemas, etc.).

### Attempted Solutions

1. **Custom tsconfig**: We tried creating a separate tsconfig.bot.json to handle the bot's specific needs:
   - ES modules support
   - Path aliases
   - Module resolution settings

2. **ts-node with ESM**: We attempted using ts-node with the --esm flag and various module resolution strategies:
   ```bash
   NODE_OPTIONS="--loader ts-node/esm" npx ts-node --esm
   ```

3. **Module Path Mapping**: Tried to configure path aliases to match SvelteKit's structure:
   ```json
   {
     "paths": {
       "$lib/*": ["lib/*"]
     }
   }
   ```

### Final Solution: Build and Run

We ultimately chose a simpler approach:

1. **Isolated Dependencies**: Created local copies of necessary Firebase and schema files to avoid dependency on SvelteKit's module system.

2. **TypeScript Build**: Compile TypeScript to JavaScript:
   ```bash
   npx tsc --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck *.ts
   ```

3. **Direct Execution**: Run the compiled JavaScript:
   ```bash
   node start.js
   ```

This approach offers several advantages:
- Simpler deployment (just need Node.js)
- No runtime TypeScript compilation needed
- Clear separation from SvelteKit's build process
- Maintains type safety during development

## Environment Variables
The bot requires two environment variables:
- `DISCORD_BOT_TOKEN`: For Discord API authentication
- `BASE64_ENCODED_SERVICE_ACCOUNT`: For Firebase admin initialization

## Development Workflow
1. Make changes to TypeScript files
2. Build with `tsc`
3. Run with `node start.js`
4. For development, you can use `nodemon` to automatically rebuild and restart on changes

## Type Safety
While we run the JavaScript files in production, we maintain TypeScript files for development to ensure:
- Type safety when making changes
- Better IDE support
- Easier debugging
- Documentation through types

The TypeScript files serve as our source of truth, while the JavaScript files are treated as build artifacts.