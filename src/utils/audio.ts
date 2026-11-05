import { SoundDefinition, SynthSoundConfig, GameProject, InstrumentType } from '../types';

/**
 * Web Audio API procedural sound synthesizer & audio manager.
 * Supports native Web Audio waveforms, FM synthesis, noise generation, filters, LFO modulation,
 * arpeggios, and external audio URL streaming.
 */

let audioCtx: AudioContext | null = null;
let soundEnabled = true;
const activeAudioElements = new Set<HTMLAudioElement>();
const urlAudioCache = new Map<string, HTMLAudioElement>();

export function getAudioContext(): AudioContext | null {
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
  if (!enabled) {
    stopAllAudio();
  }
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function stopAllAudio() {
  activeAudioElements.forEach((audio) => {
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      // Ignore
    }
  });
  activeAudioElements.clear();
}

/**
 * Generates a white/pink noise audio buffer for Web Audio
 */
function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * Official default sound library preset configurations.
 * These can be previewed, edited, and expanded by the Administrator,
 * and used freely by authors/creators in their projects.
 */
export const DEFAULT_SOUND_LIBRARY: SoundDefinition[] = [
  {
    id: 'click',
    name: 'Clic de interfaz',
    description: 'Pulsación sutil y suave de botón o enlace',
    category: 'ui',
    sourceType: 'synth',
    isGlobal: true,
    isDefault: true,
    synthConfig: {
      oscType: 'sine',
      startFreq: 420,
      endFreq: 220,
      rampType: 'exponential',
      duration: 0.05,
      volume: 0.2,
    },
  },
  {
    id: 'select',
    name: 'Selección de opción',
    description: 'Tono ágil de confirmación en diálogos y menús',
    category: 'ui',
    sourceType: 'synth',
    isGlobal: true,
    isDefault: true,
    synthConfig: {
      oscType: 'triangle',
      startFreq: 520,
      endFreq: 680,
      rampType: 'linear',
      duration: 0.08,
      volume: 0.2,
    },
  },
  {
    id: 'pickup',
    name: 'Coger objeto (Tono rápido)',
    description: 'Sonido alegre al añadir un objeto al inventario',
    category: 'action',
    sourceType: 'synth',
    isGlobal: true,
    isDefault: true,
    synthConfig: {
      oscType: 'sine',
      startFreq: 440,
      endFreq: 880,
      rampType: 'exponential',
      duration: 0.14,
      volume: 0.25,
    },
  },
  {
    id: 'fanfare',
    name: 'Fanfarria de triunfo',
    description: 'Arpegio ascendente de 4 notas victoriosas (Do5, Mi5, Sol5, Do6)',
    category: 'music',
    sourceType: 'synth',
    isGlobal: true,
    isDefault: true,
    synthConfig: {
      oscType: 'arpeggio',
      startFreq: 523.25,
      duration: 0.45,
      volume: 0.3,
      arpeggioNotes: [523.25, 659.25, 783.99, 1046.5],
      arpeggioSpeed: 0.09,
    },
  },
  {
    id: 'door_squeak',
    name: 'Chirrido de puerta / Mueble',
    description: 'Crujido de madera y bisagras al abrir o mover elementos',
    category: 'environment',
    sourceType: 'synth',
    isGlobal: true,
    isDefault: true,
    synthConfig: {
      oscType: 'sawtooth',
      startFreq: 420,
      endFreq: 550,
      rampType: 'linear',
      duration: 0.54,
      volume: 0.22,
      filterType: 'bandpass',
      filterFreq: 650,
      filterQ: 2.5,
    },
  },
  {
    id: 'unlock',
    name: 'Abrir cerrojo / Llave',
    description: 'Mecanismo de cerradura encajando con tres clics metálicos',
    category: 'action',
    sourceType: 'synth',
    isGlobal: true,
    isDefault: true,
    synthConfig: {
      oscType: 'arpeggio',
      startFreq: 300,
      duration: 0.25,
      volume: 0.2,
      arpeggioNotes: [300, 450, 600],
      arpeggioSpeed: 0.07,
    },
  },
  {
    id: 'secret',
    name: 'Secreto / Magia / Arpegio',
    description: 'Melodía cristalina de descubrimiento oculto',
    category: 'magic',
    sourceType: 'synth',
    isGlobal: true,
    isDefault: true,
    synthConfig: {
      oscType: 'arpeggio',
      startFreq: 523.25,
      duration: 0.42,
      volume: 0.2,
      arpeggioNotes: [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98],
      arpeggioSpeed: 0.05,
    },
  },
  {
    id: 'damage',
    name: 'Recibir daño / Impacto',
    description: 'Golpe contundente con mezcla sorda de ruido y tono bajo',
    category: 'action',
    sourceType: 'synth',
    isGlobal: true,
    isDefault: true,
    synthConfig: {
      oscType: 'square',
      startFreq: 180,
      endFreq: 30,
      rampType: 'exponential',
      duration: 0.28,
      volume: 0.35,
      noiseMix: 0.35,
      filterType: 'lowpass',
      filterFreq: 350,
    },
  },
  {
    id: 'gunshot',
    name: 'Disparo de arma de fuego',
    description: 'Detonación explosiva con estruendo inicial y silbido sordo',
    category: 'action',
    sourceType: 'synth',
    isGlobal: true,
    isDefault: true,
    synthConfig: {
      oscType: 'noise',
      startFreq: 3200,
      endFreq: 180,
      rampType: 'exponential',
      duration: 0.38,
      volume: 0.45,
      filterType: 'lowpass',
      filterFreq: 3000,
    },
  },
  {
    id: 'thunder',
    name: 'Trueno / Relámpago',
    description: 'Estruendo atmosférico grave de tormenta',
    category: 'environment',
    sourceType: 'synth',
    isGlobal: true,
    isDefault: true,
    synthConfig: {
      oscType: 'noise',
      startFreq: 450,
      endFreq: 90,
      rampType: 'linear',
      duration: 1.1,
      volume: 0.35,
      filterType: 'lowpass',
      filterFreq: 450,
    },
  },
  {
    id: 'page_turn',
    name: 'Pasar página / Hoja',
    description: 'Fricción de papel o pergamino antiguo',
    category: 'environment',
    sourceType: 'synth',
    isGlobal: true,
    isDefault: true,
    synthConfig: {
      oscType: 'noise',
      startFreq: 1200,
      endFreq: 800,
      rampType: 'linear',
      duration: 0.18,
      volume: 0.18,
      filterType: 'bandpass',
      filterFreq: 1200,
      filterQ: 1.8,
    },
  },
  {
    id: 'footsteps',
    name: 'Pasos / Caminar',
    description: 'Dos pisadas sobre suelo firme o madera',
    category: 'movement',
    sourceType: 'synth',
    isGlobal: true,
    isDefault: true,
    synthConfig: {
      oscType: 'arpeggio',
      startFreq: 120,
      duration: 0.3,
      volume: 0.22,
      arpeggioNotes: [120, 110],
      arpeggioSpeed: 0.18,
    },
  },
  {
    id: 'monster',
    name: 'Rugido de monstruo',
    description: 'Gruñido gutural con modulación de baja frecuencia (LFO)',
    category: 'horror',
    sourceType: 'synth',
    isGlobal: true,
    isDefault: true,
    synthConfig: {
      oscType: 'sawtooth',
      startFreq: 140,
      endFreq: 45,
      rampType: 'exponential',
      duration: 0.55,
      volume: 0.3,
      lfoFreq: 16,
      lfoGain: 35,
    },
  },
  {
    id: 'game_over',
    name: 'Fin de partida / Muerte',
    description: 'Acordes menores descendentes de derrota luctuosa',
    category: 'horror',
    sourceType: 'synth',
    isGlobal: true,
    isDefault: true,
    synthConfig: {
      oscType: 'arpeggio',
      startFreq: 392.0,
      duration: 0.75,
      volume: 0.25,
      arpeggioNotes: [392.0, 311.13, 293.66, 220.0],
      arpeggioSpeed: 0.18,
    },
  },
  {
    id: 'error',
    name: 'Error / Acción imposible',
    description: 'Tono seco de acción denegada o bloqueo',
    category: 'ui',
    sourceType: 'synth',
    isGlobal: true,
    isDefault: true,
    synthConfig: {
      oscType: 'sawtooth',
      startFreq: 180,
      endFreq: 130,
      rampType: 'linear',
      duration: 0.16,
      volume: 0.18,
    },
  },
  {
    id: 'bell_toll',
    name: 'Campanada solemne',
    description: 'Campana grave de monasterio o torre con resonancia armónica',
    category: 'environment',
    sourceType: 'synth',
    isGlobal: true,
    isDefault: true,
    synthConfig: {
      oscType: 'sine',
      startFreq: 261.63, // C4
      endFreq: 255,
      rampType: 'exponential',
      duration: 1.8,
      volume: 0.35,
      lfoFreq: 3,
      lfoGain: 6,
      filterType: 'lowpass',
      filterFreq: 800,
    },
  },
  {
    id: 'magic_spell',
    name: 'Hechizo / Destello místico',
    description: 'Destello mágico arpegiado rápido con reverberación etérea',
    category: 'magic',
    sourceType: 'synth',
    isGlobal: true,
    isDefault: true,
    synthConfig: {
      oscType: 'arpeggio',
      startFreq: 880,
      duration: 0.45,
      volume: 0.25,
      arpeggioNotes: [880, 1108.73, 1318.51, 1760, 2093.0],
      arpeggioSpeed: 0.06,
    },
  },
  {
    id: 'water_splash',
    name: 'Gota / Salpicadura de agua',
    description: 'Gota de agua cayendo en una cueva o estanque',
    category: 'environment',
    sourceType: 'synth',
    isGlobal: true,
    isDefault: true,
    synthConfig: {
      oscType: 'sine',
      startFreq: 850,
      endFreq: 1600,
      rampType: 'exponential',
      duration: 0.15,
      volume: 0.22,
    },
  },
  {
    id: 'sword_clash',
    name: 'Choque de espadas metálico',
    description: 'Impacto de acero con timbre metálico agudo',
    category: 'action',
    sourceType: 'synth',
    isGlobal: true,
    isDefault: true,
    synthConfig: {
      oscType: 'sawtooth',
      startFreq: 1400,
      endFreq: 350,
      rampType: 'exponential',
      duration: 0.28,
      volume: 0.3,
      noiseMix: 0.4,
      filterType: 'bandpass',
      filterFreq: 1500,
      filterQ: 4.0,
    },
  },
  {
    id: 'coin_drop',
    name: 'Tintineo de monedas de oro',
    description: 'Sonido brillante de monedas o tesoro al recogerlo',
    category: 'action',
    sourceType: 'synth',
    isGlobal: true,
    isDefault: true,
    synthConfig: {
      oscType: 'arpeggio',
      startFreq: 987.77, // B5
      duration: 0.28,
      volume: 0.25,
      arpeggioNotes: [987.77, 1318.51],
      arpeggioSpeed: 0.08,
    },
  },
  {
    id: 'laser_retro',
    name: 'Rayo láser arcade',
    description: 'Disparo láser sintetizado estilo aventura espacial retro',
    category: 'action',
    sourceType: 'synth',
    isGlobal: true,
    isDefault: true,
    synthConfig: {
      oscType: 'sawtooth',
      startFreq: 1600,
      endFreq: 120,
      rampType: 'exponential',
      duration: 0.22,
      volume: 0.28,
    },
  },
  {
    id: 'creepy_ambient',
    name: 'Tensión y misterio ambiental',
    description: 'Zumbido siniestro con batimiento de bajas frecuencias',
    category: 'horror',
    sourceType: 'synth',
    isGlobal: true,
    isDefault: true,
    synthConfig: {
      oscType: 'sawtooth',
      startFreq: 75,
      endFreq: 60,
      rampType: 'linear',
      duration: 1.5,
      volume: 0.25,
      lfoFreq: 4,
      lfoGain: 15,
      filterType: 'lowpass',
      filterFreq: 220,
      filterQ: 2.0,
    },
  },
];

