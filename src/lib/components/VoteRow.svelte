<script>
  /** Une ligne de l'écran de vote : le nom à gauche, le compteur à droite. */
  let { restaurant, leading, onvote, disabled = false } = $props();
</script>

<div class="flex items-center gap-3 border-b border-dotted border-line py-3 last:border-b-0">
  <div class="min-w-0 flex-1">
    <div class="flex items-baseline gap-2">
      <span class="truncate font-medium {leading ? 'text-accent' : 'text-chalk'}">
        {restaurant.name}
      </span>
      {#if leading}
        <span class="shrink-0 font-display text-lg text-accent">en tête</span>
      {/if}
    </div>
    <p class="mt-0.5 truncate text-xs text-muted">
      {[restaurant.city, restaurant.cuisine, restaurant.budget].filter(Boolean).join(' · ')}
    </p>
  </div>

  <button
    type="button"
    onclick={onvote}
    {disabled}
    aria-pressed={restaurant.votedByMe}
    aria-label="Voter pour {restaurant.name}"
    class="flex shrink-0 items-center gap-1.5 rounded-md border-2 border-dashed px-3 py-1.5
           transition-colors disabled:opacity-50
           {restaurant.votedByMe ? 'border-teal bg-teal/10 text-teal' : 'border-line text-muted'}"
  >
    <span class="text-xs font-semibold">+1</span>
    <span class="font-display text-xl leading-none">{restaurant.voteCount}</span>
  </button>
</div>
