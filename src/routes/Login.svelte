<script>
  import Board from '../lib/components/Board.svelte';
  import ChalkButton from '../lib/components/ChalkButton.svelte';
  import { api } from '../lib/api.js';
  import { param } from '../lib/router.svelte.js';

  let email = $state('');
  let sent = $state(false);
  let sending = $state(false);
  let error = $state(null);

  const emailValid = $derived(/^\S+@\S+\.\S+$/.test(email.trim()));

  // Arrivée par un lien d'invitation : le groupe sera rejoint dès la connexion.
  // Dérivé et non figé : la redirection depuis /rejoindre/:code ajoute le
  // paramètre après le montage du composant.
  const inviteCode = $derived(param('invite'));

  async function submit(event) {
    event.preventDefault();
    if (!emailValid || sending) return;

    sending = true;
    error = null;
    try {
      await api.post('/auth/request-link', { email: email.trim(), inviteCode });
      sent = true;
    } catch (e) {
      error = e.message;
    } finally {
      sending = false;
    }
  }
</script>

<Board title="Les Restaurateurs" subtitle="On mange où, ce soir ?">
  {#snippet children()}
    {#if sent}
      <div class="flex flex-1 flex-col items-center justify-center text-center">
        <p class="font-display text-3xl text-accent">C'est envoyé</p>
        <p class="mt-3 text-sm text-muted">
          Un lien de connexion vient de partir vers<br />
          <span class="text-chalk">{email}</span>
        </p>
        <p class="mt-6 text-xs text-muted">
          Le lien est valable 15 minutes. Pense à regarder tes spams.
        </p>
        <button
          type="button"
          class="mt-6 text-xs text-teal underline underline-offset-4"
          onclick={() => {
            sent = false;
            error = null;
          }}
        >
          Utiliser une autre adresse
        </button>
      </div>
    {:else}
      <form class="flex flex-1 flex-col justify-center" onsubmit={submit}>
        {#if inviteCode}
          <p class="mb-6 rounded-md border border-dotted border-teal px-4 py-3 text-center text-xs text-teal">
            Tu as été invité à rejoindre un groupe.<br />
            Connecte-toi pour y entrer.
          </p>
        {/if}

        <label class="mb-2 block text-xs tracking-wide text-muted" for="email">
          Ton adresse email
        </label>
        <input
          id="email"
          type="email"
          bind:value={email}
          placeholder="prenom@exemple.fr"
          autocomplete="email"
          disabled={sending}
          class="mb-5 w-full rounded-md border-2 border-dotted border-line bg-transparent px-4 py-3
                 text-chalk placeholder:text-muted/60 focus:border-teal focus:outline-none
                 disabled:opacity-50"
        />

        {#if error}
          <p class="mb-4 text-center text-xs text-accent">{error}</p>
        {/if}

        <ChalkButton type="submit" disabled={!emailValid || sending}>
          {#snippet children()}
            {sending ? 'Envoi en cours...' : 'Recevoir mon lien de connexion'}
          {/snippet}
        </ChalkButton>

        <p class="mt-5 text-center text-xs leading-relaxed text-muted">
          Pas de mot de passe à retenir.<br />
          On t'envoie un lien, tu cliques, tu es connecté.
        </p>
      </form>
    {/if}
  {/snippet}
</Board>
