<script>
  import { createQuery, useQueryClient } from '@tanstack/svelte-query';
  import RatingSheet from './RatingSheet.svelte';
  import { api } from '../api.js';
  import { formatDay } from '../outings.js';

  /**
   * L'onglet « Nos sorties » : les sorties passées, chacune avec ses notes.
   * Tout le monde peut noter, sans limite de temps, et voit les notes des
   * autres. Le classement viendra s'ajouter ici (étape 4).
   */
  let { groupId } = $props();

  const queryClient = useQueryClient();

  const past = createQuery(() => ({
    queryKey: ['past-outings', groupId],
    queryFn: () => api.get(`/groups/${groupId}/outings`),
    retry: false
  }));

  let rating = $state(null); // la sortie passée en cours de notation
  let busy = $state(false);
  let error = $state(null);

  const myRating = (entry) => entry.ratings.find((r) => r.mine) ?? null;

  function formatAverage(average) {
    return average.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
  }

  function open(entry) {
    error = null;
    rating = entry;
  }

  async function rate({ score, comment }) {
    if (busy) return;
    busy = true;
    error = null;
    try {
      await api.put(`/outings/${rating.outing.id}/rating`, { score, comment });
      await queryClient.invalidateQueries({ queryKey: ['past-outings', groupId] });
      rating = null;
    } catch (e) {
      error = e.message;
    } finally {
      busy = false;
    }
  }
</script>

{#if past.isPending}
  <div class="flex flex-1 items-center justify-center">
    <p class="font-display text-2xl text-muted">Un instant...</p>
  </div>
{:else if past.isError}
  <div class="flex flex-1 flex-col items-center justify-center text-center">
    <p class="text-sm text-accent">{past.error.message}</p>
  </div>
{:else if past.data.length === 0}
  <div class="flex flex-1 flex-col items-center justify-center text-center">
    <p class="font-display text-3xl text-teal">Pas encore de sortie</p>
    <p class="mt-3 max-w-xs text-sm leading-relaxed text-muted">
      Une sortie apparaît ici le lendemain, et chacun peut alors la noter.
    </p>
  </div>
{:else}
  <div>
    {#each past.data as entry (entry.outing.id)}
      {@const mine = myRating(entry)}
      <article class="border-b border-dotted border-line py-4 last:border-b-0">
        <div class="flex items-baseline justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs text-muted">{formatDay(entry.outing.plannedFor)}</p>
            <p class="break-words font-display text-2xl leading-tight text-chalk">
              {entry.outing.restaurant?.name ?? 'Adresse retirée'}
            </p>
          </div>
          {#if entry.average !== null}
            <p class="shrink-0 font-display text-3xl leading-none text-accent">
              {formatAverage(entry.average)}<span class="text-base text-muted"> / 5</span>
            </p>
          {/if}
        </div>

        {#if entry.ratings.length > 0}
          <ul class="mt-3 space-y-2">
            {#each entry.ratings as r, i (i)}
              <li class="text-sm">
                <span class="{r.mine ? 'text-teal' : 'text-chalk'}">{r.mine ? 'Toi' : r.author}</span>
                <span class="font-display text-lg text-accent">{r.score}</span>
                {#if r.comment}
                  <p class="mt-0.5 whitespace-pre-line text-xs leading-relaxed text-muted">{r.comment}</p>
                {/if}
              </li>
            {/each}
          </ul>
        {:else}
          <p class="mt-2 text-xs text-muted">Personne n'a encore noté.</p>
        {/if}

        <button
          class="mt-3 text-xs underline underline-offset-4 {mine ? 'text-muted' : 'text-teal'}"
          onclick={() => open(entry)}
        >
          {mine ? 'Modifier ma note' : 'Noter cette sortie'}
        </button>
      </article>
    {/each}
  </div>
{/if}

{#if rating}
  <RatingSheet
    title={rating.outing.restaurant?.name ?? 'La sortie'}
    initial={myRating(rating)}
    {busy}
    {error}
    onconfirm={rate}
    onclose={() => (rating = null)}
  />
{/if}
