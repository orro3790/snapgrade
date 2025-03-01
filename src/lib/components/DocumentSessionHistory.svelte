<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import Button from '$lib/components/Button.svelte';
  import { browser } from '$app/environment';
  import type { DocumentSession, ProcessingProgress } from '$lib/schemas/documentSession';
  
  export let autoRefresh = true;
  export let showCompleted = true;
  export let maxItems = 10;
  export let onSessionSelect = (sessionId: string) => {};
  export let onDocumentSelect = (documentId: string) => {};
  
  let sessions: DocumentSession[] = [];
  let loading = true;
  let error: string | null = null;
  let intervalId: number;
  
  // Format date to human-readable format
  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  }
  
  // Get status badge class based on status
  function getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'collecting': return 'badge-info';
      case 'processing': return 'badge-warning';
      case 'completed': return 'badge-success';
      case 'failed': return 'badge-error';
      case 'cancelled': return 'badge-muted';
      default: return 'badge-muted';
    }
  }
  
  // Get progress bar color based on stage
  function getProgressBarColor(stage: string): string {
    switch (stage) {
      case 'queued': return 'var(--text-muted)';
      case 'ocr_processing': return 'var(--text-accent)';
      case 'structure_analysis': return 'var(--interactive-accent-secondary)';
      case 'document_creation': return 'var(--status-success)';
      default: return 'var(--text-accent)';
    }
  }
  
  // Get text quality display value
  function getTextQualityDisplay(quality?: string): string {
    if (!quality) return 'Printed Text';
    
    switch (quality) {
      case 'printed': return 'Printed Text';
      case 'handwriting': return 'Handwriting';
      default: return quality.replace('_', ' ');
    }
  }
  
  async function fetchSessions() {
    try {
      loading = true;
      error = null;
      
      const response = await fetch('/api/document-sessions');
      
      if (!response.ok) {
        error = `Error fetching sessions: ${response.status}`;
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Filter sessions if needed
        sessions = data.sessions
          .filter((session: DocumentSession) => showCompleted || session.status.toLowerCase() !== 'completed')
          .slice(0, maxItems);
      } else {
        error = data.error || 'Failed to load sessions';
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      error = 'Failed to load document history';
    } finally {
      loading = false;
    }
  }
  
  // View document details
  function viewDocument(documentId: string) {
    onDocumentSelect(documentId);
  }
  
  // View session status details
  function viewSessionStatus(sessionId: string) {
    onSessionSelect(sessionId);
  }
  
  onMount(() => {
    fetchSessions();
    
    if (autoRefresh && browser) {
      // Check every 10 seconds for updates
      intervalId = setInterval(fetchSessions, 10000) as unknown as number;
    }
  });
  
  onDestroy(() => {
    if (intervalId) clearInterval(intervalId);
  });
</script>

<div class="document-history-container">
  <div class="header">
    <h2>Document Processing History</h2>
    <Button size="small" ClickFunction={fetchSessions} label="Refresh" />
  </div>
  
  {#if loading && sessions.length === 0}
    <div class="loading-container">
      <Spinner />
    </div>
  {:else if error}
    <div class="error-container">
      <p class="error-message">{error}</p>
    </div>
  {:else if sessions.length === 0}
    <div class="empty-container">
      <p class="empty-message">No document sessions found.</p>
      <p class="empty-submessage">Upload a document to get started.</p>
    </div>
  {:else}
    <div class="sessions-list">
      {#each sessions as session (session.sessionId)}
        <div class="session-card">
          <div class="session-header">
            <div class="session-info">
              <div class="session-meta">
                <span class="date">{formatDate(session.createdAt)}</span>
                <span class="badge {getStatusBadgeClass(session.status)}">
                  {session.status}
                </span>
                {#if session.textQuality}
                  <span class="badge badge-quality">
                    {getTextQualityDisplay(session.textQuality)}
                  </span>
                {/if}
              </div>
              <div class="session-details">
                <span>{session.receivedPages} page{session.receivedPages !== 1 ? 's' : ''}</span>
              </div>
            </div>
            
            <div class="session-actions">
              {#if session.status.toLowerCase() === 'completed' && session.documentId}
                <Button
                  size="small"
                  type="primary"
                  ClickFunction={() => viewDocument(session.documentId || '')}
                  label="View Document"
                />
              {:else if session.status.toLowerCase() === 'processing'}
                <Button
                  size="small"
                  type="secondary"
                  ClickFunction={() => viewSessionStatus(session.sessionId)}
                  label="View Status"
                />
              {/if}
            </div>
          </div>
          
          {#if session.status.toLowerCase() === 'processing' && session.processingProgress}
            {@const progress = session.processingProgress}
            <div class="progress-container">
              <div class="progress-info">
                <span class="progress-stage">
                  {#if 'stageDescription' in progress}
                    {progress.stageDescription}
                  {:else}
                    {progress.stage.replace('_', ' ')}
                  {/if}
                </span>
                {#if progress.estimatedTimeRemaining}
                  <span class="progress-time">
                    {#if 'formattedTimeRemaining' in progress}
                      Est. remaining: {progress.formattedTimeRemaining}
                    {:else}
                      Est. remaining: {Math.round(progress.estimatedTimeRemaining / 1000)} sec
                    {/if}
                  </span>
                {/if}
              </div>
              <div class="progress-bar-container">
                <div 
                  class="progress-bar-fill"
                  style="width: {Math.round((progress.current / progress.total) * 100) || 0}%; background-color: {getProgressBarColor(progress.stage)}"
                ></div>
              </div>
            </div>
          {:else if session.status.toLowerCase() === 'failed' && session.error}
            <div class="error-details">
              <p>{session.error}</p>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .document-history-container {
    animation: fadeIn var(--transition-duration-300) var(--transition-timing-ease);
    width: 100%;
  }
  
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-4);
  }
  
  .header h2 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-medium);
    color: var(--text-normal);
    margin: 0;
  }
  
  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--spacing-8) 0;
  }
  
  .error-container {
    background-color: rgba(var(--status-error-rgb), 0.1);
    padding: var(--spacing-4);
    border-radius: var(--radius-lg);
  }
  
  .error-message {
    color: var(--status-error);
  }
  
  .empty-container {
    background-color: var(--background-secondary);
    padding: var(--spacing-6);
    border-radius: var(--radius-lg);
    text-align: center;
  }
  
  .empty-message {
    color: var(--text-normal);
  }
  
  .empty-submessage {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    margin-top: var(--spacing-1);
  }
  
  .sessions-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }
  
  .session-card {
    background-color: var(--background-primary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-base);
    padding: var(--spacing-4);
    border: var(--border-width-thin) solid var(--background-modifier-border);
  }
  
  .session-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  
  .session-info {
    display: flex;
    flex-direction: column;
  }
  
  .session-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-2);
  }
  
  .date {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }
  
  .badge {
    padding: var(--spacing-0-5) var(--spacing-2);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
  }
  
  .badge-info {
    background-color: rgba(var(--status-info-rgb), 0.2);
    color: var(--status-info);
  }
  
  .badge-warning {
    background-color: rgba(var(--status-warning-rgb), 0.2);
    color: var(--status-warning);
  }
  
  .badge-success {
    background-color: rgba(var(--status-success-rgb), 0.2);
    color: var(--status-success);
  }
  
  .badge-error {
    background-color: rgba(var(--status-error-rgb), 0.2);
    color: var(--status-error);
  }
  
  .badge-muted {
    background-color: var(--background-modifier-hover);
    color: var(--text-muted);
  }
  
  .badge-quality {
    background-color: rgba(var(--interactive-accent-secondary-rgb), 0.2);
    color: var(--interactive-accent-secondary);
  }
  
  .session-details {
    margin-top: var(--spacing-1);
    font-size: var(--font-size-sm);
    color: var(--text-normal);
  }
  
  .session-actions {
    display: flex;
    gap: var(--spacing-2);
  }
  
  .progress-container {
    margin-top: var(--spacing-3);
  }
  
  .progress-info {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    margin-bottom: var(--spacing-1);
  }
  
  .progress-bar-container {
    width: 100%;
    height: var(--spacing-1-5);
    background-color: var(--background-modifier-border);
    border-radius: var(--radius-full);
    overflow: hidden;
  }
  
  .progress-bar-fill {
    height: 100%;
    border-radius: var(--radius-full);
    transition: width var(--transition-duration-300) var(--transition-timing-ease);
  }
  
  .error-details {
    margin-top: var(--spacing-3);
    font-size: var(--font-size-xs);
    color: var(--status-error);
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>