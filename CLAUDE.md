# CLAUDE.md — Front des Restaurateurs

Ce fichier guide Claude Code dans ce dépôt.

---

## Comment me parler

- **En français**, systématiquement.
- **Direct et efficace**, pas de phrases d'introduction creuses.
- **Poser des questions** quand le contexte n'est pas clair, plutôt que deviner.
- **Honnête**, même quand ça ne fait pas plaisir. Pas de flagornerie.
- **Pour les décisions importantes**, donner les pour et les contre.
- **Pas de tirets longs** dans les réponses.
- Julien débute en développement assisté : expliquer ce qui a été fait et
  pourquoi.

## Le projet

Front de l'application « Les Restaurateurs ». Le produit est décrit dans le
`PRODUIT.md` du dépôt `restaurateurs-api`. La carte du code est dans
[README.md](README.md).

## Décisions techniques, à ne pas re-litiger

- **Vite 7**, pas la 8 : le Node local de Julien est en 22.8, Vite 8 exige
  22.12 ou plus.
- **Pas de routeur tiers** : `lib/router.svelte.js` suffit pour six écrans.
- **Svelte 5 avec runes** (`$state`, `$derived`, `$props`, `$effect`), jamais
  l'ancienne syntaxe à `export let`.
- **TanStack Query pour les listes**, mais **pas pour la session** : l'état
  d'authentification est un état global unique dont dépend le routage, il vit
  dans `session.svelte.js`.
- **Front et API sur le même domaine**, l'API sous `/api`. Le cookie de session
  reste ainsi confiné à cette application et il n'y a aucun CORS. Ne pas
  séparer en deux sous-domaines.
- **Le service worker n'intercepte pas `/api`** (`navigateFallbackDenylist`),
  sans quoi il servirait `index.html` aux appels d'API.

## Pièges éprouvés

- **Un `$effect` se rejoue quand ses dépendances changent.** Pour une action
  qui ne doit partir qu'une fois, comme consommer un lien magique, utiliser
  `onMount`.
- **Une valeur lue d'une query string doit être `$derived`**, pas figée au
  montage : une redirection peut ajouter le paramètre après l'affichage du
  composant. C'est ce qui faisait perdre le code d'invitation.
- **`navigator.clipboard` et `navigator.share` n'existent pas partout.**
  Toujours prévoir le repli, et un retour visuel.
- **Le rechargement à chaud peut réinitialiser l'état d'un composant** pendant
  qu'on teste. Un comportement qui semble absent après une modification mérite
  un vrai rechargement avant d'être déclaré cassé.

## Le thème

Les couleurs et polices sont définies une seule fois dans `app.css` via
`@theme`. Ne jamais écrire une couleur en dur dans un composant : utiliser
`text-accent`, `border-line`, etc.

## Méthode de travail

Développement par tranches testables, un commit par tranche validée.

**Ne jamais annoncer qu'une chose fonctionne sans l'avoir observée** dans le
navigateur. Et vérifier le parcours entier, pas l'écran isolé : les bugs les
plus coûteux de ce projet étaient des valeurs perdues entre deux écrans.

## Périmètre

Le `PRODUIT.md` de l'API liste ce qui est volontairement absent. Ne pas
l'implémenter sans demande explicite.
