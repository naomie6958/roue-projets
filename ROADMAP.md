# ROADMAP — Roue de Projets

## État actuel — V2.2 (2026-07-10)
Roue visuelle · Timer liquide · Pause/Reprendre · Persistance refresh (session normale + overtime) · Stats semaine / all time · Spin pondéré · Continuer/Switcher · Célébration fin de session · Note de session copiable · Segments dynamiques (proportionnels aux weekMinutes) · Filtre segments 0 min · Croissance temps réel du segment actif · **CRUD projets complet via UI** (ajouter/modifier/supprimer, panel stylisé)

---

## Bugs critiques

- [x] **Compteur + segment actif disparaissent au refresh** (signalé et corrigé 2026-07-05)
  - Cause : `restoreTimer()` dans `timer.js` appelle `spinToSegment(state.index, function() {...})` avec seulement 2 arguments, mais `spinToSegment(index, candidates, callback)` en prend 3 depuis l'ajout du spin pondéré (`candidats` en 2e position). Le callback atterrit dans le paramètre `candidates`, puis `spinCandidates.forEach(...)` plante (`.forEach` n'existe pas sur une fonction) — l'animation et le `drawWheel` du restore ne s'exécutent jamais.
  - Fix : passer `null` comme 2e argument dans l'appel de `restoreTimer()` (`timer.js` ligne ~170) : `spinToSegment(state.index, null, function() {...})`

- [x] **Session perdue si timer expire pendant un refresh**
  - Fix : `restoreTimer()` appelle `onSessionEnd(state.index)` quand `remaining <= 0`

- [x] **Overtime timer ne survit pas à un refresh** (signalé 2026-07-06, corrigé 2026-07-10)
  - Cause confirmée : `startOvertime()` ne sauvegardait jamais rien dans `localStorage` — `restoreTimer()` n'avait donc rien à restaurer.
  - Fix : `saveTimerState()` accepte un 5e paramètre `overtime` (défaut `false`). `startOvertime()` sauvegarde `{index, startTimestamp, overtime: true}`. `restoreTimer()` détecte `state.overtime` et recalcule `overtimeSeconds` depuis `startTimestamp` avant de relancer l'intervalle (logique d'affichage extraite dans `renderOvertime()`/`overtimeTick()`, réutilisées par `startOvertime()` et la restauration — même pattern que le refactor `tick()` du 2026-07-06). `stopTimer()` appelle maintenant `clearTimerState()` aussi en mode overtime (oublié avant, sinon un vieil état overtime traînerait après un stop normal).

- [x] **Tableau de stats désaligné avec labels de longueur variable** (signalé 2026-07-06, corrigé 2026-07-06)
  - Cause : chaque `.stat-card` définissait ses propres colonnes (`grid-template-columns` en local) — pas de règle partagée entre les cartes, donc une carte avec un label plus long s'étirait sans que les autres suivent
  - Fix : `.stats-grid` (le parent) devient la grille qui définit les colonnes (`display: grid; grid-template-columns: 1fr 80px 110px 150px;`), et `.stat-card` utilise `grid-template-columns: subgrid; grid-column: 1 / -1;` pour hériter des colonnes du parent au lieu d'en inventer de nouvelles

---

## Fonctionnalités livrées

