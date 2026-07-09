# ROADMAP — Roue de Projets

## État actuel — V2.1 (2026-07-01)
Roue visuelle · Timer liquide · Pause/Reprendre · Persistance refresh · Stats semaine / all time · Spin pondéré · Continuer/Switcher · Célébration fin de session · Note de session copiable · Segments dynamiques (proportionnels aux weekMinutes) · Filtre segments 0 min · Croissance temps réel du segment actif

---

## Bugs critiques

- [x] **Compteur + segment actif disparaissent au refresh** (signalé et corrigé 2026-07-05)
  - Cause : `restoreTimer()` dans `timer.js` appelle `spinToSegment(state.index, function() {...})` avec seulement 2 arguments, mais `spinToSegment(index, candidates, callback)` en prend 3 depuis l'ajout du spin pondéré (`candidats` en 2e position). Le callback atterrit dans le paramètre `candidates`, puis `spinCandidates.forEach(...)` plante (`.forEach` n'existe pas sur une fonction) — l'animation et le `drawWheel` du restore ne s'exécutent jamais.
  - Fix : passer `null` comme 2e argument dans l'appel de `restoreTimer()` (`timer.js` ligne ~170) : `spinToSegment(state.index, null, function() {...})`

- [x] **Session perdue si timer expire pendant un refresh**
  - Fix : `restoreTimer()` appelle `onSessionEnd(state.index)` quand `remaining <= 0`

- [ ] **Overtime timer ne survit pas à un refresh** (signalé 2026-07-06)
  - À investiguer : `restoreTimer()` restaure le timer de session normal, mais pas l'état overtime (`startOvertime` dans `timer.js`) — probablement pas sauvegardé dans `saveTimerState`/`loadTimerState`

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

---

## À faire

- [ ] **CRUD projets via UI** 🔄 en cours (2026-07-02) — Lab 03/04
  - [x] Lab 01 — `id` stable ajouté à chaque projet dans `SEGMENTS`
  - [x] Lab 02 — Projets migrés vers localStorage (`PROJECTS_KEY` + `DEFAULT_PROJECTS`, `loadProjects()`/`saveProjects()` dans `storage.js`), `wheel.js` lit `let SEGMENTS = loadProjects()`
  - [x] Bonus — Roue agrandie (canvas 500→600, `RAYON` 210→250) pour laisser de la place aux labels plus longs
  - [x] Lab 03 — Fonctions `addProject` / `deleteProject` / `updateProject` dans `storage.js` (2026-07-05) — synchronisées par index avec les tableaux de stats, garde `if (i === -1) return` sur `deleteProject`
  - [x] `refreshSegments()` dans `wheel.js` (2026-07-06) — recharge `SEGMENTS` depuis localStorage + redessine roue/boutons/stats/liste (nécessaire car `SEGMENTS` n'était chargé qu'une fois au démarrage)
  - [x] Panel HTML (2026-07-06) — bouton toggle `#btnManageProjects`, `#managePanel` caché par défaut, `#projectsList` + formulaire `#projectForm` (label, couleur, poids)
  - [x] `renderProjectsList()` dans `app.js` (2026-07-06) — affiche les labels des projets dans le panel (texte brut, pas encore stylé)
  - [ ] Lab 04 suite — boutons ✏️ Modifier / 🗑️ Supprimer par projet dans la liste (avec `data-id`) ← **prochaine étape**
  - [ ] Brancher le formulaire d'ajout (`#projectForm` submit → `addProject()` + `refreshSegments()`)
  - [ ] Brancher modifier/supprimer (`updateProject()`/`deleteProject()` + `refreshSegments()`)
  - [ ] Styliser le panel (CSS)
  - Effort restant estimé : ~30-40 min

- [ ] **Alerte hyperfocus**
  - Si un projet dépasse ~35% du temps semaine, signal visuel sur sa stat-card

- [ ] **Anti-répétition amélioré**
  - Signal si le même projet est sélectionné 2 jours de suite

- [ ] **Note/intention au démarrage**
  - Petit champ texte optionnel : "Objectif de cette session ?"
  - Affiché pendant le timer

- [ ] **Indicateur reset de semaine**
  - Badge "Nouvelle semaine 🔄" quand weekMinutes reset le lundi

---

## Ordre suggéré

| Priorité | Item | Effort |
|---|---|---|
| 1 | CRUD projets UI | ~1h30 |
| 2 | Alerte hyperfocus | ~30 min |
| 3 | Anti-répétition signal | ~30 min |
| 4 | Note/intention session | ~30 min |
| 5 | Indicateur reset semaine | ~15 min |
