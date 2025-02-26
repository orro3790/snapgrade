# Document Bay Implementation Plan

## Overview

The Document Bay is a web interface component that displays all incoming documents from the Discord bot and allows teachers to organize, label, and assign them to students and classes. This implementation plan outlines the steps needed to create the Document Bay UI and integrate it with the existing Snapgrade application.

## 1. Current State Analysis

Based on the code review, we already have:

- A modal system with a store (`modalStore.svelte.ts`) that manages modal state
- A sidebar (`Sidebar.svelte`) with navigation items that trigger modals
- The ClassManager component that provides a good reference for modal design
- Form submissions handled via actions in `+page.server.ts`
- Document schemas and related types

## 2. Implementation Requirements

The Document Bay UI needs to:

1. Display documents uploaded via Discord bot
2. Allow filtering by class, student, and status
3. Support batch operations for efficient organization
4. Provide document previews
5. Include direct links to the editor
6. Follow the established design system

## 3. Implementation Steps

### 3.1. Update Modal Schema and Store

First, we need to add the Document Bay to our modal system:

1. Update `src/lib/stores/modalStore.svelte.ts` to include the new modal type:

```typescript
export const modalTypeSchema = z.enum([
  'login',
  'keyboard',
  'upload',
  'classManager',
  'stagingArea',
  'documentLoad',
  'discordSettings',
  'documentBay' // Add this new type
]);
```

2. Update `modalDataSchema` if needed to include any Document Bay specific data:

```typescript
export const modalDataSchema = z
  .object({
    documentToLoad: z.string().optional(),
    documentName: z.string().optional(),
    showConfirmation: z.boolean().optional(),
    confirmationMessage: z.string().optional(),
    // Add Document Bay specific fields if needed
    documentFilters: z.object({
      classId: z.string().optional(),
      studentId: z.string().optional(),
      status: z.enum(['COLLECTING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
      dateRange: z.object({
        start: z.date().optional(),
        end: z.date().optional()
      }).optional()
    }).optional()
  })
  .and(
    z
      .object({
        isConnected: z.boolean(),
        status: z.enum(['active', 'inactive', 'suspended']).nullable()
      })
      .partial()
  )
  .optional();
```

### 3.2. Update Sidebar Component

Add a new navigation item for the Document Bay:

1. Create a new icon component for Document Bay (or use an existing one like `Files.svelte`)
2. Add the Document Bay to the navigation items in `Sidebar.svelte`:

```typescript
const navItems: NavItem[] = [
  { id: 'home', label: 'Dashboard', Icon: Home, group: 'base' },
  { id: 'how-to-use', label: 'How to use', Icon: HowTo, group: 'base' },
  { id: 'files', label: 'File Manager', Icon: Files, group: 'authenticated' },
  { id: 'direct-upload', label: 'Upload Document', Icon: Upload, group: 'authenticated' },
  { id: 'staging-area', label: 'Staging Area', Icon: StagingArea, group: 'authenticated' },
  { id: 'document-bay', label: 'Document Bay', Icon: Files, group: 'authenticated' }, // Add this new item
  { id: 'analytics', label: 'Analytics', Icon: Analytics, group: 'authenticated' },
  { id: 'class-manager', label: 'Class Manager', Icon: ClassManager, group: 'authenticated' },
  { id: 'settings', label: 'Settings', Icon: Settings, group: 'authenticated' }
];
```

3. Update the click handler to open the Document Bay modal:

```typescript
function handleNavClick(itemId: string) {
  activeItem = itemId;
  if (sidebarStore.state.isMobile) {
    sidebarStore.toggle();
  }
  if (itemId === 'how-to-use') {
    modalStore.open('keyboard');
  } else if (itemId === 'direct-upload') {
    modalStore.open('upload');
  } else if (itemId === 'class-manager') {
    modalStore.open('classManager');
  } else if (itemId === 'staging-area') {
    modalStore.open('stagingArea');
  } else if (itemId === 'document-bay') {
    modalStore.open('documentBay'); // Add this new case
  } else if (itemId === 'settings') {
    modalStore.open('discordSettings', $discordStore);
  }
}
```

### 3.3. Create Document Bay Component

Create the main Document Bay component:

1. Create `src/routes/DocumentBay.svelte` following the ClassManager pattern:

