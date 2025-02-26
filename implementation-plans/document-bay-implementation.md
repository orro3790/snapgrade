# Document Bay Implementation Plan

## Overview

The Document Bay is a web interface component that displays all incoming documents from the Discord bot and allows teachers to organize, label, and assign them to students and classes. This implementation plan outlines the remaining tasks needed to improve the Document Bay UI and integrate it with the existing Snapgrade application.

## 1. Current State Analysis

We have successfully implemented:
- Basic Document Bay modal structure
- Server-side API endpoints for document, class, and student data
- Client-side components that properly fetch data from server endpoints
- Fixed the "process is not defined" error by moving Firebase Admin SDK operations to server-side

## 2. Remaining UI/UX Improvements

### 2.1. Fix Selector Functionality
- **Issue**: Class and student selectors are currently disabled
- **Solution**: 
  - Debug the API endpoints to ensure they return data correctly
  - Verify that the client components are properly handling the API responses
  - Add loading states and error handling to improve user experience

### 2.2. Update Document Status System
- **Issue**: Current status terms ("Collecting", etc.) don't reflect editing stages
- **Solution**:
  - Update document schema to use more intuitive status terms:
    ```typescript
    export enum DocumentStatus {
      unedited = 'unedited',
      edited = 'edited',
      completed = 'completed'
    }
    ```
  - Update all references to document status in the codebase
  - Ensure database queries and filters still work with the new status values

### 2.3. Improve UI Design Consistency
- **Issue**: Various UI elements don't match the app's aesthetic
- **Tasks**:
  1. Remove status pills from document list items
  2. Remove "Assign" button from batch actions
  3. Invert color scheme to match ClassManager (darker background, lighter cards)
  4. Add purple accent border for selected documents
  5. Restyle checkbox and date picker elements to match design system
  6. Simplify document details by removing redundant headers

### 2.4. Enhance Document Assignment UI
- **Issue**: Class and student values in document details are static text
- **Solution**:
  - Convert class and student fields in DocumentDetails to dropdown selectors
  - Create API endpoints for updating document assignments
  - Implement save functionality for assignment changes
  - Add loading and success states for assignment updates

### 2.5. Implement Document Deletion
- **Issue**: Delete button doesn't actually delete selected documents
- **Solution**:
  - Create or update API endpoint for document deletion
  - Implement confirmation dialog before deletion
  - Add proper error handling and success feedback
  - Update document list after successful deletion

## 3. Implementation Steps

### 3.1. Fix API Endpoints and Data Fetching

1. Debug and fix the API endpoints:
   ```typescript
   // src/routes/api/classes/list/+server.ts
   export const GET: RequestHandler = async ({ locals }) => {
     // Add logging to debug
     console.log('Fetching classes for user:', locals.uid);
     
     // Rest of the implementation...
   }
   ```

2. Update client components to handle API responses better:
   ```typescript
   // In DocumentFilters.svelte
   async function loadClasses() {
     isLoading = true;
     
     try {
       console.log('Fetching classes...');
       const response = await fetch('/api/classes/list');
       
       if (!response.ok) {
         throw new Error(`Error ${response.status}: ${response.statusText}`);
       }
       
       const data = await response.json();
       console.log('Classes received:', data.classes);
       classes = data.classes;
       
     } catch (err) {
       console.error('Error loading classes:', err);
     } finally {
       isLoading = false;
     }
   }
   ```

### 3.2. Update Document Status System

1. Update the document schema:
   ```typescript
   // src/lib/schemas/document.ts
   export enum DocumentStatus {
     unedited = 'unedited',
     edited = 'edited',
     completed = 'completed'
   }
   ```

2. Update the DocumentFilters component:
   ```svelte
   <!-- In DocumentFilters.svelte -->
   <div class="filter-group">
     <label for="status-filter">Status</label>
     <select 
       id="status-filter" 
       bind:value={selectedStatus}
       onchange={handleStatusChange}
     >
       <option value="">All Statuses</option>
       <option value="unedited">Unedited</option>
       <option value="edited">Edited</option>
       <option value="completed">Completed</option>
     </select>
   </div>
   ```

### 3.3. Improve UI Design

