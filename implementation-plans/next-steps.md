# Snapgrade Development Notes

## 1. Application Structure Issue (✅ Completed)

The processing-status route has been removed, and we've created an Activity component that shows the user's activity history, including document creation and processing status. This component is now accessible through the sidebar, like ClassManager and DocumentBay, and displayed in a modal with the help of the `modalStore`.

We've also refactored the DocumentSessionHistory component to follow our design system instead of using Tailwind CSS classes. The component now uses CSS variables and patterns defined in our design system.

Additionally, we've updated the Discord bot integration to use the new URL format for the Activity modal, ensuring that users can still check the processing status of their documents from Discord.

Next steps:
- Move the KeyboardControls modal from `src/routes/+layout.svelte` to `src/routes/+page.svelte` to better align with SvelteKit's server actions pattern.

## 2. ClassManager Requirements (✅ Completed)

We have implemented CRUD functionality in the ClassManager component for both classes and students:

1. **Classes**:
   - Create: Implemented in the ClassForm component and manageClass action
   - Read: Implemented in the ClassList component
   - Update: Implemented in the ClassForm component and manageClass action
   - Delete: Implemented with a delete button and confirmation dialog

2. **Students**:
   - Create: Implemented in the StudentForm component and manageStudent action
   - Read: Implemented in the ClassDetails component
   - Update: Implemented in the StudentForm component and manageStudent action
   - Delete: Implemented with a delete button and confirmation dialog

The implementation includes proper error handling, user permission checks, and cascading deletes (when a class is deleted, all its students are deleted as well).

3. **Bug Fixes**:
   - Fixed SuperForm nested data handling by setting `dataType: 'json'` in ClassManager, ClassForm, and StudentForm components
   - Added unique form IDs to prevent duplicate form ID warnings:
     - ClassManager: 'class-form' and 'student-form'
     - ClassForm: 'class-form-editor'
     - StudentForm: 'student-form-editor'
   - This allows proper handling of nested objects like metadata in the form data and prevents form ID conflicts

## 3. Text Formatting Implementation

We receive analyzed node array from Claude in the final stages of our pipeline (after OCR, llmwhisperer sends the text to Claude for analysis and we get back an array of textnodes). We need to make sure that we can format the title layout using our alignment spacer nodes:

