# Document Management Refactoring Plan

## Current Issues

1. **Prop Drilling**: Data is passed through multiple components via props
2. **Inconsistent State Management**: Mix of local state and store usage
3. **Complex Component Logic**: Multiple $effect blocks with overlapping concerns
4. **Poor Null Handling**: Insufficient checks for null/undefined values
5. **Legacy Code**: Outdated patterns mixed with newer Svelte 5 runes

## Refactoring Goals

1. **Centralized State Management**: Use the document store for all document-related state
2. **Simplified Component Logic**: Reduce effect blocks and clarify component responsibilities
3. **Graceful Null Handling**: Properly handle null documents throughout the UI
4. **Consistent Patterns**: Use Svelte 5 runes consistently
5. **Clear Ownership**: Define which components own what data

## Implementation Plan

### 1. Document Store Enhancements

The existing document store is well-structured but needs a few enhancements:

- Add filter management directly in the store
- Ensure proper handling of document selection
- Add methods for class and student loading to centralize data fetching

```typescript
// Enhanced document store with additional functionality
const documentState = $state({
  documents: [] as Document[],
  selectedDocument: null as Document | null,
  isLoading: false,
  isProcessing: false,
  error: null as string | null,
  
  // Add filter state directly to the store
  filters: {
    classId: '',
    studentId: '',
    status: '',
    dateRange: {
      start: null as Date | null,
      end: null as Date | null
    }
  },
  
  // Related data
  classes: [] as Class[],
  students: [] as Student[]
});
```

Additional methods to add:
- `initializeWithUser(user, uid)`: Set up the store with user data
- `loadClassesForUser(uid)`: Load classes for the current user
- `loadStudentsForClass(classId)`: Load students for a selected class
- `setFilters(newFilters)`: Update and apply filters
- `selectDocumentById(id)`: Select a document by ID with proper null checks

### 2. DocumentBay Component Refactoring

- Remove local document state
- Use document store for all document operations
- Simplify to be a layout container only

```svelte
<script lang="ts">
  import { documentStore } from '$lib/stores/documentStore.svelte';
  import DocumentList from './DocumentList.svelte';
  import DocumentDetails from './DocumentDetails.svelte';
  import DocumentFilters from './DocumentFilters.svelte';
  
  // Props
  let { data } = $props<{
    data: {
      user: App.Locals['user'];
      uid: App.Locals['uid'];
    };
  }>();
  
  // Initialize store with user data
  $effect(() => {
    if (data.user && data.uid) {
      documentStore.initializeWithUser(data.user, data.uid);
    }
  });
  
  // Derived values from store
  let selectedDocument = $derived(documentStore.selectedDocument);
</script>

<div class="document-bay-modal">
  <div class="modal-content">
    <!-- Simplified component structure -->
    <DocumentFilters />
    <DocumentList />
    {#if selectedDocument}
      <DocumentDetails />
    {/if}
  </div>
</div>
```

### 3. DocumentList Component Refactoring

- Remove duplicate document loading logic
- Use document store for document list and selection
- Simplify batch operations to use store methods

```svelte
<script lang="ts">
  import { documentStore } from '$lib/stores/documentStore.svelte';
  import Checkbox from '$lib/components/Checkbox.svelte';
  import Button from '$lib/components/Button.svelte';
  
  // Derived values from store
  let documents = $derived(documentStore.documents);
  let selectedDocumentIds = $state<string[]>([]);
  let isLoading = $derived(documentStore.isLoading);
  let error = $derived(documentStore.error);
  
  function handleDocumentClick(docId: string) {
    documentStore.selectDocumentById(docId);
  }
  
  function handleBatchAction(action: string, documentIds: string[]) {
    documentStore.batchDocumentAction(action, documentIds);
  }
  
  function handleSelectAll(event: MouseEvent) {
    if ((event.target as HTMLInputElement).checked) {
      selectedDocumentIds = documents.map(doc => doc.id);
    } else {
      selectedDocumentIds = [];
    }
  }
  
  function handleSelectDocument(docId: string, event: Event | MouseEvent) {
    if ((event.target as HTMLInputElement).checked) {
      selectedDocumentIds = [...selectedDocumentIds, docId];
    } else {
      selectedDocumentIds = selectedDocumentIds.filter(id => id !== docId);
    }
  }
</script>

<div class="document-list-container">
  <!-- Batch actions -->
  <div class="document-list-header">
    <div class="batch-actions">
      <Checkbox
        checked={selectedDocumentIds.length === documents.length && documents.length > 0}
        indeterminate={selectedDocumentIds.length > 0 && selectedDocumentIds.length < documents.length}
        disabled={documents.length === 0}
        onclick={(e: MouseEvent) => handleSelectAll(e)}
        label="Select All"
      />
      
      <div class="action-buttons">
        <Button
          label="Delete"
          type="secondary"
          disabled={selectedDocumentIds.length === 0}
          ClickFunction={() => handleBatchAction('delete', selectedDocumentIds)}
          size="small"
        />
      </div>
    </div>
  </div>
  
  <!-- Document list -->
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
          class:selected={documentStore.selectedDocument?.id === doc.id}
          onclick={() => handleDocumentClick(doc.id)}
          onkeydown={(e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleDocumentClick(doc.id);
            }
          }}
          role="button"
          tabindex="0"
          aria-label={`Document: ${doc.documentName}`}
        >
          <div class="document-select">
            <input
              type="checkbox"
              checked={selectedDocumentIds.includes(doc.id)}
              onchange={(e: Event) => handleSelectDocument(doc.id, e)}
              onclick={(e: MouseEvent) => e.stopPropagation()}
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
      {/each}
    </div>
  {/if}
</div>
```

