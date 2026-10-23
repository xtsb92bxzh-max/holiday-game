/**
 * Small, original sound effects synthesised with the Web Audio API.
 * Nothing plays unless the player has switched sound on.
 */
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(ac: AudioContext, freq: number, start: number, dur: number, type: OscillatorType = 'square', gain = 0.06) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

function noise(ac: AudioContext, start: number, dur: number, gain = 0.05) {
  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (Math.random() < 0.3 ? 1 : 0.2);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1800;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(filter).connect(g).connect(ac.destination);
  src.start(start);
}

export type Sfx = 'fanfare' | 'tick' | 'keep' | 'maybe' | 'bin' | 'applause' | 'mystery';

export function play(sfx: Sfx) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + 0.01;
  switch (sfx) {
    case 'fanfare':
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ac, f, t + i * 0.11, 0.18, 'square', 0.05));
      tone(ac, 1046.5, t + 0.5, 0.6, 'triangle', 0.07);
      tone(ac, 783.99, t + 0.5, 0.6, 'triangle', 0.05);
      break;
    case 'tick':
      tone(ac, 1400, t, 0.04, 'square', 0.025);
      break;
    case 'keep':
      tone(ac, 659.25, t, 0.12, 'triangle', 0.08);
      tone(ac, 987.77, t + 0.1, 0.25, 'triangle', 0.08);
      break;
    case 'maybe':
      tone(ac, 587.33, t, 0.15, 'sine', 0.08);
      tone(ac, 554.37, t + 0.15, 0.2, 'sine', 0.08);
      break;
    case 'bin':
      tone(ac, 196, t, 0.35, 'sawtooth', 0.05);
      tone(ac, 185, t + 0.05, 0.4, 'sawtooth', 0.04);
      break;
    case 'applause':
      for (let i = 0; i < 14; i++) noise(ac, t + i * 0.09 + Math.random() * 0.05, 0.12, 0.04);
      break;
    case 'mystery':
      [392, 369.99, 349.23, 329.63].forEach((f, i) => tone(ac, f, t + i * 0.16, 0.2, 'triangle', 0.06));
      break;
  }
}
