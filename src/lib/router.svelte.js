/**
 * Routeur minimal basé sur l'History API.
 * L'application n'a qu'une poignée d'écrans : une dépendance de routage
 * complète serait disproportionnée.
 */
export const route = $state({
  path: window.location.pathname,
  search: window.location.search
});

function sync() {
  route.path = window.location.pathname;
  route.search = window.location.search;
}

export function navigate(to, { replace = false } = {}) {
  if (to === route.path + route.search) return;
  if (replace) {
    window.history.replaceState({}, '', to);
  } else {
    window.history.pushState({}, '', to);
  }
  sync();
  window.scrollTo(0, 0);
}

/** Lit un paramètre de la query string courante. */
export function param(name) {
  return new URLSearchParams(route.search).get(name);
}

/**
 * Compare le chemin courant à un motif contenant des segments dynamiques,
 * par exemple `/groupes/:id`.
 *
 * @returns les valeurs des segments dynamiques, ou null si le motif ne
 *          correspond pas
 */
export function match(pattern) {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = route.path.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) return null;

  const params = {};
  for (const [i, part] of patternParts.entries()) {
    if (part.startsWith(':')) {
      params[part.slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (part !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

window.addEventListener('popstate', sync);