### 4. DocumentDetails Component Refactoring

- Completely rebuild with store-based approach
- Consolidate effect blocks into logical groups
- Add proper null document handling
- Move class/student loading logic to the store

```svelte
<script lang="ts">
  import { documentStore } from '$lib/stores/documentStore.svelte';
  import Button from '$lib/components/Button.svelte';
  
  // Derived values from store
  let document = $derived(documentStore.selectedDocument);
  let isProcessing = $derived(documentStore.isProcessing);
  let classes = $derived(documentStore.classes);
  let students = $derived(documentStore.students);
  
  // Local UI state
  let selectedClassId = $state('');
  let selectedStudentId = $state('');
  let isSaving = $state(false);
  let saveSuccess = $state(false);
  
  // Initialize selections when document changes
  $effect(() => {
    if (document) {
      selectedClassId = document.classId || '';
      selectedStudentId = document.studentId || '';
      
      // Load students for the selected class
      if (document.classId) {
        documentStore.loadStudentsForClass(document.classId);
      }
    }
  });
  
  // Auto-save functionality with debounce
  let saveTimer = $state<NodeJS.Timeout | null>(null);
  
  $effect(() => {
    // Only run if we have a document and values have changed
    if (!document) return;
    
    // Track the values that should trigger auto-save
    const classId = selectedClassId;
    const studentId = selectedStudentId;
    
    // Don't save if we're already saving or if it's the initial load
    if (isSaving || document.classId === classId && document.studentId === studentId) return;
    
    // Clear any existing timer
    if (saveTimer) clearTimeout(saveTimer);
    
    // Set a new timer to save after a delay
    saveTimer = setTimeout(() => {
      saveAssignment();
      saveTimer = null;
    }, 500);
    
    // Cleanup function
    return () => {
      if (saveTimer) clearTimeout(saveTimer);
    };
  });
  
  async function saveAssignment() {
    if (!document) return;
    
    isSaving = true;
    saveSuccess = false;
    
    try {
      const selectedClass = classes.find(c => c.id === selectedClassId);
      const selectedStudent = students.find(s => s.id === selectedStudentId);
      
      const success = await documentStore.updateDocument(document.id, {
        classId: selectedClassId,
        className: selectedClass?.name || '',
        studentId: selectedStudentId,
        studentName: selectedStudent?.name || ''
      });
      
      if (!success) throw new Error('Failed to update document');
      
      saveSuccess = true;
      setTimeout(() => { saveSuccess = false; }, 3000);
    } catch (err) {
      console.error('Error saving assignment:', err);
    } finally {
      isSaving = false;
    }
  }
  
  function formatDate(date: Date) {
    return date.toLocaleString();
  }
  
  function openInEditor() {
    if (document) {
      window.location.href = `/editor?documentId=${document.id}`;
    }
  }
</script>

<div class="document-details-container">
  <div class="details-content">
    {#if isProcessing}
      <div class="processing-state">
        <p>Processing document...</p>
      </div>
    {:else if !document}
      <div class="empty-state">
        <p>No document selected</p>
      </div>
    {:else}
      <div class="document-metadata">
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
        
        <div class="metadata-item">
          <span class="metadata-label">Class:</span>
          <div class="select-container">
            <select
              bind:value={selectedClassId}
              onchange={() => selectedStudentId = ''}
              disabled={isSaving}
            >
              <option value="">Select Class</option>
              {#each classes as classItem}
                <option value={classItem.id}>{classItem.name}</option>
              {/each}
            </select>
          </div>
        </div>
        
        <div class="metadata-item">
          <span class="metadata-label">Student:</span>
          <div class="select-container">
            <select
              bind:value={selectedStudentId}
              disabled={!selectedClassId || isSaving}
            >
              <option value="">Select Student</option>
              {#each students as student}
                <option value={student.id}>{student.name}</option>
              {/each}
            </select>
          </div>
        </div>
        
        {#if saveSuccess}
          <div class="save-container">
            <span class="save-success">Assignment saved successfully!</span>
          </div>
        {/if}
        
        {#if document.sourceType === 'llmwhisperer'}
          <div class="source-info">
            <div class="metadata-item">
              <span class="metadata-label">Source:</span>
              <span class="metadata-value">Discord Bot</span>
            </div>
            
            {#if document.sourceMetadata?.llmProcessed}
              <div class="metadata-item">
                <span class="metadata-label">Processed:</span>
                <span class="metadata-value">
                  {document.sourceMetadata.llmProcessedAt 
                    ? formatDate(document.sourceMetadata.llmProcessedAt) 
                    : 'Yes'}
                </span>
              </div>
            {/if}
          </div>
        {/if}
      </div>
      
      <div class="document-preview">
        <div class="preview-header">
          <h3>Preview</h3>
          <div class="preview-actions">
            <Button
              label="Open in Editor"
              type="primary"
              ClickFunction={openInEditor}
              disabled={isProcessing}
              size="small"
            />
          </div>
        </div>
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
```

