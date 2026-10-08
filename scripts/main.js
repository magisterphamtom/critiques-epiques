/**
 * Critiques Épiques — magisterphamtom
 * Effet plein écran fantasy sur les 20 naturels (réussite critique) et les 1 naturels
 * (échec critique) des jets de d20 du système D&D 5e (6.x), Foundry v13/v14.
 */

const MODULE_ID = "critiques-epiques";
const RUNES = "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ";

/* ------------------------------------------------------------------ */
/*  Réglages                                                           */
/* ------------------------------------------------------------------ */

function registerSettings() {
  const s = (key, data) => game.settings.register(MODULE_ID, key, data);
  const L = (k) => `CRITEPIQ.Settings.${k}`;

  // --- Réglages du MJ (monde) ---
  s("enableCritical", { name: L("EnableCritical.Name"), hint: L("EnableCritical.Hint"),
    scope: "world", config: true, type: Boolean, default: true });
  s("enableFumble", { name: L("EnableFumble.Name"), hint: L("EnableFumble.Hint"),
    scope: "world", config: true, type: Boolean, default: true });
  s("rollTypes", { name: L("RollTypes.Name"), hint: L("RollTypes.Hint"),
    scope: "world", config: true, type: String, default: "all",
    choices: { all: L("RollTypes.All"), attack: L("RollTypes.Attack"), attackSave: L("RollTypes.AttackSave") } });
  s("audience", { name: L("Audience.Name"), hint: L("Audience.Hint"),
    scope: "world", config: true, type: String, default: "visible",
    choices: { visible: L("Audience.Visible"), roller: L("Audience.Roller") } });
  s("includeNpc", { name: L("IncludeNpc.Name"), hint: L("IncludeNpc.Hint"),
    scope: "world", config: true, type: Boolean, default: true });
  s("criticalSound", { name: L("CriticalSound.Name"), hint: L("CriticalSound.Hint"),
    scope: "world", config: true, type: String, default: "",
    filePicker: "audio" });
  s("fumbleSound", { name: L("FumbleSound.Name"), hint: L("FumbleSound.Hint"),
    scope: "world", config: true, type: String, default: "",
    filePicker: "audio" });

  // --- Préférences de chaque joueur (client) ---
  s("showEffects", { name: L("ShowEffects.Name"), hint: L("ShowEffects.Hint"),
    scope: "client", config: true, type: Boolean, default: true });
  s("volume", { name: L("Volume.Name"), hint: L("Volume.Hint"),
    scope: "client", config: true, type: Number, default: 0.6,
    range: { min: 0, max: 1, step: 0.05 } });
  s("duration", { name: L("Duration.Name"), hint: L("Duration.Hint"),
    scope: "client", config: true, type: Number, default: 3.5,
    range: { min: 2, max: 7, step: 0.5 } });
  s("shake", { name: L("Shake.Name"), hint: L("Shake.Hint"),
    scope: "client", config: true, type: Boolean, default: true });
  s("reducedMotion", { name: L("ReducedMotion.Name"), hint: L("ReducedMotion.Hint"),
    scope: "client", config: true, type: Boolean, default: false });

  game.settings.registerMenu(MODULE_ID, "testMenu", {
    name: L("Test.Name"), label: L("Test.Label"), hint: L("Test.Hint"),
    icon: "fa-solid fa-dice-d20", type: TestApp, restricted: false
  });
}

const get = (key) => game.settings.get(MODULE_ID, key);

/* ------------------------------------------------------------------ */
/*  Détection des critiques dans les messages de D&D 5e                */
/* ------------------------------------------------------------------ */

const TYPE_LABELS = {
  attack: "CRITEPIQ.Type.attack", skill: "CRITEPIQ.Type.skill", save: "CRITEPIQ.Type.save",
  ability: "CRITEPIQ.Type.ability", check: "CRITEPIQ.Type.check", tool: "CRITEPIQ.Type.tool",
  death: "CRITEPIQ.Type.death", concentration: "CRITEPIQ.Type.concentration",
  initiative: "CRITEPIQ.Type.initiative"
};

