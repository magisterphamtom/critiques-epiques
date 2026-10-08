/**
 * Critiques Épiques — fabrication du HTML/SVG des effets (décors, sceaux, particules, dé).
 * Tout est généré en DOM + CSS, sans image externe.
 */

const RUNES = "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ";
const rand = (min, max) => min + Math.random() * (max - min);
const uid = (p) => `${p}-${Math.random().toString(36).slice(2, 9)}`;
const f = (n) => n.toFixed(1);

/* ------------------------------------------------------------------ */
/*  Le d20                                                             */
/* ------------------------------------------------------------------ */

export function d20Svg(face, kind) {
  const id = uid("ce-g");
  const crack = kind === "fumble"
    ? `<path class="ce-die-crack" d="M100 10 L94 40 L76 62 L70 92 L52 112 L44 140" />
       <path class="ce-die-crack" d="M76 62 L50 58 M70 92 L40 96 M140 150 L150 172 L138 186" />`
    : "";
  return `<svg class="ce-die-svg" viewBox="0 0 200 200" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" style="stop-color:var(--die1)"/><stop offset=".45" style="stop-color:var(--die2)"/><stop offset="1" style="stop-color:var(--die3)"/>
    </linearGradient></defs>
    <polygon class="ce-die-body" points="100,8 180,54 180,146 100,192 20,146 20,54" fill="url(#${id})" stroke-width="4" stroke-linejoin="round"/>
    <g class="ce-die-edges" fill="none" stroke-opacity=".75" stroke-width="2.5" stroke-linejoin="round">
      <polygon points="100,42 152,132 48,132"/>
      <path d="M100 8 L100 42 M180 54 L152 132 M180 54 L100 42 M20 54 L100 42 M20 54 L48 132 M180 146 L152 132 M20 146 L48 132 M100 192 L152 132 M100 192 L48 132"/>
    </g>
    ${crack}
    <text x="100" y="114" text-anchor="middle" dominant-baseline="middle" class="ce-die-face">${face}</text>
  </svg>`;
}

/* ------------------------------------------------------------------ */
/*  Décors (layers)                                                    */
/* ------------------------------------------------------------------ */

function cracksSvg() {
  const paths = [];
  const count = 9;
  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, a = (i / count) * Math.PI * 2 + rand(-0.2, 0.2);
    let d = "M 0 0";
    const steps = 6 + Math.floor(rand(0, 4));
    for (let k = 0; k < steps; k++) {
      a += rand(-0.35, 0.35);
      const len = rand(60, 150);
      x += Math.cos(a) * len; y += Math.sin(a) * len;
      d += ` L ${f(x)} ${f(y)}`;
      if (Math.random() < 0.3) {
        const b = a + (Math.random() < 0.5 ? 1 : -1) * rand(0.6, 1.1);
        const bl = rand(40, 110);
        paths.push(`M ${f(x)} ${f(y)} L ${f(x + Math.cos(b) * bl)} ${f(y + Math.sin(b) * bl)}`);
      }
    }
    paths.push(d);
  }
  return `<svg class="ce-layer ce-cracks" viewBox="-960 -540 1920 1080" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    ${paths.map((p, i) => `<path d="${p}" style="--i:${i}"/>`).join("")}</svg>`;
}

function frostSvg() {
  // Cristaux de givre qui poussent depuis les bords de l'écran.
  const paths = [];
  const starts = [];
  for (let i = 0; i < 26; i++) {
    const side = i % 4;
    const t = rand(-1, 1);
    if (side === 0) starts.push([t * 960, -540, Math.PI / 2]);
    else if (side === 1) starts.push([960, t * 540, Math.PI]);
    else if (side === 2) starts.push([t * 960, 540, -Math.PI / 2]);
    else starts.push([-960, t * 540, 0]);
  }
  for (const [sx, sy, dir] of starts) {
    let x = sx, y = sy, a = dir + rand(-0.6, 0.6);
    let d = `M ${f(x)} ${f(y)}`;
    for (let k = 0; k < 5; k++) {
      const len = rand(30, 70);
      x += Math.cos(a) * len; y += Math.sin(a) * len;
      d += ` L ${f(x)} ${f(y)}`;
      for (const s of [-1, 1]) {
        const b = a + s * 1.05;
        const bl = len * 0.55;
        paths.push(`M ${f(x)} ${f(y)} L ${f(x + Math.cos(b) * bl)} ${f(y + Math.sin(b) * bl)}`);
      }
      a += rand(-0.25, 0.25);
    }
    paths.push(d);
  }
  return `<div class="ce-layer ce-frost-edge"></div>
    <svg class="ce-layer ce-frost" viewBox="-960 -540 1920 1080" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    ${paths.map((p, i) => `<path d="${p}" style="--i:${i % 30}"/>`).join("")}</svg>`;
}