```svelte
<!-- File: src/routes/DocumentBay.svelte -->
<script lang="ts">
  import { modalStore } from '$lib/stores/modalStore.svelte';
  import type { Document } from '$lib/schemas/document';
  import type { DocumentSession } from '$lib/schemas/documentSession';
  import type { SuperValidated } from 'sveltekit-superforms';
  
  // Props
  let { data } = $props<{
    data: {
      documentForm: SuperValidated<any>;
      user: App.Locals['user'];
      uid: App.Locals['uid'];
    };
  }>();
  
  import DocumentList from './DocumentList.svelte';
  import DocumentDetails from './DocumentDetails.svelte';
  import DocumentFilters from './DocumentFilters.svelte';
  
  // State
  let selectedDocument = $state<Document | null>(null);
  let isProcessing = $state(false);
  let filters = $state({
    classId: '',
    studentId: '',
    status: '',
    dateRange: {
      start: null,
      end: null
    }
  });
  
  function closeModal() {
    modalStore.close();
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }
  
  function handleDocumentSelect(document: Document) {
    selectedDocument = document;
    isProcessing = false;
  }
  
  function handleFilterChange(newFilters) {
    filters = { ...filters, ...newFilters };
  }
  
  function handleBatchAction(action: string, documentIds: string[]) {
    // Handle batch actions like assign, delete, etc.
    isProcessing = true;
    // Implement batch action logic
  }
</script>

<!-- Backdrop -->
<div
  class="modal-backdrop"
  role="presentation"
  onclick={closeModal}
  onkeydown={handleKeydown}
></div>

<!-- Modal -->
<div class="document-bay-modal" role="dialog" aria-labelledby="modal-title">
  <div class="modal-header">
    <h1 id="modal-title">Document Bay</h1>
    <button
      type="button"
      class="close-button"
      onclick={closeModal}
      aria-label="Close document bay"
    >
      ×
    </button>
  </div>

  <div class="modal-content">
    <!-- Column 1: Document Filters -->
    <DocumentFilters
      onFilterChange={handleFilterChange}
      user={data.user}
      uid={data.uid}
    />

    <!-- Column 2: Document List -->
    <DocumentList
      onDocumentSelect={handleDocumentSelect}
      onBatchAction={handleBatchAction}
      filters={filters}
      user={data.user}
      uid={data.uid}
    />

    <!-- Column 3: Document Details -->
    {#if selectedDocument}
      <DocumentDetails
        document={selectedDocument}
        isProcessing={isProcessing}
      />
    {/if}
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--background-modifier-cover);
    z-index: var(--z-modal);
    backdrop-filter: blur(2px);
  }

  .document-bay-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--background-secondary);
    border-radius: var(--radius-lg);
    border: var(--border-width-thin) solid var(--background-modifier-border);
    box-shadow: var(--shadow-xl);
    z-index: var(--z-modal);
    width: 90%;
    max-width: 1200px;
    height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-4);
    border-bottom: var(--border-width-thin) solid var(--background-modifier-border);
    background: var(--background-primary);
  }

  h1 {
    margin: 0;
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-medium);
    color: var(--text-normal);
  }

  .close-button {
    background: none;
    border: none;
    font-size: var(--font-size-2xl);
    cursor: pointer;
    padding: var(--spacing-2);
    color: var(--text-muted);
    transition: var(--transition-all);
    line-height: var(--line-height-none);
    border-radius: var(--radius-base);
  }

  .close-button:hover {
    color: var(--text-normal);
    background: var(--background-modifier-hover);
  }

  .modal-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  /* Column transition animations */
  :global(.document-bay-modal .document-details-container) {
    animation: slideIn var(--transition-duration-300) var(--transition-timing-ease-out);
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
</style>
```

### 3.4. Create Supporting Components

Break down the UI into smaller, reusable components:

1. Create `src/routes/DocumentList.svelte`:

