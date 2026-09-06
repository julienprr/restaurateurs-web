<script>
  import { createQuery, useQueryClient } from '@tanstack/svelte-query';
  import Board from '../lib/components/Board.svelte';
  import ChalkButton from '../lib/components/ChalkButton.svelte';
  import RestaurantRow from '../lib/components/RestaurantRow.svelte';
  import VoteRow from '../lib/components/VoteRow.svelte';
  import Sheet from '../lib/components/Sheet.svelte';
  import DrawResultSheet from '../lib/components/DrawResultSheet.svelte';
  import { api } from '../lib/api.js';
  import { navigate } from '../lib/router.svelte.js';
  import { subscribeToGroup } from '../lib/events.js';

  let { id } = $props();

  const queryClient = useQueryClient();

  const group = createQuery(() => ({
    queryKey: ['group', id],
    queryFn: () => api.get(`/groups/${id}`),
    retry: false
  }));

  const restaurants = createQuery(() => ({
    queryKey: ['restaurants', id],
    queryFn: () => api.get(`/groups/${id}/restaurants`),
    retry: false
  }));

  let tab = $state('liste'); // 'liste' | 'choisir'
  let selected = $state(null);
  let showMembers = $state(false);
  let drawResult = $state(null);
  let shareFeedback = $state(null);
  let busy = $state(false);
  let error = $state(null);
  let live = $state(false);

  // Flux temps réel : toute modification faite par un autre membre recharge la
  // liste. Le tirage, lui, s'affiche chez tout le monde en même temps.
  $effect(() => {
    const groupId = id;
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['restaurants', groupId] });

    const unsubscribe = subscribeToGroup(groupId, {
      connected: () => (live = true),
      votes_changed: refresh,
      restaurants_changed: refresh,
      draw_result: (payload) => (drawResult = payload)
    });

    return () => {
      live = false;
      unsubscribe();
    };
  });

  const aTester = $derived(restaurants.data?.filter((r) => r.status === 'A_TESTER') ?? []);
  const maxVotes = $derived(Math.max(0, ...aTester.map((r) => r.voteCount)));
  const totalVotes = $derived(aTester.reduce((sum, r) => sum + r.voteCount, 0));

  async function refreshList() {
    await queryClient.invalidateQueries({ queryKey: ['restaurants', id] });
  }

  async function vote(restaurant) {
    if (busy) return;
    busy = true;
    try {
      await api.post(`/restaurants/${restaurant.id}/vote`);
      await refreshList();
    } catch (e) {
      error = e.message;
    } finally {
      busy = false;
    }
  }

  async function decide(mode) {
    if (busy) return;
    busy = true;
    error = null;
    try {
      // Le résultat arrive aussi par le flux temps réel ; l'affecter ici évite
      // d'attendre l'aller-retour pour celui qui a appuyé.
      drawResult = await api.post(`/groups/${id}/draw?mode=${mode}`);
    } catch (e) {
      error = e.message;
    } finally {
      busy = false;
    }
  }

  async function clearVotes() {
    if (busy) return;
    busy = true;
    try {
      await api.del(`/groups/${id}/votes`);
      await refreshList();
    } finally {
      busy = false;
    }
  }

  async function toggleStatus() {
    if (busy) return;
    busy = true;
    try {
      await api.patch(`/restaurants/${selected.id}/status`);
      await refreshList();
      selected = null;
    } finally {
      busy = false;
    }
  }

  async function remove() {
    if (busy) return;
    busy = true;
    try {
      await api.del(`/restaurants/${selected.id}`);
      await refreshList();
      selected = null;
    } finally {
      busy = false;
    }
  }

  async function share() {
    const url = `${window.location.origin}/rejoindre/${group.data.inviteCode}`;
    const text = `Rejoins « ${group.data.name} » sur Les Restaurateurs`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Les Restaurateurs', text, url });
        return;
      } catch {
        // Partage annulé : on retombe sur la copie.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      shareFeedback = 'Lien copié';
    } catch {
      shareFeedback = 'Copie impossible';
    }
    setTimeout(() => (shareFeedback = null), 2500);
  }

  const sousTitre = $derived(
    !restaurants.data
      ? null
      : tab === 'liste'
        ? `${aTester.length} adresse${aTester.length > 1 ? 's' : ''} à tester`
        : totalVotes === 0
          ? 'Personne n\'a encore voté'
          : `${totalVotes} voix exprimée${totalVotes > 1 ? 's' : ''}`
  );
</script>

