<script>
  import Sheet from './Sheet.svelte';
  import ChalkButton from './ChalkButton.svelte';
  import { todayInParis } from '../outings.js';

  /**
   * Choix d'une date, pour prévoir une sortie ou la déplacer. Le champ natif
   * ouvre le calendrier du téléphone, plus pratique qu'un sélecteur maison.
   */
  let { title, confirmLabel, initial, busy = false, error = null, onconfirm, onclose } = $props();

  const today = todayInParis();
  let date = $state(initial ?? today);

  function submit(event) {
    event.preventDefault();
    if (date) onconfirm(date);
  }
</script>

<Sheet {title} {onclose}>
  {#snippet children()}
    <form onsubmit={submit}>
      <label class="mb-2 block text-xs tracking-wide text-muted" for="outing-date">Le soir de la sortie</label>
      <input
        id="outing-date"
        type="date"
        min={today}
        bind:value={date}
        required
        class="mb-5 w-full rounded-md border-2 border-dotted border-line bg-transparent px-4 py-3
               text-chalk [color-scheme:dark] focus:border-teal focus:outline-none"
      />

      {#if error}
        <p class="mb-4 text-center text-xs text-accent">{error}</p>
      {/if}

      <ChalkButton type="submit" disabled={busy || !date}>
        {#snippet children()}{confirmLabel}{/snippet}
      </ChalkButton>
    </form>
  {/snippet}
</Sheet>