### 5. DocumentFilters Component Refactoring

- Use store-based filters
- Simplify filter application

```svelte
<script lang="ts">
  import { documentStore } from '$lib/stores/documentStore.svelte';
  import { DocumentStatus } from '$lib/schemas/document';
  
  // Derived values from store
  let filters = $derived(documentStore.filters);
  let classes = $derived(documentStore.classes);
  
  function handleFilterChange(field: string, value: any) {
    documentStore.setFilter(field, value);
  }
  
  function clearFilters() {
    documentStore.clearFilters();
  }
</script>

<div class="document-filters">
  <div class="filter-header">
    <h3>Filters</h3>
    <button 
      class="clear-filters" 
      onclick={clearFilters}
      aria-label="Clear all filters"
    >
      Clear
    </button>
  </div>
  
  <div class="filter-group">
    <label for="class-filter">Class</label>
    <select 
      id="class-filter"
      bind:value={filters.classId}
      onchange={(e) => handleFilterChange('classId', e.target.value)}
    >
      <option value="">All Classes</option>
      {#each classes as classItem}
        <option value={classItem.id}>{classItem.name}</option>
      {/each}
    </select>
  </div>
  
  <div class="filter-group">
    <label for="status-filter">Status</label>
    <select 
      id="status-filter"
      bind:value={filters.status}
      onchange={(e) => handleFilterChange('status', e.target.value)}
    >
      <option value="">All Statuses</option>
      <option value={DocumentStatus.unedited}>Unedited</option>
      <option value={DocumentStatus.edited}>Edited</option>
      <option value={DocumentStatus.completed}>Completed</option>
    </select>
  </div>
  
  <div class="filter-group">
    <label>Date Range</label>
    <div class="date-range">
      <input 
        type="date" 
        aria-label="Start date"
        value={filters.dateRange.start ? filters.dateRange.start.toISOString().split('T')[0] : ''}
        onchange={(e) => handleFilterChange('dateRange.start', e.target.value ? new Date(e.target.value) : null)}
      />
      <span>to</span>
      <input 
        type="date" 
        aria-label="End date"
        value={filters.dateRange.end ? filters.dateRange.end.toISOString().split('T')[0] : ''}
        onchange={(e) => handleFilterChange('dateRange.end', e.target.value ? new Date(e.target.value) : null)}
      />
    </div>
  </div>
</div>
```

## Implementation Strategy

I recommend implementing this refactoring in the following order:

1. Enhance the document store first
2. Refactor DocumentBay to use the store
3. Refactor DocumentList to use the store
4. Refactor DocumentDetails to use the store
5. Refactor DocumentFilters to use the store

This approach allows us to build on a solid foundation and ensure each component works correctly with the centralized store before moving to the next one.