```svelte
<!-- File: src/routes/DocumentList.svelte -->
<script lang="ts">
  import { adminDb } from '$lib/firebase/admin';
  import type { Document } from '$lib/schemas/document';
  import { DocumentStatus } from '$lib/schemas/document';
  import { ensureDate } from '$lib/utils/dateUtils';
  
  // Props
  let { filters, onDocumentSelect, onBatchAction, user, uid } = $props<{
    filters: any;
    onDocumentSelect: (document: Document) => void;
    onBatchAction: (action: string, documentIds: string[]) => void;
    user: any;
    uid: string;
  }>();
  
  // State
  let documents = $state<Document[]>([]);
  let selectedDocumentIds = $state<string[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  
  // Load documents based on filters
  $effect(() => {
    loadDocuments();
  });
  
  async function loadDocuments() {
    isLoading = true;
    error = null;
    
    try {
      let query = adminDb.collection('documents')
        .where('userId', '==', uid);
      
      // Apply filters
      if (filters.classId) {
        query = query.where('classId', '==', filters.classId);
      }
      
      if (filters.studentId) {
        query = query.where('studentId', '==', filters.studentId);
      }
      
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }
      
      // Date range filtering would be applied after fetching
      
      const snapshot = await query.orderBy('createdAt', 'desc').get();
      
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: ensureDate(data.createdAt),
          updatedAt: ensureDate(data.updatedAt)
        } as Document;
      });
      
      // Apply date range filter if needed
      if (filters.dateRange?.start || filters.dateRange?.end) {
        const start = filters.dateRange.start ? new Date(filters.dateRange.start) : new Date(0);
        const end = filters.dateRange.end ? new Date(filters.dateRange.end) : new Date();
        
        documents = docs.filter(doc => {
          const date = doc.createdAt;
          return date >= start && date <= end;
        });
      } else {
        documents = docs;
      }
      
    } catch (err) {
      console.error('Error loading documents:', err);
      error = 'Failed to load documents. Please try again.';
    } finally {
      isLoading = false;
    }
  }
  
  function handleSelectAll(event) {
    if (event.target.checked) {
      selectedDocumentIds = documents.map(doc => doc.id);
    } else {
      selectedDocumentIds = [];
    }
  }
  
  function handleSelectDocument(docId: string, event) {
    if (event.target.checked) {
      selectedDocumentIds = [...selectedDocumentIds, docId];
    } else {
      selectedDocumentIds = selectedDocumentIds.filter(id => id !== docId);
    }
  }
  
  function handleDocumentClick(doc: Document) {
    onDocumentSelect(doc);
  }
</script>

<div class="document-list-container">
  <div class="document-list-header">
    <h2>Documents</h2>
    
    <!-- Batch actions -->
    <div class="batch-actions">
      <label class="select-all">
        <input 
          type="checkbox" 
          checked={selectedDocumentIds.length === documents.length && documents.length > 0}
          indeterminate={selectedDocumentIds.length > 0 && selectedDocumentIds.length < documents.length}
          disabled={documents.length === 0}
          on:change={handleSelectAll}
        />
        <span>Select All</span>
      </label>
      
      <div class="action-buttons">
        <button 
          type="button" 
          class="batch-button"
          disabled={selectedDocumentIds.length === 0}
          on:click={() => onBatchAction('assign', selectedDocumentIds)}
        >
          Assign
        </button>
        <button 
          type="button" 
          class="batch-button"
          disabled={selectedDocumentIds.length === 0}
          on:click={() => onBatchAction('delete', selectedDocumentIds)}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
  
  {#if isLoading}
    <div class="loading-state">Loading documents...</div>
  {:else if error}
    <div class="error-state">{error}</div>
  {:else if documents.length === 0}
    <div class="empty-state">
      <p>No documents found matching your filters.</p>
    </div>
  {:else}
    <div class="document-items">
      {#each documents as doc}
        <div 
          class="document-item" 
          class:selected={selectedDocumentIds.includes(doc.id)}
          on:click={() => handleDocumentClick(doc)}
        >
          <div class="document-select">
            <input 
              type="checkbox" 
              checked={selectedDocumentIds.includes(doc.id)}
              on:change={(e) => handleSelectDocument(doc.id, e)}
              on:click={(e) => e.stopPropagation()}
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
          
          <div class="document-status">
            <span class="status-badge status-{doc.status.toLowerCase()}">{doc.status}</span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .document-list-container {
    width: 350px;
    border-right: var(--border-width-thin) solid var(--background-modifier-border);
    display: flex;
    flex-direction: column;
    background: var(--background-primary);
  }
  
  .document-list-header {
    padding: var(--spacing-4);
    border-bottom: var(--border-width-thin) solid var(--background-modifier-border);
  }
  
  h2 {
    margin: 0 0 var(--spacing-2) 0;
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-medium);
    color: var(--text-normal);
  }
  
  .batch-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: var(--spacing-2);
  }
  
  .select-all {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    cursor: pointer;
  }
  
  .action-buttons {
    display: flex;
    gap: var(--spacing-2);
  }
  
  .batch-button {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-base);
    background: var(--background-alt);
    border: none;
    color: var(--text-normal);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: var(--transition-all);
  }
  
  .batch-button:hover:not(:disabled) {
    background: var(--background-modifier-hover);
  }
  
  .batch-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .document-items {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-2);
  }
  
  .document-item {
    display: flex;
    align-items: center;
    padding: var(--spacing-2);
    border-radius: var(--radius-base);
    margin-bottom: var(--spacing-2);
    background: var(--background-alt);
    cursor: pointer;
    transition: var(--transition-all);
  }
  
  .document-item:hover {
    background: var(--background-modifier-hover);
  }
  
  .document-item.selected {
    background: var(--interactive-accent-secondary);
  }
  
  .document-select {
    margin-right: var(--spacing-2);
  }
  
  .document-info {
    flex: 1;
    min-width: 0;
  }
  
  .document-title {
    font-weight: var(--font-weight-medium);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .document-meta {
    display: flex;
    gap: var(--spacing-2);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    margin-top: var(--spacing-1);
  }
  
  .document-status {
    margin-left: var(--spacing-2);
  }
  
  .status-badge {
    display: inline-block;
    padding: var(--spacing-0-5) var(--spacing-1);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    text-transform: uppercase;
  }
  
  .status-collecting {
    background: var(--status-info);
    color: var(--text-on-accent);
  }
  
  .status-processing {
    background: var(--status-warning);
    color: var(--background-primary);
  }
  
  .status-completed {
    background: var(--status-success);
    color: var(--text-on-accent);
  }
  
  .status-failed {
    background: var(--status-error);
    color: var(--text-on-accent);
  }
  
  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    color: var(--text-muted);
    text-align: center;
    padding: var(--spacing-4);
  }
  
  .error-state {
    color: var(--status-error);
  }
</style>
```

