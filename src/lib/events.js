/**
 * Flux d'événements d'un groupe.
 *
 * EventSource gère seul la reconnexion en cas de coupure réseau : rien à
 * réimplémenter côté application.
 *
 * @param groupId  identifiant du groupe à écouter
 * @param handlers objet { nomDeLEvenement: (données) => void }
 * @returns une fonction à appeler pour fermer le flux
 */
export function subscribeToGroup(groupId, handlers) {
  const source = new EventSource(`/api/groups/${groupId}/events`);

  const listeners = Object.entries(handlers).map(([name, handler]) => {
    const listener = (event) => {
      let payload = null;
      try {
        payload = event.data ? JSON.parse(event.data) : null;
      } catch {
        // « connected » transporte du texte brut, pas du JSON.
        payload = event.data;
      }
      handler(payload);
    };
    source.addEventListener(name, listener);
    return [name, listener];
  });

  return () => {
    for (const [name, listener] of listeners) {
      source.removeEventListener(name, listener);
    }
    source.close();
  };
}