function findD20(message) {
  const D20Roll = CONFIG.Dice.D20Roll;
  for (const roll of message.rolls ?? []) {
    const isD20 = D20Roll ? roll instanceof D20Roll : false;
    if (!isD20 || !roll.validD20Roll || !roll._evaluated) continue;
    if (roll.isCritical) return { roll, kind: "critical" };
    if (roll.isFumble) return { roll, kind: "fumble" };
  }
  return null;
}

function rollTypeAllowed(type) {
  const mode = get("rollTypes");
  if (mode === "attack") return type === "attack";
  if (mode === "attackSave") return ["attack", "save", "death", "concentration"].includes(type);
  return true;
}

function describe(message, type) {
  const actor = message.getAssociatedActor?.() ?? message.speakerActor ?? null;
  const name = message.speaker?.alias || actor?.name || message.author?.name || "";
  let label = type && TYPE_LABELS[type] ? game.i18n.localize(TYPE_LABELS[type]) : "";
  const flags = message.flags?.dnd5e?.roll ?? {};
  if (type === "skill" && flags.skill) label = CONFIG.DND5E?.skills?.[flags.skill]?.label ?? label;
  if (["save", "ability", "check"].includes(type) && flags.ability) {
    const ab = CONFIG.DND5E?.abilities?.[flags.ability]?.label;
    if (ab) label = `${label} (${ab})`;
  }
  let item = "";
  if (type === "attack") {
    try { item = message.getAssociatedItem?.()?.name ?? ""; } catch (e) { item = ""; }
  }
  return { name, label, item, actor };
}

function titleFor(kind, type) {
  if (type === "death") return game.i18n.localize(kind === "critical" ? "CRITEPIQ.Title.deathCrit" : "CRITEPIQ.Title.deathFumble");
  if (kind === "critical") return game.i18n.localize(type === "attack" ? "CRITEPIQ.Title.attackCrit" : "CRITEPIQ.Title.crit");
  return game.i18n.localize(type === "attack" ? "CRITEPIQ.Title.attackFumble" : "CRITEPIQ.Title.fumble");
}

async function onCreateChatMessage(message) {
  try {
    if (!get("showEffects")) return;
    const found = findD20(message);
    if (!found) return;
    if (found.kind === "critical" && !get("enableCritical")) return;
    if (found.kind === "fumble" && !get("enableFumble")) return;

    const type = message.flags?.dnd5e?.roll?.type ?? null;
    if (!rollTypeAllowed(type)) return;

    // Qui voit l'effet : seulement ceux qui voient le jet (ou seulement le lanceur).
    if (!message.isContentVisible) return;
    if (get("audience") === "roller" && message.author?.id !== game.user.id) return;

    const info = describe(message, type);
    if (!get("includeNpc") && info.actor && !info.actor.hasPlayerOwner) return;

    // Attendre la fin des dés 3D (Dice So Nice!) avant de lancer l'effet.
    if (game.dice3d?.waitFor3DAnimationByMessageID) {
      try { await game.dice3d.waitFor3DAnimationByMessageID(message.id); } catch (e) { /* rien */ }
    }

    play(found.kind, {
      title: titleFor(found.kind, type),
      name: info.name,
      subtitle: [info.label, info.item].filter(Boolean).join(" · "),
      face: found.roll.d20?.total ?? (found.kind === "critical" ? 20 : 1)
    });
  } catch (err) {
    console.error(`${MODULE_ID} | Erreur pendant la détection du critique`, err);
  }
}

/* ------------------------------------------------------------------ */
/*  Effet visuel                                                        */
/* ------------------------------------------------------------------ */

let current = null;