// In-memory global library cache (can be updated from Firestore)
let globalSoundLibrary: SoundDefinition[] = [...DEFAULT_SOUND_LIBRARY];
let projectCustomSounds: SoundDefinition[] = [];

export function setGlobalSoundLibrary(sounds: SoundDefinition[]) {
  if (sounds && Array.isArray(sounds) && sounds.length > 0) {
    globalSoundLibrary = sounds;
  } else {
    globalSoundLibrary = [...DEFAULT_SOUND_LIBRARY];
  }
}

export function getGlobalSoundLibrary(): SoundDefinition[] {
  return globalSoundLibrary;
}

export function setActiveProjectSounds(sounds: SoundDefinition[]) {
  projectCustomSounds = sounds || [];
}

/**
 * Combines official global library and project-specific custom sounds
 */
export function getAllMergedSounds(project?: GameProject | null): SoundDefinition[] {
  const custom = project?.customSounds || projectCustomSounds || [];
  const map = new Map<string, SoundDefinition>();

  // Add global library first
  globalSoundLibrary.forEach((s) => map.set(s.id, s));

  // Override/Add custom sounds from project
  custom.forEach((s) => map.set(s.id, s));

  return Array.from(map.values());
}

export interface InstrumentOption {
  id: InstrumentType;
  name: string;
  description: string;
  defaultFreq: number;
  defaultDur: number;
}

