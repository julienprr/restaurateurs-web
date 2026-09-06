<script>
  import Board from '../lib/components/Board.svelte';
  import ChalkButton from '../lib/components/ChalkButton.svelte';
  import { api } from '../lib/api.js';
  import { navigate, param } from '../lib/router.svelte.js';
  import { setUser } from '../lib/session.svelte.js';

  import { onMount } from 'svelte';

  let error = $state(null);

  // Le lien magique est à usage unique : la vérification doit partir une seule
  // fois. onMount plutôt que $effect, qui se rejouerait au changement d'URL.
  onMount(async () => {
    const token = param('token');
    if (!token) {
      error = 'Ce lien est incomplet. Demande-en un nouveau.';
      return;
    }

    try {
      const data = await api.get(`/auth/verify?token=${encodeURIComponent(token)}`);
      setUser(data.user);
      // replace : revenir en arrière ne doit pas rejouer un lien consommé.
      navigate(data.inviteCode ? `/rejoindre/${data.inviteCode}` : '/', { replace: true });
    } catch (e) {
      error = e.message;
    }
  });
</script>

<Board title="Les Restaurateurs">
  {#snippet children()}
    <div class="flex flex-1 flex-col items-center justify-center text-center">
      {#if error}
        <p class="font-display text-3xl text-accent">Raté</p>
        <p class="mt-3 max-w-xs text-sm text-muted">{error}</p>
        <div class="mt-8 w-full max-w-xs">
          <ChalkButton onclick={() => navigate('/')}>
            {#snippet children()}Demander un nouveau lien{/snippet}
          </ChalkButton>
        </div>
      {:else}
        <p class="font-display text-3xl text-teal">Connexion en cours</p>
        <p class="mt-3 text-sm text-muted">Deux secondes...</p>
      {/if}
    </div>
  {/snippet}
</Board>
