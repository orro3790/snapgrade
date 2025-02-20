# Proposed Updates to .clinerules

## Changes Required

1. Remove n8n references:

   - Remove line: `- If creating anything related to n8n --> refer to n8n documentation`
   - Remove reference in example: `For example, if searching for how to integrate Discord bots with n8n, search both Discord and n8n documentation.`

2. Update Process Flow section to reflect direct implementation:

```markdown
### Process Flow

1. **Initial Input**

   - Teacher (client-side) takes a photo of a student's essay
   - Photo is sent to our Discord bot

2. **Text Extraction**

   - Discord bot confirms auth with Firebase and user document to ensure account is active
   - Discord bot forwards photo to LLM Whisperer service
   - LLM Whisperer performs OCR (Optical Character Recognition)
   - Raw text is extracted from the photo

3. **Document Processing**

   - Raw text is stored in Firestore database
   - Document processor service analyzes text structure
   - Structure LLM identifies:
     - Headers
     - Titles
     - Paragraphs
     - Lists

4. **Teacher Review**
   [Rest of teacher review section remains unchanged]

5. **Writing Analysis**
   [Rest of writing analysis section remains unchanged]

6. **Final Output**
   [Rest of final output section remains unchanged]
```

3. Update Backend Services section:

```markdown
### 2.4 Backend Services

#### 2.4.1 Authentication

- Firebase Authentication
- Discord OAuth2 Authentication

#### 2.4.2 Database

- Firestore
- Discord API endpoints (for bot interactions)

#### 2.4.3 Document Processing

- LLM Whisperer for OCR
- Structure LLM for document analysis
- Writing Analysis LLM for text review

#### 2.4.4 Discord Integration

- Bot Implementation:
  - Located in `/src/lib/discord/dm-bot.ts`
  - Handles image processing flow
  - Manages user authentication
  - Provides status updates
```

## Next Steps

1. Switch to Code mode
2. Update .clinerules with these changes
3. Remove n8n references
4. Update workflow documentation
5. Add document processing details

This update better reflects our direct implementation approach while maintaining the same level of detail and clarity in the documentation.
