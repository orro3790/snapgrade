# Discord Bot Fix Implementation Plan

## Issues Identified

1. DISCORD_BOT_TOKEN not properly validated in environment schema
2. Direct process.env access in multiple files
3. Lack of status monitoring for bot
4. Potential missing intents (though currently configured correctly)

## Implementation Steps

### 1. Update Environment Schema

Update `src/lib/schemas/env.ts` to include bot token validation:

```typescript
export const envSchema = z.object({
	DISCORD_CLIENT_ID: z.string().min(1, 'Discord client ID is required'),
	DISCORD_CLIENT_SECRET: z.string().min(1, 'Discord client secret is required'),
	DISCORD_REDIRECT_URI: z.string().url('Discord redirect URI must be a valid URL'),
	DISCORD_BOT_TOKEN: z.string().min(1, 'Discord bot token is required')
});
```

### 2. Centralize Token Management

Create a new tokens manager in `src/lib/discord/tokenManager.ts`:

```typescript
import { envSchema } from '../schemas/env';

export class TokenManager {
	private static instance: TokenManager;
	private env: z.infer<typeof envSchema>;

	private constructor() {
		this.env = envSchema.parse(process.env);
	}

	public static getInstance(): TokenManager {
		if (!TokenManager.instance) {
			TokenManager.instance = new TokenManager();
		}
		return TokenManager.instance;
	}

	public getBotToken(): string {
		return this.env.DISCORD_BOT_TOKEN;
	}
}
```

### 3. Add Status Monitoring

Create a new status monitor in `src/lib/discord/statusMonitor.ts`:

```typescript
export class BotStatusMonitor {
	private static instance: BotStatusMonitor;
	private status: 'disconnected' | 'connecting' | 'connected' | 'error';
	private lastError: Error | null;

	private constructor() {
		this.status = 'disconnected';
		this.lastError = null;
	}

	public static getInstance(): BotStatusMonitor {
		if (!BotStatusMonitor.instance) {
			BotStatusMonitor.instance = new BotStatusMonitor();
		}
		return BotStatusMonitor.instance;
	}

	public setStatus(status: typeof this.status, error?: Error): void {
		this.status = status;
		this.lastError = error || null;
		this.logStatus();
	}

	private logStatus(): void {
		console.log(`Bot Status: ${this.status}`);
		if (this.lastError) {
			console.error('Last Error:', this.lastError);
		}
	}
}
```

### 4. Enhance Error Logging

Update message handlers to include better error context:

```typescript
try {
	// ... message handling logic
} catch (error) {
	console.error('Error processing message:', {
		messageId: message.id,
		channelId: message.channelId,
		attachments: message.attachments.length,
		error:
			error instanceof Error
				? {
						name: error.name,
						message: error.message,
						stack: error.stack
					}
				: 'Unknown error'
	});
}
```

### 5. Verification Steps

1. Ensure DISCORD_BOT_TOKEN is set in environment
2. Verify bot has required permissions:
   - Send Messages
   - View Channels
   - Read Message History
   - Add Reactions
3. Confirm intents are enabled in Discord Developer Portal:
   - GUILDS
   - DIRECT_MESSAGES
   - MESSAGE_CONTENT
4. Test bot with various message types:
   - Text only
   - Single image
   - Multiple images
   - Invalid file types

## Implementation Order

1. Environment schema update
2. Token management centralization
3. Status monitoring
4. Error logging enhancement
5. Testing and verification

## Success Criteria

- Bot responds to DM images with appropriate status messages
- Error messages are clear and actionable
- Bot status is monitored and logged
- Environment validation catches missing/invalid tokens early
