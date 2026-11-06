<script>
  import Board from '../lib/components/Board.svelte';
  import ChalkButton from '../lib/components/ChalkButton.svelte';
  import { api } from '../lib/api.js';
  import { navigate, param } from '../lib/router.svelte.js';

  /**
   * Désinscription depuis le lien d'un email, sans être connecté.
   *
   * Un bouton plutôt qu'une désinscription à l'ouverture de la page : les
   * antivirus de messagerie ouvrent les liens pour les vérifier, et
   * désinscriraient les gens à leur insu.
   */
  const token = param('token');

  let done = $state(false);
  let busy = $state(false);
  let error = $state(token ? null : 'Ce lien est incomplet.');

  async function confirm() {
    if (busy) return;
    busy = true;
    error = null;
    try {
      await api.post(`/notifications/unsubscribe?token=${encodeURIComponent(token)}`);
      done = true;
    } catch (e) {
      error = e.message;
    } finally {
      busy = false;
    }
  }
</script>

<Board title="Les Restaurateurs">
  {#snippet children()}
    <div class="flex flex-1 flex-col items-center justify-center text-center">
      {#if done}
        <p class="font-display text-3xl text-teal">C'est noté</p>
        <p class="mt-3 max-w-xs text-sm leading-relaxed text-muted">
          Tu ne recevras plus les emails des sorties. Tu peux les rétablir depuis
          l'accueil de l'application.
        </p>
      {:else}
        <p class="font-display text-3xl text-teal">Plus d'emails ?</p>
        <p class="mt-3 max-w-xs text-sm leading-relaxed text-muted">
          Tu ne recevras plus d'email pour les sorties prévues, les restaurants
          choisis, ni les sorties à noter. Les liens de connexion, eux,
          continueront d'arriver.
        </p>
        {#if error}
          <p class="mt-4 text-xs text-accent">{error}</p>
        {/if}
      {/if}
    </div>
  {/snippet}

  {#snippet footer()}
    <div class="space-y-3">
      {#if !done && token}
        <ChalkButton onclick={confirm} disabled={busy}>
          {#snippet children()}Ne plus recevoir ces emails{/snippet}
        </ChalkButton>
      {/if}
      <button
        class="w-full py-1 text-xs text-muted underline underline-offset-4"
        onclick={() => navigate('/')}
      >
        Aller à l'application
      </button>
    </div>
  {/snippet}
</Board>
