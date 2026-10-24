# Les Restaurateurs — Front

Application web mobile-first. Svelte 5 (runes), Vite 7, Tailwind 4, PWA.

L'API vit dans [restaurateurs-api](https://github.com/julienprr/restaurateurs-api),
les manifests dans [vps-cluster-k3s](https://github.com/julienprr/vps-cluster-k3s).

En production : https://restaurateurs.julienprr.com

## Démarrer en local

```bash
npm install
npm run dev        # http://localhost:5173
```

L'API doit tourner en parallèle sur le port **8081** : Vite lui fait suivre
tout ce qui commence par `/api`. Pas de CORS à gérer, le front et l'API sont
vus comme une même origine.

```bash
npm run build      # vérifie que la production compile
npm run preview    # sert le build
```

## Carte du code

```
main.js              point d'entrée, monte App
App.svelte           routage et garde d'authentification
app.css              thème « Ardoise du bistrot », variables Tailwind

lib/
  api.js             client HTTP, bascule la session sur 401
  session.svelte.js  état d'authentification partagé
  router.svelte.js   routeur maison, History API, match('/groupes/:id')
  events.js          abonnement au flux temps réel (SSE)
  invite.js          normalisation des codes d'invitation

lib/components/
  Board.svelte       cadre en pointillés, titre, pied de page
  ChalkButton.svelte bouton « craie »
  RestaurantRow.svelte  ligne de menu avec leader en pointillés
  VoteRow.svelte     ligne de vote avec compteur
  Sheet.svelte       panneau qui monte du bas
  ChoiceChips.svelte choix rapides (cuisine, budget)
  DrawResultSheet.svelte  annonce du verdict

routes/
  Login.svelte       saisie de l'email, demande du lien
  Verify.svelte      consomme le lien magique
  Home.svelte        mes groupes, créer, rejoindre
  Group.svelte       écran principal : liste et vote, deux onglets
  AddRestaurant.svelte  collage du lien Maps, puis fiche
  Join.svelte        aperçu d'une invitation
```

## Le thème

« Ardoise du bistrot ». Les couleurs et les polices sont définies une fois dans
`app.css`, via `@theme` de Tailwind 4.

| Rôle | Variable | Valeur |
|---|---|---|
| Fond | `--color-board` | `#1F2E22` |
| Texte | `--color-chalk` | `#F5F1E6` |
| Secondaire | `--color-muted` | `#93A092` |
| Accent | `--color-accent` | `#E8B94A` |
| Accent 2 | `--color-teal` | `#6FA8A0` |
| Lignes | `--color-line` | `#3A4D3B` |

Deux polices : **Caveat** pour les titres et les statuts, **Work Sans** pour le
reste. Elles viennent de Google Fonts, ce qui compte si tu ajoutes un jour une
politique de sécurité de contenu.

L'élément signature est le « leader » en pointillés entre le nom et le statut,
comme sur un menu imprimé. Sa classe est `.menu-leader`.

## Déploiement

Automatique : un `git push` sur `main` construit l'image et met à jour le
Deployment. Le détail est dans le `RUNBOOK.md` du dépôt d'infrastructure.
