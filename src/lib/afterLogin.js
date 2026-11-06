/**
 * Retour à la page voulue après connexion.
 *
 * Un lien d'email mène à un groupe. Si la session a expiré, on passe par la
 * connexion, dont le lien magique arrive... par un autre email, souvent ouvert
 * dans un autre onglet. On garde donc la destination dans localStorage, que
 * les onglets partagent, plutôt que dans l'URL.
 */

const KEY = 'apres-connexion';

export function rememberDestination(path) {
  try {
    localStorage.setItem(KEY, path);
  } catch {
    // Navigation privée ou stockage bloqué : on retombera sur l'accueil.
  }
}

/** La destination gardée, effacée au passage : elle ne sert qu'une fois. */
export function takeDestination() {
  try {
    const path = localStorage.getItem(KEY);
    localStorage.removeItem(KEY);
    // N'accepter qu'un chemin interne, jamais une adresse complète.
    return path && path.startsWith('/') && !path.startsWith('//') ? path : null;
  } catch {
    return null;
  }
}
