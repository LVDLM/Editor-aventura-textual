/**
 * Web Audio API synthesizer for retro point-and-click & text adventure sound effects.
 */

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getAudioContext(): AudioContext | null {
  if (!soundEnabled) return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export const playSound = (type?: string) => {
  if (!soundEnabled || !type || type === 'none') return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'select') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.setValueAtTime(650, now + 0.04);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'pickup') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'fanfare') {
      // Fanfarria triumfal al coger objeto o lograr hito (4 notas triunfales)
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const noteOsc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        noteOsc.type = 'triangle';
        noteOsc.frequency.setValueAtTime(freq, now + idx * 0.09);
        noteGain.gain.setValueAtTime(0, now + idx * 0.09);
        noteGain.gain.linearRampToValueAtTime(0.25, now + idx * 0.09 + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.3);
        noteOsc.connect(noteGain);
        noteGain.connect(ctx.destination);
        noteOsc.start(now + idx * 0.09);
        noteOsc.stop(now + idx * 0.09 + 0.32);
      });
    } else if (type === 'door' || type === 'door_squeak') {
      // Chirrido característico de puerta o mueble
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.linearRampToValueAtTime(750, now + 0.18);
      osc.frequency.linearRampToValueAtTime(310, now + 0.38);
      osc.frequency.linearRampToValueAtTime(550, now + 0.5);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, now);
      filter.Q.setValueAtTime(2.5, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.54);
    } else if (type === 'damage') {
      // Impacto sordo y recibimiento de daño
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(170, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);

      const noiseBuf = createNoiseBuffer(ctx, 0.2);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuf;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(350, now);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSource.start(now);
    } else if (type === 'gunshot') {
      // Disparo de arma de fuego (estruendo + silbido)
      const dur = 0.35;
      const noiseBuf = createNoiseBuffer(ctx, dur);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, now);
      filter.frequency.exponentialRampToValueAtTime(180, now + dur);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.45, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSource.start(now);

      const boom = ctx.createOscillator();
      const boomGain = ctx.createGain();
      boom.type = 'sine';
      boom.frequency.setValueAtTime(240, now);
      boom.frequency.exponentialRampToValueAtTime(35, now + 0.22);
      boomGain.gain.setValueAtTime(0.4, now);
      boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      boom.connect(boomGain);
      boomGain.connect(ctx.destination);
      boom.start(now);
      boom.stop(now + 0.24);
    } else if (type === 'unlock') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.setValueAtTime(450, now + 0.07);
      osc.frequency.setValueAtTime(600, now + 0.14);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'secret') {
      const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(f, now + i * 0.05);
        g.gain.setValueAtTime(0.12, now + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.35);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + i * 0.05);
        o.stop(now + i * 0.05 + 0.38);
      });
    } else if (type === 'thunder') {
      const dur = 1.1;
      const noiseBuf = createNoiseBuffer(ctx, dur);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.linearRampToValueAtTime(100, now + dur);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noiseSource.start(now);
    } else if (type === 'page_turn') {
      const dur = 0.18;
      const noiseBuf = createNoiseBuffer(ctx, dur);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(1.5, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noiseSource.start(now);
    } else if (type === 'footsteps') {
      [0, 0.18].forEach((timeOffset) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(120, now + timeOffset);
        o.frequency.exponentialRampToValueAtTime(40, now + timeOffset + 0.08);
        g.gain.setValueAtTime(0.15, now + timeOffset);
        g.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.08);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + timeOffset);
        o.stop(now + timeOffset + 0.09);
      });
    } else if (type === 'monster') {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(140, now);
      o.frequency.exponentialRampToValueAtTime(45, now + 0.5);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 15;
      lfoGain.gain.value = 30;
      lfo.connect(o.frequency);

      g.gain.setValueAtTime(0.25, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      o.connect(g);
      g.connect(ctx.destination);
      lfo.start(now);
      o.start(now);
      lfo.stop(now + 0.55);
      o.stop(now + 0.55);
    } else if (type === 'game_over') {
      const chords = [392.0, 311.13, 293.66, 220.0];
      chords.forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(freq, now + i * 0.18);
        g.gain.setValueAtTime(0, now + i * 0.18);
        g.gain.linearRampToValueAtTime(0.15, now + i * 0.18 + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.6);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + i * 0.18);
        o.stop(now + i * 0.18 + 0.65);
      });
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(140, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    }
  } catch (e) {
    console.warn('Audio play error:', e);
  }
};