function d20Svg(face, kind) {
  // Icosaèdre vu de face : hexagone + triangle central + arêtes.
  const id = `ce-g-${foundry.utils.randomID(6)}`;
  const stops = kind === "critical"
    ? `<stop offset="0" stop-color="#fff6cf"/><stop offset=".45" stop-color="#f1c35a"/><stop offset="1" stop-color="#8a5a12"/>`
    : `<stop offset="0" stop-color="#4a2030"/><stop offset=".5" stop-color="#1c0a12"/><stop offset="1" stop-color="#050204"/>`;
  const edge = kind === "critical" ? "#fff2c4" : "#ff4a3d";
  const crack = kind === "fumble"
    ? `<path class="ce-die-crack" d="M100 10 L94 40 L76 62 L70 92 L52 112 L44 140" />
       <path class="ce-die-crack" d="M76 62 L50 58 M70 92 L40 96 M140 150 L150 172 L138 186" />`
    : "";
  return `<svg class="ce-die-svg" viewBox="0 0 200 200" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient></defs>
    <polygon points="100,8 180,54 180,146 100,192 20,146 20,54" fill="url(#${id})" stroke="${edge}" stroke-width="4" stroke-linejoin="round"/>
    <g fill="none" stroke="${edge}" stroke-opacity=".75" stroke-width="2.5" stroke-linejoin="round">
      <polygon points="100,42 152,132 48,132"/>
      <path d="M100 8 L100 42 M180 54 L152 132 M180 54 L100 42 M20 54 L100 42 M20 54 L48 132 M180 146 L152 132 M20 146 L48 132 M100 192 L152 132 M100 192 L48 132"/>
    </g>
    ${crack}
    <text x="100" y="114" text-anchor="middle" dominant-baseline="middle" class="ce-die-face">${face}</text>
  </svg>`;
}

function runeRing(radius, cls) {
  const text = Array.from({ length: 3 }, () => RUNES).join(" ");
  const id = `ce-r-${foundry.utils.randomID(6)}`;
  return `<svg class="ce-ring ${cls}" viewBox="-300 -300 600 600" aria-hidden="true">
    <defs><path id="${id}" d="M ${-radius},0 a ${radius},${radius} 0 1,1 ${radius * 2},0 a ${radius},${radius} 0 1,1 ${-radius * 2},0"/></defs>
    <circle r="${radius + 22}" class="ce-ring-line"/><circle r="${radius - 24}" class="ce-ring-line"/>
    <text class="ce-ring-text"><textPath href="#${id}" textLength="${Math.round(2 * Math.PI * radius) - 10}">${text}</textPath></text>
  </svg>`;
}

function cracksSvg() {
  // Fissures aléatoires partant du centre de l'écran.
  const paths = [];
  const count = 9;
  for (let i = 0; i < count; i++) {
    const base = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    let x = 0, y = 0, a = base;
    let d = `M 0 0`;
    const steps = 6 + Math.floor(Math.random() * 4);
    for (let k = 0; k < steps; k++) {
      a += (Math.random() - 0.5) * 0.7;
      const len = 60 + Math.random() * 90;
      x += Math.cos(a) * len; y += Math.sin(a) * len;
      d += ` L ${x.toFixed(0)} ${y.toFixed(0)}`;
      if (Math.random() < 0.3) {
        const b = a + (Math.random() < 0.5 ? 1 : -1) * (0.6 + Math.random() * 0.5);
        const bl = 40 + Math.random() * 70;
        paths.push(`M ${x.toFixed(0)} ${y.toFixed(0)} L ${(x + Math.cos(b) * bl).toFixed(0)} ${(y + Math.sin(b) * bl).toFixed(0)}`);
      }
    }
    paths.push(d);
  }
  return `<svg class="ce-cracks" viewBox="-960 -540 1920 1080" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    ${paths.map((p, i) => `<path d="${p}" style="--i:${i}"/>`).join("")}
  </svg>`;
}

