<script>
  import { createQuery, useQueryClient } from '@tanstack/svelte-query';
  import Board from '../lib/components/Board.svelte';
  import ChalkButton from '../lib/components/ChalkButton.svelte';
  import { api } from '../lib/api.js';
  import { navigate } from '../lib/router.svelte.js';

  let { code } = $props();

  const queryClient = useQueryClient();

  const invite = createQuery(() => ({
    queryKey: ['invite', code],
    queryFn: () => api.get(`/invites/${encodeURIComponent(code)}`),
    retry: false
  }));

  let busy = $state(false);
  let error = $state(null);

  async function accept() {
    if (busy) return;
    busy = true;
    error = null;
    try {
      const group = await api.post(`/invites/${encodeURIComponent(code)}/join`);
      await queryClient.invalidateQueries({ queryKey: ['groups'] });
      navigate(`/groupes/${group.id}`, { replace: true });
    } catch (e) {
      error = e.message;
      busy = false;
    }
  }
</script>

<Board title="Les Restaurateurs">
  {#snippet children()}
    <div class="flex flex-1 flex-col items-center justify-center text-center">
      {#if invite.isPending}
        <p class="font-display text-2xl text-muted">Un instant...</p>
      {:else if invite.isError}
        <p class="font-display text-3xl text-accent">Invitation introuvable</p>
        <p class="mt-3 max-w-xs text-sm text-muted">{invite.error.message}</p>
      {:else}
        <p class="text-xs tracking-widest text-muted">ON T'INVITE DANS</p>
        <p class="mt-3 font-display text-4xl text-accent">{invite.data.name}</p>
        <p class="mt-2 text-sm text-muted">
          {invite.data.memberCount}
          {invite.data.memberCount > 1 ? 'membres' : 'membre'}
        </p>

        {#if invite.data.alreadyMember}
          <p class="mt-6 text-xs text-teal">Tu fais déjà partie de ce groupe.</p>
        {/if}

        {#if error}
          <p class="mt-6 text-xs text-accent">{error}</p>
        {/if}
      {/if}
    </div>
  {/snippet}

  {#snippet footer()}
    <div class="space-y-3">
      {#if invite.isSuccess}
        <ChalkButton onclick={accept} disabled={busy}>
          {#snippet children()}
            {busy ? 'Un instant...' : invite.data.alreadyMember ? 'Aller au groupe' : 'Rejoindre le groupe'}
          {/snippet}
        </ChalkButton>
      {/if}
      <button
        class="w-full py-1 text-xs text-muted underline underline-offset-4"
        onclick={() => navigate('/')}
      >
        Retour à mes groupes
      </button>
    </div>
  {/snippet}
</Board>