export const INSTRUMENT_OPTIONS: InstrumentOption[] = [
  { id: 'custom', name: 'Manual (Oscilador Libre)', description: 'Control directo de onda senoidal, triangular, cuadrada, etc.', defaultFreq: 440, defaultDur: 0.3 },
  { id: 'piano', name: 'Piano Acústico', description: 'Timbre de teclado con armónicos múltiples y decaimiento natural', defaultFreq: 440, defaultDur: 0.65 },
  { id: 'organ', name: 'Órgano de Tubos', description: 'Registros aditivos continuos con cuerpo majestuoso', defaultFreq: 261.63, defaultDur: 0.8 },
  { id: 'flute', name: 'Flauta / Viento', description: 'Onda dulce con aire soplado y ataque gradual', defaultFreq: 587.33, defaultDur: 0.5 },
  { id: 'strings', name: 'Cuerdas / Violín', description: 'Conjunto orquestal con vibrato cálido y ataque suave', defaultFreq: 440, defaultDur: 0.75 },
  { id: 'bell', name: 'Campana / Campanillas', description: 'Parciales inarmónicos metálicos con resonancia prolongada', defaultFreq: 523.25, defaultDur: 1.4 },
  { id: 'synth_bass', name: 'Bajo Sintetizado', description: 'Bajo analógico 80s con barrido de filtro resonante', defaultFreq: 110, defaultDur: 0.4 },
  { id: 'xylophone', name: 'Xilófono / Marimba', description: 'Madera percusiva con golpe inicial y caída rápida', defaultFreq: 659.25, defaultDur: 0.3 },
  { id: 'chiptune', name: '8-Bit Chiptune', description: 'Onda cuadrada arcade vintage de consola retro', defaultFreq: 523.25, defaultDur: 0.25 },
  { id: 'brass', name: 'Metales / Trompeta', description: 'Ataque brillante y resonancia metálica de viento-metal', defaultFreq: 392, defaultDur: 0.55 },
  { id: 'harp', name: 'Arpa / Cítara', description: 'Punteo cristalino de cuerda con decaimiento perlado', defaultFreq: 659.25, defaultDur: 0.8 },
  { id: 'music_box', name: 'Caja de Música', description: 'Campanitas agudas y tintineo celestial de cuerda', defaultFreq: 880, defaultDur: 0.6 },
  { id: 'drum', name: 'Percusión / Golpe', description: 'Impacto sordo con caída de tono y chasquido', defaultFreq: 140, defaultDur: 0.25 },
];

