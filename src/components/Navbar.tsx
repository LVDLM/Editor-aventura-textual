import React from 'react';
import { Play, Edit3, Save, Download, HelpCircle, Volume2, VolumeX, FolderOpen, Bookmark, FolderDown } from 'lucide-react';
import { EngineTheme } from '../types';

interface NavbarProps {
  mode: 'play' | 'edit';
  setMode: (mode: 'play' | 'edit') => void;
  gameTitle: string;
  theme: EngineTheme;
  setTheme: (theme: EngineTheme) => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  onOpenSaveLoad: () => void;
  onOpenExport: () => void;
  onOpenHelp: () => void;
  onLoadSampleGame: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  mode,
  setMode,
  gameTitle,
  theme,
  setTheme,
  soundEnabled,
  toggleSound,
  onOpenSaveLoad,
  onOpenExport,
  onOpenHelp,
  onLoadSampleGame,
}) => {
  return (
    <header className="bg-[#0f0f12] border-b border-white/10 text-white px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & App Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center text-black font-bold shadow-md">
            N
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-medium tracking-tight text-white flex items-center gap-2">
              <span>Narrativa Engine</span>
              <span className="text-[10px] sm:text-xs text-amber-500/90 font-mono px-2 py-0.5 rounded bg-black/40 border border-white/5">
                v1.0.4
              </span>
            </h1>
            <p className="text-xs text-white/40 truncate max-w-[200px] sm:max-w-xs" title={gameTitle}>
              {gameTitle || 'Nueva Aventura'}
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/5">
          <button
            onClick={() => setMode('play')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
              mode === 'play'
                ? 'bg-white/10 text-white font-semibold shadow-inner'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Jugar</span>
          </button>
          <button
            onClick={() => setMode('edit')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
              mode === 'edit'
                ? 'bg-white/10 text-white font-semibold shadow-inner'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Theme Selector */}
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as EngineTheme)}
            className="bg-black/40 border border-white/10 text-white/80 text-xs rounded-lg px-2.5 py-1.5 focus:border-amber-500 outline-none cursor-pointer"
            title="Cambiar Estilo Visual"
          >
            <option value="classic-retro">🕹️ LucasArts Retro</option>
            <option value="modern-dark">🌙 Oscuro Elegante</option>
            <option value="sepia-parchment">📜 Pergamino Sepia</option>
            <option value="cyber-terminal">💻 Terminal Cyber</option>
            <option value="emerald-vintage">🌲 Esmeralda Vintage</option>
          </select>

          {/* Audio toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-black/40 border border-white/10 text-white/60 hover:text-amber-400 transition-colors"
            title={soundEnabled ? 'Sonido Activado' : 'Sonido Desactivado'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-white/30" />}
          </button>

          {/* Demo Loader */}
          <button
            onClick={onLoadSampleGame}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 rounded-lg text-xs font-medium transition-colors"
            title="Cargar Juego de Ejemplo"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Demo</span>
          </button>

          {/* Player Progress Save/Load */}
          <button
            onClick={onOpenSaveLoad}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-200 border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors"
            title="Guardar o cargar el progreso actual de tu jugador"
          >
            <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
            <span>Progreso Partida</span>
          </button>

          {/* Editor Project Save/Export */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm"
            title="Guardar archivo del proyecto (.json) o exportar juego autónomo (.html)"
          >
            <FolderDown className="w-4 h-4" />
            <span>Proyecto (Editor / HTML)</span>
          </button>

          {/* Help */}
          <button
            onClick={onOpenHelp}
            className="p-2 rounded-lg bg-black/40 border border-white/10 text-white/40 hover:text-white transition-colors"
            title="Guía y Ayuda"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
