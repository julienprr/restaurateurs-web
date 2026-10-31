<script>
  import { describeDay } from '../outings.js';

  /**
   * La sortie en préparation : sa date, et le restaurant s'il est choisi.
   * Le restaurant n'est pas définitif tant que la date n'est pas passée : on
   * peut encore trancher à nouveau.
   */
  let { outing, onreschedule, oncancel, disabled = false } = $props();

  const when = $derived(describeDay(outing.plannedFor));
</script>

<div class="mb-5 rounded-md border-2 border-dotted border-line px-4 py-4 text-center">
  <p class="text-xs tracking-[0.2em] text-muted">SORTIE PRÉVUE</p>
  <p class="mt-1 font-display text-3xl leading-tight text-chalk">{when}</p>

  {#if outing.restaurant}
    <p class="mt-3 text-xs text-muted">On va chez</p>
    <p class="font-display text-3xl leading-tight text-accent">{outing.restaurant.name}</p>
    <p class="mt-1 text-xs text-muted">
      {outing.decidedHow === 'VOTES' ? 'Choisi par le vote' : 'Tiré au sort'}{outing.decidedBy ? `, par ${outing.decidedBy}` : ''}
    </p>
    {#if outing.restaurant.mapsUrl}
      <a
        href={outing.restaurant.mapsUrl}
        target="_blank"
        rel="noopener"
        class="mt-3 inline-block text-xs text-teal underline underline-offset-4"
      >
        Y aller
      </a>
    {/if}
  {:else}
    <p class="mt-2 text-xs text-muted">Votez, puis tranchez.</p>
  {/if}

  <div class="mt-4 flex justify-center gap-5 text-xs">
    <button class="text-muted underline underline-offset-4" onclick={onreschedule} {disabled}>
      Changer la date
    </button>
    <button class="text-muted underline underline-offset-4" onclick={oncancel} {disabled}>
      Annuler la sortie
    </button>
  </div>
</div>
