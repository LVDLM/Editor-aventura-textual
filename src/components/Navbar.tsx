import React from 'react';
import { Play, Edit3, HelpCircle, Volume2, VolumeX, FolderOpen, Bookmark, FolderDown, PlusCircle, BookOpen, Shield, User, Layers, ShieldCheck, ChevronDown, ChevronUp, Sun, Moon, Palette } from 'lucide-react';
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
  lastAutoSaveTime?: string;
  asistirResaltado?: boolean;
  toggleAsistirResaltado?: () => void;
  difficulty?: 'facil' | 'normal' | 'dificil';
  setDifficulty?: (difficulty: 'facil' | 'normal' | 'dificil') => void;
  onOpenDetailsModal?: () => void;
  onResetGame?: () => void;
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
  lastAutoSaveTime = '',
  asistirResaltado = false,
  toggleAsistirResaltado,
  difficulty = 'normal',
  setDifficulty,
  onOpenDetailsModal,
  onResetGame,
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
        {/* Left: Save Game Button (when playing/editing) or Current Title */}
        <div className="flex items-center gap-2">
          {currentView === 'play' ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={onOpenSaveLoad}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#A4332A] hover:bg-[#8B2A22] text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
                title="Guardar o cargar tu partida en progreso"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-200" />
                <span>Guardar Partida</span>
              </button>
              <div className="relative flex items-center">
                <div
                  className={`flex items-center gap-1 p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                    isClean ? 'bg-[#FFFDF6] border-[#E5DCB8] text-[#2A2118]' : 'bg-[#382E25] border-[#42362B] text-[#F4EFE3]'
                  }`}
                  title="Cambiar aspecto visual / tema de lectura"
                >
                  <Palette className="w-3.5 h-3.5 text-[#C9A24B] shrink-0" />
                  <span className="hidden lg:inline font-medium">Tema</span>
                  <ChevronDown className="hidden lg:inline w-3 h-3 opacity-60 ml-0.5" />
                </div>
                <select
                  value={theme || 'sepia-parchment'}
                  onChange={(e) => setTheme(e.target.value as EngineTheme)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  aria-label="Seleccionar tema visual"
                >
                  <option value="sepia-parchment">📜 Pergamino Sepia</option>
                  <option value="classic-retro">🕹️ LucasArts Retro</option>
                  <option value="modern-dark">🌙 Oscuro Elegante</option>
                  <option value="cyber-terminal">💻 Terminal Cyber</option>
                  <option value="emerald-vintage">🌲 Esmeralda Vintage</option>
                </select>
              </div>
            </div>
          ) : currentView === 'edit' ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onOpenExport}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#A4332A] hover:bg-[#8B2A22] text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                title={`Guardar proyecto en la nube o descargar archivo. Autoguardado local activo${lastAutoSaveTime ? ` (${lastAutoSaveTime})` : ''}.`}
              >
                <FolderDown className="w-3.5 h-3.5 text-amber-200" />
                <span>Guardar Proyecto</span>
                <span className="text-[10px] text-emerald-300 font-normal hidden sm:inline">
                  (Autoguardado {lastAutoSaveTime || 'activo'})
                </span>
              </button>
              <button
                onClick={() => setCurrentView('play')}
                className="flex items-center gap-1 px-2.5 py-1 bg-[#3B6D11] hover:bg-[#2F570E] text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="Probar juego ahora"
              >
                <Play className="w-3 h-3 fill-white" />
                <span className="hidden sm:inline">Probar</span>
              </button>
            </div>
          ) : (
            <div className={`flex items-center gap-2 text-xs font-semibold ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>
              <img
                src="https://i.ibb.co/20ZgFKbH/favicon-32x32.png"
                alt="Urdimbre"
                className="w-4 h-4 rounded-xs shrink-0 object-contain"
              />
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
              aria-label="Mostrar menú"
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
    <header className={`border-b px-3 sm:px-6 py-2 sticky top-0 z-30 shadow-sm transition-colors duration-300 ${
      isClean
        ? 'bg-[#F4EFE3]/95 border-[#E5DCB8] text-[#2A2118] backdrop-blur-md'
        : 'bg-[#2C241C] border-[#42362B] text-[#F4EFE3]'
    }`}>
      <div className="w-full max-w-[1920px] mx-auto flex items-center justify-between gap-2 xl:gap-4 overflow-x-hidden md:overflow-x-visible">
        {/* Brand & App Title */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setCurrentView('catalog')}
            className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-xs transition-transform hover:scale-105 active:scale-95 shrink-0 cursor-pointer border border-[#E5DCB8]/50"
            title="Ir a la Biblioteca Principal"
          >
            <img
              src="https://i.ibb.co/BKyHfVXw/favicon-96x96.png"
              alt="Urdimbre"
              className="w-full h-full object-contain"
            />
          </button>
          {/* En móvil se oculta el bloque de título para que quepan todos los controles sin scroll lateral */}
          <div className="hidden md:block">
            <h1 className="text-sm sm:text-base font-serif font-bold tracking-tight flex items-center gap-2 leading-tight">
              <span className={`cursor-pointer transition-colors whitespace-nowrap ${isClean ? 'text-[#2A2118] hover:text-[#A4332A]' : 'text-[#F4EFE3] hover:text-[#C9A24B]'}`} onClick={() => setCurrentView('catalog')}>
                Urdimbre: Aventuras textuales
              </span>
            </h1>
            <p className={`text-[11px] truncate max-w-[160px] sm:max-w-xs leading-tight ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`} title={gameTitle}>
              {currentView === 'play' || currentView === 'edit' ? gameTitle : 'Biblioteca de historias para jugar'}
            </p>
          </div>
        </div>

        {/* Center: Action Controls & User Auth Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-center">
          {/* User Profile / Auth Button */}
          <button
            onClick={() => {
              if (currentUser) {
                setCurrentView('profile');
              } else {
                onOpenAuth();
              }
            }}
            aria-label={currentUser ? `Perfil de ${currentUser.displayName}` : 'Iniciar sesión'}
            title={currentUser ? `Perfil de ${currentUser.displayName}` : 'Iniciar sesión'}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
              currentUser
                ? currentView === 'profile'
                  ? 'bg-[#A4332A] border-[#8B2A22] text-white shadow-sm font-bold'
                  : 'bg-[#FFFDF6] border-[#E5DCB8] text-[#2A2118] hover:border-[#A4332A]'
                : 'bg-[#A4332A]/10 border-[#A4332A]/30 text-[#A4332A] hover:bg-[#A4332A]/20'
            }`}
          >
            {currentUser ? (
              <>
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt=""
                    className="w-4 h-4 rounded-full object-cover shrink-0 ring-1 ring-amber-500/40"
                  />
                ) : currentUser.role === 'admin' ? (
                  <Shield className="w-3.5 h-3.5 text-[#A4332A]" />
                ) : (
                  <User className="w-3.5 h-3.5 text-[#C9A24B]" />
                )}
                <span className="hidden lg:inline truncate max-w-[110px]">{currentUser.displayName}</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Iniciar Sesión</span>
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
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm whitespace-nowrap ${
                currentView === 'admin'
                  ? 'bg-[#A4332A] border-[#8B2A22] text-white shadow-sm'
                  : 'bg-[#FFFDF6] border-[#E5DCB8] text-[#2A2118] hover:border-[#A4332A]'
              }`}
              aria-label={
                currentView === 'admin'
                  ? 'Volver a la Biblioteca Pública'
                  : 'Abrir Panel de Control de Administración'
              }
              title={
                currentView === 'admin'
                  ? 'Volver a la Biblioteca Pública'
                  : 'Abrir Panel de Control de Administración'
              }
            >
              {currentView === 'admin' ? (
                <>
                  <BookOpen className="w-3.5 h-3.5 text-white" />
                  <span className="hidden lg:inline">Ver Biblioteca</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5 text-[#A4332A]" />
                  <span className="hidden lg:inline">Panel Admin</span>
                </>
              )}
            </button>
          )}

          {/* Player Progress Save/Load & Visual Theme Selector (ONLY visible when playing the game) */}
          {currentView === 'play' && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={onOpenSaveLoad}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 bg-[#3B6D11] hover:bg-[#2F570E] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm whitespace-nowrap"
                title="Guardar o cargar tu progreso en la partida actual"
                aria-label="Guardar o cargar partida"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-200" />
                <span className="hidden lg:inline">Guardar/Cargar Partida</span>
              </button>

              <div className="relative flex items-center">
                <div
                  className={`flex items-center gap-1.5 p-2 lg:px-3 lg:py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm whitespace-nowrap ${
                    isClean
                      ? 'bg-[#FFFDF6] border-[#E5DCB8] text-[#2A2118] hover:border-[#A4332A]'
                      : 'bg-[#1F1913] border-[#42362B] text-[#F4EFE3] hover:border-[#C9A24B]'
                  }`}
                  title="Cambiar aspecto visual / tema de lectura"
                >
                  <Palette className="w-3.5 h-3.5 text-[#C9A24B] shrink-0" />
                  <span className="hidden lg:inline font-bold">
                    {theme === 'classic-retro' ? 'Retro' :
                     theme === 'modern-dark' ? 'Oscuro' :
                     theme === 'cyber-terminal' ? 'Cyber' :
                     theme === 'emerald-vintage' ? 'Esmeralda' : 'Pergamino'}
                  </span>
                  <ChevronDown className="hidden lg:inline w-3 h-3 opacity-60 ml-0.5" />
                </div>
                <select
                  value={theme || 'sepia-parchment'}
                  onChange={(e) => setTheme(e.target.value as EngineTheme)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  aria-label="Seleccionar tema visual"
                >
                  <option value="sepia-parchment">📜 Pergamino Sepia</option>
                  <option value="classic-retro">🕹️ LucasArts Retro</option>
                  <option value="modern-dark">🌙 Oscuro Elegante</option>
                  <option value="cyber-terminal">💻 Terminal Cyber</option>
                  <option value="emerald-vintage">🌲 Esmeralda Vintage</option>
                </select>
              </div>

              {/* Audio toggle in expanded navbar during play */}
              <button
                type="button"
                onClick={toggleSound}
                className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
                  isClean
                    ? 'bg-[#FFFDF6] hover:bg-[#E5DCB8] text-[#2A2118] border-[#E5DCB8]'
                    : 'bg-[#1F1913] hover:bg-[#382E25] text-[#F4EFE3] border-[#42362B]'
                }`}
                title={soundEnabled ? 'Sonido Activado' : 'Sonido Desactivado'}
                aria-label={soundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#C9A24B]" /> : <VolumeX className="w-3.5 h-3.5 text-[#6B5C46]" />}
              </button>
            </div>
          )}

          {/* Project Save and Play Buttons (ONLY visible when in Editor) */}
          {currentView === 'edit' && (
            <>
              <button
                onClick={onOpenExport}
                className="flex items-center gap-2 px-2.5 sm:px-3.5 py-2 sm:py-1.5 bg-[#A4332A] hover:bg-[#8B2A22] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
                title={`Guardar proyecto en la nube o descargar archivo. Autoguardado local activo${lastAutoSaveTime ? ` (${lastAutoSaveTime})` : ''}.`}
                aria-label="Guardar proyecto"
              >
                <FolderDown className="w-4 h-4 text-amber-200 shrink-0" />
                <div className="hidden lg:flex flex-col text-left leading-tight">
                  <span className="font-bold">Guardar Proyecto</span>
                  <span className="text-[9px] text-emerald-200/90 font-normal flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Autoguardado {lastAutoSaveTime || 'activo'}</span>
                  </span>
                </div>
              </button>

              <button
                onClick={() => setCurrentView('play')}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-[#3B6D11] hover:bg-[#2F570E] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm whitespace-nowrap"
                title="Probar y jugar esta historia ahora mismo"
                aria-label="Probar juego"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span className="hidden lg:inline">Probar Juego</span>
              </button>
            </>
          )}

          {/* Help */}
          <button
            onClick={onOpenHelp}
            className={`w-8 h-8 rounded-full border transition-colors flex items-center justify-center cursor-pointer shrink-0 ${
              isClean ? 'bg-[#FFFDF6] border-[#E5DCB8] text-[#6B5C46] hover:text-[#2A2118]' : 'bg-[#1F1913] border-[#42362B] text-[#D1C7B7] hover:text-white'
            }`}
            title="Guía y Ayuda"
            aria-label="Guía y ayuda"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Ocultar Menú */}
          {setIsHeaderCollapsed && (
            <button
              onClick={() => setIsHeaderCollapsed(true)}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-[#A4332A]/10 hover:bg-[#A4332A]/20 border border-[#A4332A]/30 text-[#A4332A] rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm whitespace-nowrap ml-0.5"
              title="Ocultar menú para lectura inmersiva a pantalla completa"
              aria-label="Ocultar menú"
            >
              <ChevronUp className="w-4 h-4 text-[#A4332A]" />
              <span className="hidden lg:inline">Ocultar Menú</span>
            </button>
          )}
        </div>

        {/* Right: Platform Navigation Tabs - Hidden on mobile during reading mode */}
        <div className={`${currentView === 'play' ? 'hidden md:flex' : 'flex'} items-center rounded-xl p-1 border shrink-0 ${
          isClean ? 'bg-[#FFFDF6] border-[#E5DCB8]' : 'bg-[#1F1913] border-[#42362B]'
        }`}>
          <button
            onClick={() => setCurrentView('catalog')}
            aria-label="Biblioteca"
            title="Biblioteca"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              currentView === 'catalog'
                ? 'bg-[#A4332A] text-white shadow-sm font-bold'
                : isClean ? 'text-[#6B5C46] hover:text-[#2A2118]' : 'text-[#D1C7B7] hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Biblioteca</span>
          </button>

          {canShowEditor && (
            <button
              onClick={() => setCurrentView('edit')}
              aria-label="Editor"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
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
              <span className="hidden lg:inline">Editor</span>
            </button>
          )}

          <button
            onClick={() => setCurrentView('workspace')}
            aria-label="Mis proyectos"
            title="Mis proyectos"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              currentView === 'workspace'
                ? 'bg-[#A4332A] text-white shadow-sm font-bold'
                : isClean ? 'text-[#6B5C46] hover:text-[#2A2118]' : 'text-[#D1C7B7] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Mis Proyectos</span>
          </button>
        </div>
      </div>
    </header>
  );
};