function lightningSvg() {
  const bolts = [];
  for (let i = 0; i < 4; i++) {
    let x = rand(-900, 900), y = -560;
    const tx = rand(-200, 200), ty = rand(-120, 60);
    let d = `M ${f(x)} ${f(y)}`;
    const steps = 9;
    for (let k = 1; k <= steps; k++) {
      const p = k / steps;
      const nx = x + (tx - x) * (1 / (steps - k + 1)) + rand(-60, 60);
      const ny = y + (ty - y) * (1 / (steps - k + 1));
      x = nx; y = ny;
      d += ` L ${f(x)} ${f(y)}`;
    }
    bolts.push(d);
  }
  return `<svg class="ce-layer ce-lightning" viewBox="-960 -540 1920 1080" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    ${bolts.map((d, i) => `<g style="--i:${i}"><path class="ce-bolt-glow" d="${d}"/><path class="ce-bolt" d="${d}"/></g>`).join("")}</svg>`;
}

function flamesHtml() {
  const tongues = [];
  for (let i = 0; i < 26; i++) {
    tongues.push(`<span style="--x:${f(rand(-4, 100))}vw;--w:${f(rand(8, 18))}vw;--h:${f(rand(26, 55))}vh;--delay:${f(rand(0, 0.8))}s;--dur:${f(rand(0.7, 1.4))}s"></span>`);
  }
  return `<div class="ce-layer ce-flames">${tongues.join("")}</div>`;
}

function smokeHtml() {
  const puffs = [];
  for (let i = 0; i < 12; i++) {
    puffs.push(`<span style="--x:${f(rand(-10, 90))}vw;--y:${f(rand(10, 90))}vh;--s:${f(rand(30, 60))}vmax;--delay:${f(rand(0, 0.8))}s;--dx:${f(rand(-12, 12))}vw"></span>`);
  }
  return `<div class="ce-layer ce-smoke">${puffs.join("")}</div>`;
}

function dripsSvg() {
  const drips = [];
  let x = -980;
  while (x < 980) {
    const w = rand(20, 70);
    const h = rand(60, 380);
    drips.push(`<path style="--i:${drips.length % 12}" d="M ${f(x)} -560 L ${f(x)} ${f(-540 + h)} a ${f(w / 2)} ${f(w / 2)} 0 0 0 ${f(w)} 0 L ${f(x + w)} -560 Z"/>`);
    x += w + rand(-6, 30);
  }
  return `<svg class="ce-layer ce-drips" viewBox="-960 -540 1920 1080" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
    <rect x="-1000" y="-560" width="2000" height="40"/>${drips.join("")}</svg>`;
}

function starfieldHtml() {
  const stars = [];
  for (let i = 0; i < 90; i++) {
    stars.push(`<span style="--x:${f(rand(0, 100))}vw;--y:${f(rand(0, 100))}vh;--s:${f(rand(1, 3.2))}px;--delay:${f(rand(0, 2))}s"></span>`);
  }
  return `<div class="ce-layer ce-starfield">${stars.join("")}</div>`;
}

const LAYERS = {
  glow: () => `<div class="ce-layer ce-glow"></div>`,
  dark: () => `<div class="ce-layer ce-dark"></div>`,
  rays: () => `<div class="ce-rays"></div>`,
  flash: () => `<div class="ce-layer ce-flash"></div>`,
  aurora: () => `<div class="ce-layer ce-aurora"><span></span><span></span><span></span></div>`,
  flames: flamesHtml,
  frost: frostSvg,
  lightning: lightningSvg,
  starfield: starfieldHtml,
  cracks: cracksSvg,
  smoke: smokeHtml,
  drips: dripsSvg,
  void: () => `<div class="ce-layer ce-void"><span class="ce-void-swirl"></span><span class="ce-void-hole"></span></div>`,
  confetti: () => ""
};

