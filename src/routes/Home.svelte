<script>
  import { createQuery, useQueryClient } from '@tanstack/svelte-query';
  import Board from '../lib/components/Board.svelte';
  import ChalkButton from '../lib/components/ChalkButton.svelte';
  import { api } from '../lib/api.js';
  import { navigate } from '../lib/router.svelte.js';
  import { session, logout } from '../lib/session.svelte.js';
  import { InviteCodes } from '../lib/invite.js';

  const queryClient = useQueryClient();

  const groups = createQuery(() => ({
    queryKey: ['groups'],
    queryFn: () => api.get('/groups')
  }));

  let mode = $state(null); // null | 'creer' | 'rejoindre'
  let groupName = $state('');
  let inviteCode = $state('');
  let busy = $state(false);
  let error = $state(null);

  function reset() {
    mode = null;
    groupName = '';
    inviteCode = '';
    error = null;
  }

  async function createGroup(event) {
    event.preventDefault();
    if (!groupName.trim() || busy) return;

    busy = true;
    error = null;
    try {
      const group = await api.post('/groups', { name: groupName.trim() });
      await queryClient.invalidateQueries({ queryKey: ['groups'] });
      navigate(`/groupes/${group.id}`);
    } catch (e) {
      error = e.message;
    } finally {
      busy = false;
    }
  }

  async function joinGroup(event) {
    event.preventDefault();
    const code = InviteCodes.normalize(inviteCode);
    if (!code || busy) return;

    busy = true;
    error = null;
    try {
      const group = await api.post(`/invites/${encodeURIComponent(code)}/join`);
      await queryClient.invalidateQueries({ queryKey: ['groups'] });
      navigate(`/groupes/${group.id}`);
    } catch (e) {
      error = e.message;
    } finally {
      busy = false;
    }
  }
</script>

<Board title="Les Restaurateurs" subtitle="Salut {session.user.displayName}">
  {#snippet children()}
    {#if mode === 'creer'}
      <form class="flex flex-1 flex-col justify-center" onsubmit={createGroup}>
        <label class="mb-2 block text-xs tracking-wide text-muted" for="group-name">
          Le nom de ton groupe
        </label>
        <input
          id="group-name"
          bind:value={groupName}
          placeholder="Les Restaurateurs"
          maxlength="60"
          disabled={busy}
          class="mb-5 w-full rounded-md border-2 border-dotted border-line bg-transparent px-4 py-3
                 text-chalk placeholder:text-muted/60 focus:border-teal focus:outline-none"
        />
        {#if error}
          <p class="mb-4 text-center text-xs text-accent">{error}</p>
        {/if}
        <ChalkButton type="submit" disabled={!groupName.trim() || busy}>
          {#snippet children()}{busy ? 'Création...' : 'Créer le groupe'}{/snippet}
        </ChalkButton>
        <button type="button" class="mt-5 text-xs text-muted underline underline-offset-4" onclick={reset}>
          Annuler
        </button>
      </form>
    {:else if mode === 'rejoindre'}
      <form class="flex flex-1 flex-col justify-center" onsubmit={joinGroup}>
        <label class="mb-2 block text-xs tracking-wide text-muted" for="invite-code">
          Le code d'invitation
        </label>
        <input
          id="invite-code"
          bind:value={inviteCode}
          placeholder="ABCD2345"
          maxlength="12"
          autocapitalize="characters"
          disabled={busy}
          class="mb-5 w-full rounded-md border-2 border-dotted border-line bg-transparent px-4 py-3
                 text-center font-display text-3xl tracking-[0.2em] text-chalk
                 placeholder:text-muted/40 focus:border-teal focus:outline-none"
        />
        {#if error}
          <p class="mb-4 text-center text-xs text-accent">{error}</p>
        {/if}
        <ChalkButton type="submit" variant="teal" disabled={!inviteCode.trim() || busy}>
          {#snippet children()}{busy ? 'Un instant...' : 'Rejoindre le groupe'}{/snippet}
        </ChalkButton>
        <button type="button" class="mt-5 text-xs text-muted underline underline-offset-4" onclick={reset}>
          Annuler
        </button>
      </form>
    {:else if groups.isPending}
      <div class="flex flex-1 items-center justify-center">
        <p class="font-display text-2xl text-muted">Un instant...</p>
      </div>
    {:else if groups.isError}
      <div class="flex flex-1 flex-col items-center justify-center text-center">
        <p class="text-sm text-accent">{groups.error.message}</p>
        <button
          class="mt-4 text-xs text-teal underline underline-offset-4"
          onclick={() => groups.refetch()}
        >
          Réessayer
        </button>
      </div>
    {:else if groups.data.length === 0}
      <div class="flex flex-1 flex-col items-center justify-center text-center">
        <p class="font-display text-3xl text-teal">C'est vide ici</p>
        <p class="mt-3 max-w-xs text-sm leading-relaxed text-muted">
          Crée le groupe de tes amis, ou rejoins celui dans lequel on t'a invité.
        </p>
      </div>
    {:else}
      <h2 class="mb-2 font-display text-2xl text-teal">Tes groupes</h2>
      <div>
        {#each groups.data as group (group.id)}
          <button
            class="w-full border-b border-dotted border-line py-4 text-left last:border-b-0"
            onclick={() => navigate(`/groupes/${group.id}`)}
          >
            <div class="flex items-baseline gap-2">
              <span class="font-medium text-chalk">{group.name}</span>
              <span class="menu-leader" aria-hidden="true"></span>
              <span class="font-display text-xl text-accent">
                {group.memberCount}
                {group.memberCount > 1 ? 'membres' : 'membre'}
              </span>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  {/snippet}

  {#snippet footer()}
    {#if mode === null}
      <div class="space-y-3">
        <ChalkButton onclick={() => (mode = 'creer')}>
          {#snippet children()}+ Créer un groupe{/snippet}
        </ChalkButton>
        <ChalkButton variant="teal" onclick={() => (mode = 'rejoindre')}>
          {#snippet children()}J'ai un code d'invitation{/snippet}
        </ChalkButton>
        <button class="w-full py-1 text-xs text-muted underline underline-offset-4" onclick={logout}>
          Se déconnecter
        </button>
      </div>
    {/if}
  {/snippet}
</Board>