1. Update DocumentList.svelte to remove status pills and match ClassManager styling:
   ```svelte
   <!-- In DocumentList.svelte -->
   <div 
     class="document-item" 
     class:selected={selectedDocumentIds.includes(doc.id)}
     onclick={() => handleDocumentClick(doc)}
   >
     <div class="document-select">
       <input 
         type="checkbox" 
         checked={selectedDocumentIds.includes(doc.id)}
         onchange={(e) => handleSelectDocument(doc.id, e)}
         onclick={(e) => e.stopPropagation()}
         class="custom-checkbox"
       />
     </div>
     
     <div class="document-info">
       <div class="document-title">{doc.documentName}</div>
       <div class="document-meta">
         <span class="document-class">{doc.className}</span>
         <span class="document-student">{doc.studentName}</span>
         <span class="document-date">{doc.createdAt.toLocaleDateString()}</span>
       </div>
     </div>
   </div>
   
   <style>
     /* Updated styles */
     .document-list-container {
       background: var(--background-secondary);
     }
     
     .document-item {
       background: var(--background-primary);
       border: var(--border-width-thin) solid transparent;
     }
     
     .document-item.selected {
       border-color: var(--interactive-accent);
     }
     
     .custom-checkbox {
       /* Custom checkbox styling */
     }
   </style>
   ```

2. Remove the "Assign" button from batch actions:
   ```svelte
   <!-- In DocumentList.svelte -->
   <div class="action-buttons">
     <button 
       type="button" 
       class="batch-button"
       disabled={selectedDocumentIds.length === 0}
       onclick={() => onBatchAction('delete', selectedDocumentIds)}
     >
       Delete
     </button>
   </div>
   ```

3. Simplify DocumentDetails.svelte by removing redundant headers:
   ```svelte
   <!-- In DocumentDetails.svelte -->
   <div class="document-metadata">
     <div class="metadata-item">
       <span class="metadata-label">Name:</span>
       <span class="metadata-value">{document.documentName}</span>
     </div>
     
     <div class="metadata-item">
       <span class="metadata-label">Status:</span>
       <span class="metadata-value">{document.status}</span>
     </div>
     
     <div class="metadata-item">
       <span class="metadata-label">Created:</span>
       <span class="metadata-value">{formatDate(document.createdAt)}</span>
     </div>
     
     <div class="metadata-item">
       <span class="metadata-label">Updated:</span>
       <span class="metadata-value">{formatDate(document.updatedAt)}</span>
     </div>
     
     <div class="metadata-item">
       <span class="metadata-label">Class:</span>
       <select bind:value={selectedClassId} onchange={handleClassChange}>
         {#each classes as classItem}
           <option value={classItem.id}>{classItem.name}</option>
         {/each}
       </select>
     </div>
     
     <div class="metadata-item">
       <span class="metadata-label">Student:</span>
       <select bind:value={selectedStudentId} onchange={handleStudentChange}>
         {#each students as student}
           <option value={student.id}>{student.name}</option>
         {/each}
       </select>
     </div>
   </div>
   ```

### 3.4. Implement Document Assignment UI

1. Create an API endpoint for updating document assignments:
   ```typescript
   // src/routes/api/documents/update/+server.ts
   import { json } from '@sveltejs/kit';
   import type { RequestHandler } from './$types';
   import { adminDb } from '$lib/firebase/admin';
   
   export const POST: RequestHandler = async ({ request, locals }) => {
     if (!locals.uid) {
       return json({ error: 'Unauthorized' }, { status: 401 });
     }
     
     try {
       const { documentId, classId, className, studentId, studentName } = await request.json();
       
       await adminDb.collection('documents').doc(documentId).update({
         classId,
         className,
         studentId,
         studentName,
         updatedAt: new Date()
       });
       
       return json({ success: true });
     } catch (error) {
       console.error('Error updating document:', error);
       return json({ error: 'Failed to update document' }, { status: 500 });
     }
   };
   ```

