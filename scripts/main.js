/**
 * Critiques Épiques — magisterphamtom
 * Effet plein écran fantasy sur les 20 naturels (réussite critique) et les 1 naturels
 * (échec critique) des jets de d20 du système D&D 5e (6.x), Foundry v13/v14.
 */

import { THEMES, hashString } from "./themes.js";
import { d20Svg, layersHtml, sigilHtml, particlesHtml } from "./effects.js";
import { playSynth } from "./sounds.js";

const MODULE_ID = "critiques-epiques";

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

  // Thèmes désactivés par le MJ (les nouveaux thèmes sont donc actifs par défaut).
  s("disabledThemes", { scope: "world", config: false, type: Object, default: { critical: [], fumble: [] } });

  game.settings.registerMenu(MODULE_ID, "themesMenu", {
    name: L("Themes.Name"), label: L("Themes.Label"), hint: L("Themes.Hint"),
    icon: "fa-solid fa-palette", type: ThemesApp, restricted: true
  });
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
      seed: hashString(message.id),
      type,
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
/*  Choix du thème                                                      */
/* ------------------------------------------------------------------ */

export function enabledThemes(kind) {
  const disabled = new Set(get("disabledThemes")?.[kind] ?? []);
  const list = THEMES[kind].filter((t) => !disabled.has(t.id));
  return list.length ? list : THEMES[kind];
}

/** Même graine (id du message) = même thème chez tous les joueurs. */
function pickTheme(kind, seed) {
  const list = enabledThemes(kind);
  return list[seed % list.length];
}

/* ------------------------------------------------------------------ */
/*  Effet visuel                                                        */
/* ------------------------------------------------------------------ */

let current = null;
const esc = (s) => foundry.utils.escapeHTML(String(s ?? ""));

/**
 * Joue l'effet. Accessible aux macros :
 *   game.modules.get("critiques-epiques").api.play("critical", {name: "Aria", subtitle: "Attaque", theme: "dragon"})
 */
