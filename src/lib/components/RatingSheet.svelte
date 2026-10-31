<script>
  import Sheet from './Sheet.svelte';
  import ChalkButton from './ChalkButton.svelte';

  /**
   * Donner ou modifier sa note sur une sortie passée. La note est obligatoire,
   * le commentaire facultatif. Renvoyer une note remplace la précédente.
   */
  let { title, initial = null, busy = false, error = null, onconfirm, onclose } = $props();

  const MAX_COMMENT = 500;

  let score = $state(initial?.score ?? null);
  let comment = $state(initial?.comment ?? '');

  function submit(event) {
    event.preventDefault();
    if (score) onconfirm({ score, comment });
  }
</script>

<Sheet {title} {onclose}>
  {#snippet children()}
    <form onsubmit={submit}>
      <fieldset class="mb-5">
        <legend class="mb-2 text-xs tracking-wide text-muted">Ta note</legend>
        <div class="flex gap-2">
          {#each [1, 2, 3, 4, 5] as value (value)}
            <button
              type="button"
              onclick={() => (score = value)}
              aria-pressed={score === value}
              aria-label="{value} sur 5"
              class="flex-1 rounded-md border-2 border-dashed py-2 font-display text-2xl transition-colors
                     {score !== null && value <= score
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-line text-muted'}"
            >
              {value}
            </button>
          {/each}
        </div>
      </fieldset>

      <label class="mb-2 block text-xs tracking-wide text-muted" for="rating-comment">
        Un mot ? (facultatif)
      </label>
      <textarea
        id="rating-comment"
        bind:value={comment}
        maxlength={MAX_COMMENT}
        rows="3"
        placeholder="Le service, le plat à ne pas rater..."
        class="w-full resize-none rounded-md border-2 border-dotted border-line bg-transparent px-4 py-3
               text-sm text-chalk placeholder:text-muted/60 focus:border-teal focus:outline-none"
      ></textarea>
      <p class="mb-5 text-right text-xs text-muted">{comment.length} / {MAX_COMMENT}</p>

      {#if error}
        <p class="mb-4 text-center text-xs text-accent">{error}</p>
      {/if}

      <ChalkButton type="submit" disabled={busy || !score}>
        {#snippet children()}{initial ? 'Modifier ma note' : 'Noter'}{/snippet}
      </ChalkButton>
    </form>
  {/snippet}
</Sheet>