2. Create `src/routes/DocumentFilters.svelte`:

```svelte
<!-- File: src/routes/DocumentFilters.svelte -->
<script lang="ts">
  import { adminDb } from '$lib/firebase/admin';
  import type { Class } from '$lib/schemas/class';
  import type { Student } from '$lib/schemas/student';
  import { DocumentStatus } from '$lib/schemas/document';
  
  // Props
  let { onFilterChange, user, uid } = $props<{
    onFilterChange: (filters: any) => void;
    user: any;
    uid: string;
  }>();
  
  // State
  let classes = $state<Class[]>([]);
  let students = $state<Student[]>([]);
  let selectedClassId = $state('');
  let selectedStudentId = $state('');
  let selectedStatus = $state('');
  let startDate = $state('');
  let endDate = $state('');
  let isLoading = $state(true);
  
  // Load classes and students
  $effect(() => {
    loadClasses();
  });
  
  $effect(() => {
    if (selectedClassId) {
      loadStudents(selectedClassId);
    } else {
      students = [];
    }
  });
  
  async function loadClasses() {
    isLoading = true;
    
    try {
      const snapshot = await adminDb.collection('classes')
        .where('userId', '==', uid)
        .where('status', '==', 'active')
        .get();
      
      classes = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Class));
      
    } catch (err) {
      console.error('Error loading classes:', err);
    } finally {
      isLoading = false;
    }
  }
  
  async function loadStudents(classId: string) {
    try {
      const snapshot = await adminDb.collection('students')
        .where('classId', '==', classId)
        .where('status', '==', 'active')
        .get();
      
      students = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Student));
      
    } catch (err) {
      console.error('Error loading students:', err);
    }
  }
  
  function handleClassChange(event) {
    selectedClassId = event.target.value;
    selectedStudentId = '';
    applyFilters();
  }
  
  function handleStudentChange(event) {
    selectedStudentId = event.target.value;
    applyFilters();
  }
  
  function handleStatusChange(event) {
    selectedStatus = event.target.value;
    applyFilters();
  }
  
  function handleDateChange() {
    applyFilters();
  }
  
  function applyFilters() {
    const filters = {
      classId: selectedClassId,
      studentId: selectedStudentId,
      status: selectedStatus,
      dateRange: {
        start: startDate ? new Date(startDate) : null,
        end: endDate ? new Date(endDate) : null
      }
    };
    
    onFilterChange(filters);
  }
  
  function clearFilters() {
    selectedClassId = '';
    selectedStudentId = '';
    selectedStatus = '';
    startDate = '';
    endDate = '';
    applyFilters();
  }
</script>

<div class="filters-container">
  <div class="filters-header">
    <h2>Filters</h2>
    <button type="button" class="clear-button" on:click={clearFilters}>
      Clear All
    </button>
  </div>
  
  <div class="filters-content">
    <div class="filter-group">
      <label for="class-filter">Class</label>
      <select 
        id="class-filter" 
        bind:value={selectedClassId}
        on:change={handleClassChange}
        disabled={isLoading || classes.length === 0}
      >
        <option value="">All Classes</option>
        {#each classes as classItem}
          <option value={classItem.id}>{classItem.name}</option>
        {/each}
      </select>
    </div>
    
    <div class="filter-group">
      <label for="student-filter">Student</label>
      <select 
        id="student-filter" 
        bind:value={selectedStudentId}
        on:change={handleStudentChange}
        disabled={!selectedClassId || students.length === 0}
      >
        <option value="">All Students</option>
        {#each students as student}
          <option value={student.id}>{student.name}</option>
        {/each}
      </select>
    </div>
    
    <div class="filter-group">
      <label for="status-filter">Status</label>
      <select 
        id="status-filter" 
        bind:value={selectedStatus}
        on:change={handleStatusChange}
      >
        <option value="">All Statuses</option>
        <option value="COLLECTING">Collecting</option>
        <option value="PROCESSING">Processing</option>
        <option value="COMPLETED">Completed</option>
        <option value="FAILED">Failed</option>
      </select>
    </div>
    
    <div class="filter-group">
      <label for="start-date">From Date</label>
      <input 
        type="date" 
        id="start-date" 
        bind:value={startDate}
        on:change={handleDateChange}
      />
    </div>
    
    <div class="filter-group">
      <label for="end-date">To Date</label>
      <input 
        type="date" 
        id="end-date" 
        bind:value={endDate}
        on:change={handleDateChange}
      />
    </div>
  </div>
</div>

<style>
  .filters-container {
    width: 250px;
    border-right: var(--border-width-thin) solid var(--background-modifier-border);
    background: var(--background-primary);
    display: flex;
    flex-direction: column;
  }
  
  .filters-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-4);
    border-bottom: var(--border-width-thin) solid var(--background-modifier-border);
  }
  
  h2 {
    margin: 0;
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-medium);
    color: var(--text-normal);
  }
  
  .clear-button {
    background: none;
    border: none;
    color: var(--text-accent);
    font-size: var(--font-size-sm);
    cursor: pointer;
    padding: 0;
  }
  
  .clear-button:hover {
    text-decoration: underline;
  }
  
  .filters-content {
    padding: var(--spacing-4);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    overflow-y: auto;
  }
  
  .filter-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
  }
  
  label {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }
  
  select,
  input[type="date"] {
    padding: var(--spacing-2);
    background: var(--background-alt);
    border: var(--border-width-thin) solid var(--background-modifier-border);
    border-radius: var(--radius-base);
    color: var(--text-normal);
    font-size: var(--font-size-sm);
    width: 100%;
  }
  
  select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
```

