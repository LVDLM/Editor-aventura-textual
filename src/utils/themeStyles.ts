import { EngineTheme } from '../types';

export interface ThemeConfig {
  id: EngineTheme;
  name: string;
  bgClass: string;
  cardBgClass: string;
  cardBorderClass: string;
  textMainClass: string;
  textMutedClass: string;
  accentClass: string;
  accentBgClass: string;
  accentBorderClass: string;
  hotspotClass: string;
  hotspotHoverClass: string;
  verbActiveBg: string;
  verbActiveText: string;
  responseBgClass: string;
  responseBorderClass: string;
  fontFamily: string;
}

export const THEME_CONFIGS: Record<EngineTheme, ThemeConfig> = {
  'classic-retro': {
    id: 'classic-retro',
    name: 'LucasArts Retro',
    bgClass: 'bg-[#0a0a0c]',
    cardBgClass: 'bg-[#0f0f12]',
    cardBorderClass: 'border-amber-500/30',
    textMainClass: 'text-amber-100',
    textMutedClass: 'text-amber-400/60',
    accentClass: 'text-amber-400',
    accentBgClass: 'bg-amber-500/20',
    accentBorderClass: 'border-amber-500',
    hotspotClass: 'bg-amber-500/20 border-b-2 border-amber-500 text-amber-300 font-mono font-bold cursor-pointer px-1.5 py-0.5 rounded-xs transition-colors',
    hotspotHoverClass: 'hover:bg-amber-500/30 hover:text-amber-100',
    verbActiveBg: 'bg-amber-500',
    verbActiveText: 'text-[#0a0a0c]',
    responseBgClass: 'bg-[#0c0c0e]',
    responseBorderClass: 'border-amber-500',
    fontFamily: 'font-mono',
  },
  'modern-dark': {
    id: 'modern-dark',
    name: 'Oscuro Elegante',
    bgClass: 'bg-[#0a0a0c]',
    cardBgClass: 'bg-[#0f0f12]',
    cardBorderClass: 'border-white/10',
    textMainClass: 'text-slate-100',
    textMutedClass: 'text-white/40',
    accentClass: 'text-amber-400',
    accentBgClass: 'bg-amber-500/20',
    accentBorderClass: 'border-amber-500/50',
    hotspotClass: 'bg-amber-500/20 border-b-2 border-amber-500 text-amber-300 font-semibold cursor-pointer px-1.5 py-0.5 rounded-xs transition-colors shadow-sm',
    hotspotHoverClass: 'hover:bg-amber-500/35 hover:text-amber-100',
    verbActiveBg: 'bg-amber-600',
    verbActiveText: 'text-white',
    responseBgClass: 'bg-[#0c0c0e]',
    responseBorderClass: 'border-amber-500/50',
    fontFamily: 'font-sans',
  },
  'sepia-parchment': {
    id: 'sepia-parchment',
    name: 'Pergamino Sepia',
    bgClass: 'bg-[#f5ebd7]',
    cardBgClass: 'bg-[#ebdcb9]',
    cardBorderClass: 'border-[#cbb382]',
    textMainClass: 'text-[#3b2d1d]',
    textMutedClass: 'text-[#786146]',
    accentClass: 'text-[#9c381e]',
    accentBgClass: 'bg-[#9c381e]/15',
    accentBorderClass: 'border-[#9c381e]',
    hotspotClass: 'text-[#9c381e] font-bold underline decoration-[#9c381e]/50 underline-offset-4 cursor-pointer rounded px-1',
    hotspotHoverClass: 'hover:bg-[#9c381e]/20 hover:text-[#782813]',
    verbActiveBg: 'bg-[#9c381e]',
    verbActiveText: 'text-[#f5ebd7]',
    responseBgClass: 'bg-[#dfceaa]',
    responseBorderClass: 'border-[#9c381e]',
    fontFamily: 'font-serif',
  },
  'cyber-terminal': {
    id: 'cyber-terminal',
    name: 'Terminal Cyber',
    bgClass: 'bg-black',
    cardBgClass: 'bg-emerald-950/30',
    cardBorderClass: 'border-emerald-500/40',
    textMainClass: 'text-emerald-300',
    textMutedClass: 'text-emerald-600',
    accentClass: 'text-emerald-400',
    accentBgClass: 'bg-emerald-500/20',
    accentBorderClass: 'border-emerald-500',
    hotspotClass: 'text-emerald-400 font-mono font-bold underline decoration-emerald-500/60 underline-offset-4 cursor-pointer rounded px-1',
    hotspotHoverClass: 'hover:bg-emerald-500/30 hover:text-emerald-100',
    verbActiveBg: 'bg-emerald-500',
    verbActiveText: 'text-black',
    responseBgClass: 'bg-black/90',
    responseBorderClass: 'border-emerald-400',
    fontFamily: 'font-mono',
  },
  'emerald-vintage': {
    id: 'emerald-vintage',
    name: 'Esmeralda Vintage',
    bgClass: 'bg-zinc-950',
    cardBgClass: 'bg-emerald-950/20',
    cardBorderClass: 'border-emerald-800/50',
    textMainClass: 'text-emerald-100',
    textMutedClass: 'text-emerald-400/70',
    accentClass: 'text-yellow-400',
    accentBgClass: 'bg-yellow-500/10',
    accentBorderClass: 'border-yellow-500/40',
    hotspotClass: 'text-yellow-400 font-semibold underline decoration-yellow-400/50 underline-offset-4 cursor-pointer rounded px-1',
    hotspotHoverClass: 'hover:bg-yellow-500/20 hover:text-yellow-200',
    verbActiveBg: 'bg-yellow-500',
    verbActiveText: 'text-zinc-950',
    responseBgClass: 'bg-zinc-900',
    responseBorderClass: 'border-yellow-500',
    fontFamily: 'font-sans',
  },
};
