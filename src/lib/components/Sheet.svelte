<script>
  /** Panneau qui monte depuis le bas, façon feuille d'actions mobile. */
  let { title, onclose, children } = $props();

  function onkeydown(event) {
    if (event.key === 'Escape') onclose();
  }
</script>

<svelte:window {onkeydown} />

<div class="fixed inset-0 z-40 flex flex-col justify-end">
  <button
    class="absolute inset-0 bg-black/60"
    aria-label="Fermer"
    onclick={onclose}
  ></button>

  <div
    class="chalk-surface relative z-10 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t-2
           border-dotted border-line bg-board px-5 pb-8 pt-5"
  >
    <div class="mb-4 flex items-baseline justify-between gap-4">
      <h2 class="font-display text-2xl text-teal">{title}</h2>
      <button class="text-xs text-muted underline underline-offset-4" onclick={onclose}>
        Fermer
      </button>
    </div>
    {@render children()}
  </div>
</div>
