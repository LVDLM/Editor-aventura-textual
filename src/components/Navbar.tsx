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
      <header className={`border-b px-3 sm:px-6 py-1.5 sticky top-0 z-30 shadow-sm flex items-center justify-between gap-2 min-h-[42px] transition-colors duration-300 ${
        isClean ? 'bg-[#F4EFE3] border-[#E5DCB8] text-[#2A2118]' : 'bg-[#2C241C] border-[#42362B] text-[#F4EFE3]'
      }`}>
        {/* Left: Save Game Button (when playing) or Current Title */}
        <div className="flex items-center gap-2">
          {currentView === 'play' ? (
            <button
              onClick={onOpenSaveLoad}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#A4332A] hover:bg-[#8B2A22] text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
              title="Guardar o cargar tu partida en progreso"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-200" />
              <span>Guardar Partida</span>
            </button>
          ) : (
            <div className={`flex items-center gap-2 text-xs font-semibold ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>
              <span className="w-2 h-2 rounded-full bg-[#C9A24B]"></span>
              <span className="truncate max-w-[180px] sm:max-w-xs font-serif">{gameTitle || 'Urdimbre'}</span>
            </div>
          )}
        </div>

        {/* Center/Right: Audio & Expand Arrow Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isClean ? 'bg-[#FFFDF6] hover:bg-[#E5DCB8] text-[#2A2118] border border-[#E5DCB8]' : 'bg-[#382E25] hover:bg-[#45392E] text-[#F4EFE3] border border-[#42362B]'
            }`}
            title={soundEnabled ? 'Sonido Activado' : 'Sonido Desactivado'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#C9A24B]" /> : <VolumeX className="w-3.5 h-3.5 text-[#6B5C46]" />}
          </button>

          {setIsHeaderCollapsed && (
            <button
              onClick={() => setIsHeaderCollapsed(false)}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#A4332A]/10 hover:bg-[#A4332A]/20 text-[#A4332A] dark:text-[#C9A24B] border border-[#A4332A]/30 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Mostrar menú de navegación"
            >
              <ChevronDown className="w-4 h-4 text-[#A4332A] animate-pulse" />
              <span className="hidden sm:inline">Mostrar Menú</span>
            </button>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className={`border-b px-4 sm:px-6 py-2.5 sticky top-0 z-30 shadow-sm transition-colors duration-300 ${
      isClean
        ? 'bg-[#F4EFE3]/95 border-[#E5DCB8] text-[#2A2118] backdrop-blur-md'
        : 'bg-[#2C241C] border-[#42362B] text-[#F4EFE3]'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & App Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('catalog')}
            className="w-8 h-8 bg-[#A4332A] hover:bg-[#8B2A22] text-white rounded-lg flex items-center justify-center font-serif font-black shadow-sm transition-all shrink-0 cursor-pointer"
            title="Ir a la Biblioteca Principal"
          >
            U
          </button>
          <div>
            <h1 className="text-sm sm:text-base font-serif font-bold tracking-tight flex items-center gap-2">
              <span className={`cursor-pointer transition-colors ${isClean ? 'text-[#2A2118] hover:text-[#A4332A]' : 'text-[#F4EFE3] hover:text-[#C9A24B]'}`} onClick={() => setCurrentView('catalog')}>
                Urdimbre: Aventuras textuales.
              </span>
            </h1>
            <p className={`text-[11px] truncate max-w-[160px] sm:max-w-xs ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`} title={gameTitle}>
              {currentView === 'play' || currentView === 'edit' ? gameTitle : 'Biblioteca de historias para jugar'}
            </p>
          </div>
        </div>

        {/* Platform Navigation Tabs */}
        <div className={`flex items-center rounded-xl p-1 border flex-wrap ${
          isClean ? 'bg-[#FFFDF6] border-[#E5DCB8]' : 'bg-[#1F1913] border-[#42362B]'
        }`}>
          <button
            onClick={() => setCurrentView('catalog')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'catalog'
                ? 'bg-[#A4332A] text-white shadow-sm font-bold'
                : isClean ? 'text-[#6B5C46] hover:text-[#2A2118]' : 'text-[#D1C7B7] hover:text-white'
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
                  ? 'bg-[#A4332A] text-white shadow-sm font-bold'
                  : isClean ? 'text-[#6B5C46] hover:text-[#2A2118]' : 'text-[#D1C7B7] hover:text-white'
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
                ? 'bg-[#A4332A] text-white shadow-sm font-bold'
                : isClean ? 'text-[#6B5C46] hover:text-[#2A2118]' : 'text-[#D1C7B7] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mis Proyectos</span>
          </button>
        </div>

        {/* Action Controls & User Auth Button */}
        <div className="flex items-center gap-2 flex-wrap">
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
                  ? 'bg-[#A4332A] border-[#8B2A22] text-white shadow-sm font-bold'
                  : 'bg-[#FFFDF6] border-[#E5DCB8] text-[#2A2118] hover:border-[#A4332A]'
                : 'bg-[#A4332A]/10 border-[#A4332A]/30 text-[#A4332A] hover:bg-[#A4332A]/20'
            }`}
          >
            {currentUser ? (
              <>
                {currentUser.role === 'admin' ? <Shield className="w-3.5 h-3.5 text-[#A4332A]" /> : <User className="w-3.5 h-3.5 text-[#C9A24B]" />}
                <span className="truncate max-w-[100px]">{currentUser.displayName}</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5" />
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>

          {/* Admin Navigation Button for Administrators */}
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
                  ? 'bg-[#A4332A] border-[#8B2A22] text-white shadow-sm'
                  : 'bg-[#FFFDF6] border-[#E5DCB8] text-[#2A2118] hover:border-[#A4332A]'
              }`}
              title={
                currentView === 'admin'
                  ? 'Volver a la Biblioteca Pública'
                  : 'Abrir Panel de Control de Administración'
              }
            >
              {currentView === 'admin' ? (
                <>
                  <BookOpen className="w-3.5 h-3.5 text-white" />
                  <span>Ver Biblioteca</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5 text-[#A4332A]" />
                  <span>Panel Admin</span>
                </>
              )}
            </button>
          )}

          {/* Player Progress Save/Load (ONLY visible when playing the game) */}
          {currentView === 'play' && (
            <button
              onClick={onOpenSaveLoad}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3B6D11] hover:bg-[#2F570E] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm"
              title="Guardar o cargar tu progreso en la partida actual"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-200" />
              <span>Guardar/Cargar Partida</span>
            </button>
          )}

          {/* Help */}
          <button
            onClick={onOpenHelp}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isClean ? 'bg-[#FFFDF6] border-[#E5DCB8] text-[#6B5C46] hover:text-[#2A2118]' : 'bg-[#1F1913] border-[#42362B] text-[#D1C7B7] hover:text-white'
            }`}
            title="Guía y Ayuda"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Ocultar Menú */}
          {setIsHeaderCollapsed && (
            <button
              onClick={() => setIsHeaderCollapsed(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#A4332A]/10 hover:bg-[#A4332A]/20 border border-[#A4332A]/30 text-[#A4332A] rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm ml-1"
              title="Ocultar menú para lectura inmersiva a pantalla completa"
            >
              <ChevronUp className="w-4 h-4 text-[#A4332A]" />
              <span className="hidden sm:inline">Ocultar Menú</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