3. Create `src/routes/DocumentDetails.svelte`:

```svelte
<!-- File: src/routes/DocumentDetails.svelte -->
<script lang="ts">
  import type { Document } from '$lib/schemas/document';
  
  // Props
  let { document, isProcessing } = $props<{
    document: Document;
    isProcessing: boolean;
  }>();
  
  function formatDate(date: Date) {
    return date.toLocaleString();
  }
  
  function openInEditor() {
    window.location.href = `/editor?documentId=${document.id}`;
  }
</script>

<div class="document-details-container">
  <div class="details-header">
    <h2>Document Details</h2>
    
    <div class="action-buttons">
      <button 
        type="button" 
        class="action-button primary"
        on:click={openInEditor}
        disabled={isProcessing}
      >
        Open in Editor
      </button>
    </div>
  </div>
  
  <div class="details-content">
    {#if isProcessing}
      <div class="processing-state">
        <p>Processing document...</p>
      </div>
    {:else}
      <div class="document-metadata">
        <div class="metadata-group">
          <h3>Document Information</h3>
          
          <div class="metadata-item">
            <span class="metadata-label">Name:</span>
            <span class="metadata-value">{document.documentName}</span>
          </div>
          
          <div class="metadata-item">
            <span class="metadata-label">Status:</span>
            <span class="metadata-value status-{document.status.toLowerCase()}">{document.status}</span>
          </div>
          
          <div class="metadata-item">
            <span class="metadata-label">Created:</span>
            <span class="metadata-value">{formatDate(document.createdAt)}</span>
          </div>
          
          <div class="metadata-item">
            <span class="metadata-label">Updated:</span>
            <span class="metadata-value">{formatDate(document.updatedAt)}</span>
          </div>
        </div>
        
        <div class="metadata-group">
          <h3>Assignment</h3>
          
          <div class="metadata-item">
            <span class="metadata-label">Class:</span>
            <span class="metadata-value">{document.className}</span>
          </div>
          
          <div class="metadata-item">
            <span class="metadata-label">Student:</span>
            <span class="metadata-value">{document.studentName}</span>
          </div>
        </div>
        
        {#if document.sourceType === 'llmwhisperer'}
          <div class="metadata-group">
            <h3>Source Information</h3>
            
            <div class="metadata-item">
              <span class="metadata-label">Source:</span>
              <span class="metadata-value">Discord Bot</span>
            </div>
            
            {#if document.sourceMetadata?.llmProcessed}
              <div class="metadata-item">
                <span class="metadata-label">Processed:</span>
                <span class="metadata-value">{document.sourceMetadata.llmProcessedAt ? formatDate(document.sourceMetadata.llmProcessedAt) : 'Yes'}</span>
              </div>
            {/if}
          </div>
        {/if}
      </div>
      
      <div class="document-preview">
        <h3>Preview</h3>
        <div class="preview-content">
          {#if document.documentBody}
            <p class="preview-text">{document.documentBody.substring(0, 500)}...</p>
          {:else}
            <p class="preview-empty">No content available</p>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .document-details-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--background-secondary);
    overflow: hidden;
  }
  
  .details-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-4);
    border-bottom: var(--border-width-thin) solid var(--background-modifier-border);
    background: var(--background-primary);
  }
  
  h2 {
    margin: 0;
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-medium);
    color: var(--text-normal);
  }
  
  .action-buttons {
    display: flex;
    gap: var(--spacing-2);
  }
  
  .action-button {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-base);
    border: none;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: var(--transition-all);
  }
  
  .action-button.primary {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }
  
  .action-button.primary:hover:not(:disabled) {
    background: var(--interactive-accent-hover);
  }
  
  .action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .details-content {
    flex: 1;
    padding: var(--spacing-4);
    overflow-y: auto;
  }
  
  .processing-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    color: var(--text-muted);
  }
  
  .document-metadata {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
    margin-bottom: var(--spacing-6);
  }
  
  .metadata-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }
  
  h3 {
    margin: 0 0 var(--spacing-2) 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-medium);
    color: var(--text-normal);
    border-bottom: var(--border-width-thin) solid var(--background-modifier-border);
    padding-bottom: var(--spacing-2);
  }
  
  .metadata-item {
    display: flex;
    align-items: baseline;
    gap: var(--spacing-2);
  }
  
  .metadata-label {
    font-weight: var(--font-weight-medium);
    color: var(--text-muted);
    width: 80px;
    flex-shrink: 0;
  }
  
  .metadata-value {
    color: var(--text-normal);
  }
  
  .status-collecting,
  .status-processing,
  .status-completed,
  .status-failed {
    display: inline-block;
    padding: var(--spacing-0-5) var(--spacing-1);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    text-transform: uppercase;
  }
  
  .status-collecting {
    background: var(--status-info);
    color: var(--text-on-accent);
  }
  
  .status-processing {
    background: var(--status-warning);
    color: var(--background-primary);
  }
  
  .status-completed {
    background: var(--status-success);
    color: var(--text-on-accent);
  }
  
  .status-failed {
    background: var(--status-error);
    color: var(--text-on-accent);
  }
  
  .document-preview {
    background: var(--background-alt);
    border-radius: var(--radius-base);
    padding: var(--spacing-4);
  }
  
  .preview-content {
    max-height: 300px;
    overflow-y: auto;
    margin-top: var(--spacing-2);
  }
  
  .preview-text {
    white-space: pre-wrap;
    font-family: 'Geist', monospace;
    line-height: var(--line-height-relaxed);
  }
  
  .preview-empty {
    color: var(--text-muted);
    font-style: italic;
  }
</style>
```

