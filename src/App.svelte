<script>
  import { onMount } from 'svelte';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import { route, match, navigate } from './lib/router.svelte.js';
  import { session, loadSession } from './lib/session.svelte.js';
  import Board from './lib/components/Board.svelte';
  import Login from './routes/Login.svelte';
  import Verify from './routes/Verify.svelte';
  import Home from './routes/Home.svelte';
  import Group from './routes/Group.svelte';
  import AddRestaurant from './routes/AddRestaurant.svelte';
  import Join from './routes/Join.svelte';
  import Unsubscribe from './routes/Unsubscribe.svelte';
  import { rememberDestination } from './lib/afterLogin.js';

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Les mises à jour arrivent par SSE : inutile de refetch au focus.
        refetchOnWindowFocus: false,
        retry: 1
      }
    }
  });

  onMount(loadSession);

  const groupRoute = $derived(match('/groupes/:id'));
  const addRoute = $derived(match('/groupes/:id/ajouter'));
  const joinRoute = $derived(match('/rejoindre/:code'));

  // Une invitation ouverte sans être connecté mène au formulaire de connexion,
  // qui conservera le code pour rejoindre le groupe juste après.
  $effect(() => {
    if (!session.loading && !session.user && joinRoute) {
      navigate(`/?invite=${joinRoute.code}`, { replace: true });
    }
  });

  // Un lien d'email vers un groupe, ouvert sans session : on y reviendra
  // après la connexion.
  $effect(() => {
    if (!session.loading && !session.user && groupRoute) {
      rememberDestination(route.path + route.search);
    }
  });
</script>

<QueryClientProvider client={queryClient}>
  {#if route.path === '/auth/verify'}
    <Verify />
  {:else if route.path === '/desinscription'}
    <Unsubscribe />
  {:else if session.loading}
    <Board title="Les Restaurateurs">
      {#snippet children()}
        <div class="flex flex-1 items-center justify-center">
          <p class="font-display text-2xl text-muted">Un instant...</p>
        </div>
      {/snippet}
    </Board>
  {:else if !session.user}
    <Login />
  {:else if joinRoute}
    <Join code={joinRoute.code} />
  {:else if addRoute}
    <AddRestaurant groupId={addRoute.id} />
  {:else if groupRoute}
    <Group id={groupRoute.id} />
  {:else}
    <Home />
  {/if}
</QueryClientProvider>
