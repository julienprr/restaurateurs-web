<script>
  /**
   * Une ligne de restaurant, présentée comme une ligne de menu imprimé :
   * nom à gauche, leader en pointillés, statut manuscrit à droite.
   */
  let { restaurant, onclick } = $props();

  const statusLabel = $derived(
    restaurant.status === 'DEJA_FAIT' ? 'déjà fait' : 'à tester'
  );
  const statusColor = $derived(
    restaurant.status === 'DEJA_FAIT' ? 'text-muted' : 'text-accent'
  );
</script>

<button
  type="button"
  {onclick}
  class="w-full border-b border-dotted border-line py-3 text-left last:border-b-0"
>
  <div class="flex items-baseline gap-2">
    <span class="font-medium text-chalk">{restaurant.name}</span>
    <span class="menu-leader" aria-hidden="true"></span>
    <span class="font-display text-xl {statusColor}">{statusLabel}</span>
  </div>

  <div class="mt-0.5 flex items-center gap-2 text-xs text-muted">
    {#if restaurant.city}
      <span>{restaurant.city}</span>
    {/if}
    {#if restaurant.cuisine}
      <span aria-hidden="true">·</span>
      <span>{restaurant.cuisine}</span>
    {/if}
    {#if restaurant.budget}
      <span aria-hidden="true">·</span>
      <span>{restaurant.budget}</span>
    {/if}
  </div>
</button>