/**
 * Synthesizes procedural audio directly using Web Audio API
 */
export function playSynthWithConfig(ctx: AudioContext, config: SynthSoundConfig, startTime?: number) {
  const now = startTime ?? ctx.currentTime;
  const dur = Math.max(0.04, config.duration || 0.2);
  const vol = Math.max(0, Math.min(1, config.volume ?? 0.25));
  const startF = Math.max(20, config.startFreq || 440);

  // ==========================================
  // ORGANIC ANIMAL VOCALIZATION PROFILE
  // ==========================================
  if (config.synthesisProfile === 'animal_cry') {
    // A layered, non-musical cry: unstable vocal pitch, two moving formants
    // and a short breath/noise component instead of a single static oscillator.
    const pitch = ctx.createOscillator();
    const body = ctx.createOscillator();
    const pitchGain = ctx.createGain();
    const bodyGain = ctx.createGain();
    const formantA = ctx.createBiquadFilter();
    const formantB = ctx.createBiquadFilter();
    const mix = ctx.createGain();

    pitch.type = 'sawtooth';
    body.type = 'triangle';
    pitch.frequency.setValueAtTime(startF, now);
    body.frequency.setValueAtTime(startF * 0.503, now);
    const endF = Math.max(65, config.endFreq || startF * 0.42);
    pitch.frequency.exponentialRampToValueAtTime(endF, now + dur * 0.82);
    body.frequency.exponentialRampToValueAtTime(Math.max(35, endF * 0.5), now + dur * 0.82);

    // Slightly irregular-feeling pitch movement keeps the cry from sounding like a siren.
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibrato.type = 'sine';
    vibrato.frequency.setValueAtTime(4.7, now);
    vibratoGain.gain.setValueAtTime(Math.max(3, startF * 0.018), now);
    vibrato.connect(vibratoGain);
    vibratoGain.connect(pitch.frequency);
    vibrato.start(now);
    vibrato.stop(now + dur + 0.03);

    formantA.type = 'bandpass';
    formantA.Q.setValueAtTime(2.2, now);
    formantA.frequency.setValueAtTime(780, now);
    formantA.frequency.linearRampToValueAtTime(1180, now + dur * 0.55);
    formantA.frequency.linearRampToValueAtTime(920, now + dur);

    formantB.type = 'bandpass';
    formantB.Q.setValueAtTime(1.6, now);
    formantB.frequency.setValueAtTime(1450, now);
    formantB.frequency.linearRampToValueAtTime(2050, now + dur * 0.7);
    formantB.frequency.linearRampToValueAtTime(1550, now + dur);

    pitchGain.gain.setValueAtTime(vol * 0.52, now);
    bodyGain.gain.setValueAtTime(vol * 0.34, now);
    mix.gain.setValueAtTime(0, now);
    mix.gain.linearRampToValueAtTime(1, now + Math.min(0.075, dur * 0.18));
    mix.gain.setValueAtTime(0.82, now + dur * 0.68);
    mix.gain.linearRampToValueAtTime(0.001, now + dur);

    pitch.connect(formantA);
    body.connect(formantB);
    formantA.connect(pitchGain);
    formantB.connect(bodyGain);
    pitchGain.connect(mix);
    bodyGain.connect(mix);
    mix.connect(ctx.destination);

    pitch.start(now);
    body.start(now);
    pitch.stop(now + dur + 0.04);
    body.stop(now + dur + 0.04);

    // A little filtered breath gives the attack and tail an airy, animal quality.
    const breath = ctx.createBufferSource();
    breath.buffer = createNoiseBuffer(ctx, dur);
    const breathFilter = ctx.createBiquadFilter();
    const breathGain = ctx.createGain();
    breathFilter.type = 'bandpass';
    breathFilter.frequency.setValueAtTime(1850, now);
    breathFilter.frequency.linearRampToValueAtTime(1250, now + dur);
    breathFilter.Q.setValueAtTime(0.8, now);
    breathGain.gain.setValueAtTime(vol * 0.12, now);
    breathGain.gain.linearRampToValueAtTime(vol * 0.2, now + dur * 0.12);
    breathGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    breath.connect(breathFilter);
    breathFilter.connect(breathGain);
    breathGain.connect(ctx.destination);
    breath.start(now);
    breath.stop(now + dur + 0.04);
    return;
  }

  // ==========================================
  // INSTRUMENT TIMBRE MODELING
  // ==========================================
  if (config.instrument && config.instrument !== 'custom') {
    switch (config.instrument) {
      case 'piano': {
        const harmonics = [
          { mult: 1, gain: vol * 0.65, decayMult: 1.0 },
          { mult: 2, gain: vol * 0.28, decayMult: 0.75 },
          { mult: 3, gain: vol * 0.12, decayMult: 0.5 },
          { mult: 4, gain: vol * 0.05, decayMult: 0.35 },
        ];
        harmonics.forEach(({ mult, gain: hGain, decayMult }) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(startF * mult, now);
          g.gain.setValueAtTime(0, now);
          g.gain.linearRampToValueAtTime(hGain, now + 0.005);
          g.gain.exponentialRampToValueAtTime(0.001, now + dur * decayMult);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + dur * decayMult + 0.02);
        });
        return;
      }

      case 'organ': {
        const drawbars = [
          { mult: 0.5, type: 'triangle' as OscillatorType, gRatio: 0.25 },
          { mult: 1.0, type: 'sine' as OscillatorType, gRatio: 0.45 },
          { mult: 2.0, type: 'sine' as OscillatorType, gRatio: 0.2 },
          { mult: 3.0, type: 'triangle' as OscillatorType, gRatio: 0.1 },
        ];
        drawbars.forEach(({ mult, type, gRatio }) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(startF * mult, now);
          g.gain.setValueAtTime(0, now);
          g.gain.linearRampToValueAtTime(vol * gRatio, now + 0.03);
          g.gain.setValueAtTime(vol * gRatio, now + dur - 0.06);
          g.gain.linearRampToValueAtTime(0.001, now + dur);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + dur + 0.02);
        });
        return;
      }

      case 'flute': {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startF, now);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol * 0.75, now + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + dur + 0.02);

        // Breath noise layer
        const nBuf = createNoiseBuffer(ctx, dur);
        const nSrc = ctx.createBufferSource();
        nSrc.buffer = nBuf;
        const nFilt = ctx.createBiquadFilter();
        nFilt.type = 'bandpass';
        nFilt.frequency.setValueAtTime(startF * 1.5, now);
        nFilt.Q.setValueAtTime(2.5, now);
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(vol * 0.15, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        nSrc.connect(nFilt);
        nFilt.connect(nGain);
        nGain.connect(ctx.destination);
        nSrc.start(now);
        nSrc.stop(now + dur + 0.02);
        return;
      }

      case 'strings': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const g = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(startF, now);
        osc2.frequency.setValueAtTime(startF * 1.006, now);

        // Vibrato
        const lfo = ctx.createOscillator();
        const lfoG = ctx.createGain();
        lfo.frequency.setValueAtTime(5.5, now);
        lfoG.gain.setValueAtTime(6, now);
        lfo.connect(osc1.frequency);
        lfo.connect(osc2.frequency);
        lfo.start(now);
        lfo.stop(now + dur + 0.05);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(startF * 2.8, now);

        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol * 0.6, now + 0.08);
        g.gain.setValueAtTime(vol * 0.6, now + dur - 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(g);
        g.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + dur + 0.05);
        osc2.stop(now + dur + 0.05);
        return;
      }

      case 'bell': {
        const partials = [
          { ratio: 1.0, g: vol * 0.5, d: 1.0 },
          { ratio: 2.76, g: vol * 0.25, d: 0.75 },
          { ratio: 5.4, g: vol * 0.15, d: 0.5 },
          { ratio: 8.93, g: vol * 0.08, d: 0.35 },
        ];
        partials.forEach(({ ratio, g: pGain, d: pDecay }) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(startF * ratio, now);
          g.gain.setValueAtTime(0, now);
          g.gain.linearRampToValueAtTime(pGain, now + 0.003);
          g.gain.exponentialRampToValueAtTime(0.0008, now + dur * pDecay);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + dur * pDecay + 0.02);
        });
        return;
      }

      case 'synth_bass': {
        const osc = ctx.createOscillator();
        const sub = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const g = ctx.createGain();

        osc.type = 'sawtooth';
        sub.type = 'square';
        osc.frequency.setValueAtTime(startF, now);
        sub.frequency.setValueAtTime(startF * 0.5, now);

        filter.type = 'lowpass';
        filter.Q.setValueAtTime(6, now);
        filter.frequency.setValueAtTime(startF * 7, now);
        filter.frequency.exponentialRampToValueAtTime(startF * 1.5, now + dur * 0.6);

        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol * 0.7, now + 0.015);
        g.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc.connect(filter);
        sub.connect(filter);
        filter.connect(g);
        g.connect(ctx.destination);

        osc.start(now);
        sub.start(now);
        osc.stop(now + dur + 0.02);
        sub.stop(now + dur + 0.02);
        return;
      }

      case 'xylophone': {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startF, now);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol * 0.8, now + 0.004);
        g.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.6);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + dur * 0.6 + 0.02);

        // Wood impact tap
        const nBuf = createNoiseBuffer(ctx, 0.025);
        const nSrc = ctx.createBufferSource();
        nSrc.buffer = nBuf;
        const nF = ctx.createBiquadFilter();
        nF.type = 'highpass';
        nF.frequency.setValueAtTime(1500, now);
        const nG = ctx.createGain();
        nG.gain.setValueAtTime(vol * 0.25, now);
        nG.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
        nSrc.connect(nF);
        nF.connect(nG);
        nG.connect(ctx.destination);
        nSrc.start(now);
        nSrc.stop(now + 0.03);
        return;
      }

      case 'chiptune': {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(startF, now);
        if (config.endFreq) {
          osc.frequency.setValueAtTime(config.endFreq, now + dur * 0.25);
        }
        g.gain.setValueAtTime(vol * 0.5, now);
        g.gain.setValueAtTime(vol * 0.5, now + dur - 0.02);
        g.gain.linearRampToValueAtTime(0.001, now + dur);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + dur + 0.02);
        return;
      }

      case 'brass': {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(startF, now);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(startF * 1.5, now);
        filter.frequency.linearRampToValueAtTime(startF * 2.8, now + 0.05);
        filter.Q.setValueAtTime(3.0, now);

        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol * 0.7, now + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc.connect(filter);
        filter.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + dur + 0.02);
        return;
      }

      case 'harp': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const g = ctx.createGain();
        osc1.type = 'triangle';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(startF, now);
        osc2.frequency.setValueAtTime(startF * 2, now);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol * 0.6, now + 0.003);
        g.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc1.connect(g);
        osc2.connect(g);
        g.connect(ctx.destination);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + dur + 0.02);
        osc2.stop(now + dur + 0.02);
        return;
      }

      case 'music_box': {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startF, now);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol * 0.6, now + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0005, now + dur);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + dur + 0.02);
        return;
      }

      case 'drum': {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(Math.max(160, startF), now);
        osc.frequency.exponentialRampToValueAtTime(32, now + dur * 0.7);
        g.gain.setValueAtTime(vol * 0.8, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + dur + 0.02);

        // Noise click
        const nBuf = createNoiseBuffer(ctx, 0.05);
        const nSrc = ctx.createBufferSource();
        nSrc.buffer = nBuf;
        const nG = ctx.createGain();
        nG.gain.setValueAtTime(vol * 0.3, now);
        nG.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        nSrc.connect(nG);
        nG.connect(ctx.destination);
        nSrc.start(now);
        nSrc.stop(now + 0.06);
        return;
      }
    }
  }

  // ==========================================
  // CUSTOM / STANDARD WAVEFORM SYNTHESIS
  // ==========================================

  // Handle Arpeggios (sequence of distinct notes)
  if (config.oscType === 'arpeggio' && config.arpeggioNotes && config.arpeggioNotes.length > 0) {
    const step = config.arpeggioSpeed || 0.08;
    config.arpeggioNotes.forEach((freq, idx) => {
      const noteTime = now + idx * step;
      const noteDur = Math.min(dur, step * 1.5);
      const noteOsc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      noteOsc.type = 'triangle';
      noteOsc.frequency.setValueAtTime(freq, noteTime);

      noteGain.gain.setValueAtTime(0, noteTime);
      noteGain.gain.linearRampToValueAtTime(vol, noteTime + 0.015);
      noteGain.gain.exponentialRampToValueAtTime(0.001, noteTime + noteDur);

      noteOsc.connect(noteGain);
      noteGain.connect(ctx.destination);

      noteOsc.start(noteTime);
      noteOsc.stop(noteTime + noteDur + 0.02);
    });
    return;
  }

  // Handle Pure Noise
  if (config.oscType === 'noise') {
    const noiseBuf = createNoiseBuffer(ctx, dur);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuf;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(vol, now + Math.min(0.04, dur * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    if (config.filterType && config.filterType !== 'none') {
      const filter = ctx.createBiquadFilter();
      filter.type = config.filterType;
      filter.frequency.setValueAtTime(config.filterFreq || config.startFreq || 1000, now);
      if (config.endFreq) {
        if (config.rampType === 'linear') {
          filter.frequency.linearRampToValueAtTime(config.endFreq, now + dur);
        } else {
          filter.frequency.exponentialRampToValueAtTime(Math.max(20, config.endFreq), now + dur);
        }
      }
      if (config.filterQ) filter.Q.setValueAtTime(config.filterQ, now);

      noiseSource.connect(filter);
      filter.connect(gain);
    } else {
      noiseSource.connect(gain);
    }

    gain.connect(ctx.destination);
    noiseSource.start(now);
    noiseSource.stop(now + dur + 0.05);
    return;
  }

  // Handle Standard Waveform Synthesis (sine, triangle, square, sawtooth)
  const osc = ctx.createOscillator();
  const mainGain = ctx.createGain();

  const standardType: OscillatorType =
    config.oscType === 'sine' ||
    config.oscType === 'triangle' ||
    config.oscType === 'square' ||
    config.oscType === 'sawtooth'
      ? config.oscType
      : 'sawtooth';

  osc.type = standardType;
  osc.frequency.setValueAtTime(startF, now);

  if (config.endFreq && config.endFreq !== startF) {
    const endF = Math.max(20, config.endFreq);
    if (config.rampType === 'linear') {
      osc.frequency.linearRampToValueAtTime(endF, now + dur);
    } else {
      osc.frequency.exponentialRampToValueAtTime(endF, now + dur);
    }
  }

  // LFO Frequency Modulation (Vibrato / Tremolo / Growl)
  if (config.lfoFreq && config.lfoFreq > 0 && config.lfoGain && config.lfoGain > 0) {
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(config.lfoFreq, now);
    lfoGain.gain.setValueAtTime(config.lfoGain, now);
    lfo.connect(osc.frequency);
    lfo.start(now);
    lfo.stop(now + dur + 0.05);
  }

  // Envelope
  mainGain.gain.setValueAtTime(0, now);
  mainGain.gain.linearRampToValueAtTime(vol, now + Math.min(0.03, dur * 0.15));
  mainGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

  // Optional Filter Node
  if (config.filterType && config.filterType !== 'none') {
    const filter = ctx.createBiquadFilter();
    filter.type = config.filterType;
    filter.frequency.setValueAtTime(config.filterFreq || startF, now);
    if (config.filterQ) filter.Q.setValueAtTime(config.filterQ, now);

    osc.connect(filter);
    filter.connect(mainGain);
  } else {
    osc.connect(mainGain);
  }

  mainGain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + dur + 0.05);

  // Optional Noise Layer Mix (e.g. for impacts or gunshots)
  if (config.noiseMix && config.noiseMix > 0) {
    const noiseBuf = createNoiseBuffer(ctx, dur * 0.8);
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    const noiseGain = ctx.createGain();
    const noiseVol = vol * config.noiseMix;
    noiseGain.gain.setValueAtTime(noiseVol, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.8);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(config.filterFreq || 1200, now);

    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSrc.start(now);
    noiseSrc.stop(now + dur * 0.85);
  }
}

