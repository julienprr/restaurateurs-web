<script>
  /**
   * Le classement, assumé comme un jeu : les restaurants selon la moyenne de
   * leurs sorties, puis les membres selon les restaurants qu'ils ont proposés.
   * Les ex aequo partagent leur rang (1, 1, 3), calculé par l'API.
   */
  let { ranking } = $props();

  const ranked = $derived(ranking.members.filter((m) => m.rank !== null));
  const unranked = $derived(ranking.members.filter((m) => m.rank === null));

  function formatAverage(average) {
    return average.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
  }

  const count = (n, one, many) => `${n} ${n > 1 ? many : one}`;
</script>

{#snippet row(rank, name, detail, average, highlight)}
  <li class="flex items-baseline gap-3 py-1.5">
    <span class="w-6 shrink-0 text-right font-display text-xl {rank === 1 ? 'text-accent' : 'text-muted'}">
      {rank}
    </span>
    <div class="min-w-0 flex-1">
      <p class="break-words text-sm {highlight ? 'text-teal' : 'text-chalk'}">{name}</p>
      <p class="text-xs text-muted">{detail}</p>
    </div>
    <span class="shrink-0 font-display text-2xl leading-none text-accent">
      {formatAverage(average)}<span class="text-sm text-muted"> / 5</span>
    </span>
  </li>
{/snippet}

<section class="mb-6 rounded-md border-2 border-dotted border-line px-4 py-4">
  <h2 class="font-display text-2xl text-teal">Le classement</h2>

  <h3 class="mt-3 text-xs tracking-[0.2em] text-muted">LES RESTAURANTS</h3>
  <ol class="mt-1">
    {#each ranking.restaurants as r (r.id)}
      {@render row(r.rank, r.name, count(r.outings, 'sortie notée', 'sorties notées'), r.average, false)}
    {/each}
  </ol>

  <h3 class="mt-4 text-xs tracking-[0.2em] text-muted">LES DÉNICHEURS</h3>
  {#if ranked.length > 0}
    <ol class="mt-1">
      {#each ranked as m, i (i)}
        {@render row(
          m.rank,
          m.mine ? `${m.name} (toi)` : m.name,
          count(m.restaurants, 'adresse notée', 'adresses notées'),
          m.average,
          m.mine
        )}
      {/each}
    </ol>
  {/if}
  {#if unranked.length > 0}
    <p class="mt-2 text-xs leading-relaxed text-muted">
      Pas encore classé{unranked.length > 1 ? 's' : ''} :
      {unranked.map((m) => (m.mine ? `${m.name} (toi)` : m.name)).join(', ')}
    </p>
  {/if}
</section>
