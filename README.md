# Critiques Épiques

Module Foundry VTT (v13 / v14) pour **D&D 5e** (testé avec le système 6.0.6).

Quand un d20 tombe sur une **réussite critique** (20 naturel, ou la valeur critique de l'arme) ou un **échec critique** (1 naturel), un effet plein écran fantasy se déclenche :

- **Réussite critique** : rayons de lumière dorée, cercles de runes tournants, d20 d'or, étincelles, titre doré « Coup critique ! » / « Réussite critique ! », carillon.
- **Échec critique** : l'écran se fissure, le d20 d'obsidienne tombe et se brise, braises, titre rouge sang « Échec critique ! », secousse de la scène, glas.
- Bandeau parchemin avec le nom du personnage, le type de jet (attaque, compétence, sauvegarde…) et l'arme utilisée.
- Jets contre la mort : « Sursaut de vie ! » sur un 20, « Le voile s'assombrit… » sur un 1.

Compatible **Dice So Nice!** : l'effet attend que les dés 3D aient fini de rouler.
Les jets privés ou à l'aveugle ne déclenchent l'effet que chez ceux qui peuvent voir le jet.

## Installation

Foundry → Modules complémentaires → Installer un module → coller le lien du manifeste :

```
https://github.com/magisterphamtom/critiques-epiques/releases/latest/download/module.json
```

## Réglages

**MJ (pour tout le monde)**
- Effet sur les réussites critiques / sur les échecs critiques
- Jets concernés : tous les d20, attaques uniquement, ou attaques + sauvegardes
- Qui voit l'effet : tous ceux qui voient le jet, ou seulement la personne qui lance
- Inclure les PNJ
- Son personnalisé pour chaque effet (sinon sons intégrés, synthétisés)

**Chaque joueur**
- Afficher les effets, volume, durée (2 à 7 s), secousse, mouvements réduits
- Bouton **Tester** pour voir les deux effets sans lancer de dés

Un clic sur l'effet le ferme plus tôt.

## Pour les macros

```js
game.modules.get("critiques-epiques").api.play("critical", { name: "Aria", subtitle: "Attaque · Épée longue" });
game.modules.get("critiques-epiques").api.play("fumble", { name: "Borin", subtitle: "Jet de sauvegarde" });
```

## Crédits

- Code : magisterphamtom (licence MIT).
- Polices Cinzel, Cinzel Decorative (Natanael Gama) et Noto Sans Runic (Google) : SIL Open Font License, voir `fonts/`.
