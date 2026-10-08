/**
 * Critiques Épiques — magisterphamtom
 * Effet plein écran fantasy sur les 20 naturels (réussite critique) et les 1 naturels
 * (échec critique) des jets de d20 du système D&D 5e (6.x), Foundry v13/v14.
 */

import { THEMES, hashString } from "./themes.js";
import { d20Svg, layersHtml, sigilHtml, particlesHtml, tokenFxHtml } from "./effects.js";
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

  s("damageThemes", { name: L("DamageThemes.Name"), hint: L("DamageThemes.Hint"),
    scope: "world", config: true, type: Boolean, default: true });
  s("chatCard", { name: L("ChatCard.Name"), hint: L("ChatCard.Hint"),
    scope: "world", config: true, type: Boolean, default: true });
  s("portraitMode", { name: L("PortraitMode.Name"), hint: L("PortraitMode.Hint"),
    scope: "world", config: true, type: String, default: "auto",
    choices: { auto: L("PortraitMode.Auto"), custom: L("PortraitMode.Custom"), none: L("PortraitMode.None") } });
  s("portraitOpacity", { name: L("PortraitOpacity.Name"), hint: L("PortraitOpacity.Hint"),
    scope: "world", config: true, type: Number, default: 0.4,
    range: { min: 0.1, max: 0.9, step: 0.05 } });
  s("heroes", { scope: "world", config: false, type: Object, default: {} });

  // --- Préférences de chaque joueur (client) ---
  s("display", { name: L("Display.Name"), hint: L("Display.Hint"),
    scope: "client", config: true, type: String, default: "both",
    choices: { both: L("Display.Both"), fullscreen: L("Display.Fullscreen"), token: L("Display.Token") } });
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
  game.settings.registerMenu(MODULE_ID, "heroesMenu", {
    name: L("Heroes.Name"), label: L("Heroes.Label"), hint: L("Heroes.Hint"),
    icon: "fa-solid fa-user-shield", type: HeroesApp, restricted: true
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

/**
 * Analyse un message : critique ou échec critique autorisé par les réglages du monde ?
 * Résultat identique sur tous les clients (sert à l'effet et à la carte de chat).
 */
function analyze(message) {
  const found = findD20(message);
  if (!found) return null;
  if (found.kind === "critical" && !get("enableCritical")) return null;
  if (found.kind === "fumble" && !get("enableFumble")) return null;
  const type = message.flags?.dnd5e?.roll?.type ?? null;
  if (!rollTypeAllowed(type)) return null;
  const info = describe(message, type);
  if (!get("includeNpc") && info.actor && !info.actor.hasPlayerOwner) return null;
  const theme = themeForMessage(message, found.kind);
  return { ...found, type, info, theme };
}

async function onCreateChatMessage(message) {
  try {
    if (!get("showEffects")) return;
    const a = analyze(message);
    if (!a) return;

    // Qui voit l'effet : seulement ceux qui voient le jet (ou seulement le lanceur).
    if (!message.isContentVisible) return;
    if (get("audience") === "roller" && message.author?.id !== game.user.id) return;

    // Attendre la fin des dés 3D (Dice So Nice!) avant de lancer l'effet.
    if (game.dice3d?.waitFor3DAnimationByMessageID) {
      try { await game.dice3d.waitFor3DAnimationByMessageID(message.id); } catch (e) { /* rien */ }
    }

    const token = message.getAssociatedToken?.() ?? null;
    play(a.kind, {
      seed: hashString(message.id),
      theme: a.theme.id,
      type: a.type,
      title: titleFor(a.kind, a.type),
      name: a.info.name,
      subtitle: [a.info.label, a.info.item].filter(Boolean).join(" · "),
      face: a.roll.d20?.total ?? (a.kind === "critical" ? 20 : 1),
      actorId: a.info.actor?.id,
      tokenId: token?.parent === canvas.scene ? token.id : null
    });
  } catch (err) {
    console.error(`${MODULE_ID} | Erreur pendant la détection du critique`, err);
  }
}

/* ------------------------------------------------------------------ */
/*  Carte de chat thématique                                            */
/* ------------------------------------------------------------------ */

function onRenderChatMessage(message, html) {
  try {
    if (!get("chatCard") || !message.isContentVisible) return;
    const el = html instanceof HTMLElement ? html : html?.[0];
    if (!el || el.querySelector(".ce-chat-banner")) return;
    const a = analyze(message);
    if (!a) return;
    el.classList.add("ce-chat", `ce-${a.kind}`, `ce-th-${a.theme.id}`);
    const banner = document.createElement("div");
    banner.className = "ce-chat-banner";
    banner.innerHTML = `<span class="ce-chat-icon">${a.kind === "critical" ? "✦" : "☠"}</span>
      <span class="ce-chat-title">${esc(titleFor(a.kind, a.type))}</span>
      <span class="ce-chat-theme">${esc(a.theme.label)}</span>`;
    const content = el.querySelector(".message-content") ?? el;
    content.prepend(banner);
  } catch (err) {
    console.error(`${MODULE_ID} | Erreur sur la carte de chat`, err);
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

/** Thèmes suggérés par type de dégâts (D&D 5e). */
const BY_DAMAGE = {
  critical: {
    fire: ["dragon", "phenix"], cold: ["givre"], lightning: ["foudre"], thunder: ["foudre"],
    radiant: ["divin", "celeste"], force: ["arcane"], psychic: ["arcane", "celeste"], necrotic: ["arcane"],
    acid: ["sylvestre"], poison: ["sylvestre"], healing: ["sylvestre", "divin"], temphp: ["divin"],
    slashing: ["forge", "royal"], piercing: ["royal", "forge"], bludgeoning: ["forge", "royal"]
  },
  fumble: {
    fire: ["cendres"], cold: ["verre"], lightning: ["fissures"], thunder: ["verre", "fissures"],
    radiant: ["cendres"], force: ["neant"], psychic: ["neant", "malediction"], necrotic: ["malediction", "corbeaux"],
    acid: ["poison"], poison: ["poison"], healing: ["bouffon"],
    slashing: ["lame", "sang"], piercing: ["sang", "corbeaux"], bludgeoning: ["fissures", "bouffon"]
  }
};

function damageTypesOf(message) {
  const types = [];
  try {
    const activity = message.getAssociatedActivity?.();
    const add = (part) => { for (const t of part?.types ?? []) types.push(t); };
    if (activity?.damage?.includeBase) add(activity.item?.system?.damage?.base);
    for (const part of activity?.damage?.parts ?? []) add(part);
    for (const part of activity?.healing ? [activity.healing] : []) add(part);
  } catch (err) { /* pas d'activité associée */ }
  return types;
}

/** Thème d'un message : selon les dégâts si possible, sinon au hasard (même graine pour tous). */
function themeForMessage(message, kind) {
  const seed = hashString(message.id);
  if (get("damageThemes")) {
    const enabled = new Set(enabledThemes(kind).map((th) => th.id));
    for (const type of damageTypesOf(message)) {
      const ids = (BY_DAMAGE[kind][type] ?? []).filter((id) => enabled.has(id));
      if (ids.length) return THEMES[kind].find((th) => th.id === ids[seed % ids.length]);
    }
  }
  return pickTheme(kind, seed);
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
export function play(kind = "critical", { title, name = "", subtitle = "", face, theme, seed, type = null, actorId = null, tokenId = null, heroOverride = null } = {}) {
  kind = kind === "fumble" ? "fumble" : "critical";
  seed ??= Math.floor(Math.random() * 2 ** 31);
  const th = (theme && THEMES[kind].find((t) => t.id === theme)) || pickTheme(kind, seed);
  title ??= titleFor(kind, type);
  face ??= kind === "critical" ? 20 : 1;
  const hero = heroFor(actorId, kind, heroOverride);
  const tagline = hero.quote || (th.taglines?.length ? th.taglines[(seed >>> 4) % th.taglines.length] : "");
  const reduced = get("reducedMotion");
  const duration = Number(get("duration")) || 3.5;
  const display = get("display");

  // Effet autour du jeton : seul, ou à la fin de l'effet plein écran.
  if (tokenId && display !== "fullscreen") {
    const token = canvas.tokens?.get(tokenId);
    if (token) setTimeout(() => tokenFx(kind, th, token, face, reduced), display === "token" ? 0 : duration * 780);
  }
  if (display === "token" && tokenId) {
    playSound(kind, th.sound);
    return null;
  }

  current?.remove();
  const el = document.createElement("div");
  el.className = `critiques-epiques ce-${kind} ce-th-${th.id}${reduced ? " ce-reduced" : ""}`;
  el.style.setProperty("--ce-dur", `${duration}s`);
  el.innerHTML = `
    ${layersHtml(th.layers)}
    ${hero.imgs.length ? `<div class="ce-portrait" style="--portrait-opacity:${Number(get("portraitOpacity")) || 0.4}"></div>` : ""}
    <div class="ce-stage">
      <div class="ce-rings">${sigilHtml(th.sigil)}</div>
      <div class="ce-die">${d20Svg(face, kind)}</div>
      <div class="ce-banner">
        ${tagline ? `<div class="ce-tagline">${esc(tagline)}</div>` : ""}
        <div class="ce-title" data-text="${esc(title)}" style="--len:${Math.max(12, [...title].length)}">${esc(title)}</div>
        ${name || subtitle ? `<div class="ce-ribbon">
          ${name ? `<span class="ce-name">${esc(name)}</span>` : ""}
          ${subtitle ? `<span class="ce-sub">${esc(subtitle)}</span>` : ""}
        </div>` : ""}
      </div>
    </div>
    ${particlesHtml(th.particles, reduced)}`;
  document.body.appendChild(el);
  current = el;
  if (hero.imgs.length) mountPortrait(el.querySelector(".ce-portrait"), hero.imgs);

  if (get("shake") && !reduced && th.shake) shakeBoard();
  playSound(kind, th.sound);

  const remove = () => { if (el.isConnected) el.remove(); if (current === el) current = null; };
  el.addEventListener("click", remove);
  setTimeout(remove, duration * 1000 + 200);
  return el;
}

/** Image et réplique du personnage pour cet effet. */
function heroFor(actorId, kind, override = null) {
  const mode = get("portraitMode");
  const conf = override ?? (get("heroes") ?? {})[actorId] ?? {};
  const key = kind === "critical" ? "crit" : "fumble";
  const imgs = [];
  if (mode !== "none" && conf[key]) imgs.push(conf[key]);
  if (mode === "auto" && actorId) {
    const actor = game.actors.get(actorId);
    // Portrait de la fiche, puis image du jeton (en ignorant les icônes par défaut).
    for (const src of [actor?.img, actor?.prototypeToken?.texture?.src]) {
      if (src && !isDefaultArt(src) && !imgs.includes(src)) imgs.push(src);
    }
  }
  const quote = (kind === "critical" ? conf.quoteCrit : conf.quoteFumble) || "";
  return { imgs, quote };
}

function isDefaultArt(src) {
  return src === CONST.DEFAULT_TOKEN || /(^|\/)icons\/svg\//.test(src) || /mystery-man/i.test(src);
}

const VIDEO_EXT = /\.(webm|mp4|m4v|ogg)(\?.*)?$/i;

/**
 * Place le portrait. Le chemin est utilisé tel quel (sans réencodage : les chemins de Foundry
 * peuvent déjà contenir des %20 ou des accents encodés). Si l'image ne se charge pas, on essaie la suivante.
 */
function mountPortrait(container, srcs, index = 0) {
  if (!container || index >= srcs.length) {
    container?.remove();
    return;
  }
  const src = srcs[index];
  const isVideo = VIDEO_EXT.test(src);
  const media = document.createElement(isVideo ? "video" : "img");
  if (isVideo) Object.assign(media, { autoplay: true, loop: true, muted: true, playsInline: true });
  media.addEventListener("error", () => {
    console.warn(`${MODULE_ID} | Portrait introuvable ou illisible : ${src}`);
    media.remove();
    mountPortrait(container, srcs, index + 1);
  }, { once: true });
  media.src = src;
  container.replaceChildren(media);
}

/** Éclat (ou fissure) autour du jeton, dans le calque HUD qui suit le zoom et le défilement. */
function tokenFx(kind, th, token, face, reduced) {
  const hud = document.getElementById("hud");
  if (!hud || !token?.center) return;
  const size = Math.max(token.w, token.h) * 3.2;
  const el = document.createElement("div");
  el.className = `ce-tfx ce-${kind} ce-th-${th.id}${reduced ? " ce-reduced" : ""}`;
  Object.assign(el.style, {
    left: `${token.center.x - size / 2}px`, top: `${token.center.y - size / 2}px`,
    width: `${size}px`, height: `${size}px`
  });
  el.innerHTML = tokenFxHtml(kind, face, reduced);
  hud.appendChild(el);
  setTimeout(() => el.remove(), 3000);
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

/** Options d'aperçu : personnage du joueur et son jeton s'il est sur la scène. */
function previewOptions(actor = game.user.character) {
  const token = actor ? canvas.tokens?.placeables.find((tk) => tk.actor?.id === actor.id) : canvas.tokens?.controlled[0];
  return {
    name: actor?.name ?? playerName(), subtitle: t("CRITEPIQ.Type.attack"), type: "attack",
    actorId: actor?.id ?? token?.actor?.id ?? null, tokenId: token?.id ?? null
  };
}

class TestApp extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "critiques-epiques-test",
    tag: "div",
    window: { title: "CRITEPIQ.Test.Window", icon: "fa-solid fa-dice-d20" },
    position: { width: 400, height: "auto" },
    actions: {
      critical: () => play("critical", previewOptions()),
      fumble: () => play("fumble", previewOptions())
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
    play(kind, { ...previewOptions(), theme: target.dataset.theme });
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

class HeroesApp extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "critiques-epiques-heroes",
    tag: "form",
    window: { title: "CRITEPIQ.Heroes.Window", icon: "fa-solid fa-user-shield", resizable: true },
    position: { width: 760, height: "auto" },
    form: { handler: HeroesApp.#onSubmit, closeOnSubmit: true },
    actions: { preview: HeroesApp.#onPreview }
  };

  static actors() {
    return game.actors.filter((a) => a.type === "character" && a.hasPlayerOwner)
      .sort((a, b) => a.name.localeCompare(b.name, game.i18n.lang));
  }

  async _renderHTML() {
    const heroes = get("heroes") ?? {};
    const actors = HeroesApp.actors();
    if (!actors.length) return `<p>${t("CRITEPIQ.Heroes.Empty")}</p>`;
    const rows = actors.map((a) => {
      const h = heroes[a.id] ?? {};
      const owners = game.users.filter((u) => !u.isGM && a.testUserPermission(u, "OWNER")).map((u) => u.name).join(", ");
      return `<fieldset class="ce-hero">
        <legend><img src="${esc(a.img)}" alt=""> ${esc(a.name)} ${owners ? `<small>(${esc(owners)})</small>` : ""}</legend>
        <div class="ce-hero-grid">
          <label>${t("CRITEPIQ.Heroes.CritImg")}</label>
          <file-picker name="${a.id}.crit" type="image" value="${esc(h.crit ?? "")}"></file-picker>
          <button type="button" data-action="preview" data-actor="${a.id}" data-kind="critical" data-tooltip="${t("CRITEPIQ.Themes.Preview")}"><i class="fa-solid fa-sun"></i></button>
          <label>${t("CRITEPIQ.Heroes.FumbleImg")}</label>
          <file-picker name="${a.id}.fumble" type="image" value="${esc(h.fumble ?? "")}"></file-picker>
          <button type="button" data-action="preview" data-actor="${a.id}" data-kind="fumble" data-tooltip="${t("CRITEPIQ.Themes.Preview")}"><i class="fa-solid fa-skull"></i></button>
          <label>${t("CRITEPIQ.Heroes.QuoteCrit")}</label>
          <input type="text" name="${a.id}.quoteCrit" value="${esc(h.quoteCrit ?? "")}" placeholder="${t("CRITEPIQ.Heroes.QuoteCritPh")}"><span></span>
          <label>${t("CRITEPIQ.Heroes.QuoteFumble")}</label>
          <input type="text" name="${a.id}.quoteFumble" value="${esc(h.quoteFumble ?? "")}" placeholder="${t("CRITEPIQ.Heroes.QuoteFumblePh")}"><span></span>
        </div></fieldset>`;
    }).join("");
    return `<p class="hint">${t("CRITEPIQ.Heroes.Text")}</p>
      <div class="ce-heroes">${rows}</div>
      <footer class="form-footer"><button type="submit"><i class="fa-solid fa-floppy-disk"></i> ${t("CRITEPIQ.Themes.Save")}</button></footer>`;
  }

  _replaceHTML(result, content) {
    content.innerHTML = result;
  }

  /** Lit le formulaire tel quel (aperçu avant enregistrement). */
  #read() {
    const data = new foundry.applications.ux.FormDataExtended(this.element).object;
    const heroes = {};
    for (const [key, value] of Object.entries(data)) {
      const [id, field] = key.split(".");
      if (!field) continue;
      const v = String(value ?? "").trim();
      if (!v) continue;
      (heroes[id] ??= {})[field] = v;
    }
    return heroes;
  }

  static async #onPreview(event, target) {
    const actor = game.actors.get(target.dataset.actor);
    if (!actor) return;
    // Aperçu avec les valeurs du formulaire, sans les enregistrer.
    play(target.dataset.kind, { ...previewOptions(actor), heroOverride: this.#read()[actor.id] ?? {} });
  }

  static async #onSubmit() {
    await game.settings.set(MODULE_ID, "heroes", this.#read());
  }
}

/* ------------------------------------------------------------------ */
/*  Initialisation                                                       */
/* ------------------------------------------------------------------ */

Hooks.once("init", () => {
  registerSettings();
  game.modules.get(MODULE_ID).api = { play, themes: THEMES };
  if (game.system.id !== "dnd5e") {
    console.warn(`${MODULE_ID} | Conçu pour D&D 5e : la détection automatique est inactive sur ${game.system.id}.`);
    return;
  }
  Hooks.on("createChatMessage", onCreateChatMessage);
  Hooks.on("renderChatMessageHTML", onRenderChatMessage);
});
