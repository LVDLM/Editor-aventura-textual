/**
 * Motor de VOZ ORGÁNICA (criaturas, aullidos, alaridos, gruñidos...).
 *
 * IMPORTANTE: este archivo es JavaScript plano y autocontenido (sin imports ni
 * dependencias externas) a propósito: el exportador HTML lo incrusta tal cual
 * (import con `?raw`), de modo que el sonido del editor y el del juego exportado
 * salen de EXACTAMENTE el mismo código.
 *
 * Por qué suena "orgánico" y no a juguete mecánico:
 *  1. Fuente rica en armónicos (diente de sierra) filtrada por FORMANTES
 *     (resonancias del tracto vocal) que además pueden moverse en el tiempo.
 *  2. Contorno de tono libre (curva con varios puntos) + vibrato que entra
 *     gradualmente + JITTER (micro-variaciones aleatorias, nunca periódicas).
 *  3. Aliento (ruido) que pasa por los mismos formantes que la voz.
 *  4. Aspereza: modulación de amplitud (gruñido), subarmónico (voz "crujiente")
 *     y saturación.
 *  5. Envolvente de amplitud con curva propia (ataque, cuerpo sostenido, cola),
 *     en vez del típico "golpe + decaimiento" de un sintetizador de juguete.
 *  6. Reverberación opcional para dar espacio.
 *
 * Es determinista: con la misma configuración (y `voice.seed`) suena siempre igual.
 *
 * @param {BaseAudioContext} ctx
 * @param {object} config  SynthSoundConfig (usa startFreq, endFreq, duration, volume, voice)
 * @param {number} [startTime]  instante de inicio (por defecto ctx.currentTime)
 * @param {(node: AudioScheduledSourceNode, when: number) => void} [startSource]
 *        función para arrancar los nodos fuente (permite que el reproductor los registre)
 * @param {AudioNode} [destination]  por defecto ctx.destination
 * @returns {number} duración total en segundos (incluida la cola de reverberación)
 */