### 3.5. Update Server Actions

Add necessary server actions to handle Document Bay operations:

1. Update `+page.server.ts` to include actions for document management:

```typescript
// Add to existing actions
manageDocuments: async ({ request, fetch, cookies }) => {
  const data = await request.json();
  const { action, documentIds } = data;
  
  try {
    const sessionCookie = cookies.get('session');
    if (!sessionCookie) {
      return fail(401, {
        error: 'You must be logged in to manage documents'
      });
    }
    
    const response = await fetch(`/api/documents/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session=${sessionCookie}`
      },
      body: JSON.stringify({
        action,
        documentIds
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return fail(response.status, {
        error: result.message || 'Failed to process documents'
      });
    }
    
    return {
      success: true,
      message: `Successfully ${action}ed ${documentIds.length} document(s)`
    };
  } catch (error) {
    console.error('Document management error:', error);
    return fail(500, {
      error: 'An unexpected error occurred'
    });
  }
}
```

### 3.6. Update Page Load Function

Update the load function in `+page.server.ts` to include document data:

```typescript
export const load: PageServerLoad = async ({ locals, url }) => {
  const [classForm, studentForm, documentForm] = await Promise.all([
    superValidate(zod(classSchema)),
    superValidate(zod(studentSchema)),
    superValidate(zod(createDocumentSchema))
  ]);
  
  // Get Discord connection status if user is logged in
  let discordStatus = null;
  let isConnected = false;
  
  if (locals.user) {
    const mappingQuery = await adminDb
      .collection('discord_mappings')
      .where('firebaseUid', '==', locals.user.id)
      .limit(1)
      .get();
    
    isConnected = !mappingQuery.empty;
    discordStatus = isConnected ? mappingQuery.docs[0].data().status : null;
  }
  
  // Check for modal parameter
  const modal = url.searchParams.get('modal');
  const error = url.searchParams.get('error');
  const discord = url.searchParams.get('discord');
  
  return {
    user: locals.user || null,
    settings: locals.settings || null,
    uid: locals.uid || null,
    classForm,
    studentForm,
    documentForm,
    discord: {
      isConnected,
      status: discordStatus
    },
    modal: modal === 'discordSettings' ? {
      type: 'discordSettings' as const,
      error,
      discord
    } : null
  };
};
```