export function layersHtml(list) {
  return list.map((l) => LAYERS[l]?.() ?? "").join("");
}

/* ------------------------------------------------------------------ */
/*  Sceaux centraux (sigils)                                            */
/* ------------------------------------------------------------------ */

function runeRing(radius, cls) {
  const text = Array.from({ length: 3 }, () => RUNES).join(" ");
  const id = uid("ce-r");
  return `<svg class="ce-ring ${cls}" viewBox="-300 -300 600 600" aria-hidden="true">
    <defs><path id="${id}" d="M ${-radius},0 a ${radius},${radius} 0 1,1 ${radius * 2},0 a ${radius},${radius} 0 1,1 ${-radius * 2},0"/></defs>
    <circle r="${radius + 22}" class="ce-ring-line"/><circle r="${radius - 24}" class="ce-ring-line"/>
    <text class="ce-ring-text"><textPath href="#${id}" textLength="${Math.round(2 * Math.PI * radius) - 10}">${text}</textPath></text>
  </svg>`;
}

function svgWrap(cls, inner, viewBox = "-300 -300 600 600") {
  return `<svg class="ce-ring ${cls}" viewBox="${viewBox}" aria-hidden="true">${inner}</svg>`;
}

function arcaneSigil() {
  const tri = (r, rot) => {
    const pts = [0, 1, 2].map((k) => {
      const a = rot + (k * 2 * Math.PI) / 3;
      return `${f(Math.cos(a) * r)},${f(Math.sin(a) * r)}`;
    });
    return `<polygon points="${pts.join(" ")}"/>`;
  };
  const dots = Array.from({ length: 12 }, (_, k) => {
    const a = (k * Math.PI) / 6;
    return `<circle cx="${f(Math.cos(a) * 250)}" cy="${f(Math.sin(a) * 250)}" r="${k % 3 ? 4 : 9}" class="ce-sig-fill"/>`;
  }).join("");
  return svgWrap("ce-ring-a", `<g class="ce-sig-line">
      <circle r="250"/><circle r="232"/>${tri(232, -Math.PI / 2)}${tri(232, Math.PI / 2)}<circle r="118"/></g>${dots}`)
    + runeRing(175, "ce-ring-b");
}

function snowflakeSigil() {
  let arms = "";
  for (let k = 0; k < 6; k++) {
    const rot = k * 60;
    arms += `<g transform="rotate(${rot})">
      <path d="M0 0 L0 -260 M0 -90 L-40 -130 M0 -90 L40 -130 M0 -160 L-46 -205 M0 -160 L46 -205 M0 -220 L-24 -246 M0 -220 L24 -246"/>
      <polygon points="0,-262 -10,-280 0,-298 10,-280" class="ce-sig-fill"/></g>`;
  }
  return svgWrap("ce-ring-a ce-slow", `<g class="ce-sig-line">${arms}<circle r="120"/></g>`);
}

function vinesSigil() {
  let leaves = "";
  for (let k = 0; k < 28; k++) {
    const a = (k / 28) * 360;
    const out = k % 2 ? 1 : -1;
    leaves += `<g transform="rotate(${f(a)}) translate(0 -232)"><path class="ce-sig-fill" transform="rotate(${out * 50})" d="M0 0 C 12 -10 14 -28 0 -42 C -14 -28 -12 -10 0 0 Z"/></g>`;
  }
  return svgWrap("ce-ring-a ce-slow", `<g class="ce-sig-line"><circle r="232"/><circle r="196" stroke-dasharray="4 10"/></g>${leaves}`);
}

function constellationSigil() {
  const pts = Array.from({ length: 14 }, (_, k) => {
    const a = (k / 14) * Math.PI * 2 + rand(-0.15, 0.15);
    const r = rand(190, 270);
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
  const lines = pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length];
    return `<line x1="${f(p[0])}" y1="${f(p[1])}" x2="${f(q[0])}" y2="${f(q[1])}" style="--i:${i}"/>`;
  }).join("");
  const stars = pts.map((p, i) => `<circle class="ce-sig-fill ce-twinkle" cx="${f(p[0])}" cy="${f(p[1])}" r="${i % 3 ? 4 : 7}" style="--i:${i}"/>`).join("");
  return svgWrap("ce-ring-b ce-slow", `<g class="ce-sig-line ce-constellation">${lines}</g>${stars}`);
}