/**
 * Plays an audio source via external URL (mp3/wav/ogg)
 */
export function playUrlAudio(url: string, volume = 0.5): Promise<void> {
  if (!soundEnabled || !url) return Promise.resolve();

  return new Promise((resolve, reject) => {
    try {
      let audio = urlAudioCache.get(url);
      if (!audio) {
        audio = new Audio(url);
        audio.crossOrigin = 'anonymous';
        urlAudioCache.set(url, audio);
      }

      audio.volume = Math.max(0, Math.min(1, volume));
      audio.currentTime = 0;

      activeAudioElements.add(audio);
      audio.onended = () => {
        activeAudioElements.delete(audio!);
        resolve();
      };
      audio.onerror = () => {
        activeAudioElements.delete(audio!);
        reject(new Error(`Failed to load audio from: ${url}`));
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => resolve()).catch((err) => {
          activeAudioElements.delete(audio!);
          console.warn('Audio play prevented by browser policy:', err);
          resolve();
        });
      }
    } catch (e) {
      console.warn('Audio URL error:', e);
      resolve();
    }
  });
}

/**
 * Preview / Test any SoundDefinition
 */
export function previewSoundDefinition(sound: SoundDefinition): Promise<void> {
  if (!sound || !soundEnabled) return Promise.resolve();

  if (sound.sourceType === 'url' && sound.url) {
    return playUrlAudio(sound.url, 0.7);
  }

  if (sound.synthConfig) {
    const ctx = getAudioContext();
    if (ctx) {
      playSynthWithConfig(ctx, sound.synthConfig);
    }
    return Promise.resolve();
  }

  return Promise.resolve();
}

