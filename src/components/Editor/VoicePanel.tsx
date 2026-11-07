import React from 'react';
import { Play, Square, Shuffle, Mic } from 'lucide-react';
import { SynthSoundConfig, VoiceConfig } from '../../types';
import { VOICE_PRESETS, VOICE_ENGINE_DEFAULTS } from '../../utils/voicePresets';

interface VoicePanelProps {
  config: SynthSoundConfig;
  onChange: (next: SynthSoundConfig) => void;
  /** Aplica una configuración y la reproduce al momento (plantillas, vocales...) */
  onChangeAndPlay: (next: SynthSoundConfig) => void;
  onPreview: () => void;
  onStop: () => void;
  isPlaying: boolean;
  isClean: boolean;
}

// ---- Formas rápidas ----
const CONTOUR_SHAPES: { id: string; label: string; pts: number[] }[] = [
  { id: 'arc', label: 'Arco', pts: [0.9, 1.25, 1.4, 1.2, 0.9] },
  { id: 'rise', label: 'Sube', pts: [0.8, 1.35] },
  { id: 'fall', label: 'Baja', pts: [1.35, 0.8] },
  { id: 'cry', label: 'Grito (sube rápido, cae lento)', pts: [0.75, 1.4, 1.3, 1.1, 0.9, 0.75] },
  { id: 'howl', label: 'Aullido', pts: [0.8, 1.2, 1.35, 1.3, 1.1, 0.8] },
  { id: 'dip', label: 'Cae y sube', pts: [1.2, 0.85, 1.1] },
  { id: 'flat', label: 'Plano', pts: [1, 1] },
];

const ENVELOPE_SHAPES: { id: string; label: string; pts: number[] }[] = [
  { id: 'hit', label: 'Golpe', pts: [0, 1, 0.65, 0.3, 0.1, 0] },
  { id: 'sustain', label: 'Sostenido', pts: [0, 0.85, 1, 0.9, 0.55, 0] },
  { id: 'swell', label: 'Crescendo', pts: [0, 0.15, 0.4, 0.75, 1, 0] },
  { id: 'double', label: 'Doble', pts: [0, 1, 0.6, 0.05, 0.9, 0.6, 0] },
  { id: 'breath', label: 'Respiración', pts: [0, 0.8, 0.7, 0.1, 0, 0.1, 0.9, 1, 0.5, 0] },
];

const VOWELS: { id: string; label: string; f: [number, number, number] }[] = [
  { id: 'a', label: 'A', f: [800, 1200, 2600] },
  { id: 'e', label: 'E', f: [500, 1900, 2600] },
  { id: 'i', label: 'I', f: [300, 2300, 3000] },
  { id: 'o', label: 'O', f: [500, 900, 2500] },
  { id: 'u', label: 'U', f: [350, 800, 2400] },
];

const sameArray = (a?: number[], b?: number[]) =>
  !!a && !!b && a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 0.001);

// ---- Piezas visuales (a nivel de módulo para no perder el foco al arrastrar) ----
const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  hint?: string;
  left?: string;
  right?: string;
  isClean: boolean;
}> = ({ label, value, min, max, step, format, onChange, hint, left, right, isClean }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs font-bold gap-2">
      <span className={isClean ? 'text-[#2A2118]' : 'text-slate-300'}>{label}</span>
      <span className={`font-mono shrink-0 ${isClean ? 'text-[#872820]' : 'text-amber-400'}`}>{format(value)}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={label}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full accent-amber-600"
    />
    {(left || right) && (
      <div className={`flex justify-between text-[10px] ${isClean ? 'text-[#6B5C46]' : 'text-slate-500'}`}>
        <span>{left}</span>
        <span>{right}</span>
      </div>
    )}
    {hint && <p className={`text-[10px] leading-snug ${isClean ? 'text-[#6B5C46]' : 'text-slate-500'}`}>{hint}</p>}
  </div>
);

