/**
 * Critiques Épiques — catalogue des thèmes.
 * Chaque thème : décors (layers), sceau central (sigil), particules, son, phrases d'ambiance.
 * Les couleurs sont dans styles/critiques-epiques.css, classe .ce-th-<id>.
 */

export const THEMES = {
  critical: [
    {
      id: "divin", label: "Lumière divine",
      layers: ["glow", "rays", "flash"], sigil: "runes",
      particles: [{ shape: "dot", motion: "burst", count: 30 }, { shape: "star", motion: "burst", count: 14 }],
      sound: "bells",
      taglines: ["Les dieux sourient", "Bénédiction céleste", "La fortune est avec vous"]
    },
    {
      id: "arcane", label: "Éclat arcanique",
      layers: ["glow", "aurora", "flash"], sigil: "arcane",
      particles: [{ shape: "star", motion: "burst", count: 22 }, { shape: "dot", motion: "orbit", count: 18 }],
      sound: "harp",
      taglines: ["La trame se plie à votre volonté", "Résonance arcanique", "Les runes s'embrasent"]
    },
    {
      id: "dragon", label: "Souffle du dragon",
      layers: ["glow", "flames"], sigil: "dragoneye",
      particles: [{ shape: "ember", motion: "rise", count: 40 }],
      sound: "fire",
      taglines: ["Le dragon s'éveille", "Feu et fureur", "Une flamme ancienne"]
    },
    {
      id: "givre", label: "Givre éternel",
      layers: ["glow", "frost", "flash"], sigil: "snowflake",
      particles: [{ shape: "flake", motion: "fall", count: 30 }, { shape: "dot", motion: "burst", count: 16 }],
      sound: "ice",
      taglines: ["Le froid du Nord", "Précision glaciale", "Le temps se fige"]
    },
    {
      id: "foudre", label: "Fureur de l'orage",
      layers: ["glow", "lightning", "flash"], sigil: "runes",
      particles: [{ shape: "spark", motion: "burst", count: 34 }],
      sound: "thunder", shake: true,
      taglines: ["Le tonnerre gronde", "Frappé par la foudre", "Colère des cieux"]
    },
    {
      id: "sylvestre", label: "Bénédiction sylvestre",
      layers: ["glow", "rays"], sigil: "vines",
      particles: [{ shape: "leaf", motion: "swirl", count: 28 }, { shape: "dot", motion: "rise", count: 16 }],
      sound: "harp",
      taglines: ["La forêt vous guide", "Le chant des anciens bois", "Grâce de la nature"]
    },
    {
      id: "celeste", label: "Voûte céleste",
      layers: ["glow", "starfield", "aurora"], sigil: "constellation",
      particles: [{ shape: "star", motion: "shoot", count: 7 }, { shape: "dot", motion: "twinkle", count: 40 }],
      sound: "choir",
      taglines: ["Écrit dans les étoiles", "Les astres s'alignent", "Destinée céleste"]
    },
    {
      id: "royal", label: "Lauriers royaux",
      layers: ["glow", "rays", "flash"], sigil: "laurel",
      particles: [{ shape: "petal", motion: "fall", count: 34 }, { shape: "dot", motion: "burst", count: 14 }],
      sound: "fanfare",
      taglines: ["Gloire au champion", "Un exploit digne des ballades", "Victoire !"]
    },
    {
      id: "phenix", label: "Envol du phénix",
      layers: ["glow", "flames", "flash"], sigil: "wings",
      particles: [{ shape: "feather", motion: "fall", count: 18 }, { shape: "ember", motion: "rise", count: 26 }],
      sound: "fire",
      taglines: ["Renaître des cendres", "Les ailes de feu se déploient", "Flamme immortelle"]
    },
    {
      id: "forge", label: "Forge naine",
      layers: ["glow", "rays"], sigil: "gear",
      particles: [{ shape: "spark", motion: "burst", count: 44 }],
      sound: "forge",
      taglines: ["Forgé dans la montagne", "Frappe du marteau ancestral", "Acier et honneur"]
    }
  ],

  fumble: [
    {
      id: "fissures", label: "Fissures de sang",
      layers: ["dark", "cracks"], sigil: "runes",
      particles: [{ shape: "ember", motion: "rise", count: 34 }],
      sound: "knell", shake: true,
      taglines: ["Le destin se brise", "Mauvais présage", "Les dés vous trahissent"]
    },
    {
      id: "malediction", label: "Malédiction",
      layers: ["dark", "smoke"], sigil: "skull",
      particles: [{ shape: "dot", motion: "rise", count: 30 }],
      sound: "void", shake: true,
      taglines: ["Une malédiction ancienne", "Les esprits ricanent", "Maudit soit ce jet"]
    },
    {
      id: "poison", label: "Poison",
      layers: ["dark", "drips"], sigil: "none",
      particles: [{ shape: "bubble", motion: "rise", count: 28 }],
      sound: "ooze", shake: false,
      taglines: ["Un goût amer", "Ça ne sent pas bon…", "Le venin coule"]
    },
    {
      id: "verre", label: "Verre brisé",
      layers: ["dark", "cracks", "flash"], sigil: "none",
      particles: [{ shape: "shard", motion: "fallspin", count: 26 }],
      sound: "shatter", shake: true,
      taglines: ["Tout vole en éclats", "Fragile comme le verre", "Sept ans de malheur"]
    },
    {
      id: "neant", label: "Appel du néant",
      layers: ["dark", "void"], sigil: "spiral",
      particles: [{ shape: "dot", motion: "implode", count: 40 }],
      sound: "void", shake: false,
      taglines: ["Le néant vous regarde", "Aspiré par les ténèbres", "Rien. Absolument rien."]
    },
    {
      id: "lame", label: "Lame brisée",
      layers: ["dark", "flash"], sigil: "brokensword",
      particles: [{ shape: "spark", motion: "fall", count: 30 }],
      sound: "blade", shake: true,
      taglines: ["L'acier cède", "Une arme trahie", "Le fil de la lame se rompt"]
    },
    {
      id: "cendres", label: "Cendres",
      layers: ["dark", "smoke"], sigil: "runes",
      particles: [{ shape: "ash", motion: "fall", count: 46 }],
      sound: "wind", shake: false,
      taglines: ["Il ne reste que des cendres", "La flamme s'éteint", "Poussière et regrets"]
    },
    {
      id: "sang", label: "Sang versé",
      layers: ["dark", "drips", "cracks"], sigil: "none",
      particles: [{ shape: "drop", motion: "fall", count: 24 }],
      sound: "knell", shake: true,
      taglines: ["Le sang appelle le sang", "Une blessure d'orgueil", "Ça va laisser une marque"]
    },
    {
      id: "corbeaux", label: "Nuée de corbeaux",
      layers: ["dark", "smoke"], sigil: "none",
      particles: [{ shape: "crow", motion: "fly", count: 14 }, { shape: "feather", motion: "fall", count: 14 }],
      sound: "crows", shake: false,
      taglines: ["Les corbeaux se rassemblent", "Un sombre augure", "Le croassement du destin"]
    },
    {
      id: "bouffon", label: "Bouffon du destin",
      layers: ["dark", "confetti"], sigil: "dizzy",
      particles: [{ shape: "confetti", motion: "fall", count: 40 }],
      sound: "trombone", shake: false,
      taglines: ["Le bouffon s'esclaffe", "Ça arrive aux meilleurs…", "Personne n'a rien vu"]
    }
  ]
};

/** Hash stable d'une chaîne (FNV-1a) pour que tous les clients tirent le même thème. */
export function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
