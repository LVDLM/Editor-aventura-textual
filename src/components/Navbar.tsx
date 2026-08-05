import React from 'react';
import { Play, Edit3, HelpCircle, Volume2, VolumeX, FolderOpen, Bookmark, FolderDown, PlusCircle, BookOpen, Shield, User, Layers, ShieldCheck, ChevronDown, ChevronUp, Sun, Moon } from 'lucide-react';
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
  isHeaderCollapsed?: boolean;
  setIsHeaderCollapsed?: (collapsed: boolean) => void;
  webAspect?: 'clean' | 'classic';
  onAspectChange?: (aspect: 'clean' | 'classic') => void;
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
  isHeaderCollapsed = false,
  setIsHeaderCollapsed,
  webAspect = 'clean',
  onAspectChange,
}) => {
  const isClean = webAspect === 'clean';

  // Logic for showing the Editor tab
  const canShowEditor = React.useMemo(() => {
    if (currentView === 'edit') return true;
    if (!currentUser) return false;
    if (currentView === 'play') {
      return isOwnProject || isTutorial;
    }
    return true;
  }, [currentView, currentUser, isOwnProject, isTutorial]);

  // Render ultra-compact top bar when collapsed
  if (isHeaderCollapsed) {
    return (
      <header className={`border-b px-3 sm:px-6 py-1 sticky top-0 z-30 shadow-lg backdrop-blur-md flex items-center justify-between gap-2 min-h-[42px] transition-colors duration-300 ${
        isClean ? 'bg-white/95 border-slate-200 text-slate-800' : 'bg-slate-950/95 border-white/10 text-white'
      }`}>
        {/* Left: Save Game Button (when playing) or Current Title */}
        <div className="flex items-center gap-2">
          {currentView === 'play' ? (
            <button
              onClick={onOpenSaveLoad}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
              title="Guardar o cargar tu partida en progreso"
            >
              <Bookmark className="w-3.5 h-3.5 text-emerald-200" />
              <span>Guardar Partida</span>
            </button>
          ) : (
            <div className={`flex items-center gap-2 text-xs font-semibold ${isClean ? 'text-slate-700' : 'text-slate-300'}`}>
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="truncate max-w-[180px] sm:max-w-xs">{gameTitle || 'Textoaventura'}</span>
            </div>
          )}
        </div>

        {/* Center/Right: Audio & Expand Arrow Button */}
        <div className="flex items-center gap-2">
          {onAspectChange && (
            <button
              onClick={() => onAspectChange(isClean ? 'classic' : 'clean')}
              className={`p-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                isClean ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
              title={isClean ? 'Cambiar a Estilo Web Oscuro Clásico' : 'Cambiar a Estilo Web Luminoso'}
            >
              {isClean ? <Moon className="w-3.5 h-3.5 text-slate-600" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            </button>
          )}

          <button
            onClick={toggleSound}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isClean ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/5 hover:bg-white/10 text-white/70'
            }`}
            title={soundEnabled ? 'Sonido Activado' : 'Sonido Desactivado'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-500" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {setIsHeaderCollapsed && (
            <button
              onClick={() => setIsHeaderCollapsed(false)}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Desplegar encabezados y menú principal de la web"
            >
              <ChevronDown className="w-4 h-4 text-amber-500 animate-bounce" />
              <span className="hidden sm:inline">Desplegar Encabezados</span>
            </button>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className={`border-b px-4 sm:px-6 py-2.5 sticky top-0 z-30 shadow-md transition-colors duration-300 ${
      isClean
        ? 'bg-white/95 border-slate-200 text-slate-900 backdrop-blur-md'
        : 'bg-[#0f0f12] border-white/10 text-white'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & App Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('catalog')}
            className="w-8 h-8 bg-amber-500 hover:bg-amber-400 rounded-lg flex items-center justify-center text-slate-950 font-extrabold shadow-md transition-all shrink-0 cursor-pointer"
            title="Ir a la Biblioteca Principal"
          >
            N
          </button>
          <div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight flex items-center gap-2">
              <span className={`cursor-pointer transition-colors ${isClean ? 'text-slate-900 hover:text-amber-600' : 'text-white hover:text-amber-400'}`} onClick={() => setCurrentView('catalog')}>
                Textoaventura: Lecturas interactivas
              </span>
            </h1>
            <p className={`text-[11px] truncate max-w-[160px] sm:max-w-xs ${isClean ? 'text-slate-500' : 'text-white/50'}`} title={gameTitle}>
              {currentView === 'play' || currentView === 'edit' ? gameTitle : 'Plataforma de Historias'}
            </p>
          </div>
        </div>

        {/* Platform Navigation Tabs */}
        <div className={`flex items-center rounded-xl p-1 border flex-wrap ${
          isClean ? 'bg-slate-100 border-slate-200' : 'bg-black/60 border-white/10'
        }`}>
          <button
            onClick={() => setCurrentView('catalog')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'catalog'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : isClean ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Biblioteca</span>
          </button>

          {canShowEditor && (
            <button
              onClick={() => setCurrentView('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'edit'
                  ? isClean ? 'bg-slate-200 text-slate-900 font-bold shadow-sm' : 'bg-white/15 text-white font-bold shadow-inner'
                  : isClean ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'
              }`}
              title={
                isTutorial
                  ? 'Ver y probar cambios en el tutorial'
                  : 'Editar y personalizar esta historia'
              }
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>
          )}

          <button
            onClick={() => setCurrentView('workspace')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'workspace'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-md'
                : isClean ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mis Proyectos</span>
          </button>
        </div>

        {/* Action Controls & User Auth Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Global Web Aspect Selector Button */}
          {onAspectChange && (
            <button
              onClick={() => onAspectChange(isClean ? 'classic' : 'clean')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isClean
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
              }`}
              title={isClean ? 'Cambiar estilo de la web a Oscuro Clásico' : 'Cambiar estilo de la web a Luminoso y Diáfano'}
            >
              {isClean ? <Moon className="w-3.5 h-3.5 text-slate-700" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              <span className="hidden md:inline">{isClean ? 'Modo Oscuro' : 'Modo Claro'}</span>
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              currentUser
                ? currentView === 'profile'
                  ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md font-bold'
                  : currentUser.role === 'admin'
                  ? 'bg-rose-100 border-rose-300 text-rose-900 hover:bg-rose-200'
                  : 'bg-sky-100 border-sky-300 text-sky-900 hover:bg-sky-200'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30'
            }`}
          >
            {currentUser ? (
              <>
                {currentUser.role === 'admin' ? <Shield className="w-3.5 h-3.5 text-rose-600" /> : <User className="w-3.5 h-3.5 text-sky-600" />}
                <span className="truncate max-w-[100px]">{currentUser.displayName}</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5" />
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>

          {/* Single Admin / Lector View Toggle Button for Administrators */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => {
                if (currentView === 'admin') {
                  setCurrentView('catalog');
                } else {
                  setCurrentView('admin');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm ${
                currentView === 'admin'
                  ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                  : isClean
                  ? 'bg-sky-100 border-sky-300 text-sky-900 hover:bg-sky-200'
                  : 'bg-sky-950/50 border-sky-700/60 text-sky-300 hover:bg-sky-900/60'
              }`}
              title={
                currentView === 'admin'
                  ? 'Ver la web como lector registrado (Lector)'
                  : 'Ver panel de administración (Admin)'
              }
            >
              {currentView === 'admin' ? (
                <>
                  <Shield className="w-3.5 h-3.5 text-white" />
                  <span>Admin</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Lector</span>
                </>
              )}
            </button>
          )}

          {/* Player Progress Save/Load (ONLY visible when playing the game) */}
          {currentView === 'play' && (
            <button
              onClick={onOpenSaveLoad}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm"
              title="Guardar o cargar tu progreso en la partida actual"
            >
              <Bookmark className="w-3.5 h-3.5 text-emerald-200" />
              <span>Guardar/Cargar Partida</span>
            </button>
          )}

          {/* Help */}
          <button
            onClick={onOpenHelp}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isClean ? 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900' : 'bg-black/40 border-white/10 text-white/40 hover:text-white'
            }`}
            title="Guía y Ayuda"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Recoger Encabezados */}
          {setIsHeaderCollapsed && (
            <button
              onClick={() => setIsHeaderCollapsed(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm ml-1"
              title="Recoger encabezados de la web y de la lectura para pantalla completa de texto y botones"
            >
              <ChevronUp className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Recoger Encabezados</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
