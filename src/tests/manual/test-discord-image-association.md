# Manual Testing: Discord Image Session Association

## Setup
1. Ensure the Discord bot is running with the latest changes
2. Have a Discord user account ready for testing
3. Have at least two test images ready to upload

## Test Case 1: Creating a Document from Uploaded Images
**Objective**: Verify that images uploaded before creating a session are properly associated with the new session.

1. **Upload Image(s)**:
   - Send one or more images to the Discord bot
   - Verify the bot responds with: "I've received your image(s). Would you like to create a document for processing?"
   - Verify the "Create Document" button contains the temporary session ID in the custom_id
   
2. **Create Document**:
   - Click the "Create Document" button
   - Verify the bot acknowledges the interaction
   - Verify the bot creates a document session
   - Verify the bot associates the previously uploaded images with the new session
   - Verify the bot sends a message with "Document created successfully"
   
3. **Process Document**:
   - Click the "Process Document" button
   - Verify the document processing starts
   - Verify the images are included in the document (check logs or database)

## Test Case 2: Adding More Images to an Existing Session
**Objective**: Verify that images can be added to an existing session.

1. **Create a Session**:
   - Upload an image and create a document (as in Test Case 1)
   - Click "I'll Add More Images" instead of "Process Document"
   
2. **Upload More Images**:
   - Upload one or more additional images
   - Verify the bot adds the images to the existing session
   - Verify the bot sends a message with "Added X image(s) to document (Y total)"
   
3. **Process Document**:
   - Click the "Yes, Process Document" button
   - Verify the document processing starts
   - Verify all uploaded images are included in the document

## Test Case 3: Cleaning Up Orphaned Images
**Objective**: Verify that orphaned images are properly cleaned up.

1. **Create Orphaned Images**:
   - Upload one or more images to the Discord bot
   - Do NOT click the "Create Document" button
   - Verify the images are stored in Firestore and marked as orphaned
   
2. **Trigger Cleanup**:
   - Wait for the scheduled cleanup job to run, or manually trigger it
   - Verify the orphaned images are deleted from Firestore

## Additional Verification
- Check the Firestore database directly to verify image documents are created with correct metadata
- Monitor server logs for any errors or unexpected behavior
- Verify temporary session IDs are properly formatted and unique
- Verify the cleanup job only removes orphaned images older than 24 hours

## Expected Results
- All images should be properly associated with sessions
- No images should be lost when creating a document
- Orphaned images should be automatically cleaned up after 24 hours