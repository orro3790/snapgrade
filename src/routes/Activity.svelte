<script lang="ts">
  import { modalStore } from '$lib/stores/modalStore.svelte';
  import DocumentSessionHistory from '$lib/components/DocumentSessionHistory.svelte';
  import ProcessingStatusModal from '$lib/components/ProcessingStatusModal.svelte';
  import Button from '$lib/components/Button.svelte';
  import { superForm } from 'sveltekit-superforms/client';
  import { zod } from 'sveltekit-superforms/adapters';
  import { activitySchema } from '$lib/schemas/activity';

  // Get props directly
  const { form: formProp, user, uid, sessionId: initialSessionId } = $props<{
    form: any;
    user: any;
    uid: string;
    sessionId?: string;
  }>();
  
  // Initialize form with Superforms
  const { form, errors, enhance } = superForm(formProp, {
    // Don't invalidate all forms when one is submitted
    invalidateAll: false
  });
  
  // Tab state
  let activeTab = $state('history');
  
  // Session ID for detailed view
  let sessionId = $state(initialSessionId || null);
  
  function handleClose() {
    modalStore.close();
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }
  
  function handleSessionSelect(id: string) {
    sessionId = id;
    activeTab = 'status';
  }
  
  function handleBackToHistory() {
    sessionId = null;
    activeTab = 'history';
  }
</script>

<!-- Backdrop -->
<div
  class="modal-backdrop"
  role="presentation"
  onclick={handleClose}
  onkeydown={handleKeydown}
></div>

<!-- Modal -->
<div class="activity-modal" role="dialog" aria-labelledby="modal-title">
  <div class="modal-header">
    <h1 id="modal-title">Activity</h1>
    <button
      type="button"
      class="close-button"
      onclick={handleClose}
      aria-label="Close activity"
    >
      ×
    </button>
  </div>

  <div class="modal-content">
    {#if !sessionId}
      <div class="tabs">
        <button
          class="tab-button {activeTab === 'history' ? 'active' : ''}"
          onclick={() => activeTab = 'history'}
        >
          Document History
        </button>
      </div>
      
      <div class="tab-content">
        {#if activeTab === 'history'}
          <DocumentSessionHistory
            autoRefresh={true}
            showCompleted={true}
            maxItems={20}
            onSessionSelect={handleSessionSelect}
            onDocumentSelect={(documentId) => {
              // Handle document selection
              modalStore.close();
              // This would typically use a store or service to load the document
              console.log('Loading document:', documentId);
            }}
          />
        {/if}
      </div>
    {:else}
      <div class="back-button-container">
        <Button
          label="Back to History"
          type="secondary"
          size="small"
          ClickFunction={handleBackToHistory}
        />
      </div>
      
      <div class="status-container">
        <ProcessingStatusModal
          sessionId={sessionId}
          onClose={handleBackToHistory}
          onViewDocument={(documentId) => {
            // Handle viewing document within the SPA
            modalStore.close();
            // Load the document in the editor
            // This would typically use a store or service to load the document
            console.log('Loading document:', documentId);
          }}
        />
      </div>
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

  .activity-modal {
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
    max-width: 800px;
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
    flex-direction: column;
    overflow: hidden;
    background: var(--background-secondary);
  }

  .tabs {
    display: flex;
    padding: 0 var(--spacing-4);
    border-bottom: var(--border-width-thin) solid var(--background-modifier-border);
    background: var(--background-secondary);
  }

  .tab-button {
    padding: var(--spacing-2) var(--spacing-4);
    background: none;
    border: none;
    color: var(--text-muted);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    cursor: pointer;
    transition: var(--transition-all);
    position: relative;
  }

  .tab-button.active {
    color: var(--text-accent);
  }

  .tab-button.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: var(--text-accent);
  }

  .tab-button:hover:not(.active) {
    color: var(--text-normal);
  }

  .tab-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-4);
  }

  .back-button-container {
    padding: var(--spacing-4);
    border-bottom: var(--border-width-thin) solid var(--background-modifier-border);
  }

  .status-container {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-4);
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