# État — Critiques Épiques

## v1.2.0 (8 octobre 2026)
- Thème selon le type de dégâts (`BY_DAMAGE` dans main.js, via `message.getAssociatedActivity()`), réglage `damageThemes`.
- Effet autour du jeton : élément dans `#hud` (coordonnées de la carte), réglage client `display`.
- Carte de chat : hook `renderChatMessageHTML`, classes `ce-chat ce-<kind> ce-th-<id>` + bandeau.
- Portraits/répliques par personnage : réglage monde `heroes` {actorId: {crit, fumble, quoteCrit, quoteFumble}}, menu HeroesApp (`<file-picker>`), `portraitMode`, `portraitOpacity`.
- Vérifié en capture (portrait, jeton, carte de chat simulée) ; à tester en jeu, surtout la carte de chat dnd5e réelle.

## v1.1.0 (8 octobre 2026)
- 20 thèmes (scripts/themes.js) : 10 réussites, 10 échecs ; décors, sceaux, particules et sons propres (scripts/effects.js, scripts/sounds.js).
- Tirage par hash de l'id du message (FNV-1a) → même visuel chez tous les clients.
- Menu MJ « Choisir les visuels » (réglage monde `disabledThemes`), aperçu par thème.
- Captures vérifiées pour les 20 thèmes ; à tester en jeu.

## v1.0.0 (8 octobre 2026)
- Détection via `createChatMessage` : premier `CONFIG.Dice.D20Roll` valide du message, `isCritical` / `isFumble` (dnd5e 6.0.6, gère avantage/désavantage et seuil critique de l'arme).
- Type de jet lu dans `flags.dnd5e.roll.type` (attack, skill, save, ability, check, tool, death, concentration, initiative).
- Visibilité : `message.isContentVisible` ; option « seulement le lanceur ».
- Dice So Nice : `game.dice3d.waitFor3DAnimationByMessageID`.
- Effet en DOM/CSS pur (aucune image), polices embarquées, sons synthétisés WebAudio ou fichier choisi par le MJ.
- Fenêtre de test (Réglages → Tester), API `api.play()`.
- Aperçus vérifiés en capture (Chromium) ; non testé en jeu.

## À vérifier en jeu
- Que l'effet ne se déclenche qu'une fois par jet (attaque + carte d'activité).
- Jets de groupe / jets demandés par le MJ (messages de requête dnd5e).
- Lisibilité sur petit écran.

## Idées
- Choisir le thème selon le type de dégâts (feu → dragon, froid → givre…).
- Citations personnalisées par acteur.
