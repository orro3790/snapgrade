<!-- src/lib/components/Spinner.svelte -->
<script lang="ts">
  /**
   * Rich-inspired spinner component with a more engaging animation
   * @prop size - Size of the spinner in pixels (default: 24)
   * @prop color - Color of the spinner (default: var(--interactive-accent))
   * @prop variant - Animation style (dots, pulse, orbit) (default: orbit)
   */
  const { 
    size = 24, 
    color = 'var(--interactive-accent)',
    variant = 'orbit'
  } = $props<{
    size?: number;
    color?: string;
    variant?: 'dots' | 'pulse' | 'orbit';
  }>();

  // Derived measurements
  const viewBoxSize = 50;
  const center = viewBoxSize / 2;
</script>

<div class="spinner-container">
  {#if variant === 'dots'}
    <svg class="spinner dots-spinner" viewBox="0 0 {viewBoxSize} {viewBoxSize}" width={size} height={size}>
      {#each Array(8) as _, i}
        <circle 
          class="dot"
          cx={center + Math.cos(i * Math.PI / 4) * 15} 
          cy={center + Math.sin(i * Math.PI / 4) * 15} 
          r="4"
          style="animation-delay: {i * 0.125}s; fill: {color};" 
        />
      {/each}
    </svg>
  {:else if variant === 'pulse'}
    <svg class="spinner pulse-spinner" viewBox="0 0 {viewBoxSize} {viewBoxSize}" width={size} height={size}>
      <circle 
        class="pulse-circle"
        cx={center} 
        cy={center} 
        r="15"
        fill="none"
        stroke={color}
        stroke-width="2"
      />
      <circle 
        class="pulse-circle delayed"
        cx={center} 
        cy={center} 
        r="15"
        fill="none"
        stroke={color}
        stroke-width="2"
      />
    </svg>
  {:else}
    <!-- Default orbit spinner -->
    <svg class="spinner orbit-spinner" viewBox="0 0 {viewBoxSize} {viewBoxSize}" width={size} height={size}>
      <g class="orbit">
        {#each Array(6) as _, i}
          <circle 
            class="particle"
            cx={center} 
            cy={10} 
            r="3"
            style="
              transform-origin: {center}px {center}px; 
              animation-delay: {i * 0.16}s;
              fill: {i % 2 === 0 ? color : 'var(--interactive-accent-hover)'};
            " 
          />
        {/each}
      </g>
    </svg>
  {/if}
</div>

<style>
  .spinner-container {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Dots spinner animation */
  .dots-spinner .dot {
    opacity: 0;
    animation: fade-in-out 1.6s ease-in-out infinite;
  }
  
  @keyframes fade-in-out {
    0%, 100% { opacity: 0; }
    50% { opacity: 1; }
  }
  
  /* Pulse spinner animation */
  .pulse-spinner .pulse-circle {
    animation: pulse 2s ease-in-out infinite;
    transform-origin: center;
  }
  
  .pulse-spinner .delayed {
    animation-delay: 1s;
  }
  
  @keyframes pulse {
    0% { 
      transform: scale(0.5);
      opacity: 1;
    }
    100% { 
      transform: scale(1.5);
      opacity: 0;
    }
  }
  
  /* Orbit spinner animation */
  .orbit-spinner {
    animation: rotate 12s linear infinite;
  }
  
  .orbit-spinner .particle {
    animation: orbit 2s ease-in-out infinite;
  }
  
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes orbit {
    0%, 100% { 
      transform: rotate(0deg) translateY(0) scale(1); 
    }
    50% { 
      transform: rotate(180deg) translateY(15px) scale(1.2); 
    }
  }
</style>