const Chip: React.FC<{ active: boolean; onClick: () => void; isClean: boolean; children: React.ReactNode; title?: string }> = ({
  active,
  onClick,
  isClean,
  children,
  title,
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-pressed={active}
    className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer touch-manipulation ${
      active
        ? isClean
          ? 'bg-[#A4332A] text-white border-[#872820] shadow-sm'
          : 'bg-amber-500 text-black border-amber-400 shadow-sm'
        : isClean
        ? 'bg-[#FFFDF6] border-[#E5DCB8] text-[#2A2118] hover:bg-[#EBE3CD]'
        : 'bg-[#2C241C] border-[#42362B] text-slate-300 hover:text-white'
    }`}
  >
    {children}
  </button>
);

/** Dibujo mínimo de una curva (puntos equiespaciados en el tiempo) */
const MiniCurve: React.FC<{ pts: number[]; log?: boolean; depth?: number; isClean: boolean; label: string }> = ({
  pts,
  log,
  depth = 1,
  isClean,
  label,
}) => {
  const vals = pts.map((p) => (log ? depth * Math.log2(Math.max(0.05, p)) : p));
  const lo = log ? Math.min(...vals, -0.6) : 0;
  const hi = log ? Math.max(...vals, 0.6) : 1.05;
  const W = 120;
  const H = 34;
  const path = vals
    .map((v, i) => {
      const x = (i / Math.max(1, vals.length - 1)) * W;
      const y = H - 3 - ((v - lo) / (hi - lo)) * (H - 6);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label} className="w-full h-9">
      <rect x="0" y="0" width={W} height={H} rx="6" fill={isClean ? '#FFFDF6' : '#2C241C'} stroke={isClean ? '#E5DCB8' : '#42362B'} />
      <path d={path} fill="none" stroke={isClean ? '#A4332A' : '#F59E0B'} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

export const VoicePanel: React.FC<VoicePanelProps> = ({
  config,
  onChange,
  onChangeAndPlay,
  onPreview,
  onStop,
  isPlaying,
  isClean,
}) => {
  const voice: VoiceConfig = { ...VOICE_ENGINE_DEFAULTS, ...(config.voice || {}) };
  const num = (k: keyof typeof VOICE_ENGINE_DEFAULTS) => (voice[k] as number) ?? VOICE_ENGINE_DEFAULTS[k];

  const setVoice = (patch: Partial<VoiceConfig>) => onChange({ ...config, voice: { ...(config.voice || {}), ...patch } });
  const setVoicePlay = (patch: Partial<VoiceConfig>) =>
    onChangeAndPlay({ ...config, voice: { ...(config.voice || {}), ...patch } });

  const contour = voice.contour && voice.contour.length ? voice.contour : [1, 1];
  const envelope = voice.envelope && voice.envelope.length > 1 ? voice.envelope : [0, 0.85, 1, 0.8, 0];
  const activeShape = CONTOUR_SHAPES.find((s) => sameArray(s.pts, contour));
  const activeEnv = ENVELOPE_SHAPES.find((s) => sameArray(s.pts, envelope));

  const staticFormants =
    voice.formants && voice.formants.length >= 3 && voice.formants.slice(0, 3).every((f) => f.freqs.length === 1);
  const activeVowel = staticFormants
    ? VOWELS.find((vw) => vw.f.every((fr, i) => Math.abs((voice.formants as any)[i].freqs[0] - fr) < 1))
    : undefined;

  const txt = isClean ? 'text-[#2A2118]' : 'text-slate-300';
  const sectionTitle = `text-[11px] font-black uppercase tracking-wide ${isClean ? 'text-[#872820]' : 'text-amber-400'}`;
  const divider = `pt-3 border-t ${isClean ? 'border-[#E5DCB8]' : 'border-white/10'}`;

  const ProbarBtn = (
    <button
      type="button"
      onClick={isPlaying ? onStop : onPreview}
      aria-label={isPlaying ? 'Parar sonido' : 'Probar sonido'}
      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-sm cursor-pointer touch-manipulation transition-all ${
        isPlaying
          ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
          : isClean
          ? 'bg-[#A4332A] hover:bg-[#872820] text-white'
          : 'bg-amber-600 hover:bg-amber-500 text-black'
      }`}
    >
      {isPlaying ? (
        <>
          <Square className="w-3.5 h-3.5 fill-current" /> Parar
        </>
      ) : (
        <>
          <Play className="w-3.5 h-3.5 fill-current" /> Probar Sonido
        </>
      )}
    </button>
  );

  return (
    <div
      className={`p-4 rounded-2xl border space-y-4 ${isClean ? 'bg-[#F4EFE3] border-[#E5DCB8]' : 'bg-[#1F1913] border-[#42362B]'}`}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-0.5">
          <h5 className={`text-xs font-bold flex items-center gap-1.5 ${isClean ? 'text-[#2A2118]' : 'text-amber-300'}`}>
            <Mic className="w-3.5 h-3.5 text-amber-500" />
            Voz / Criatura
          </h5>
          <p className={`text-[11px] leading-snug max-w-md ${isClean ? 'text-[#6B5C46]' : 'text-slate-400'}`}>
            Voz con resonancias, aire y vibración irregulares, como un ser vivo. Empieza por una criatura y retoca.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={isPlaying ? onStop : onPreview}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
              isPlaying
                ? 'bg-rose-600 text-white animate-pulse'
                : isClean
                ? 'bg-[#A4332A] text-white hover:bg-[#872820]'
                : 'bg-amber-600 text-black hover:bg-amber-500'
            }`}
          >
            {isPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
            <span>{isPlaying ? 'Parar' : 'Escuchar'}</span>
          </button>
          <button
            type="button"
            onClick={onStop}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
              isClean ? 'bg-[#E5DCB8] text-[#2A2118] hover:bg-[#D9CFA9]' : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            <Square className="w-3 h-3 fill-current" /> Parar
          </button>
          <button
            type="button"
            onClick={() => setVoicePlay({ seed: Math.floor(Math.random() * 99999) + 1 })}
            title="Mismo tipo de sonido con otras micro-variaciones aleatorias"
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 border ${
              isClean ? 'bg-[#FFFDF6] border-[#E5DCB8] text-[#2A2118]' : 'bg-[#2C241C] border-[#42362B] text-slate-200'
            }`}
          >
            <Shuffle className="w-3 h-3" /> Otra versión
          </button>
        </div>
      </div>

      {/* Criaturas */}
      <div className="space-y-2">
        <span className={sectionTitle}>Criaturas</span>
        <div className="flex flex-wrap gap-1.5">
          {VOICE_PRESETS.map((p) => (
            <Chip
              key={p.id}
              isClean={isClean}
              active={false}
              title={p.description}
              onClick={() => onChangeAndPlay({ ...p.config, voice: { ...p.config.voice } })}
            >
              {p.name}
            </Chip>
          ))}
        </div>
      </div>

      {/* Tono y duración */}
      <div className={`space-y-3 ${divider}`}>
        <span className={sectionTitle}>Tono y duración</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Slider
            isClean={isClean}
            label="Nota base"
            value={config.startFreq || 400}
            min={40}
            max={2500}
            step={5}
            format={(v) => `${Math.round(v)} Hz`}
            onChange={(v) => onChange({ ...config, startFreq: v })}
            left="Grave"
            right="Aguda"
          />
          <Slider
            isClean={isClean}
            label="Duración"
            value={config.duration || 1}
            min={0.2}
            max={5}
            step={0.05}
            format={(v) => `${v.toFixed(2)} s`}
            onChange={(v) => onChange({ ...config, duration: v })}
          />
          <Slider
            isClean={isClean}
            label="Volumen"
            value={config.volume ?? 0.3}
            min={0.05}
            max={1}
            step={0.05}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => onChange({ ...config, volume: v })}
          />
        </div>
      </div>

      {/* Forma del tono */}
      <div className={`space-y-2 ${divider}`}>
        <div className="flex items-center justify-between gap-2">
          <span className={sectionTitle}>Melodía del grito</span>
          <span className={`text-[10px] ${isClean ? 'text-[#6B5C46]' : 'text-slate-500'}`}>
            {activeShape ? activeShape.label : 'Personalizada'}
          </span>
        </div>
        <MiniCurve pts={contour} log depth={num('contourDepth')} isClean={isClean} label="Contorno del tono" />
        <div className="flex flex-wrap gap-1.5">
          {CONTOUR_SHAPES.map((s) => (
            <Chip key={s.id} isClean={isClean} active={activeShape?.id === s.id} onClick={() => setVoicePlay({ contour: s.pts })}>
              {s.label.split(' (')[0]}
            </Chip>
          ))}
        </div>
        <Slider
          isClean={isClean}
          label="Intensidad de la melodía"
          value={num('contourDepth')}
          min={0}
          max={2.5}
          step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => setVoice({ contourDepth: v })}
          left="Monótona"
          right="Exagerada"
        />
      </div>

      {/* Volumen en el tiempo */}
      <div className={`space-y-2 ${divider}`}>
        <div className="flex items-center justify-between gap-2">
          <span className={sectionTitle}>Volumen en el tiempo</span>
          <span className={`text-[10px] ${isClean ? 'text-[#6B5C46]' : 'text-slate-500'}`}>
            {activeEnv ? activeEnv.label : 'Personalizada'}
          </span>
        </div>
        <label className={`flex items-start gap-2 text-xs font-bold cursor-pointer ${txt}`}>
          <input
            type="checkbox"
            checked={!!config.sustain}
            onChange={(e) => onChangeAndPlay({ ...config, sustain: e.target.checked })}
            className="mt-0.5 w-4 h-4 accent-amber-600"
          />
          <span>
            Sin decaimiento (volumen constante)
            <span className={`block text-[10px] font-normal ${isClean ? 'text-[#6B5C46]' : 'text-slate-500'}`}>
              El sonido se mantiene a la misma fuerza hasta el final, con una entrada y salida muy cortas.
            </span>
          </span>
        </label>
        <div className={config.sustain ? 'opacity-40 pointer-events-none' : ''} aria-disabled={!!config.sustain}>
        <MiniCurve pts={config.sustain ? [0, 1, 1, 1, 0] : envelope} isClean={isClean} label="Envolvente de volumen" />
        <div className="flex flex-wrap gap-1.5">
          {ENVELOPE_SHAPES.map((s) => (
            <Chip key={s.id} isClean={isClean} active={activeEnv?.id === s.id} onClick={() => setVoicePlay({ envelope: s.pts })}>
              {s.label}
            </Chip>
          ))}
        </div>
        </div>
      </div>

      {/* Cuerpo */}
      <div className={`space-y-3 ${divider}`}>
        <div className="flex items-center justify-between gap-2">
          <span className={sectionTitle}>Cuerpo y boca</span>
          {ProbarBtn}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs font-bold ${txt}`}>Vocal</span>
            <span className={`text-[10px] ${isClean ? 'text-[#6B5C46]' : 'text-slate-500'}`}>
              {activeVowel ? `Vocal ${activeVowel.label}` : 'Personalizada (se mueve en el tiempo)'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {VOWELS.map((vw) => (
              <Chip
                key={vw.id}
                isClean={isClean}
                active={activeVowel?.id === vw.id}
                title="Aplica una vocal fija. Las criaturas de la lista suelen cambiar de vocal durante el sonido."
                onClick={() =>
                  setVoicePlay({
                    formants: [
                      { freqs: [vw.f[0]], q: 8, gain: 1 },
                      { freqs: [vw.f[1]], q: 10, gain: 0.8 },
                      { freqs: [vw.f[2]], q: 12, gain: 0.5 },
                    ],
                  })
                }
              >
                {vw.label}
              </Chip>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Slider
            isClean={isClean}
            label="Tamaño de la criatura"
            value={num('formantScale')}
            min={0.5}
            max={2}
            step={0.05}
            format={(v) => (v < 0.85 ? 'Enorme' : v < 1.15 ? 'Mediana' : v < 1.5 ? 'Pequeña' : 'Diminuta')}
            onChange={(v) => setVoice({ formantScale: v })}
            left="Enorme"
            right="Diminuta"
            hint="Cambia el timbre sin cambiar la nota: un cuerpo grande suena más hueco."
          />
          <Slider
            isClean={isClean}
            label="Aire / soplido"
            value={num('breath')}
            min={0}
            max={1}
            step={0.02}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => setVoice({ breath: v })}
            left="Limpia"
            right="Muy aireada"
          />
          <Slider
            isClean={isClean}
            label="Brillo"
            value={num('brightness')}
            min={0}
            max={1}
            step={0.02}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => setVoice({ brightness: v })}
            left="Apagado"
            right="Brillante"
          />
          <Slider
            isClean={isClean}
            label="Eco / espacio"
            value={num('reverb')}
            min={0}
            max={1}
            step={0.02}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => setVoice({ reverb: v })}
            left="Seco"
            right="Cueva"
          />
        </div>
      </div>

      {/* Carácter */}
      <div className={`space-y-3 ${divider}`}>
        <div className="flex items-center justify-between gap-2">
          <span className={sectionTitle}>Carácter</span>
          {ProbarBtn}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Slider
            isClean={isClean}
            label="Inestabilidad del tono"
            value={num('jitter')}
            min={0}
            max={1}
            step={0.02}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => setVoice({ jitter: v })}
            left="Perfecta (mecánica)"
            right="Temblorosa"
            hint="Lo que más separa un ser vivo de un sintetizador: nada vibra de forma perfecta."
          />
          <Slider
            isClean={isClean}
            label="Aspereza / gruñido"
            value={num('roughness')}
            min={0}
            max={1}
            step={0.02}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => setVoice({ roughness: v })}
            left="Suave"
            right="Gutural"
          />
          <Slider
            isClean={isClean}
            label="Velocidad del gruñido"
            value={num('roughnessRate')}
            min={10}
            max={100}
            step={1}
            format={(v) => `${Math.round(v)} Hz`}
            onChange={(v) => setVoice({ roughnessRate: v })}
            left="Lento (bestia)"
            right="Rápido (graznido)"
          />
          <Slider
            isClean={isClean}
            label="Saturación"
            value={num('drive')}
            min={0}
            max={1}
            step={0.02}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => setVoice({ drive: v })}
            left="Limpia"
            right="Desgarrada"
          />
          <Slider
            isClean={isClean}
            label="Voz crujiente"
            value={num('subharmonic')}
            min={0}
            max={1}
            step={0.02}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => setVoice({ subharmonic: v })}
            hint="Añade una octava grave irregular, como una voz quebrada."
          />
          <Slider
            isClean={isClean}
            label="Vibrato"
            value={num('vibratoDepth')}
            min={0}
            max={100}
            step={1}
            format={(v) => `${Math.round(v)} cents`}
            onChange={(v) => setVoice({ vibratoDepth: v })}
            left="Sin vibrato"
            right="Marcado"
            hint="Entra poco a poco a mitad del sonido, como en un aullido."
          />
        </div>
      </div>

    </div>
  );
};