function laurelSigil() {
  const branch = (side) => {
    let out = "";
    for (let k = 0; k < 11; k++) {
      const a = 200 + k * 13; // degrés, de bas en haut
      const rad = (a * Math.PI) / 180;
      const x = Math.cos(rad) * 225 * side;
      const y = -Math.sin(rad) * 225;
      const rot = side * (90 - a) + (side > 0 ? 0 : 180);
      out += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">
        <path class="ce-sig-fill" d="M0 0 C 10 -12 10 -30 0 -40 C -10 -30 -10 -12 0 0 Z" transform="rotate(${side * 35})"/>
        <path class="ce-sig-fill" d="M0 0 C 10 -12 10 -30 0 -40 C -10 -30 -10 -12 0 0 Z" transform="rotate(${side * 145})"/></g>`;
    }
    return out;
  };
  return svgWrap("ce-laurel", `<g class="ce-sig-line"><path d="M -60 218 A 225 225 0 0 1 -212 -76" /><path d="M 60 218 A 225 225 0 0 0 212 -76"/></g>${branch(1)}${branch(-1)}
    <path class="ce-sig-fill" d="M -70 228 L 70 228 L 52 262 L 70 296 L -70 296 L -52 262 Z" opacity=".9"/>`);
}

function wingsSigil() {
  const wing = (side) => {
    let feathers = "";
    for (let k = 0; k < 10; k++) {
      const ang = 8 + k * 8.5;                 // de presque vertical à presque horizontal
      const len = 170 + Math.sin((k / 9) * Math.PI) * 110;
      feathers += `<path class="ce-sig-fill" transform="rotate(${f(ang)})" d="M0 0 C 20 -${f(len * 0.3)} 16 -${f(len * 0.8)} 0 -${f(len)} C -16 -${f(len * 0.8)} -20 -${f(len * 0.3)} 0 0 Z" opacity="${f(0.95 - k * 0.04)}"/>`;
    }
    return `<g class="ce-wing" transform="translate(${side * 80} 40) scale(${side} 1)">${feathers}</g>`;
  };
  return svgWrap("ce-wings", `${wing(-1)}${wing(1)}`, "-420 -320 840 640");
}

function gearSigil() {
  const teeth = 24;
  let d = "";
  for (let k = 0; k < teeth; k++) {
    const a0 = (k / teeth) * Math.PI * 2;
    const a1 = a0 + Math.PI / teeth * 0.5;
    const a2 = a0 + Math.PI / teeth * 1.0;
    const a3 = a0 + Math.PI / teeth * 1.5;
    const P = (a, r) => `${f(Math.cos(a) * r)} ${f(Math.sin(a) * r)}`;
    d += `${k ? "L" : "M"} ${P(a0, 240)} L ${P(a1, 270)} L ${P(a2, 270)} L ${P(a3, 240)} `;
  }
  return svgWrap("ce-ring-a ce-slow", `<g class="ce-sig-line"><path d="${d} Z"/><circle r="214"/></g>`) + runeRing(170, "ce-ring-b");
}

function dragonEyeSigil() {
  const id = uid("ce-eye");
  return svgWrap("ce-dragoneye", `<defs><radialGradient id="${id}">
      <stop offset="0" style="stop-color:var(--c1)"/><stop offset=".55" style="stop-color:var(--c2)"/><stop offset="1" style="stop-color:var(--c3)"/></radialGradient></defs>
    <path class="ce-eye-lid" d="M -290 0 Q 0 -200 290 0 Q 0 200 -290 0 Z"/>
    <circle r="150" fill="url(#${id})" class="ce-eye-iris"/>
    <path class="ce-sig-line" d="M -290 0 Q 0 -200 290 0 Q 0 200 -290 0 Z"/>`, "-320 -220 640 440");
}

function skullSigil() {
  return svgWrap("ce-skull", `<g class="ce-sig-fill">
      <path d="M0 -230 C 130 -230 200 -140 200 -40 C 200 40 160 80 140 110 L 140 170 L -140 170 L -140 110 C -160 80 -200 40 -200 -40 C -200 -140 -130 -230 0 -230 Z"/>
    </g>
    <g class="ce-skull-holes">
      <ellipse cx="-78" cy="-20" rx="52" ry="60"/><ellipse cx="78" cy="-20" rx="52" ry="60"/>
      <path d="M0 50 L -24 100 L 24 100 Z"/>
      <path d="M -100 170 L -100 230 M -50 170 L -50 240 M 0 170 L 0 240 M 50 170 L 50 240 M 100 170 L 100 230" class="ce-sig-line"/>
    </g>`, "-300 -300 600 600");
}

function spiralSigil() {
  let d = "M 0 0";
  for (let t = 0; t < Math.PI * 9; t += 0.15) {
    const r = 6 + t * 9.5;
    d += ` L ${f(Math.cos(t) * r)} ${f(Math.sin(t) * r)}`;
  }
  return svgWrap("ce-ring-a ce-spiral", `<g class="ce-sig-line"><path d="${d}"/></g>`);
}

function brokenSwordSigil() {
  const blade = `<path class="ce-sig-fill" d="M -14 -40 L 14 -40 L 12 140 L 0 170 L -12 140 Z"/>`;
  return svgWrap("ce-sword", `
    <g class="ce-sword-top"><path class="ce-sig-fill" d="M -90 -250 L 90 -250 L 90 -230 L -90 -230 Z"/>
      <path class="ce-sig-fill" d="M -12 -330 L 12 -330 L 12 -250 L -12 -250 Z"/><circle cy="-340" r="18" class="ce-sig-fill"/>
      <path class="ce-sig-fill ce-blade" d="M -18 -230 L 18 -230 L 16 -60 L 4 -40 L -6 -66 L -16 -48 Z"/></g>
    <g class="ce-sword-bottom"><path class="ce-sig-fill ce-blade" d="M -16 -30 L -6 -50 L 4 -28 L 16 -46 L 14 150 L 0 190 L -14 150 Z"/></g>`, "-300 -380 600 620");
}

function dizzySigil() {
  const stars = Array.from({ length: 6 }, (_, k) => `<span class="ce-dizzy-star" style="--i:${k}">★</span>`).join("");
  return `<div class="ce-dizzy">${stars}</div>`;
}

const SIGILS = {
  runes: () => runeRing(230, "ce-ring-a") + runeRing(170, "ce-ring-b"),
  arcane: arcaneSigil,
  snowflake: snowflakeSigil,
  vines: vinesSigil,
  constellation: constellationSigil,
  laurel: laurelSigil,
  wings: wingsSigil,
  gear: gearSigil,
  dragoneye: dragonEyeSigil,
  skull: skullSigil,
  spiral: spiralSigil,
  brokensword: brokenSwordSigil,
  dizzy: dizzySigil,
  none: () => ""
};

export function sigilHtml(type) {
  return SIGILS[type]?.() ?? "";
}

/* ------------------------------------------------------------------ */
/*  Particules                                                          */
/* ------------------------------------------------------------------ */

const CROW = `<svg viewBox="0 0 100 50" aria-hidden="true"><path d="M0 22 C 18 6 32 8 44 24 C 47 18 53 18 56 24 C 68 8 82 6 100 22 C 84 18 70 22 60 34 L 50 44 L 40 34 C 30 22 16 18 0 22 Z"/></svg>`;

export function particlesHtml(specs, reduced) {
  const out = [];
  for (const spec of specs) {
    const count = reduced ? Math.ceil(spec.count / 3) : spec.count;
    for (let i = 0; i < count; i++) {
      const vars = [
        `--a:${f(rand(0, 360))}deg`,
        `--d:${f(rand(20, 58))}vmin`,
        `--s:${f(rand(3, 10))}px`,
        `--delay:${f(rand(0, spec.motion === "burst" ? 0.5 : 1.4))}s`,
        `--x:${f(rand(0, 100))}vw`,
        `--y:${f(rand(0, 100))}vh`,
        `--dx:${f(rand(-18, 18))}vw`,
        `--r:${f(rand(-540, 540))}deg`,
        `--dur:${f(rand(1.6, 3.2))}s`,
        `--hue:${Math.floor(rand(0, 360))}`
      ].join(";");
      const inner = spec.shape === "crow" ? CROW : (spec.shape === "flake" ? "❄" : "");
      out.push(`<span class="ce-p ce-shape-${spec.shape} ce-m-${spec.motion}" style="${vars}">${inner}</span>`);
    }
  }
  return `<div class="ce-particles">${out.join("")}</div>`;
}