<Board title={group.data?.name ?? 'Les Restaurateurs'} subtitle={sousTitre}>
  {#snippet children()}
    {#if group.isError}
      <div class="flex flex-1 flex-col items-center justify-center text-center">
        <p class="font-display text-3xl text-accent">Introuvable</p>
        <p class="mt-3 text-sm text-muted">{group.error.message}</p>
      </div>
    {:else if restaurants.isPending}
      <div class="flex flex-1 items-center justify-center">
        <p class="font-display text-2xl text-muted">Un instant...</p>
      </div>
    {:else if restaurants.isError}
      <div class="flex flex-1 flex-col items-center justify-center text-center">
        <p class="text-sm text-accent">{restaurants.error.message}</p>
      </div>
    {:else}
      <div class="mb-5 flex gap-2 text-xs">
        <button
          class="flex-1 rounded border border-dotted px-3 py-2 {tab === 'liste'
            ? 'border-accent text-accent'
            : 'border-line text-muted'}"
          onclick={() => (tab = 'liste')}
        >
          La liste
        </button>
        <button
          class="flex-1 rounded border border-dotted px-3 py-2 {tab === 'choisir'
            ? 'border-accent text-accent'
            : 'border-line text-muted'}"
          onclick={() => (tab = 'choisir')}
        >
          Choisir ce soir
        </button>
      </div>

      {#if tab === 'liste'}
        <div class="mb-2 flex items-baseline justify-between gap-3">
          <h2 class="font-display text-2xl text-teal">Au tableau</h2>
          <button
            class="shrink-0 text-xs text-muted underline underline-offset-4"
            onclick={() => (showMembers = true)}
          >
            {group.data?.members.length ?? '·'} membres
          </button>
        </div>

        {#if restaurants.data.length === 0}
          <div class="flex flex-1 flex-col items-center justify-center text-center">
            <p class="font-display text-3xl text-teal">Le tableau est vide</p>
            <p class="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              Colle un lien Google Maps et l'adresse s'ajoute toute seule.
            </p>
          </div>
        {:else}
          <div>
            {#each restaurants.data as restaurant (restaurant.id)}
              <RestaurantRow {restaurant} onclick={() => (selected = restaurant)} />
            {/each}
          </div>
        {/if}
      {:else}
        <div class="mb-2 flex items-baseline justify-between gap-3">
          <h2 class="font-display text-2xl text-teal">Les votes</h2>
          {#if live}
            <span class="shrink-0 text-xs text-muted">en direct</span>
          {/if}
        </div>

        {#if aTester.length === 0}
          <div class="flex flex-1 flex-col items-center justify-center text-center">
            <p class="font-display text-3xl text-teal">Rien à décider</p>
            <p class="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              Toutes les adresses sont marquées « déjà fait ». Ajoutes-en une, ou
              remets-en une au tableau.
            </p>
          </div>
        {:else}
          <div>
            {#each aTester as restaurant (restaurant.id)}
              <VoteRow
                {restaurant}
                leading={maxVotes > 0 && restaurant.voteCount === maxVotes}
                disabled={busy}
                onvote={() => vote(restaurant)}
              />
            {/each}
          </div>

          {#if totalVotes > 0}
            <button
              class="mt-4 w-full py-1 text-xs text-muted underline underline-offset-4"
              onclick={clearVotes}
              disabled={busy}
            >
              Effacer tous les votes
            </button>
          {/if}
        {/if}

        {#if error}
          <p class="mt-4 text-center text-xs text-accent">{error}</p>
        {/if}
      {/if}
    {/if}
  {/snippet}

  {#snippet footer()}
    <div class="space-y-3">
      {#if tab === 'liste'}
        <ChalkButton onclick={() => navigate(`/groupes/${id}/ajouter`)}>
          {#snippet children()}+ Ajouter une adresse{/snippet}
        </ChalkButton>
      {:else if aTester.length > 0}
        <ChalkButton onclick={() => decide('votes')} disabled={busy}>
          {#snippet children()}Trancher selon les votes{/snippet}
        </ChalkButton>
        <ChalkButton variant="teal" onclick={() => decide('hasard')} disabled={busy}>
          {#snippet children()}Tirer au sort{/snippet}
        </ChalkButton>
      {/if}
      <button
        class="w-full py-1 text-xs text-muted underline underline-offset-4"
        onclick={() => navigate('/')}
      >
        Mes groupes
      </button>
    </div>
  {/snippet}
</Board>

{#if drawResult}
  <DrawResultSheet result={drawResult} onclose={() => (drawResult = null)} />
{/if}

{#if selected}
  <Sheet title={selected.name} onclose={() => (selected = null)}>
    {#snippet children()}
      <div class="mb-5 space-y-1 text-sm text-muted">
        {#if selected.address}<p>{selected.address}</p>{/if}
        {#if selected.city}<p>{selected.city}</p>{/if}
        {#if selected.cuisine || selected.budget}
          <p>{[selected.cuisine, selected.budget].filter(Boolean).join(' · ')}</p>
        {/if}
        {#if selected.addedBy}
          <p class="pt-1 text-xs">Proposé par {selected.addedBy}</p>
        {/if}
      </div>

      <div class="space-y-3">
        {#if selected.mapsUrl}
          <a
            href={selected.mapsUrl}
            target="_blank"
            rel="noopener"
            class="block w-full rounded-md border-2 border-dashed border-teal px-4 py-3
                   text-center text-sm font-semibold text-teal"
          >
            Voir sur Google Maps
          </a>
        {/if}

        <ChalkButton onclick={toggleStatus} disabled={busy}>
          {#snippet children()}
            {selected.status === 'A_TESTER' ? 'On y est allés' : 'Remettre à tester'}
          {/snippet}
        </ChalkButton>

        <button
          class="w-full py-2 text-xs text-muted underline underline-offset-4"
          onclick={remove}
          disabled={busy}
        >
          Retirer du tableau
        </button>
      </div>
    {/snippet}
  </Sheet>
{/if}

{#if showMembers && group.data}
  <Sheet title="Le groupe" onclose={() => (showMembers = false)}>
    {#snippet children()}
      <div class="mb-6">
        {#each group.data.members as member (member.id)}
          <div class="flex items-baseline gap-2 border-b border-dotted border-line py-2.5 last:border-b-0">
            <span class="text-sm text-chalk">{member.displayName}</span>
            <span class="menu-leader" aria-hidden="true"></span>
            <span class="truncate text-xs text-muted">{member.email}</span>
          </div>
        {/each}
      </div>

      <div class="rounded-md border-2 border-dotted border-line px-4 py-4 text-center">
        <p class="text-xs tracking-widest text-muted">CODE D'INVITATION</p>
        <p class="mt-2 font-display text-4xl tracking-[0.15em] text-accent">
          {group.data.inviteCode}
        </p>
        <button class="mt-3 text-xs text-teal underline underline-offset-4" onclick={share}>
          {shareFeedback ?? 'Partager le lien'}
        </button>
      </div>
    {/snippet}
  </Sheet>
{/if}
