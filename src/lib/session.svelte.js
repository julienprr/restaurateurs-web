import { api, setUnauthorizedHandler } from './api.js';

/**
 * État d'authentification, partagé par toute l'application.
 *
 * Volontairement hors de TanStack Query : c'est un état global unique dont
 * dépend le routage, pas une donnée de liste à mettre en cache.
 */
export const session = $state({
  user: null,
  /** true tant qu'on n'a pas encore interrogé le serveur au démarrage. */
  loading: true
});

export async function loadSession() {
  try {
    const data = await api.get('/auth/me');
    session.user = data.user;
  } catch {
    // Serveur injoignable : on considère l'utilisateur déconnecté.
    session.user = null;
  } finally {
    session.loading = false;
  }
}

export function setUser(user) {
  session.user = user;
  session.loading = false;
}

// Toute requête refusée en 401 déconnecte l'application : App bascule alors
// sur l'écran de connexion, sans que chaque écran ait à gérer ce cas.
setUnauthorizedHandler(() => {
  session.user = null;
  session.loading = false;
});

export async function logout() {
  try {
    await api.post('/auth/logout');
  } finally {
    session.user = null;
  }
}
