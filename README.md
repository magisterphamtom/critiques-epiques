# Critiques Épiques

Module Foundry VTT (v13 / v14) pour **D&D 5e** (testé avec le système 6.0.6).

Quand un d20 tombe sur une **réussite critique** (20 naturel, ou la valeur critique de l'arme) ou un **échec critique** (1 naturel), un effet plein écran fantasy se déclenche. **20 visuels** sont tirés au hasard, le même pour tous les joueurs :

| Réussites critiques | Échecs critiques |
|---|---|
| Lumière divine — rayons dorés, runes | Fissures de sang — l'écran se fend |
| Éclat arcanique — aurore, hexagramme | Malédiction — crâne spectral, fumée |
| Souffle du dragon — œil de dragon, flammes | Poison — coulures vertes, bulles |
| Givre éternel — cristaux de givre, flocons | Verre brisé — éclats qui tombent |
| Fureur de l'orage — éclairs | Appel du néant — trou noir |
| Bénédiction sylvestre — couronne de feuilles | Lame brisée — l'épée se rompt |
| Voûte céleste — constellation, étoiles filantes | Cendres — fumée grise, cendres |
| Lauriers royaux — couronne de lauriers, pétales | Sang versé — coulures de sang |
| Envol du phénix — ailes de feu | Nuée de corbeaux — vol de corbeaux |
| Forge naine — engrenage, étincelles | Bouffon du destin — étoiles, confettis, trombone |

Chaque visuel a son son (synthétisé, aucun fichier) et une phrase d'ambiance.

**Et aussi :**
- **Visuel selon les dégâts** : une attaque de feu tire le dragon ou le phénix, le froid le givre, la foudre l'orage, le nécrotique la malédiction… (sinon, hasard).
- **Effet sur le jeton** : éclat de lumière ou fissure autour du jeton sur la carte, qui suit le zoom.
- **Carte de chat critique** : le message du jet prend les couleurs du visuel, avec un bandeau titre.
- **Portraits des héros** : chaque personnage joueur peut avoir son image (réussite / échec) en transparence derrière le visuel, et sa réplique. Par défaut, le portrait de la fiche. Bandeau parchemin avec le nom du personnage, le type de jet et l'arme. Jets contre la mort : « Sursaut de vie ! » sur un 20, « Le voile s'assombrit… » sur un 1.

Compatible **Dice So Nice!** : l'effet attend que les dés 3D aient fini de rouler.
Les jets privés ou à l'aveugle ne déclenchent l'effet que chez ceux qui peuvent voir le jet.

## Installation

Foundry → Modules complémentaires → Installer un module → coller le lien du manifeste :

```
https://github.com/magisterphamtom/critiques-epiques/releases/latest/download/module.json
```

## Réglages

**MJ (pour tout le monde)**
- **Choisir les visuels** : cocher/décocher chacun des 20 visuels, avec un bouton d'aperçu pour chacun
- **Personnaliser les héros** : image de réussite, image d'échec et répliques pour chaque personnage joueur, avec aperçu
- Visuel selon les dégâts, carte de chat critique, portrait (auto / images choisies / aucun) et son opacité
- Effet sur les réussites critiques / sur les échecs critiques
- Jets concernés : tous les d20, attaques uniquement, ou attaques + sauvegardes
- Qui voit l'effet : tous ceux qui voient le jet, ou seulement la personne qui lance
- Inclure les PNJ
- Son personnalisé pour chaque effet (sinon sons intégrés, synthétisés)

**Chaque joueur**
- Afficher les effets, affichage (plein écran puis jeton / plein écran / jeton), volume, durée (2 à 7 s), secousse, mouvements réduits
- Bouton **Tester** pour voir les deux effets sans lancer de dés

Un clic sur l'effet le ferme plus tôt.

## Pour les macros

```js
game.modules.get("critiques-epiques").api.play("critical", { name: "Aria", subtitle: "Attaque · Épée longue" });
game.modules.get("critiques-epiques").api.play("fumble", { name: "Borin", subtitle: "Jet de sauvegarde" });
// Forcer un visuel précis : theme: "dragon", "givre", "bouffon"… (liste : api.themes)
game.modules.get("critiques-epiques").api.play("critical", { theme: "dragon", name: "Aria" });
```

## Crédits

- Code : magisterphamtom (licence MIT).
- Polices Cinzel, Cinzel Decorative (Natanael Gama) et Noto Sans Runic (Google) : SIL Open Font License, voir `fonts/`.
