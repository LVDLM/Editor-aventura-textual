import React from 'react';
import { Play, Edit3, HelpCircle, Volume2, VolumeX, FolderOpen, Bookmark, FolderDown, PlusCircle, BookOpen, Shield, User, Layers, ShieldCheck } from 'lucide-react';
import { EngineTheme, UserProfile } from '../types';

export type AppView = 'catalog' | 'play' | 'edit' | 'workspace' | 'admin' | 'profile';

interface NavbarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  currentUser: UserProfile | null;
  gameTitle: string;
  theme: EngineTheme;
  setTheme: (theme: EngineTheme) => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  onOpenNewProject: () => void;
  onOpenSaveLoad: () => void;
  onOpenExport: () => void;
  onOpenHelp: () => void;
  onOpenAuth: () => void;
  onOpenPrivacyModal?: () => void;
  onLoadSampleGame: () => void;
  isOwnProject?: boolean;
  isTutorial?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  currentUser,
  gameTitle,
  theme,
  setTheme,
  soundEnabled,
  toggleSound,
  onOpenNewProject,
  onOpenSaveLoad,
  onOpenExport,
  onOpenHelp,
  onOpenAuth,
  onOpenPrivacyModal,
  onLoadSampleGame,
  isOwnProject = false,
  isTutorial = false,
}) => {
  // Logic for showing the Editor tab
  // Unregistered users (!currentUser) reading stories will NEVER see the Editor button.
  // Registered users (currentUser) reading stories will see the Editor button ONLY if it's their own story or the tutorial.
  const canShowEditor = React.useMemo(() => {
    if (currentView === 'edit') return true;
    if (!currentUser) return false;
    if (currentView === 'play') {
      return isOwnProject || isTutorial;
    }
    return true;
  }, [currentView, currentUser, isOwnProject, isTutorial]);
  return (
    <header className="bg-[#0f0f12] border-b border-white/10 text-white px-4 sm:px-6 py-2.5 sticky top-0 z-30 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & App Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('catalog')}
            className="w-8 h-8 bg-amber-500 hover:bg-amber-400 rounded-lg flex items-center justify-center text-slate-950 font-extrabold shadow-md transition-all shrink-0"
            title="Ir a la Biblioteca Principal"
          >
            N
          </button>
          <div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span className="cursor-pointer hover:text-amber-400 transition-colors" onClick={() => setCurrentView('catalog')}>
                Lecturas Interactivas
              </span>
              <span className="text-[10px] text-amber-500 font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/10">
                Web &amp; Editor
              </span>
            </h1>
            <p className="text-[11px] text-white/50 truncate max-w-[160px] sm:max-w-xs" title={gameTitle}>
              {currentView === 'play' || currentView === 'edit' ? gameTitle : 'Plataforma de Historias'}
            </p>
          </div>
        </div>

        {/* Platform Navigation Tabs */}
        <div className="flex items-center bg-black/60 rounded-xl p-1 border border-white/10 flex-wrap">
          <button
            onClick={() => setCurrentView('catalog')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'catalog'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Biblioteca</span>
          </button>

          <button
            onClick={() => setCurrentView('play')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'play'
                ? 'bg-white/15 text-white font-bold shadow-inner'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Jugar Lectura</span>
          </button>

          {canShowEditor && (
            <button
              onClick={() => setCurrentView('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'edit'
                  ? 'bg-white/15 text-white font-bold shadow-inner'
                  : 'text-white/60 hover:text-white'
              }`}
              title={
                isTutorial
                  ? 'Ver y probar cambios en el tutorial (puedes editarlo sin sobreescribir el original en el servidor)'
                  : 'Editar y personalizar esta historia'
              }
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>
          )}

          <button
            onClick={() => setCurrentView('workspace')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'workspace'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mis Proyectos</span>
          </button>

          {currentUser && (
            <button
              onClick={() => setCurrentView('profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'profile'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Mi Perfil</span>
            </button>
          )}

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setCurrentView('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'admin'
                  ? 'bg-rose-500 text-white font-bold shadow-md'
                  : 'text-rose-300/80 hover:text-rose-200 bg-rose-950/40'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          )}
        </div>

        {/* Action Controls & User Auth Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenPrivacyModal && (
            <button
              onClick={onOpenPrivacyModal}
              className="p-1.5 text-white/50 hover:text-emerald-400 hover:bg-white/5 rounded-xl transition-colors"
              title="Política de Privacidad y RGPD (Unión Europea)"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          )}

          {/* User Profile / Auth Button */}
          <button
            onClick={() => {
              if (currentUser) {
                setCurrentView('profile');
              } else {
                onOpenAuth();
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              currentUser
                ? currentView === 'profile'
                  ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md font-bold'
                  : currentUser.role === 'admin'
                  ? 'bg-rose-950/60 border-rose-500/40 text-rose-200 hover:bg-rose-900/60'
                  : 'bg-sky-950/60 border-sky-500/40 text-sky-200 hover:bg-sky-900/60'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
            }`}
          >
            {currentUser ? (
              <>
                {currentUser.role === 'admin' ? <Shield className="w-3.5 h-3.5 text-rose-400" /> : <User className="w-3.5 h-3.5 text-sky-400" />}
                <span className="truncate max-w-[100px]">{currentUser.displayName}</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5" />
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>

          {/* Theme Selector (when in play mode) */}
          {(currentView === 'play' || currentView === 'edit') && (
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as EngineTheme)}
              className="bg-black/40 border border-white/10 text-white/80 text-xs rounded-xl px-2.5 py-1.5 focus:border-amber-500 outline-none cursor-pointer"
              title="Cambiar Estilo Visual"
            >
              <option value="classic-retro">🕹️ LucasArts Retro</option>
              <option value="modern-dark">🌙 Oscuro Elegante</option>
              <option value="sepia-parchment">📜 Pergamino Sepia</option>
              <option value="cyber-terminal">💻 Terminal Cyber</option>
              <option value="emerald-vintage">🌲 Esmeralda Vintage</option>
            </select>
          )}

          {/* Audio toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-black/40 border border-white/10 text-white/60 hover:text-amber-400 transition-colors"
            title={soundEnabled ? 'Sonido Activado' : 'Sonido Desactivado'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-white/30" />}
          </button>

          {/* Player Progress Save/Load (ONLY visible when playing the game) */}
          {currentView === 'play' && (
            <button
              onClick={onOpenSaveLoad}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-200 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm"
              title="Guardar o cargar tu progreso en la partida actual"
            >
              <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
              <span>Guardar/Cargar Partida</span>
            </button>
          )}

          {/* Project Save & Export Button (In Editor / Workspace mode) */}
          {currentView === 'edit' && (
            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
              title="Guardar proyecto en la nube, descargar JSON o exportar HTML/ZIP"
            >
              <FolderDown className="w-3.5 h-3.5" />
              <span>Guardar Proyecto</span>
            </button>
          )}

          {/* Help */}
          <button
            onClick={onOpenHelp}
            className="p-2 rounded-xl bg-black/40 border border-white/10 text-white/40 hover:text-white transition-colors"
            title="Guía y Ayuda"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
