<script>
  import ChalkButton from './ChalkButton.svelte';

  /** Annonce du verdict, affichée à tout le groupe en même temps. */
  let { result, onclose } = $props();

  const titre = $derived(
    result.mode === 'votes'
      ? result.tie
        ? 'Égalité, le sort a tranché'
        : 'Le groupe a choisi'
      : 'Le sort a tranché'
  );
</script>

<div class="fixed inset-0 z-50 flex flex-col items-center justify-center px-6">
  <button class="absolute inset-0 bg-board/95" aria-label="Fermer" onclick={onclose}></button>

  <div class="relative z-10 w-full max-w-sm rounded-lg border-2 border-dashed border-accent px-6 py-10 text-center">
    <p class="text-xs tracking-[0.2em] text-muted">{titre.toUpperCase()}</p>

    <p class="mt-4 font-display text-5xl leading-tight text-accent">
      {result.winner.name}
    </p>

    {#if result.winner.city || result.winner.cuisine}
      <p class="mt-2 text-sm text-muted">
        {[result.winner.city, result.winner.cuisine, result.winner.budget]
          .filter(Boolean)
          .join(' · ')}
      </p>
    {/if}

    {#if result.mode === 'votes'}
      <p class="mt-3 text-xs text-teal">
        {result.winner.voteCount}
        {result.winner.voteCount > 1 ? 'voix' : 'voix'}
      </p>
    {/if}

    {#if result.winner.mapsUrl}
      <a
        href={result.winner.mapsUrl}
        target="_blank"
        rel="noopener"
        class="mt-8 block w-full rounded-md border-2 border-dashed border-teal px-4 py-3
               text-sm font-semibold text-teal"
      >
        Y aller
      </a>
    {/if}

    <div class="mt-3">
      <ChalkButton variant="muted" onclick={onclose}>
        {#snippet children()}Fermer{/snippet}
      </ChalkButton>
    </div>

    <p class="mt-5 text-xs text-muted">Lancé par {result.decidedBy}</p>
  </div>
</div>
