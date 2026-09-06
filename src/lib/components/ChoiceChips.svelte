<script>
  /**
   * Choix rapides en puces. Le brief impose des choix prédéfinis plutôt qu'une
   * saisie libre : plus rapide sur mobile, et évite dix orthographes du même
   * type de cuisine.
   */
  let { label, options, value = $bindable(), allowNone = true } = $props();

  function pick(option) {
    value = value === option && allowNone ? null : option;
  }
</script>

<fieldset class="mb-5">
  <legend class="mb-2 text-xs tracking-wide text-muted">{label}</legend>
  <div class="flex flex-wrap gap-2">
    {#each options as option (option)}
      <button
        type="button"
        onclick={() => pick(option)}
        class="rounded-full border border-dotted px-3 py-1.5 text-xs transition-colors
               {value === option
          ? 'border-accent bg-accent/10 text-accent'
          : 'border-line text-muted'}"
      >
        {option}
      </button>
    {/each}
  </div>
</fieldset>
