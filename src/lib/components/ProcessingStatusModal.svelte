<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  
  // Create a simple Close icon component inline
  const CloseIcon = {
    default: true
  };
  
  const { sessionId, onClose, onViewDocument } = $props<{
    sessionId: string;
    onClose: () => void;
    onViewDocument?: (documentId: string) => void;
  }>();
  
  let status = $state('loading');
  let progress = $state({
    current: 0,
    total: 0,
    stage: 'queued',
    startedAt: new Date(),
    stageDescription: 'Preparing for processing',
    percentComplete: 0,
    formattedTimeRemaining: 'Calculating...'
  });
  let error = $state('');
  let documentId = $state<string | null>(null);
  let intervalId = $state<number | null>(null);
  
  async function checkStatus() {
    try {
      const response = await fetch(`/api/document-sessions/${sessionId}/status`);
      const data = await response.json();
      
      if (data.success) {
        status = data.status;
        documentId = data.documentId;
        
        if (data.processingProgress) {
          progress = {
            ...progress,
            ...data.processingProgress
          };
        }
        
        if (status === 'completed' && documentId) {
          if (intervalId) clearInterval(intervalId);
        }
      } else {
        error = data.error || 'Failed to fetch status';
      }
    } catch (err) {
      error = 'Error checking status';
      console.error(err);
    }
  }
  
  function getProgressBarColor(stage: string): string {
    switch (stage) {
      case 'queued': return 'var(--text-muted)';
      case 'ocr_processing': return 'var(--text-accent)';
      case 'structure_analysis': return 'var(--interactive-accent-secondary)';
      case 'document_creation': return 'var(--status-success)';
      default: return 'var(--text-accent)';
    }
  }
  
  $effect(() => {
    checkStatus();
    intervalId = setInterval(checkStatus, 5000) as unknown as number;
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  });
  
  let progressBarColor = $derived(getProgressBarColor(progress.stage));
  
  function handleViewDocument() {
    if (documentId && onViewDocument) {
      onViewDocument(documentId);
    }
  }
</script>

<div class="modal-content">
  <div class="modal-header">
    <h2>Processing Status</h2>
    <Button
      label="Close"
      type="ghost"
      size="small"
      ClickFunction={onClose}
      icon={{
        component: CloseIcon,
        props: {}
      }}
    />
  </div>
  
  {#if status === 'loading'}
    <div class="loading-container">
      <Spinner />
      <p class="loading-text">Loading status...</p>
    </div>
  {:else if status === 'processing'}
    <div class="progress-container">
      <div class="progress-header">
        <Spinner />
        <p>
          Processing document ({progress.current} of {progress.total})
        </p>
      </div>
      
      <div class="progress-bar-container">
        <div
          class="progress-bar-fill"
          style="width: {progress.percentComplete || 0}%; background-color: {progressBarColor}"
        ></div>
      </div>
      
      <div class="progress-details">
        <p class="progress-stage">
          <span class="label">Stage:</span> {progress.stageDescription}
        </p>
        
        {#if progress.formattedTimeRemaining}
          <p class="progress-time">
            <span class="label">Estimated time remaining:</span> {progress.formattedTimeRemaining}
          </p>
        {/if}
      </div>
    </div>
  {:else if status === 'completed'}
    <div class="success-container">
      <div class="status-icon success">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <p class="status-message success">Processing complete!</p>
      {#if documentId && onViewDocument}
        <Button
          ClickFunction={handleViewDocument}
          label="View Document"
          type="primary"
        />
      {/if}
      <Button
        ClickFunction={onClose}
        label="Close"
        type="secondary"
      />
    </div>
  {:else if status === 'failed'}
    <div class="error-container">
      <div class="status-icon error">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </div>
      <p class="status-message error">Processing failed</p>
      <p class="error-details">{error || "An unknown error occurred"}</p>
      <Button
        ClickFunction={onClose}
        label="Close"
        type="secondary"
      />
    </div>
  {:else if status === 'cancelled'}
    <div class="cancelled-container">
      <div class="status-icon warning">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
      </div>
      <p class="status-message warning">Processing cancelled</p>
      <Button
        ClickFunction={onClose}
        label="Close"
        type="secondary"
      />
    </div>
  {/if}
</div>

<style>
  .modal-content {
    background-color: var(--background-primary);
    border-radius: var(--radius-lg);
    padding: var(--spacing-6);
    width: 100%;
    animation: fadeIn var(--transition-duration-300) var(--transition-timing-ease);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-4);
  }
  
  .modal-header h2 {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-medium);
    color: var(--text-normal);
    margin: 0;
  }
  
  .close-button {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: var(--spacing-1);
    transition: var(--transition-all);
    border-radius: var(--radius-full);
  }
  
  .close-button:hover {
    color: var(--text-normal);
    background-color: var(--background-modifier-hover);
  }
  
  .loading-container,
  .success-container,
  .error-container,
  .cancelled-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-6);
    text-align: center;
  }
  
  .loading-text {
    margin-top: var(--spacing-4);
    color: var(--text-muted);
  }
  
  .status-icon {
    width: var(--icon-2xl);
    height: var(--icon-2xl);
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--spacing-4);
  }
  
  .status-icon.success {
    background-color: rgba(var(--status-success-rgb), 0.2);
    color: var(--status-success);
  }
  
  .status-icon.error {
    background-color: rgba(var(--status-error-rgb), 0.2);
    color: var(--status-error);
  }
  
  .status-icon.warning {
    background-color: rgba(var(--status-warning-rgb), 0.2);
    color: var(--status-warning);
  }
  
  .icon {
    width: var(--icon-lg);
    height: var(--icon-lg);
  }
  
  .status-message {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-medium);
    margin-bottom: var(--spacing-4);
  }
  
  .status-message.success {
    color: var(--status-success);
  }
  
  .status-message.error {
    color: var(--status-error);
  }
  
  .status-message.warning {
    color: var(--status-warning);
  }
  
  .error-details {
    color: var(--text-muted);
    margin-bottom: var(--spacing-4);
    max-width: 300px;
  }
  
  .progress-container {
    animation: fadeIn var(--transition-duration-300) var(--transition-timing-ease);
  }
  
  .progress-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    margin-bottom: var(--spacing-4);
  }
  
  .progress-bar-container {
    width: 100%;
    height: var(--spacing-1-5);
    background-color: var(--background-modifier-border);
    border-radius: var(--radius-full);
    margin-bottom: var(--spacing-4);
    overflow: hidden;
  }
  
  .progress-bar-fill {
    height: 100%;
    border-radius: var(--radius-full);
    transition: width var(--transition-duration-300) var(--transition-timing-ease);
  }
  
  .progress-details {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }
  
  .progress-stage,
  .progress-time {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }
  
  .label {
    font-weight: var(--font-weight-medium);
    color: var(--text-normal);
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideDown {
    from { transform: translateY(calc(var(--spacing-5) * -1)); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
</style>