function particles(kind, count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 360;
    const dist = (kind === "critical" ? 28 : 16) + Math.random() * (kind === "critical" ? 30 : 34);
    const size = 3 + Math.random() * (kind === "critical" ? 7 : 6);
    const delay = Math.random() * (kind === "critical" ? 0.5 : 1.2);
    const star = kind === "critical" && Math.random() < 0.3;
    out.push(`<span class="ce-p${star ? " ce-star" : ""}" style="--a:${angle}deg;--d:${dist}vmin;--s:${size}px;--delay:${delay}s;--x:${(Math.random() * 100).toFixed(1)}vw"></span>`);
  }
  return `<div class="ce-particles">${out.join("")}</div>`;
}

/**
 * Joue l'effet. Accessible aux macros :
 *   game.modules.get("critiques-epiques").api.play("critical", {name: "Aria", subtitle: "Attaque"})
 */
export function play(kind = "critical", { title, name = "", subtitle = "", face } = {}) {
  kind = kind === "fumble" ? "fumble" : "critical";
  title ??= titleFor(kind, null);
  face ??= kind === "critical" ? 20 : 1;
  const reduced = get("reducedMotion");
  const duration = Number(get("duration")) || 3.5;

  current?.remove();
  const el = document.createElement("div");
  el.className = `critiques-epiques ce-${kind}${reduced ? " ce-reduced" : ""}`;
  el.style.setProperty("--ce-dur", `${duration}s`);
  el.innerHTML = `
    <div class="ce-vignette"></div>
    ${kind === "critical" ? `<div class="ce-rays"></div><div class="ce-flash"></div>` : cracksSvg()}
    <div class="ce-stage">
      <div class="ce-rings">${runeRing(230, "ce-ring-a")}${runeRing(170, "ce-ring-b")}</div>
      <div class="ce-die">${d20Svg(face, kind)}</div>
      <div class="ce-banner">
        <div class="ce-title" data-text="${foundry.utils.escapeHTML(title)}">${foundry.utils.escapeHTML(title)}</div>
        ${name || subtitle ? `<div class="ce-ribbon">
          ${name ? `<span class="ce-name">${foundry.utils.escapeHTML(name)}</span>` : ""}
          ${subtitle ? `<span class="ce-sub">${foundry.utils.escapeHTML(subtitle)}</span>` : ""}
        </div>` : ""}
      </div>
    </div>
    ${particles(kind, reduced ? 12 : (kind === "critical" ? 46 : 38))}`;
  document.body.appendChild(el);
  current = el;

  if (get("shake") && !reduced && kind === "fumble") shakeBoard();
  playSound(kind);

  const remove = () => { if (el.isConnected) el.remove(); if (current === el) current = null; };
  el.addEventListener("click", remove);
  setTimeout(remove, duration * 1000 + 200);
  return el;
}

function shakeBoard() {
  const board = document.getElementById("board");
  if (!board) return;
  board.classList.remove("ce-shake");
  void board.offsetWidth; // relance l'animation
  board.classList.add("ce-shake");
  setTimeout(() => board.classList.remove("ce-shake"), 700);
}

/* ------------------------------------------------------------------ */
/*  Sons (fichier choisi par le MJ, sinon son synthétisé)               */
/* ------------------------------------------------------------------ */

let audioCtx = null;

function playSound(kind) {
  const volume = Number(get("volume")) * (game.settings.get("core", "globalInterfaceVolume") ?? 1);
  if (!volume) return;
  const file = get(kind === "critical" ? "criticalSound" : "fumbleSound");
  if (file) {
    foundry.audio.AudioHelper.play({ src: file, volume, autoplay: true, loop: false }, false)
      .catch((err) => console.warn(`${MODULE_ID} | Son illisible : ${file}`, err));
    return;
  }
  try {
    audioCtx ??= new AudioContext();
    if (audioCtx.state === "suspended") audioCtx.resume();
    (kind === "critical" ? synthCritical : synthFumble)(audioCtx, volume);
  } catch (err) {
    console.warn(`${MODULE_ID} | Son synthétisé indisponible`, err);
  }
}

function tone(ctx, out, { freq, type = "sine", start, dur, gain = 0.3, glideTo = null }) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(out);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