- [x] Spin pondéré (anti-répétition + équilibrage par poids)
- [x] Timer liquide (cercle central qui se remplit)
- [x] Pause / Reprendre persistant au refresh
- [x] Stats semaine vs all time (toggle)
- [x] Panel fin de session : nom projet + couleur + temps ajouté
- [x] Overtime timer (continue après session, s'ajoute aux stats)
- [x] Note de session copiable → SUIVI-PROJETS
- [x] Segments proportionnels aux weekMinutes (reset lundi)
- [x] **Filtre segments 0 min** — seuls les projets travaillés cette semaine apparaissent (2026-07-01)
- [x] **Croissance temps réel du segment actif** — le segment grandit pendant le timer sans attendre la fin de session (2026-07-01)
- [x] **Spin parmi les non-travaillés** — lors du spin aléatoire, seuls les projets sans minutes cette semaine apparaissent et sont candidats; fallback logique pondérée si tous travaillés (2026-07-01)
- [x] **Stats hebdomadaires sessions** — `weekSessions` + `weekCompletedSessions` dans storage, reset lundi avec weekMinutes; stats affichent les données de la semaine en mode "cette semaine" (2026-07-01)
- [x] **Timer live dans le titre de l'onglet** (2026-07-06) — refactor des 3 `setInterval` dupliqués (`startTimer`/`resumeTimer`/`restoreTimer`) en une seule fonction partagée `tick(index, totalSecs)` dans `timer.js`, qui met à jour `document.title` chaque seconde (ex. "⏱ 0:17:57 · Roue de Projets"). Titre remis à la normale dans `onSessionEnd` et `stopTimer`. Overtime (`startOvertime`) a aussi son propre live update ("⏱ +1:23 · Roue de Projets"). Permet de voir le compte à rebours sans revenir sur l'onglet.
- [x] **Seuil minimum de 5 min pour compter une session** (2026-07-10) — `stopTimer()` (normal + overtime) n'appelle plus `recordTime`/`recordSession` si l'arrêt manuel survient à moins de 5 min (`DUREE_MIN_SESSION`). Évite que les tests (démarrer/arrêter tout de suite) polluent les stats. N'affecte pas `onSessionEnd()` (session complétée au bout de la durée choisie, toujours comptée). Historique déjà loggé non corrigeable (aucun journal par session, seulement des compteurs cumulatifs).

---

## À faire

- [x] **CRUD projets via UI** ✅ complété 2026-07-10 — Lab 01-04
  - [x] Lab 01 — `id` stable ajouté à chaque projet dans `SEGMENTS`
  - [x] Lab 02 — Projets migrés vers localStorage (`PROJECTS_KEY` + `DEFAULT_PROJECTS`, `loadProjects()`/`saveProjects()` dans `storage.js`), `wheel.js` lit `let SEGMENTS = loadProjects()`
  - [x] Bonus — Roue agrandie (canvas 500→600, `RAYON` 210→250) pour laisser de la place aux labels plus longs
  - [x] Lab 03 — Fonctions `addProject` / `deleteProject` / `updateProject` dans `storage.js` (2026-07-05) — synchronisées par index avec les tableaux de stats, garde `if (i === -1) return` sur `deleteProject`
  - [x] `refreshSegments()` dans `wheel.js` (2026-07-06) — recharge `SEGMENTS` depuis localStorage + redessine roue/boutons/stats/liste
  - [x] Panel HTML (2026-07-06) — bouton toggle `#btnManageProjects`, `#managePanel`, `#projectsList` + formulaire `#projectForm`
  - [x] Lab 04 (2026-07-10) — `renderProjectsList()` affiche maintenant pastille de couleur + poids + boutons ✏️/🗑️ par projet (`data-id`, délégation d'événements sur `#projectsList`). Formulaire branché en mode double usage (ajout ou édition selon `editingProjectId`) — cliquer ✏️ pré-remplit le formulaire et change le libellé du bouton, bouton "Annuler" pour sortir du mode édition. Suppression avec `confirm()` natif (pas de modale custom dans ce projet). Chaque action (`addProject`/`updateProject`/`deleteProject`) suivie de `refreshSegments()` + `renderProjectsList()`.
  - [x] Panel stylisé (CSS minimal ajouté dans `style.css` — cohérent avec le thème sombre magenta existant)

- [x] **Alerte hyperfocus** ✅ complété 2026-07-27
  - Si un projet dépasse ~35% du temps semaine, signal visuel sur sa stat-card (bordure magenta + 🔥 sur `.stat-label`)

- [ ] **Anti-répétition amélioré**
  - Signal si le même projet est sélectionné 2 jours de suite

- [ ] **Note/intention au démarrage**
  - Petit champ texte optionnel : "Objectif de cette session ?"
  - Affiché pendant le timer

- [ ] **Indicateur reset de semaine**
  - Badge "Nouvelle semaine 🔄" quand weekMinutes reset le lundi

- [ ] **Historique de sessions + tableau/graphique** (noté 2026-08-30, idée à scoper)
  - Actuellement `storage.js` ne garde que des compteurs cumulatifs (`sessions`, `minutes`, `completedSessions`...), pas un journal par session — cas vécu le 2026-08-29 : impossible de retrouver ce qui avait été fait dans une session passée, seulement sa durée
  - Pour un vrai tableau/graphique utile, il faudrait un nouveau modèle de données : un tableau `sessionsLog` avec un objet par session (`projectId`, `date`, `durée`, `complète oui/non`, peut-être une note optionnelle), puis une vue construite par-dessus (tableau triable et/ou graphique par jour/semaine/projet)
  - Plus gros que les autres items ci-dessus (effort à définir, probablement plusieurs labs) — pas encore scopé en détail

---

## Ordre suggéré

| Priorité | Item | Effort |
|---|---|---|
| 1 | Alerte hyperfocus | ~30 min |
| 2 | Anti-répétition signal | ~30 min |
| 3 | Note/intention session | ~30 min |
| 4 | Indicateur reset semaine | ~15 min |
