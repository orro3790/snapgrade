# Telegram Integration Flow

## 1. Account Linking Flow

1. **Website Onboarding**

   - After user signs up on Snapgrade
   - Show "Connect Telegram" button
   - When clicked, generate unique `telegramLinkCode` and store in user's metadata
   - Set `telegramLinkExpiry` to 1 hour from now
   - Display link: `https://t.me/SnapgradeBot?start=LINK_CODE`
   - Link button also availble in settings page

2. **Telegram Bot Link Command**

   ```javascript
   // n8n: When user sends /start LINK_CODE
   const linkCode = message.text.split(' ')[1];

   // Firestore query
   const userQuery = {
     collection: 'users',
     where: [
       ['metadata.telegramLinkCode', '==', linkCode],
       ['metadata.telegramLinkExpiry', '>', new Date().toISOString()]
     ]
   };

   if (user exists) {
     // Update user document
     update user with {
       'metadata.telegramId': message.from.id,
       'metadata.telegramLinkCode': null,
       'metadata.telegramLinkExpiry': null
     }

     // Send success message
     "Account linked successfully! You can now send photos of documents."
   }
   ```

## 2. Authentication Check Flow

1. **Before Processing Any Message**

   ```javascript
   // n8n: Add "Firestore" node before processing
   const userLookup = {
   	collection: 'users',
   	where: [
   		['metadata.telegramId', '==', message.from.id],
   		['metadata.accountStatus', '==', 'ACTIVE']
   	]
   };

   if (!user) {
   	return 'Please link your Snapgrade account first: https://snapgrade.app/link-telegram';
   }

   if (user.metadata.accountStatus !== 'ACTIVE') {
   	return 'Your account is not active. Please check your subscription status.';
   }
   ```

## 3. Document Processing Flow

Update your existing workflow:

1. **After Telegram Trigger**

   - Add Firestore node to look up user
   - Only proceed if user exists and is active

2. **Before LLMWhisperer**

   - Store user's Firebase UID for later use

3. **After Text Extraction**
   ```javascript
   // n8n: Add HTTP Request node
   POST to /api/documents/process
   Body: {
     image: base64Image,
     text: extractedText,
     uid: user.id,  // Firebase UID from user lookup
   }
   ```

## Required n8n Updates

1. **New Nodes**

   - Firestore node for user lookup
   - HTTP Request node for our API
   - Function node for link code validation

2. **Environment Variables**

   - SNAPGRADE_API_URL
   - FIREBASE_PROJECT_ID

3. **Error Handling**
   - Invalid/expired link codes
   - Unlinked accounts
   - Inactive subscriptions

## Next Steps

1. Add account linking flow to website
2. Update user schema (already done)
3. Add authentication check to n8n workflow
4. Update document processing to include user ID
5. Test end-to-end flow

Would you like me to provide the specific n8n node configurations for any of these updates?