function noise(ctx, out, { start, dur, gain = 0.3, filter = 800, type = "lowpass" }) {
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = filter;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(out);
  src.start(start);
}

function synthCritical(ctx, volume) {
  const out = ctx.createGain();
  out.gain.value = volume * 0.8;
  out.connect(ctx.destination);
  const t = ctx.currentTime + 0.02;
  noise(ctx, out, { start: t, dur: 0.6, gain: 0.25, filter: 3000, type: "highpass" }); // souffle
  // Arpège de cloches en majeur (do – mi – sol – do – mi)
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
    tone(ctx, out, { freq: f, type: "triangle", start: t + 0.08 + i * 0.09, dur: 1.6, gain: 0.22 });
    tone(ctx, out, { freq: f * 2.01, type: "sine", start: t + 0.08 + i * 0.09, dur: 0.9, gain: 0.06 });
  });
  // Accord final tenu
  [261.63, 329.63, 392.0].forEach((f) => tone(ctx, out, { freq: f, type: "sine", start: t + 0.55, dur: 2.2, gain: 0.12 }));
}

function synthFumble(ctx, volume) {
  const out = ctx.createGain();
  out.gain.value = volume * 0.9;
  out.connect(ctx.destination);
  const t = ctx.currentTime + 0.02;
  noise(ctx, out, { start: t, dur: 0.35, gain: 0.6, filter: 4200, type: "bandpass" }); // craquement
  tone(ctx, out, { freq: 120, type: "sine", start: t, dur: 1.1, gain: 0.55, glideTo: 38 }); // coup sourd
  // Glas descendant en mineur
  [392.0, 311.13, 261.63, 196.0].forEach((f, i) => {
    tone(ctx, out, { freq: f, type: "sawtooth", start: t + 0.25 + i * 0.22, dur: 0.9, gain: 0.05, glideTo: f * 0.94 });
    tone(ctx, out, { freq: f / 2, type: "sine", start: t + 0.25 + i * 0.22, dur: 1.2, gain: 0.12 });
  });
}

/* ------------------------------------------------------------------ */
/*  Fenêtre de test (Réglages → Configurer les réglages)                */
/* ------------------------------------------------------------------ */

const { ApplicationV2 } = foundry.applications.api;

class TestApp extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "critiques-epiques-test",
    tag: "div",
    window: { title: "CRITEPIQ.Test.Window", icon: "fa-solid fa-dice-d20" },
    position: { width: 380, height: "auto" },
    actions: {
      critical: () => play("critical", { name: game.user.character?.name ?? game.user.name, subtitle: game.i18n.localize("CRITEPIQ.Type.attack") }),
      fumble: () => play("fumble", { name: game.user.character?.name ?? game.user.name, subtitle: game.i18n.localize("CRITEPIQ.Type.attack") })
    }
  };

  async _renderHTML() {
    const t = (k) => game.i18n.localize(k);
    return `<p>${t("CRITEPIQ.Test.Text")}</p>
      <div class="ce-test-buttons">
        <button type="button" data-action="critical"><i class="fa-solid fa-sun"></i> ${t("CRITEPIQ.Test.Critical")}</button>
        <button type="button" data-action="fumble"><i class="fa-solid fa-skull"></i> ${t("CRITEPIQ.Test.Fumble")}</button>
      </div>`;
  }

  _replaceHTML(result, content) {
    content.innerHTML = result;
  }
}

/* ------------------------------------------------------------------ */
/*  Initialisation                                                       */
/* ------------------------------------------------------------------ */

Hooks.once("init", () => {
  registerSettings();
  game.modules.get(MODULE_ID).api = { play };
});

Hooks.once("ready", () => {
  if (game.system.id !== "dnd5e") {
    console.warn(`${MODULE_ID} | Conçu pour D&D 5e : la détection automatique est inactive sur ${game.system.id}.`);
    return;
  }
  Hooks.on("createChatMessage", onCreateChatMessage);
});