/**
 * Preview SynthSoundConfig directly
 */
export function previewSynthSound(config: SynthSoundConfig) {
  if (!soundEnabled || !config) return;
  const ctx = getAudioContext();
  if (ctx) {
    playSynthWithConfig(ctx, config);
  }
}

/**
 * Main playSound function used by the game engine, scenes, hotspot actions and dialogue options.
 * Seamlessly resolves built-in sound names, custom project sound IDs, or direct audio URLs.
 */
export const playSound = (
  typeOrUrl?: string,
  projectCustomSoundsOverride?: SoundDefinition[]
) => {
  if (!soundEnabled || !typeOrUrl || typeOrUrl === 'none') return;

  try {
    // 1. Check if typeOrUrl is a direct web URL or data URL
    if (
      typeOrUrl.startsWith('http://') ||
      typeOrUrl.startsWith('https://') ||
      typeOrUrl.startsWith('data:audio/') ||
      typeOrUrl.startsWith('blob:')
    ) {
      playUrlAudio(typeOrUrl);
      return;
    }

    // 2. Look for sound definition in custom project sounds
    const projectList = projectCustomSoundsOverride || projectCustomSounds;
    const customMatch = projectList.find((s) => s.id === typeOrUrl);
    if (customMatch) {
      previewSoundDefinition(customMatch);
      return;
    }

    // 3. Look for sound in global sound library
    const globalMatch = globalSoundLibrary.find((s) => s.id === typeOrUrl);
    if (globalMatch) {
      previewSoundDefinition(globalMatch);
      return;
    }

    // 4. Look in default built-in presets
    const defaultMatch = DEFAULT_SOUND_LIBRARY.find((s) => s.id === typeOrUrl);
    if (defaultMatch) {
      previewSoundDefinition(defaultMatch);
      return;
    }

    // 5. Fallback: play simple click if unknown
    const ctx = getAudioContext();
    if (ctx) {
      playSynthWithConfig(ctx, {
        oscType: 'sine',
        startFreq: 400,
        endFreq: 200,
        duration: 0.05,
        volume: 0.15,
      });
    }
  } catch (e) {
    console.warn('Audio play error:', e);
  }
};
