<script>
  import { createQuery, useQueryClient } from '@tanstack/svelte-query';
  import Board from '../lib/components/Board.svelte';
  import ChalkButton from '../lib/components/ChalkButton.svelte';
  import RestaurantRow from '../lib/components/RestaurantRow.svelte';
  import VoteRow from '../lib/components/VoteRow.svelte';
  import Sheet from '../lib/components/Sheet.svelte';
  import DrawResultSheet from '../lib/components/DrawResultSheet.svelte';
  import OutingCard from '../lib/components/OutingCard.svelte';
  import OutingDateSheet from '../lib/components/OutingDateSheet.svelte';
  import PastOutings from '../lib/components/PastOutings.svelte';
  import { api } from '../lib/api.js';
  import { todayInParis } from '../lib/outings.js';
  import { navigate, param } from '../lib/router.svelte.js';
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

  // La sortie en préparation, ou null. Sans elle, on ne peut pas voter.
  const fetchOuting = () => api.get(`/groups/${id}/outings/planned`).then((body) => body.outing);
  const outing = createQuery(() => ({
    queryKey: ['outing', id],
    queryFn: fetchOuting,
    retry: false
  }));

  // Les emails ouvrent directement le bon onglet : ?onglet=sortie ou sorties.
  const TABS_FROM_LINK = { sortie: 'choisir', sorties: 'sorties' };
  let tab = $state(TABS_FROM_LINK[param('onglet')] ?? 'liste'); // 'liste' | 'choisir' | 'sorties'
  let selected = $state(null);
  let showMembers = $state(false);
  let drawResult = $state(null);
  let shareFeedback = $state(null);
  let busy = $state(false);
  let error = $state(null);
  let live = $state(false);
  // Panneaux ouverts par-dessus l'onglet de la sortie.
  let dateSheet = $state(null); // null | 'prevoir' | 'deplacer'
  let confirmCancel = $state(false);
  let conflict = $state(null); // message de l'API quand une sortie est prévue un autre jour

  // Flux temps réel : toute modification faite par un autre membre recharge la
  // liste. Le tirage, lui, s'affiche chez tout le monde en même temps.
  $effect(() => {
    const groupId = id;
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['restaurants', groupId] });
    // Une sortie qui change peut changer la liste : les voix repartent de
    // zéro après une annulation, le restaurant passe « déjà fait » à la clôture.
    // Une sortie close rejoint l'historique, et une note change le classement.
    const refreshPast = () => {
      queryClient.invalidateQueries({ queryKey: ['past-outings', groupId] });
      queryClient.invalidateQueries({ queryKey: ['ranking', groupId] });
    };
    const refreshOuting = () => {
      queryClient.invalidateQueries({ queryKey: ['outing', groupId] });
      refreshPast();
      refresh();
    };

    const unsubscribe = subscribeToGroup(groupId, {
      connected: () => (live = true),
      votes_changed: refresh,
      restaurants_changed: refresh,
      outing_changed: refreshOuting,
      ratings_changed: refreshPast,
      draw_result: (payload) => {
        drawResult = payload;
        queryClient.invalidateQueries({ queryKey: ['outing', groupId] });
      }
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

  async function refreshOuting() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['outing', id] }),
      refreshList()
    ]);
  }

  /** Enveloppe commune des actions : un seul clic à la fois, erreur affichée. */
  async function run(action) {
    if (busy) return;
    busy = true;
    error = null;
    try {
      await action();
    } catch (e) {
      error = e.message;
    } finally {
      busy = false;
    }
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

  function decide(mode) {
    return run(async () => {
      // Le résultat arrive aussi par le flux temps réel ; l'affecter ici évite
      // d'attendre l'aller-retour pour celui qui a appuyé.
      drawResult = await api.post(`/outings/${outing.data.id}/decide?mode=${mode}`);
      await refreshOuting();
    });
  }

  function plan(date) {
    return run(async () => {
      await api.post(`/groups/${id}/outings`, { plannedFor: date });
      dateSheet = null;
      await refreshOuting();
    });
  }

  function reschedule(date) {
    return run(async () => {
      await api.patch(`/outings/${outing.data.id}`, { plannedFor: date });
      dateSheet = null;
      await refreshOuting();
    });
  }

  function cancelOuting() {
    return run(async () => {
      await api.post(`/outings/${outing.data.id}/cancel`);
      confirmCancel = false;
      await refreshOuting();
    });
  }

  /**
   * « Choisir ce soir » : l'API crée la sortie du jour et tire au sort d'un
   * coup. Si une sortie est prévue un autre jour, elle répond 409 et on
   * propose de l'avancer plutôt que d'échouer.
   */
  function drawTonight() {
    return run(async () => {
      try {
        drawResult = await api.post(`/groups/${id}/outings/tonight?mode=hasard`);
      } catch (e) {
        if (e.status !== 409) throw e;
        conflict = e.message;
      }
      await refreshOuting();
    });
  }

  function moveToTonightAndDraw() {
    return run(async () => {
      // Relue plutôt que prise dans le cache : un autre membre a pu la
      // modifier entre-temps.
      const current = await queryClient.fetchQuery({ queryKey: ['outing', id], queryFn: fetchOuting });
      if (current) {
        await api.patch(`/outings/${current.id}`, { plannedFor: todayInParis() });
      }
      conflict = null;
      drawResult = await api.post(`/groups/${id}/outings/tonight?mode=hasard`);
      await refreshOuting();
    });
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

  const decided = $derived(Boolean(outing.data?.restaurant));
  const plannedTonight = $derived(outing.data?.plannedFor === todayInParis());

  const sousTitre = $derived(
    !restaurants.data
      ? null
      : tab === 'liste'
        ? `${aTester.length} adresse${aTester.length > 1 ? 's' : ''} à tester`
        : tab === 'sorties'
          ? 'Nos sorties, notées'
        : !outing.data
          ? 'Aucune sortie prévue'
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
          La sortie
        </button>
        <button
          class="flex-1 rounded border border-dotted px-3 py-2 {tab === 'sorties'
            ? 'border-accent text-accent'
            : 'border-line text-muted'}"
          onclick={() => (tab = 'sorties')}
        >
          Nos sorties
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
      {:else if tab === 'sorties'}
        <PastOutings groupId={id} />
      {:else if outing.isPending}
        <div class="flex flex-1 items-center justify-center">
          <p class="font-display text-2xl text-muted">Un instant...</p>
        </div>
      {:else if outing.isError}
        <div class="flex flex-1 flex-col items-center justify-center text-center">
          <p class="text-sm text-accent">{outing.error.message}</p>
        </div>
      {:else if !outing.data}
        <div class="flex flex-1 flex-col items-center justify-center text-center">
          <p class="font-display text-3xl text-teal">Aucune sortie prévue</p>
          <p class="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Prévois une date pour ouvrir le vote. Ou, si c'est pour ce soir et
            que personne ne veut décider, laisse le sort choisir.
          </p>
          {#if aTester.length === 0}
            <p class="mt-3 max-w-xs text-xs leading-relaxed text-accent">
              Aucune adresse à tester pour l'instant : ajoutes-en une avant de tirer au sort.
            </p>
          {/if}
        </div>

        {#if error}
          <p class="mt-4 text-center text-xs text-accent">{error}</p>
        {/if}
      {:else}
        <OutingCard
          outing={outing.data}
          disabled={busy}
          onreschedule={() => (dateSheet = 'deplacer')}
          oncancel={() => (confirmCancel = true)}
        />

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
      {:else if tab === 'sorties'}
        <!-- On note depuis chaque sortie : pas d'action globale ici. -->
      {:else if outing.isSuccess && !outing.data}
        <ChalkButton onclick={() => (dateSheet = 'prevoir')} disabled={busy}>
          {#snippet children()}Prévoir une sortie{/snippet}
        </ChalkButton>
        <ChalkButton variant="teal" onclick={drawTonight} disabled={busy || aTester.length === 0}>
          {#snippet children()}Choisir ce soir{/snippet}
        </ChalkButton>
      {:else if outing.data && aTester.length > 0}
        <!-- Trancher à nouveau remplace le choix : c'est un rattrapage, pas une nouvelle sortie. -->
        <ChalkButton onclick={() => decide('votes')} disabled={busy}>
          {#snippet children()}{decided ? 'Trancher à nouveau selon les votes' : 'Trancher selon les votes'}{/snippet}
        </ChalkButton>
        <ChalkButton variant="teal" onclick={() => decide('hasard')} disabled={busy}>
          {#snippet children()}{decided ? 'Retirer au sort' : 'Tirer au sort'}{/snippet}
        </ChalkButton>
        {#if !plannedTonight}
          <button
            class="w-full py-1 text-xs text-teal underline underline-offset-4"
            onclick={drawTonight}
            disabled={busy}
          >
            Finalement, on y va ce soir ?
          </button>
        {/if}
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

{#if dateSheet === 'prevoir'}
  <OutingDateSheet
    title="Prévoir une sortie"
    confirmLabel="Ouvrir le vote"
    busy={busy}
    {error}
    onconfirm={plan}
    onclose={() => (dateSheet = null)}
  />
{:else if dateSheet === 'deplacer' && outing.data}
  <OutingDateSheet
    title="Changer la date"
    confirmLabel="Déplacer la sortie"
    initial={outing.data.plannedFor}
    busy={busy}
    {error}
    onconfirm={reschedule}
    onclose={() => (dateSheet = null)}
  />
{/if}

{#if confirmCancel}
  <Sheet title="Annuler la sortie ?" onclose={() => (confirmCancel = false)}>
    {#snippet children()}
      <p class="mb-5 text-sm leading-relaxed text-muted">
        Les votes de cette sortie seront perdus. Vous pourrez en prévoir une autre aussitôt.
      </p>
      <div class="space-y-3">
        <ChalkButton onclick={cancelOuting} disabled={busy}>
          {#snippet children()}Oui, annuler{/snippet}
        </ChalkButton>
        <ChalkButton variant="muted" onclick={() => (confirmCancel = false)}>
          {#snippet children()}Garder la sortie{/snippet}
        </ChalkButton>
      </div>
    {/snippet}
  </Sheet>
{/if}

{#if conflict}
  <Sheet title="Une sortie est déjà prévue" onclose={() => (conflict = null)}>
    {#snippet children()}
      <p class="mb-5 text-sm leading-relaxed text-muted">{conflict}</p>
      <div class="space-y-3">
        <ChalkButton onclick={moveToTonightAndDraw} disabled={busy}>
          {#snippet children()}L'avancer à ce soir et tirer au sort{/snippet}
        </ChalkButton>
        <ChalkButton variant="muted" onclick={() => (conflict = null)}>
          {#snippet children()}Garder la date prévue{/snippet}
        </ChalkButton>
      </div>
    {/snippet}
  </Sheet>
{/if}

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
