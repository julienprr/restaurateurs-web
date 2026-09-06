/**
 * Client HTTP de l'API. Le cookie de session est posé par le serveur en
 * httpOnly : rien à gérer côté JS, on demande juste à fetch de l'envoyer.
 */

export class ApiError extends Error {
  constructor(status, message, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

/**
 * Appelé dès qu'une requête revient en 401, c'est-à-dire quand la session a
 * expiré ou été révoquée pendant la navigation. Enregistré par le module de
 * session, qui ne peut pas être importé ici sans créer un cycle.
 */
let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function request(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    // Session expirée en cours de route : on ramène l'utilisateur à la
    // connexion plutôt que d'afficher une erreur sur chaque écran.
    if (res.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    throw new ApiError(res.status, data?.message ?? `Erreur ${res.status}`, data);
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  del: (path) => request('DELETE', path)
};
