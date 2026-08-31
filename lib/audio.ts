"use client";

export type GameCue = "select" | "phase" | "battle-open" | "dice" | "clash" | "arrows" | "cavalry" | "capture" | "retreat" | "victory";

let context: AudioContext | null = null;
let master: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;

function audioContext() {
  if (typeof window === "undefined") return null;
  const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!context || context.state === "closed") {
    context = new AudioCtor();
    master = context.createGain();
    master.gain.value = .7;
    compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 18;
    compressor.ratio.value = 5;
    master.connect(compressor).connect(context.destination);
  }
  if (context.state === "suspended") void context.resume();
  return context;
}

function bus(ctx: AudioContext, volume: number, pan = 0) {
  const gain = ctx.createGain();
  gain.gain.value = volume;
  if (typeof ctx.createStereoPanner === "function") {
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    gain.connect(panner).connect(master!);
  } else gain.connect(master!);
  return gain;
}

function tone(ctx: AudioContext, at: number, frequency: number, duration: number, volume: number, type: OscillatorType = "triangle", endFrequency = frequency, pan = 0) {
  const oscillator = ctx.createOscillator();
  const gain = bus(ctx, volume, pan);
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, at);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), at + duration);
  gain.gain.setValueAtTime(.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + Math.min(.018, duration / 4));
  gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
  oscillator.connect(gain);
  oscillator.start(at);
  oscillator.stop(at + duration + .03);
}

function noise(ctx: AudioContext, at: number, duration: number, volume: number, filterType: BiquadFilterType, frequency: number, pan = 0) {
  const frames = Math.ceil(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < frames; index++) data[index] = (Math.random() * 2 - 1) * (1 - index / frames);
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = bus(ctx, volume, pan);
  filter.type = filterType;
  filter.frequency.value = frequency;
  filter.Q.value = 1.8;
  gain.gain.setValueAtTime(.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + .012);
  gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
  source.buffer = buffer;
  source.connect(filter).connect(gain);
  source.start(at);
}

function impact(ctx: AudioContext, at: number, pan = 0, weight = 1) {
  noise(ctx, at, .13, .11 * weight, "highpass", 1250, pan);
  tone(ctx, at, 112, .17, .1 * weight, "square", 44, pan);
  tone(ctx, at + .014, 720, .08, .025 * weight, "sawtooth", 210, pan);
}

export function playGameCue(cue: GameCue, enabled = true) {
  if (!enabled) return;
  const ctx = audioContext();
  if (!ctx) return;
  const now = ctx.currentTime + .012;
  if (cue === "select") {
    impact(ctx, now, -.08, .62);
    tone(ctx, now, 92, .2, .055, "triangle", 48);
  } else if (cue === "phase") {
    [146, 196, 246].forEach((note, index) => tone(ctx, now + index * .09, note, .34, .045, "triangle", note * .98, index * .08));
    impact(ctx, now, 0, .5);
  } else if (cue === "battle-open") {
    [58, 58, 73].forEach((note, index) => tone(ctx, now + index * .16, note, .24, .1, "sine", 38, index === 1 ? .25 : -.25));
    tone(ctx, now + .08, 110, .75, .04, "sawtooth", 82);
  } else if (cue === "dice") {
    for (let index = 0; index < 7; index++) impact(ctx, now + index * .055, -.4 + Math.random() * .8, .28 + index * .025);
  } else if (cue === "clash") {
    impact(ctx, now, -.15 + Math.random() * .3, 1);
    impact(ctx, now + .08, .22, .7);
  } else if (cue === "arrows") {
    for (let index = 0; index < 4; index++) {
      noise(ctx, now + index * .035, .28, .035, "bandpass", 2600 + index * 350, -.6 + index * .38);
      tone(ctx, now + index * .035, 980, .16, .012, "sine", 2200, -.6 + index * .38);
    }
  } else if (cue === "cavalry") {
    for (let index = 0; index < 8; index++) {
      const at = now + index * .09 + (index % 2) * .022;
      tone(ctx, at, 76, .1, .085, "sine", 42, -.45 + index * .12);
      noise(ctx, at, .08, .045, "lowpass", 420, -.45 + index * .12);
    }
  } else if (cue === "capture") {
    impact(ctx, now, 0, 1.15);
    [110, 147, 220].forEach((note, index) => tone(ctx, now + .12 + index * .045, note, .8, .055, "sawtooth", note * .94, index * .12 - .12));
  } else if (cue === "retreat") {
    tone(ctx, now, 164, .38, .045, "triangle", 82);
    tone(ctx, now + .12, 110, .42, .04, "triangle", 55);
  } else if (cue === "victory") {
    [147, 196, 247, 294, 392].forEach((note, index) => tone(ctx, now + index * .11, note, .8, .055, "triangle", note * 1.01, index * .08 - .16));
    impact(ctx, now, 0, .75);
  }
}

export function startBattleAmbience(enabled = true) {
  if (!enabled) return () => undefined;
  const ctx = audioContext();
  if (!ctx) return () => undefined;
  let stopped = false;
  playGameCue("battle-open", true);
  const distantEvent = () => {
    if (stopped || !context) return;
    const at = context.currentTime + .03;
    noise(context, at, .8, .011, "lowpass", 520, -.7 + Math.random() * 1.4);
    if (Math.random() > .45) impact(context, at + .2, -.7 + Math.random() * 1.4, .2);
  };
  distantEvent();
  const interval = window.setInterval(distantEvent, 1900);
  return () => { stopped = true; window.clearInterval(interval); };
}