export function play(kind = "critical", { title, name = "", subtitle = "", face, theme, seed, type = null } = {}) {
  kind = kind === "fumble" ? "fumble" : "critical";
  seed ??= Math.floor(Math.random() * 2 ** 31);
  const th = (theme && THEMES[kind].find((t) => t.id === theme)) || pickTheme(kind, seed);
  title ??= titleFor(kind, type);
  face ??= kind === "critical" ? 20 : 1;
  const tagline = th.taglines?.length ? th.taglines[(seed >>> 4) % th.taglines.length] : "";
  const reduced = get("reducedMotion");
  const duration = Number(get("duration")) || 3.5;

  current?.remove();
  const el = document.createElement("div");
  el.className = `critiques-epiques ce-${kind} ce-th-${th.id}${reduced ? " ce-reduced" : ""}`;
  el.style.setProperty("--ce-dur", `${duration}s`);
  el.innerHTML = `
    ${layersHtml(th.layers)}
    <div class="ce-stage">
      <div class="ce-rings">${sigilHtml(th.sigil)}</div>
      <div class="ce-die">${d20Svg(face, kind)}</div>
      <div class="ce-banner">
        ${tagline ? `<div class="ce-tagline">${esc(tagline)}</div>` : ""}
        <div class="ce-title" data-text="${esc(title)}">${esc(title)}</div>
        ${name || subtitle ? `<div class="ce-ribbon">
          ${name ? `<span class="ce-name">${esc(name)}</span>` : ""}
          ${subtitle ? `<span class="ce-sub">${esc(subtitle)}</span>` : ""}
        </div>` : ""}
      </div>
    </div>
    ${particlesHtml(th.particles, reduced)}`;
  document.body.appendChild(el);
  current = el;

  if (get("shake") && !reduced && th.shake) shakeBoard();
  playSound(kind, th.sound);

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

function playSound(kind, synth) {
  const volume = Number(get("volume")) * (game.settings.get("core", "globalInterfaceVolume") ?? 1);
  if (!volume) return;
  const file = get(kind === "critical" ? "criticalSound" : "fumbleSound");
  if (file) {
    foundry.audio.AudioHelper.play({ src: file, volume, autoplay: true, loop: false }, false)
      .catch((err) => console.warn(`${MODULE_ID} | Son illisible : ${file}`, err));
    return;
  }
  playSynth(synth, volume);
}

/* ------------------------------------------------------------------ */
/*  Fenêtres : test (joueurs) et choix des thèmes (MJ)                  */
/* ------------------------------------------------------------------ */

const { ApplicationV2 } = foundry.applications.api;
const playerName = () => game.user.character?.name ?? game.user.name;
const t = (k) => game.i18n.localize(k);

class TestApp extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "critiques-epiques-test",
    tag: "div",
    window: { title: "CRITEPIQ.Test.Window", icon: "fa-solid fa-dice-d20" },
    position: { width: 400, height: "auto" },
    actions: {
      critical: () => play("critical", { name: playerName(), subtitle: t("CRITEPIQ.Type.attack"), type: "attack" }),
      fumble: () => play("fumble", { name: playerName(), subtitle: t("CRITEPIQ.Type.attack"), type: "attack" })
    }
  };

  async _renderHTML() {
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

class ThemesApp extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "critiques-epiques-themes",
    tag: "form",
    window: { title: "CRITEPIQ.Themes.Window", icon: "fa-solid fa-palette", resizable: true },
    position: { width: 620, height: "auto" },
    form: { handler: ThemesApp.#onSubmit, closeOnSubmit: true },
    actions: {
      preview: ThemesApp.#onPreview,
      all: ThemesApp.#onAll
    }
  };

  async _renderHTML() {
    const disabled = get("disabledThemes") ?? {};
    const column = (kind) => {
      const off = new Set(disabled[kind] ?? []);
      const rows = THEMES[kind].map((th) => `
        <li class="ce-theme-row">
          <label><input type="checkbox" name="${kind}.${th.id}" ${off.has(th.id) ? "" : "checked"}> ${esc(th.label)}</label>
          <button type="button" data-action="preview" data-kind="${kind}" data-theme="${th.id}" data-tooltip="${t("CRITEPIQ.Themes.Preview")}">
            <i class="fa-solid fa-eye"></i></button>
        </li>`).join("");
      return `<section class="ce-theme-col ce-col-${kind}">
        <h3><i class="fa-solid ${kind === "critical" ? "fa-sun" : "fa-skull"}"></i> ${t(kind === "critical" ? "CRITEPIQ.Themes.Critical" : "CRITEPIQ.Themes.Fumble")}
          <a data-action="all" data-kind="${kind}" class="ce-all">${t("CRITEPIQ.Themes.All")}</a></h3>
        <ul>${rows}</ul></section>`;
    };
    return `<p class="hint">${t("CRITEPIQ.Themes.Text")}</p>
      <div class="ce-theme-grid">${column("critical")}${column("fumble")}</div>
      <footer class="form-footer"><button type="submit"><i class="fa-solid fa-floppy-disk"></i> ${t("CRITEPIQ.Themes.Save")}</button></footer>`;
  }

  _replaceHTML(result, content) {
    content.innerHTML = result;
  }

  static #onPreview(event, target) {
    const kind = target.dataset.kind;
    play(kind, { theme: target.dataset.theme, name: playerName(), subtitle: t("CRITEPIQ.Type.attack"), type: "attack" });
  }

  static #onAll(event, target) {
    const boxes = this.element.querySelectorAll(`input[name^="${target.dataset.kind}."]`);
    const allOn = [...boxes].every((b) => b.checked);
    boxes.forEach((b) => { b.checked = !allOn; });
  }

  static async #onSubmit(event, form, formData) {
    const data = formData.object;
    const disabled = { critical: [], fumble: [] };
    for (const kind of ["critical", "fumble"]) {
      for (const th of THEMES[kind]) if (!data[`${kind}.${th.id}`]) disabled[kind].push(th.id);
      if (disabled[kind].length === THEMES[kind].length) {
        ui.notifications.warn(t("CRITEPIQ.Themes.NoneWarning"));
        disabled[kind] = [];
      }
    }
    await game.settings.set(MODULE_ID, "disabledThemes", disabled);
  }
}

/* ------------------------------------------------------------------ */
/*  Initialisation                                                       */
/* ------------------------------------------------------------------ */

Hooks.once("init", () => {
  registerSettings();
  game.modules.get(MODULE_ID).api = { play, themes: THEMES };
});

Hooks.once("ready", () => {
  if (game.system.id !== "dnd5e") {
    console.warn(`${MODULE_ID} | Conçu pour D&D 5e : la détection automatique est inactive sur ${game.system.id}.`);
    return;
  }
  Hooks.on("createChatMessage", onCreateChatMessage);
});