export function playVoiceSynth(ctx, config, startTime, startSource, destination) {
  const v = config.voice || {};
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const num = (x, d) => (typeof x === 'number' && isFinite(x) ? x : d);

  const now = startTime === undefined ? ctx.currentTime : startTime;
  const dur = clamp(num(config.duration, 1), 0.1, 6);
  const vol = clamp(num(config.volume, 0.3), 0, 1);
  const f0 = clamp(num(config.startFreq, 400), 30, 4000);
  const out = destination || ctx.destination;
  const begin = startSource || ((node, when) => node.start(when));

  // ---- Aleatoriedad determinista (mulberry32 + Box-Muller) ----
  let seed = (num(v.seed, 1234) >>> 0) || 1;
  const rnd = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-9, rnd()))) * Math.cos(2 * Math.PI * rnd());

  // ---- Curvas de control muestreadas (200 puntos/s) ----
  const RATE = 200;
  const N = Math.max(16, Math.min(1500, Math.round(dur * RATE)));

  // Interpolación suave (Catmull-Rom) por una lista de puntos equiespaciados en el tiempo
  const sampleCurve = (pts, x) => {
    const n = pts.length;
    if (n === 1) return pts[0];
    const p = clamp(x, 0, 1) * (n - 1);
    const i = Math.min(n - 2, Math.floor(p));
    const t = p - i;
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];
    return (
      0.5 *
      (2 * p1 +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)
    );
  };
  const buildCurve = (pts, fn) => {
    const arr = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const x = i / (N - 1);
      arr[i] = fn(sampleCurve(pts, x), x);
    }
    return arr;
  };

  // ---- Contorno de tono ----
  // `contour`: multiplicadores respecto a startFreq (equiespaciados en el tiempo).
  // Si no se da, se usa startFreq -> endFreq.
  let contour = Array.isArray(v.contour) && v.contour.length >= 1 ? v.contour : null;
  if (!contour) contour = [1, config.endFreq ? config.endFreq / f0 : 1];
  // contourDepth exagera (>1) o aplana (<1) la forma del contorno sin cambiar la nota base
  const contourDepth = clamp(num(v.contourDepth, 1), 0, 2.5);
  const logContour = contour.map((m) => contourDepth * Math.log2(Math.max(0.05, num(m, 1))));

  const vibRate = clamp(num(v.vibratoRate, 5.5), 0.5, 14);
  const vibDepth = clamp(num(v.vibratoDepth, 0), 0, 200); // cents
  const vibDelay = clamp(num(v.vibratoDelay, 0.3), 0, 0.95); // fracción de la duración
  const jitter = clamp(num(v.jitter, 0), 0, 1);

  // Ruido suavizado (paso bajo de un solo polo) normalizado a desviación típica 1
  const smoothNoise = (cutoffHz) => {
    const a = Math.exp((-2 * Math.PI * cutoffHz) / RATE);
    const norm = Math.sqrt((1 + a) / (1 - a));
    let y = 0;
    return () => {
      y = a * y + (1 - a) * gauss();
      return y * norm;
    };
  };
  const fastJit = smoothNoise(30);
  const slowJit = smoothNoise(2.5);
  const rateWander = smoothNoise(1.5);

  let vibPhase = rnd() * Math.PI * 2;
  const freqCurve = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const x = i / (N - 1);
    const base = f0 * Math.pow(2, sampleCurve(logContour, x));
    vibPhase += (2 * Math.PI * vibRate * (1 + 0.08 * rateWander())) / RATE;
    const fade = vibDelay >= 0.95 ? 0 : clamp((x - vibDelay) / Math.max(0.05, 0.35 * (1 - vibDelay)), 0, 1);
    const cents = vibDepth * Math.sin(vibPhase) * fade + jitter * (28 * fastJit() + 35 * slowJit());
    freqCurve[i] = clamp(base * Math.pow(2, cents / 1200), 20, 9000);
  }

  // ---- Envolvente de amplitud ----
  const envPts = Array.isArray(v.envelope) && v.envelope.length >= 2 ? v.envelope : [0, 0.85, 1, 0.9, 0.55, 0];
  const shimmer = clamp(num(v.shimmer, 0), 0, 1);
  const shimmerNoise = smoothNoise(12);
  const envCurve = buildCurve(envPts, (y, x) => {
    let e = clamp(y, 0, 1.2);
    if (shimmer > 0) e *= 1 + shimmer * 0.22 * shimmerNoise();
    return x >= 0.999 ? 0 : clamp(e, 0, 1.4);
  });
  envCurve[0] = Math.min(envCurve[0], 0.0001);

  // ---- Cadena de audio ----
  const master = ctx.createGain();
  master.gain.value = vol * 0.9;

  // Reverberación opcional (respuesta al impulso sintética: ruido con caída exponencial)
  const reverb = clamp(num(v.reverb, 0), 0, 1);
  let tail = 0.05;
  if (reverb > 0.01) {
    const irSecs = 0.35 + 1.5 * reverb;
    const irLen = Math.max(1, Math.floor(ctx.sampleRate * irSecs));
    const ir = ctx.createBuffer(2, irLen, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < irLen; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / irLen, 2.6);
    }
    const conv = ctx.createConvolver();
    conv.buffer = ir;
    const wet = ctx.createGain();
    const dry = ctx.createGain();
    wet.gain.value = 0.9 * reverb;
    dry.gain.value = 1 - 0.35 * reverb;
    master.connect(dry);
    dry.connect(out);
    master.connect(conv);
    conv.connect(wet);
    wet.connect(out);
    tail = irSecs;
  } else {
    master.connect(out);
  }

  const envGain = ctx.createGain();
  envGain.gain.setValueCurveAtTime(envCurve, now, dur);
  envGain.connect(master);

  // Paso bajo final: quita el "zumbido" digital de los armónicos más agudos
  const brightness = clamp(num(v.brightness, 0.55), 0, 1);
  const finalLP = ctx.createBiquadFilter();
  finalLP.type = 'lowpass';
  finalLP.frequency.value = 900 * Math.pow(2, brightness * 4); // 900 Hz .. 14 kHz
  finalLP.Q.value = 0.5;
  finalLP.connect(envGain);

  // Saturación (rugosidad / grito desgarrado)
  const drive = clamp(num(v.drive, 0), 0, 1);
  let tailNode = finalLP;
  if (drive > 0.01) {
    const shaper = ctx.createWaveShaper();
    const k = 1 + drive * 10;
    const curveLen = 2048;
    const sc = new Float32Array(curveLen);
    for (let i = 0; i < curveLen; i++) {
      const x = (i * 2) / (curveLen - 1) - 1;
      sc[i] = Math.tanh(k * x) / Math.tanh(k);
    }
    shaper.curve = sc;
    shaper.oversample = '2x';
    const pre = ctx.createGain();
    pre.gain.value = 1 + drive * 1.5;
    pre.connect(shaper);
    shaper.connect(finalLP);
    tailNode = pre;
  }

  // Aspereza / gruñido: modulación de amplitud rápida (20-90 Hz)
  const rough = clamp(num(v.roughness, 0), 0, 1);
  let voiceOut = tailNode;
  if (rough > 0.01) {
    const am = ctx.createGain();
    am.gain.value = 1 - rough * 0.5;
    const lfo = ctx.createOscillator();
    lfo.type = 'triangle';
    lfo.frequency.value = clamp(num(v.roughnessRate, 35), 8, 120);
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = rough * 0.5;
    lfo.connect(lfoDepth);
    lfoDepth.connect(am.gain);
    am.connect(tailNode);
    begin(lfo, now);
    lfo.stop(now + dur + 0.05);
    voiceOut = am;
  }

  // Banco de formantes en paralelo + camino directo (cuerpo grave de la voz)
  const bankOut = ctx.createGain();
  bankOut.gain.value = 3.2;
  bankOut.connect(voiceOut);
  const bodyDirect = ctx.createGain();
  bodyDirect.gain.value = 0.55;
  const bodyLP = ctx.createBiquadFilter();
  bodyLP.type = 'lowpass';
  bodyLP.frequency.value = 500 * Math.pow(2, brightness * 3); // 500 Hz .. 4 kHz
  bodyDirect.connect(bodyLP);
  bodyLP.connect(voiceOut);

  const bankIn = ctx.createGain();
  const formants =
    Array.isArray(v.formants) && v.formants.length
      ? v.formants
      : [
          { freqs: [700], q: 8, gain: 1 },
          { freqs: [1200], q: 10, gain: 0.8 },
          { freqs: [2600], q: 12, gain: 0.5 },
        ];
  const fScale = clamp(num(v.formantScale, 1), 0.4, 2.5);
  formants.forEach((fm) => {
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = clamp(num(fm.q, 8), 0.7, 40);
    const freqs = (Array.isArray(fm.freqs) && fm.freqs.length ? fm.freqs : [1000]).map((f) =>
      clamp(num(f, 1000) * fScale, 60, 9000)
    );
    if (freqs.length === 1) {
      bp.frequency.value = freqs[0];
    } else {
      bp.frequency.setValueCurveAtTime(buildCurve(freqs, (y) => y), now, dur);
    }
    const g = ctx.createGain();
    g.gain.value = clamp(num(fm.gain, 1), 0, 4);
    bankIn.connect(bp);
    bp.connect(g);
    g.connect(bankOut);
  });

  // Fuente de voz: diente de sierra (+ segundo oscilador desafinado + subarmónico)
  const voicing = clamp(num(v.voicing, 1), 0, 1);
  const addOsc = (mult, detuneCents, level) => {
    if (level <= 0.001) return;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    const arr = new Float32Array(N);
    for (let i = 0; i < N; i++) arr[i] = clamp(freqCurve[i] * mult, 20, 12000);
    o.frequency.setValueCurveAtTime(arr, now, dur);
    o.detune.value = detuneCents;
    const g = ctx.createGain();
    g.gain.value = level * voicing * 0.5;
    o.connect(g);
    g.connect(bankIn);
    g.connect(bodyDirect);
    begin(o, now);
    o.stop(now + dur + 0.05);
  };
  const unison = clamp(num(v.unison, 7), 0, 40); // cents
  addOsc(1, 0, 1);
  addOsc(1, unison, unison > 0 ? 0.55 : 0);
  addOsc(0.5, 0, clamp(num(v.subharmonic, 0), 0, 1) * 0.9);

  // Aliento: ruido blanco que atraviesa los mismos formantes
  const breath = clamp(num(v.breath, 0), 0, 1);
  if (breath > 0.005) {
    const nLen = Math.max(1, Math.floor(ctx.sampleRate * (dur + 0.1)));
    const nBuf = ctx.createBuffer(1, nLen, ctx.sampleRate);
    const nd = nBuf.getChannelData(0);
    for (let i = 0; i < nLen; i++) nd[i] = rnd() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = nBuf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 180;
    const ng = ctx.createGain();
    ng.gain.value = breath * 1.4;
    noise.connect(hp);
    hp.connect(ng);
    ng.connect(bankIn);
    // un poco de siseo sin filtrar para los gritos muy "aireados"
    const hiss = ctx.createGain();
    hiss.gain.value = breath * 0.12;
    const hissHP = ctx.createBiquadFilter();
    hissHP.type = 'highpass';
    hissHP.frequency.value = 2800;
    ng.connect(hiss);
    hiss.connect(hissHP);
    hissHP.connect(voiceOut);
    begin(noise, now);
    noise.stop(now + dur + 0.05);
  }

  return dur + tail;
}