- Center the title node(s) on their own line at the top center of the page by sandwiching them between two alignment nodes that stretch their width to fill the flexbox row
- Implement first paragraph indentation (no lineBreak added before because it's the first paragraph)
- Format new paragraphs (spacer node of type lineBreak and a spacer node of type indent)

To easily test and troubleshoot this, I think it would be easiest to build in the functionality in the FormattingModal commands because we will need them anyway to allow the user to manually correct any errors in formatting. I can manually try to insert these nodes to achieve the intended formatting which serves as a convenient testing method as well.

## 4. Final Processing Stage Implementation

Once we verify the essential layout format can be achieved with the help of our commands in FormattingModal, we can implement the final stage of processing, which is sending the formatted text to Claude for corrections (receiving an array of text nodes that contain all of the correction metadata), and writing feedback.

### 4a. Correction Pattern Decisions

We will need to decide on the correction patterns we want Claude to enforce.

### 4b. Feedback Structure Decisions

We will need to decide on the general feedback structure we want:
- Should we start with areas for improvement, then end on positives?
- Should we note the most pressing areas for improvement in terms of grammar?
- What writing feedback should we give regarding:
  - Style
  - Essay structure based on the kind of essay written (expository essay, creative narrative, process essay, etc.)
  - Formatting (indentations, title, writing along margins properly, etc.)
  - Paragraph elements (thesis, topic sentence, at least 5 sentences per paragraph)
  - Sentence structure
  - Effort
  - Penmanship
  - etc.

Every academy and every teacher will have their own expectations and grading criteria for the kind of writing that was assigned to the student, so the instructions prompt that is passed to Claude in this stage will have to be variable.

### 4c. Assignment Schema Component

We should make a component that allows users to create and manage "Assignment Schemas" (feel free to suggest the most appropriate name for this if you think a better one exists). Here, the user can provide inputs to help instruct Claude how to interpret the writing:
- What kind of essay it is (creative narrative, process essay, compare and contrast, etc.)
- What specific things to look for:
  - Paragraphs should be at least 5 sentences long
  - Paragraphs should have a topic sentence that includes the thesis
  - The thesis should be restated in the conclusion but not copied directly from the introduction
  - etc.

Additionally, we should allow users to view the correction patterns that Claude can apply and enable/disable them as they wish (too many visible corrections can really overwhelm students and discourage them). This lets users create rulesets that can be used to instruct Claude how to correct the essay.

We should still track these corrections for monitoring student progress, but simply allow the user to toggle their visibility in the editor somehow (maybe by adding some buttons to the "title-container" div - we should change the name to something else, like "toolbar", by the way).

When a document is sent to Claude for corrections, we should check that the user has selected a schema for the document in question so that Claude can carry out the corrections appropriately.

### 4d. TextNode Schema Update

- Implement the addition of a "footnote" type to the TextNode schema. This way, Claude can add footnotes to the document that correspond with a particular part of the text which we can designate by placing a number above the TextNode. Currently, the only way to place text over a node is by designating it as a "correction" type and supplying correction text, but that would apply correction node styling as well, which we don't want for footnotes.
- Since footnotes are part of the editing phase (not formatting phase), we should add footnote functionality to the EditModal.svelte component rather than the FormattingModal.svelte component.

## 5. Revised Implementation Plan

### 5.1. Activity Component Implementation

1. **Create Activity Component**:
   - Create a new component called `Activity.svelte` in the routes directory
   - Reuse functionality from DocumentSessionHistory and ProcessingStatusModal
   - Implement a tabbed interface to show both document history and processing status

2. **Update modalStore Schema**:
   - Add 'activity' to the modalTypeSchema enum in `src/lib/stores/modalStore.svelte.ts`
   - Update modalDataSchema to include sessionId parameter if needed

3. **Create Server Actions**:
   - Create a Zod schema for the activity data in `src/lib/schemas/activity.ts`
   - Implement server actions in `src/routes/+page.server.ts` using Superforms:
     ```typescript
     import { superValidate } from 'sveltekit-superforms/server';
     import { zod } from 'sveltekit-superforms/adapters';
     import { activitySchema } from '$lib/schemas/activity';
     import { fail } from '@sveltejs/kit';
     
     export const actions = {
       getActivity: async ({ request, locals }) => {
         const form = await superValidate(request, zod(activitySchema));
         if (!form.valid) return fail(400, { form });
         
         // Fetch activity data from the database
         // ...
         
         return { form };
       }
     };
     ```

4. **Update Sidebar Component**:
   - Add a new sidebar item for "Activity"
   - Implement click handler to open the activity modal

5. **Implement Activity Component**:
   - Use Superforms for form handling:
     ```typescript
     import { superForm } from 'sveltekit-superforms/client';
     
     const { form, errors, enhance } = superForm(data.form);
     ```
   - Add the tabbed interface for document history and processing status
   - Implement loading states and error handling

6. **Update Main Page Layout**:
   - Move KeyboardControls modal from +layout.svelte to +page.svelte
   - Add the Activity component to the main page layout
   - Conditionally render it based on modalStore state

7. **Remove Standalone Route**:
   - Once the modal implementation is working, remove the `/processing-status` route

### 5.2. ClassManager CRUD Implementation

1. **Create Schemas**:
   - Define Zod schemas for class and student data in their respective schema files
   - Ensure proper validation rules are in place

2. **Implement Server Actions**:
   - Create actions for class and student CRUD operations in +page.server.ts:
     ```typescript
     export const actions = {
       createClass: async ({ request }) => {
         const form = await superValidate(request, zod(classSchema));
         if (!form.valid) return fail(400, { form });
         
         // Create class in database
         // ...
         
         return { form };
       },
       updateClass: async ({ request }) => {
         // Similar implementation
       },
       deleteClass: async ({ request }) => {
         // Similar implementation
       },
       // Student actions
       // ...
     };
     ```

3. **Update ClassManager Component**:
   - Implement forms using Superforms
   - Add proper validation and error handling
   - Implement loading states for async operations

### 5.3. Text Formatting Implementation

1. **Title Centering**:
   - Implement functionality to center title nodes using alignment spacer nodes
   - Create a function to sandwich title nodes between two alignment spacer nodes

2. **Paragraph Indentation**:
   - Implement first paragraph indentation without adding a lineBreak
   - Implement new paragraph formatting with lineBreak and indent spacer nodes

3. **FormattingModal Enhancement**:
   - Update the FormattingModal component to include these formatting options
   - Implement commands for title formatting, paragraph indentation, and other formatting options

### 5.4. TextNode Schema Update

1. **Schema Update**:
   - Add 'footnote' to the nodeTypeEnum in `src/lib/schemas/textNode.ts`
   - Create a footnoteDataSchema for storing footnote-specific data
   - Update the nodeSchema to include footnoteData

2. **UI Implementation**:
   - Update the TextNode component to render footnotes differently
   - Add a footnote button to the EditModal (not FormattingModal)
   - Implement functionality to add and edit footnotes

3. **Editor Commands**:
   - Add a FOOTNOTE command to the EditorCommands
   - Implement functionality to toggle footnotes on nodes

### 5.5. Assignment Schema Component

1. **Schema Definition**:
   - Define the AssignmentSchema Zod schema
   - Include fields for essay type, specific requirements, and correction patterns

2. **UI Implementation**:
   - Create an AssignmentSchemaManager component
   - Implement forms for creating and editing assignment schemas using Superforms
   - Add functionality to enable/disable correction patterns

3. **Integration with Document Processing**:
   - Update the document processing flow to include assignment schema selection
   - Modify the Claude prompt to include assignment schema data
   - Implement validation to ensure a schema is selected before sending to Claude

4. **Correction Pattern Visibility**:
   - Implement functionality to toggle visibility of corrections
   - Add buttons to the toolbar (renamed from "title-container")
   - Update the TextNode component to respect visibility settings
