<script>
  import { useQueryClient } from '@tanstack/svelte-query';
  import Board from '../lib/components/Board.svelte';
  import ChalkButton from '../lib/components/ChalkButton.svelte';
  import ChoiceChips from '../lib/components/ChoiceChips.svelte';
  import { api } from '../lib/api.js';
  import { navigate } from '../lib/router.svelte.js';

  let { groupId } = $props();

  const queryClient = useQueryClient();

  const CUISINES = [
    'Italien', 'Japonais', 'Français', 'Vietnamien', 'Chinois', 'Thaï',
    'Indien', 'Libanais', 'Coréen', 'Mexicain', 'Burger', 'Pizza',
    'Végétarien', 'Autre'
  ];
  const BUDGETS = ['€', '€€', '€€€'];

  // 'lien' : on attend un lien Maps — 'fiche' : formulaire à compléter
  let step = $state('lien');
  let mapsUrl = $state('');
  let reading = $state(false);
  let saving = $state(false);
  let error = $state(null);
  let notice = $state(null);

  let form = $state({
    name: '',
    address: '',
    city: '',
    lat: null,
    lng: null,
    mapsUrl: '',
    cuisine: null,
    budget: null
  });

  async function readLink(event) {
    event.preventDefault();
    if (!mapsUrl.trim() || reading) return;

    reading = true;
    error = null;
    try {
      const preview = await api.post('/maps/preview', { url: mapsUrl.trim() });
      form = {
        name: preview.name ?? '',
        address: preview.address ?? '',
        city: preview.city ?? '',
        lat: preview.lat,
        lng: preview.lng,
        mapsUrl: preview.mapsUrl ?? mapsUrl.trim(),
        cuisine: null,
        budget: null
      };
      notice = preview.name
        ? 'Vérifie que tout est bon, puis complète.'
        : "Le nom n'a pas pu être lu, complète-le à la main.";
      step = 'fiche';
    } catch (e) {
      // L'échec de lecture ne doit jamais bloquer : on bascule en saisie
      // manuelle en conservant le lien collé.
      error = e.message;
      form = { ...form, mapsUrl: mapsUrl.trim() };
    } finally {
      reading = false;
    }
  }

  function skipToManual() {
    form = { ...form, mapsUrl: mapsUrl.trim() };
    notice = null;
    error = null;
    step = 'fiche';
  }

  async function save(event) {
    event.preventDefault();
    if (!form.name.trim() || saving) return;

    saving = true;
    error = null;
    try {
      await api.post(`/groups/${groupId}/restaurants`, {
        name: form.name.trim(),
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        lat: form.lat,
        lng: form.lng,
        mapsUrl: form.mapsUrl || null,
        cuisine: form.cuisine,
        budget: form.budget
      });
      await queryClient.invalidateQueries({ queryKey: ['restaurants', groupId] });
      navigate(`/groupes/${groupId}`, { replace: true });
    } catch (e) {
      error = e.message;
    } finally {
      saving = false;
    }
  }

  const champ =
    'w-full rounded-md border-2 border-dotted border-line bg-transparent px-4 py-3 ' +
    'text-chalk placeholder:text-muted/60 focus:border-teal focus:outline-none';
</script>

<Board title="Une adresse de plus" subtitle={step === 'lien' ? 'Colle le lien, on remplit le reste' : null}>
  {#snippet children()}
    {#if step === 'lien'}
      <form class="flex flex-1 flex-col justify-center" onsubmit={readLink}>
        <label class="mb-2 block text-xs tracking-wide text-muted" for="maps-url">
          Le lien Google Maps
        </label>
        <input
          id="maps-url"
          type="url"
          bind:value={mapsUrl}
          placeholder="https://maps.app.goo.gl/..."
          autocomplete="off"
          disabled={reading}
          class="{champ} mb-5"
        />

        {#if error}
          <p class="mb-4 text-center text-xs text-accent">{error}</p>
        {/if}

        <ChalkButton type="submit" disabled={!mapsUrl.trim() || reading}>
          {#snippet children()}{reading ? 'Lecture du lien...' : 'Lire le lien'}{/snippet}
        </ChalkButton>

        <p class="mt-5 text-center text-xs leading-relaxed text-muted">
          Depuis Google Maps : Partager, puis Copier le lien.
        </p>
        <button
          type="button"
          class="mt-6 text-xs text-teal underline underline-offset-4"
          onclick={skipToManual}
        >
          Saisir à la main
        </button>
      </form>
    {:else}
      <form onsubmit={save}>
        {#if notice}
          <p class="mb-4 rounded-md border border-dotted border-teal px-3 py-2 text-center text-xs text-teal">
            {notice}
          </p>
        {/if}

        <label class="mb-2 block text-xs tracking-wide text-muted" for="name">Le nom</label>
        <input id="name" bind:value={form.name} placeholder="Chez Aline" class="{champ} mb-5" />

        <label class="mb-2 block text-xs tracking-wide text-muted" for="city">La ville</label>
        <input id="city" bind:value={form.city} placeholder="Paris" class="{champ} mb-5" />

        <label class="mb-2 block text-xs tracking-wide text-muted" for="address">
          L'adresse <span class="text-muted/60">(facultatif)</span>
        </label>
        <input id="address" bind:value={form.address} placeholder="31 rue Saint-Sabin" class="{champ} mb-5" />

        <ChoiceChips label="Le type de cuisine" options={CUISINES} bind:value={form.cuisine} />
        <ChoiceChips label="Le budget" options={BUDGETS} bind:value={form.budget} />

        {#if form.mapsUrl}
          <p class="mb-5 truncate text-xs text-muted">
            Lien conservé :
            <a href={form.mapsUrl} target="_blank" rel="noopener" class="text-teal underline underline-offset-2">
              {form.mapsUrl}
            </a>
          </p>
        {/if}

        {#if error}
          <p class="mb-4 text-center text-xs text-accent">{error}</p>
        {/if}

        <ChalkButton type="submit" disabled={!form.name.trim() || saving}>
          {#snippet children()}{saving ? 'Ajout...' : 'Ajouter au tableau'}{/snippet}
        </ChalkButton>
      </form>
    {/if}
  {/snippet}

  {#snippet footer()}
    <button
      class="w-full py-1 text-xs text-muted underline underline-offset-4"
      onclick={() => navigate(`/groupes/${groupId}`)}
    >
      Annuler
    </button>
  {/snippet}
</Board>