2. Update DocumentDetails.svelte to fetch classes and students:
   ```typescript
   // In DocumentDetails.svelte
   // Add state for classes and students
   let classes = $state<Class[]>([]);
   let students = $state<Student[]>([]);
   let selectedClassId = $state(document.classId || '');
   let selectedStudentId = $state(document.studentId || '');
   let isSaving = $state(false);
   
   // Load classes on mount
   $effect(() => {
     loadClasses();
   });
   
   // Load students when class changes
   $effect(() => {
     if (selectedClassId) {
       loadStudents(selectedClassId);
     } else {
       students = [];
     }
   });
   
   async function loadClasses() {
     try {
       const response = await fetch('/api/classes/list');
       if (!response.ok) throw new Error('Failed to load classes');
       const data = await response.json();
       classes = data.classes;
     } catch (err) {
       console.error('Error loading classes:', err);
     }
   }
   
   async function loadStudents(classId: string) {
     try {
       const response = await fetch('/api/students/list', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ classId })
       });
       if (!response.ok) throw new Error('Failed to load students');
       const data = await response.json();
       students = data.students;
     } catch (err) {
       console.error('Error loading students:', err);
     }
   }
   
   async function saveAssignment() {
     isSaving = true;
     try {
       const selectedClass = classes.find(c => c.id === selectedClassId);
       const selectedStudent = students.find(s => s.id === selectedStudentId);
       
       const response = await fetch('/api/documents/update', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           documentId: document.id,
           classId: selectedClassId,
           className: selectedClass?.name || '',
           studentId: selectedStudentId,
           studentName: selectedStudent?.name || ''
         })
       });
       
       if (!response.ok) throw new Error('Failed to update document');
       
       // Update local document data
       document.classId = selectedClassId;
       document.className = selectedClass?.name || '';
       document.studentId = selectedStudentId;
       document.studentName = selectedStudent?.name || '';
       
     } catch (err) {
       console.error('Error saving assignment:', err);
     } finally {
       isSaving = false;
     }
   }
   ```

### 3.5. Implement Document Deletion

1. Create or update API endpoint for document deletion:
   ```typescript
   // src/routes/api/documents/batch/+server.ts
   import { json } from '@sveltejs/kit';
   import type { RequestHandler } from './$types';
   import { adminDb } from '$lib/firebase/admin';
   
   export const POST: RequestHandler = async ({ request, locals }) => {
     if (!locals.uid) {
       return json({ error: 'Unauthorized' }, { status: 401 });
     }
     
     try {
       const { action, documentIds } = await request.json();
       
       if (action === 'delete') {
         const batch = adminDb.batch();
         
         documentIds.forEach(id => {
           const docRef = adminDb.collection('documents').doc(id);
           batch.delete(docRef);
         });
         
         await batch.commit();
         
         return json({ 
           success: true, 
           message: `Successfully deleted ${documentIds.length} document(s)` 
         });
       }
       
       return json({ error: 'Unsupported action' }, { status: 400 });
     } catch (error) {
       console.error('Error processing batch action:', error);
       return json({ error: 'Failed to process documents' }, { status: 500 });
     }
   };
   ```

2. Update DocumentList.svelte to handle deletion:
   ```typescript
   // In DocumentList.svelte
   async function handleBatchAction(action: string, documentIds: string[]) {
     if (action === 'delete') {
       if (!confirm(`Are you sure you want to delete ${documentIds.length} document(s)?`)) {
         return;
       }
     }
     
     isProcessing = true;
     
     try {
       const response = await fetch('/api/documents/batch', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({
           action,
           documentIds
         })
       });
       
       if (!response.ok) {
         throw new Error(`Error ${response.status}: ${response.statusText}`);
       }
       
       const result = await response.json();
       console.log(result.message);
       
       // Refresh document list
       loadDocuments();
       
       // Clear selection
       selectedDocumentIds = [];
       
     } catch (err) {
       console.error(`Error performing ${action}:`, err);
     } finally {
       isProcessing = false;
     }
   }
   ```

## 4. Testing Plan

1. **API Endpoint Testing**:
   - Test each API endpoint with valid and invalid data
   - Verify authentication and authorization checks
   - Ensure proper error handling

2. **UI Component Testing**:
   - Test document filtering functionality
   - Verify document selection and batch operations
   - Test document assignment updates
   - Verify document deletion

3. **Integration Testing**:
   - Test end-to-end workflow from document upload to editing
   - Verify integration with Discord bot
   - Test with various document types and sizes

## 5. Implementation Timeline

1. **Day 1**: Fix API endpoints and data fetching issues
2. **Day 2**: Update document status system and UI design
3. **Day 3**: Implement document assignment UI and deletion functionality
4. **Day 4**: Testing and refinement

## 6. Future Enhancements

1. **Bulk Assignment**: Add ability to assign multiple documents at once
2. **Advanced Filtering**: Implement more advanced filtering options
3. **Document Preview**: Enhance document preview with formatting
4. **Real-time Updates**: Add Firestore listeners for live updates
5. **Export Options**: Add ability to export documents in various formats