/**
 * Critiques Épiques — sons synthétisés (WebAudio), un par ambiance.
 * Aucun fichier audio : tout est généré à la volée.
 */

let ctx = null;

function audio() {
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(c, out, { freq, type = "sine", start, dur, gain = 0.3, glideTo = null, attack = 0.02 }) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(out);
  osc.start(start);
  osc.stop(start + dur + 0.05);
  return osc;
}

function noise(c, out, { start, dur, gain = 0.3, filter = 800, type = "lowpass", sweepTo = null, shape = 2 }) {
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** shape;
  const src = c.createBufferSource();
  src.buffer = buf;
  const fl = c.createBiquadFilter();
  fl.type = type;
  fl.frequency.setValueAtTime(filter, start);
  if (sweepTo) fl.frequency.exponentialRampToValueAtTime(sweepTo, start + dur);
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(fl).connect(g).connect(out);
  src.start(start);
}

const SOUNDS = {
  /* --------- Réussites --------- */
  bells(c, out, t) {
    noise(c, out, { start: t, dur: 0.6, gain: 0.25, filter: 3000, type: "highpass" });
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((fq, i) => {
      tone(c, out, { freq: fq, type: "triangle", start: t + 0.08 + i * 0.09, dur: 1.6, gain: 0.22 });
      tone(c, out, { freq: fq * 2.01, start: t + 0.08 + i * 0.09, dur: 0.9, gain: 0.06 });
    });
    [261.63, 329.63, 392.0].forEach((fq) => tone(c, out, { freq: fq, start: t + 0.55, dur: 2.2, gain: 0.12 }));
  },
  harp(c, out, t) {
    [392, 493.88, 587.33, 739.99, 783.99, 987.77, 1174.66, 1567.98].forEach((fq, i) =>
      tone(c, out, { freq: fq, type: "triangle", start: t + i * 0.06, dur: 1.4, gain: 0.16, attack: 0.005 }));
    [196, 293.66, 392].forEach((fq) => tone(c, out, { freq: fq, start: t + 0.5, dur: 2, gain: 0.1 }));
  },
  fire(c, out, t) {
    noise(c, out, { start: t, dur: 1.4, gain: 0.55, filter: 300, sweepTo: 2600, type: "lowpass", shape: 1 });
    [130.81, 196, 261.63].forEach((fq, i) => tone(c, out, { freq: fq, type: "sawtooth", start: t + 0.35 + i * 0.04, dur: 1.6, gain: 0.06 }));
    tone(c, out, { freq: 65.4, start: t, dur: 1.2, gain: 0.35, glideTo: 98 });
  },
  ice(c, out, t) {
    for (let i = 0; i < 14; i++) {
      tone(c, out, { freq: 1800 + Math.random() * 2600, start: t + Math.random() * 0.9, dur: 0.6, gain: 0.07, attack: 0.003 });
    }
    noise(c, out, { start: t, dur: 0.8, gain: 0.18, filter: 6000, type: "highpass" });
    [659.25, 987.77, 1318.5].forEach((fq) => tone(c, out, { freq: fq, start: t + 0.3, dur: 2, gain: 0.08 }));
  },
  thunder(c, out, t) {
    noise(c, out, { start: t, dur: 0.12, gain: 0.9, filter: 5000, type: "highpass", shape: 1 });
    noise(c, out, { start: t + 0.05, dur: 2.2, gain: 0.9, filter: 900, sweepTo: 120, type: "lowpass", shape: 1.5 });
    tone(c, out, { freq: 55, start: t + 0.05, dur: 1.8, gain: 0.4, glideTo: 35 });
    [523.25, 659.25, 783.99].forEach((fq) => tone(c, out, { freq: fq, type: "triangle", start: t + 0.6, dur: 1.4, gain: 0.08 }));
  },
  choir(c, out, t) {
    [261.63, 329.63, 392, 523.25, 659.25].forEach((fq, i) => {
      const o = tone(c, out, { freq: fq, type: "sine", start: t + i * 0.05, dur: 2.6, gain: 0.08, attack: 0.5 });
      const lfo = c.createOscillator(); const lg = c.createGain();
      lfo.frequency.value = 5.5; lg.gain.value = fq * 0.008;
      lfo.connect(lg).connect(o.frequency); lfo.start(t); lfo.stop(t + 2.8);
    });
    for (let i = 0; i < 6; i++) tone(c, out, { freq: 2000 + Math.random() * 2000, start: t + 0.2 + i * 0.18, dur: 0.5, gain: 0.04, attack: 0.003 });
  },
  fanfare(c, out, t) {
    const notes = [[392, 0], [392, 0.12], [392, 0.24], [523.25, 0.38], [659.25, 0.62], [783.99, 0.86]];
    notes.forEach(([fq, d]) => {
      tone(c, out, { freq: fq, type: "sawtooth", start: t + d, dur: d > 0.8 ? 1.4 : 0.22, gain: 0.07 });
      tone(c, out, { freq: fq, type: "square", start: t + d, dur: d > 0.8 ? 1.4 : 0.22, gain: 0.03 });
    });
    noise(c, out, { start: t + 0.86, dur: 0.5, gain: 0.2, filter: 6000, type: "highpass" });
  },
  forge(c, out, t) {
    [0, 0.28, 0.56].forEach((d, i) => {
      noise(c, out, { start: t + d, dur: 0.08, gain: 0.6, filter: 3000, type: "bandpass" });
      [880, 1567, 2349].forEach((fq) => tone(c, out, { freq: fq * (1 + i * 0.06), type: "triangle", start: t + d, dur: 0.9, gain: 0.07, attack: 0.002 }));
    });
    [130.81, 196, 261.63].forEach((fq) => tone(c, out, { freq: fq, type: "sawtooth", start: t + 0.9, dur: 1.4, gain: 0.05 }));
  },

  /* --------- Échecs --------- */
  knell(c, out, t) {
    noise(c, out, { start: t, dur: 0.35, gain: 0.6, filter: 4200, type: "bandpass" });
    tone(c, out, { freq: 120, start: t, dur: 1.1, gain: 0.55, glideTo: 38 });
    [392.0, 311.13, 261.63, 196.0].forEach((fq, i) => {
      tone(c, out, { freq: fq, type: "sawtooth", start: t + 0.25 + i * 0.22, dur: 0.9, gain: 0.05, glideTo: fq * 0.94 });
      tone(c, out, { freq: fq / 2, start: t + 0.25 + i * 0.22, dur: 1.2, gain: 0.12 });
    });
  },
  void(c, out, t) {
    tone(c, out, { freq: 110, start: t, dur: 2.6, gain: 0.35, glideTo: 30, attack: 0.3 });
    tone(c, out, { freq: 116, type: "sawtooth", start: t, dur: 2.6, gain: 0.04, glideTo: 32, attack: 0.3 });
    noise(c, out, { start: t, dur: 2.4, gain: 0.35, filter: 1500, sweepTo: 80, type: "lowpass", shape: 0.5 });
  },
  ooze(c, out, t) {
    for (let i = 0; i < 12; i++) {
      const fq = 140 + Math.random() * 200;
      tone(c, out, { freq: fq, start: t + i * 0.13 + Math.random() * 0.05, dur: 0.16, gain: 0.25, glideTo: fq * 2.4, attack: 0.005 });
    }
    tone(c, out, { freq: 220, type: "sawtooth", start: t + 0.2, dur: 1.4, gain: 0.04, glideTo: 70 });
  },
  shatter(c, out, t) {
    noise(c, out, { start: t, dur: 0.5, gain: 0.8, filter: 3500, type: "highpass", shape: 3 });
    for (let i = 0; i < 18; i++) {
      tone(c, out, { freq: 2500 + Math.random() * 4500, type: "triangle", start: t + 0.05 + Math.random() * 0.9, dur: 0.25, gain: 0.06, attack: 0.002 });
    }
    tone(c, out, { freq: 90, start: t, dur: 0.8, gain: 0.4, glideTo: 40 });
  },
  blade(c, out, t) {
    noise(c, out, { start: t, dur: 0.1, gain: 0.7, filter: 2500, type: "bandpass" });
    [1244, 1865, 2637].forEach((fq) => tone(c, out, { freq: fq, type: "triangle", start: t, dur: 1.6, gain: 0.08, glideTo: fq * 0.97, attack: 0.002 }));
    noise(c, out, { start: t + 0.45, dur: 0.08, gain: 0.4, filter: 1800, type: "bandpass" });
    [293.66, 246.94, 196].forEach((fq, i) => tone(c, out, { freq: fq, type: "sawtooth", start: t + 0.6 + i * 0.25, dur: 0.8, gain: 0.05 }));
  },
  wind(c, out, t) {
    noise(c, out, { start: t, dur: 2.8, gain: 0.45, filter: 400, sweepTo: 1200, type: "bandpass", shape: 0.6 });
    [220, 207.65, 196].forEach((fq, i) => tone(c, out, { freq: fq, start: t + 0.4 + i * 0.5, dur: 1.4, gain: 0.07, attack: 0.3 }));
  },
  crows(c, out, t) {
    [0, 0.35, 0.62, 1.1].forEach((d) => {
      tone(c, out, { freq: 900 + Math.random() * 200, type: "sawtooth", start: t + d, dur: 0.22, gain: 0.12, glideTo: 450, attack: 0.01 });
      noise(c, out, { start: t + d, dur: 0.22, gain: 0.15, filter: 1400, type: "bandpass" });
    });
    noise(c, out, { start: t, dur: 1.6, gain: 0.12, filter: 500, type: "lowpass" });
  },
  trombone(c, out, t) {
    // « Wah wah wah waaah »
    const notes = [[293.66, 0, 0.35], [277.18, 0.42, 0.35], [261.63, 0.84, 0.35], [246.94, 1.26, 1.2]];
    notes.forEach(([fq, d, dur]) => {
      const o = tone(c, out, { freq: fq, type: "sawtooth", start: t + d, dur, gain: 0.13, glideTo: fq * (dur > 1 ? 0.92 : 0.98), attack: 0.04 });
      if (dur > 1) {
        const lfo = c.createOscillator(); const lg = c.createGain();
        lfo.frequency.value = 6; lg.gain.value = 6;
        lfo.connect(lg).connect(o.frequency); lfo.start(t + d); lfo.stop(t + d + dur);
      }
    });
  }
};

export function playSynth(name, volume) {
  try {
    const c = audio();
    const out = c.createGain();
    out.gain.value = volume * 0.8;
    out.connect(c.destination);
    (SOUNDS[name] ?? SOUNDS.bells)(c, out, c.currentTime + 0.02);
  } catch (err) {
    console.warn("critiques-epiques | Son synthétisé indisponible", err);
  }
}
