# Discord Bot TypeScript Configuration Fix

## Issue

The Discord bot build is failing due to missing module resolution for `$lib` path aliases. The current tsconfig.bot.json doesn't properly resolve imports from the src/lib directory.

## Implementation Plan

1. Update tsconfig.bot.json configuration:

   ```json
   {
   	"compilerOptions": {
   		"target": "ES2020",
   		"module": "ES2020",
   		"moduleResolution": "node",
   		"esModuleInterop": true,
   		"strict": true,
   		"skipLibCheck": true,
   		"outDir": "./dist",
   		"allowJs": true,
   		"declaration": false,
   		"removeComments": true,
   		"resolveJsonModule": true,
   		"baseUrl": "../..",
   		"paths": {
   			"$lib/*": ["src/lib/*"]
   		}
   	},
   	"include": ["./*.ts", "../schemas/*.ts", "../firebase/*.ts"]
   }
   ```

2. Key Changes:

   - Set baseUrl to "../../" to point to project root
   - Add $lib path alias mapping to src/lib
   - Include firebase directory in includes array

3. Alternative Approach:
   If the path alias approach doesn't work, we can modify the imports in tokens.ts to use relative paths:
   ```typescript
   import { adminDb } from '../../firebase/admin';
   import { envSchema } from '../../schemas/env';
   ```

## Next Steps

1. Switch to Code mode to implement these changes
2. Test the build process
3. If successful, update documentation to reflect the configuration changes

## Rationale

- The bot needs its own TypeScript configuration since it runs independently of the SvelteKit app
- Setting baseUrl to "../../" allows paths to be resolved relative to the project root
- Including firebase directory ensures TypeScript can find and check all necessary files