## 4. Integration with Discord Bot

The Document Bay UI will integrate with the Discord bot by:

1. Displaying documents uploaded via the Discord bot
2. Showing document status (COLLECTING, PROCESSING, COMPLETED, FAILED)
3. Allowing teachers to assign documents to classes and students
4. Providing direct links to the editor for document correction

## 5. Implementation Timeline

1. **Day 1**: Update modal schema and store files, add sidebar entry
2. **Day 2**: Create main DocumentBay component and layout
3. **Day 3**: Implement document filtering and list view
4. **Day 4**: Add document preview and individual actions
5. **Day 5**: Implement batch operations and server actions
6. **Day 6**: Testing and refinement

## 6. Technical Considerations

1. **Performance**: Implement pagination for large document collections
2. **Real-time Updates**: Consider using Firestore listeners for live updates
3. **Error Handling**: Implement robust error handling for failed operations
4. **Accessibility**: Ensure all components follow WCAG guidelines
5. **Mobile Responsiveness**: Design for both desktop and mobile views

## 7. Future Enhancements

1. **Real-time Updates**: Add Firestore listeners to update document status in real-time
2. **Batch Processing**: Enhance batch operations to include more actions
3. **Document Preview**: Improve document preview with formatting and highlighting
4. **Export Options**: Add ability to export documents in various formats
5. **Notifications**: Add notifications for document status changes