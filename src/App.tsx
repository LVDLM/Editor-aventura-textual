import React, { useState, useEffect } from 'react';
import { GameProject, EngineTheme, UserProfile } from './types';
import { sampleGameProject } from './data/sampleGame';
import { Navbar, AppView } from './components/Navbar';
import { GamePlayer } from './components/GamePlayer';
import { GameEditor } from './components/Editor/GameEditor';
import { SaveLoadModal } from './components/SaveLoadModal';
import { ExportModal } from './components/ExportModal';
import { HelpModal } from './components/HelpModal';
import { NewProjectModal } from './components/NewProjectModal';
import { PublicCatalog } from './components/Portal/PublicCatalog';
import { ProjectWorkspace } from './components/Portal/ProjectWorkspace';
import { AdminReviewPanel } from './components/Portal/AdminReviewPanel';
import { AuthModal } from './components/Portal/AuthModal';
import { UserProfilePage } from './components/Portal/UserProfilePage';
import { PrivacyPolicyModal } from './components/Portal/PrivacyPolicyModal';
import { Footer } from './components/Footer';
import { setSoundEnabled } from './utils/audio';
import { auth, getUserProfile, createOrUpdateUserProfile, ADMIN_EMAILS, getProjectByIdFromCloud } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [project, setProject] = useState<GameProject>(() => {
    const saved = localStorage.getItem('motordeaventuras_last_edited_project');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.scenes && parsed.id) return parsed;
      } catch (e) {
        console.error('Error loading last edited project:', e);
      }
    }
    return sampleGameProject;
  });

  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>('');

  // Auto-save last edited project to localStorage whenever it changes
  useEffect(() => {
    if (project) {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      localStorage.setItem('motordeaventuras_last_edited_project', JSON.stringify(project));
      if (project.id) {
        localStorage.setItem(`motordeaventuras_autosave_${project.id}`, JSON.stringify(project));
      }
      setLastAutoSaveTime(timeStr);
    }
  }, [project]);

  const [currentCloudDocId, setCurrentCloudDocId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('catalog');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [soundEnabled, setSoundState] = useState<boolean>(true);

  // Deep linking: Load game from URL search parameter '?juego=<id>' or '?game=<id>' on load
  useEffect(() => {
    const checkUrlGame = async () => {
      const params = new URLSearchParams(window.location.search);
      const gameParam = params.get('juego') || params.get('game');
      if (gameParam) {
        if (gameParam === 'demo' || gameParam === 'sample') {
          setProject(sampleGameProject);
          setCurrentCloudDocId(null);
          resetGameStateForProject(sampleGameProject);
          setCurrentView('play');
        } else {
          const docData = await getProjectByIdFromCloud(gameParam);
          if (docData) {
            const targetProj = docData.publishedData || docData.projectData;
            setProject(targetProj);
            setCurrentCloudDocId(docData.id);
            resetGameStateForProject(targetProj);
            setCurrentView('play');
          }
        }
      }
    };
    checkUrlGame();
  }, []);

  // Synchronize URL search parameter when playing a game or navigating views
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentGameId = currentCloudDocId || project?.id;

    if (currentView === 'play' && currentGameId) {
      if (params.get('juego') !== currentGameId) {
        const newUrl = `${window.location.pathname}?juego=${encodeURIComponent(currentGameId)}`;
        window.history.replaceState({ view: 'play', gameId: currentGameId }, '', newUrl);
      }
    } else if (currentView !== 'play' && (params.has('juego') || params.has('game'))) {
      window.history.replaceState({ view: currentView }, '', window.location.pathname);
    }
  }, [currentView, currentCloudDocId, project?.id]);

  // Global web aspect selector state: 'clean' vs 'classic'
  const [webAspect, setWebAspect] = useState<'clean' | 'classic'>(() => {
    return (localStorage.getItem('portal_web_aspect') as 'clean' | 'classic') || 'clean';
  });

  const handleAspectChange = (aspect: 'clean' | 'classic') => {
    setWebAspect(aspect);
    localStorage.setItem('portal_web_aspect', aspect);
  };

  // Active game runtime state
  const [gameState, setGameState] = useState({
    currentSceneId: sampleGameProject.initialSceneId,
    inventory: [] as string[],
    flags: { ...sampleGameProject.globalFlags },
    appendedTextsPerScene: {} as Record<string, string[]>,
    history: [] as { id: string; type: 'story' | 'response' | 'system'; text: string }[],
    usedHotspotIds: [] as string[],
    difficulty: 'facil' as 'facil' | 'normal',
  });

  // Modals and UI Focus state
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userEmail = user.email || '';
        const isAdminEmail = userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase().trim());
        let profile = await getUserProfile(user.uid);

        if (!profile) {
          profile = await createOrUpdateUserProfile(
            user.uid,
            userEmail || `${user.uid.substring(0, 6)}@lector.com`,
            user.displayName || userEmail.split('@')[0] || 'Lector',
            isAdminEmail ? 'admin' : 'author'
          );
        } else if (isAdminEmail && profile.role !== 'admin') {
          profile = await createOrUpdateUserProfile(
            user.uid,
            userEmail,
            profile.displayName || userEmail.split('@')[0] || 'Administrador',
            'admin'
          );
        }
        setCurrentUser(profile);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const resetGameStateForProject = (proj: GameProject) => {
    setGameState({
      currentSceneId: proj.initialSceneId || (proj.scenes && proj.scenes[0]?.id) || '',
      inventory: [],
      flags: { ...proj.globalFlags },
      appendedTextsPerScene: {},
      history: [],
      usedHotspotIds: [],
      difficulty: gameState.difficulty || 'facil',
    });
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setSoundState(next);
  };

  const handleCreateNewProject = () => {
    const timestamp = Date.now();
    const freshProject: GameProject = {
      id: `juego_${timestamp}`,
      title: 'Mi Nueva Aventura',
      author: currentUser?.displayName || 'Autor',
      version: '1.0.0',
      description: 'Escribe aquí la sinopsis de tu historia interactiva.',
      theme: 'classic-retro',
      initialSceneId: 'escena_portada',
      defaultResponses: {
        mirar: 'Miras con atención, pero no observas nada fuera de lo normal.',
        usar: 'Intentas usarlo, pero no parece tener ningún efecto evidente.',
        abrir: 'Intentas abrirlo, pero no es posible o no responde.',
        coger: 'Intentas cogerlo, pero no puedes llevártelo contigo.',
        hablar: 'Hablas en voz alta, pero nadie te responde.',
        empujar: 'Lo empujas con fuerza, pero apenas se mueve.',
        ir_a: 'No puedes ir hacia allí en este momento.',
      },
      globalFlags: {},
      inventoryItems: [],
      scenes: [
        {
          id: 'escena_portada',
          name: 'Portada del Juego',
          type: 'portada',
          description: 'Carátula y pantalla de inicio del juego',
          textBlocks: [
            {
              id: `block_portada_${timestamp}`,
              text: 'MI NUEVA AVENTURA\n\nUna historia interactiva llena de misterios.\n\nHaz clic en [Comenzar] para iniciar la experiencia.',
              coverMode: 'with_text',
            },
          ],
          hotspots: [
            {
              id: `hotspot_comenzar_${timestamp}`,
              word: 'Comenzar',
              label: 'Comenzar Aventura',
              initialVisible: true,
              actions: [
                {
                  id: `act_comenzar_${timestamp}`,
                  verb: 'ir_a',
                  responseMessage: 'Iniciando la aventura...',
                  stateChange: {
                    goToSceneId: 'escena_introduccion',
                  },
                },
              ],
            },
          ],
        },
        {
          id: 'escena_introduccion',
          name: 'Introducción',
          type: 'introduccion',
          description: 'Prólogo y contexto narrativo',
          textBlocks: [
            {
              id: `block_intro_${timestamp}`,
              text: 'INTRODUCCIÓN\n\nBienvenido a esta historia. Aquí comienza tu viaje por escenarios misteriosos...\n\n¿Estás listo para [Entrar] en la primera escena?',
            },
          ],
          hotspots: [
            {
              id: `hotspot_entrar_${timestamp}`,
              word: 'Entrar',
              label: 'Entrar a la escena',
              initialVisible: true,
              actions: [
                {
                  id: `act_entrar_${timestamp}`,
                  verb: 'ir_a',
                  responseMessage: 'Entrando en la escena...',
                  stateChange: {
                    goToSceneId: 'escena_1',
                  },
                },
              ],
            },
          ],
        },
        {
          id: 'escena_1',
          name: 'Entrada Principal',
          type: 'normal',
          description: 'Primera escena de exploración',
          textBlocks: [
            {
              id: `block_escena1_${timestamp}`,
              text: 'Te encuentras frente a la entrada principal de un antiguo edificio. Hay una gran [puerta] de madera y una antigua [lámpara] de pared.',
            },
          ],
          hotspots: [
            {
              id: `hotspot_puerta_${timestamp}`,
              word: 'puerta',
              label: 'Puerta de madera',
              initialVisible: true,
              actions: [
                {
                  id: `act_puerta_mirar_${timestamp}`,
                  verb: 'mirar',
                  responseMessage: 'Es una pesada puerta de roble macizo con herrajes de hierro.',
                },
              ],
            },
            {
              id: `hotspot_lampara_${timestamp}`,
              word: 'lámpara',
              label: 'Lámpara de pared',
              initialVisible: true,
              actions: [
                {
                  id: `act_lampara_mirar_${timestamp}`,
                  verb: 'mirar',
                  responseMessage: 'Una vieja lámpara de aceite gastada.',
                },
              ],
            },
          ],
        },
      ],
    };

    setProject(freshProject);
    setCurrentCloudDocId(null);
    resetGameStateForProject(freshProject);
    setCurrentView('edit');
  };

  const handleResetGame = () => {
    resetGameStateForProject(project);
  };

  const handleUpdateProject = (fn: (prev: GameProject) => GameProject) => {
    setProject((prev) => {
      const updated = fn(prev);
      return updated;
    });
  };

  const handleLoadSampleGame = () => {
    if (confirm('¿Quieres cargar el juego de demostración "El Misterio de la Habitación Oscura"? Se reemplazarán los cambios no guardados en el editor.')) {
      setProject(sampleGameProject);
      setCurrentCloudDocId(null);
      resetGameStateForProject(sampleGameProject);
      setCurrentView('play');
    }
  };

  const handleImportProject = (imported: GameProject) => {
    setProject(imported);
    setCurrentCloudDocId(null);
    resetGameStateForProject(imported);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      webAspect === 'clean' ? 'bg-[#f8fafc] text-slate-800' : 'bg-[#0a0a0c] text-[#d1d1d1]'
    } selection:bg-amber-500 selection:text-slate-950`}>
      
      {/* Platform Top Header */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentUser={currentUser}
        gameTitle={project.title}
        theme={project.theme}
        setTheme={(newTheme: EngineTheme) =>
          handleUpdateProject((prev) => ({ ...prev, theme: newTheme }))
        }
        soundEnabled={soundEnabled}
        toggleSound={toggleSound}
        onOpenNewProject={() => setShowNewProjectModal(true)}
        onOpenSaveLoad={() => setShowSaveLoad(true)}
        onOpenExport={() => setShowExport(true)}
        onOpenHelp={() => setShowHelp(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenPrivacyModal={() => setShowPrivacyModal(true)}
        onLoadSampleGame={handleLoadSampleGame}
        isHeaderCollapsed={isHeaderCollapsed}
        setIsHeaderCollapsed={setIsHeaderCollapsed}
        webAspect={webAspect}
        onAspectChange={handleAspectChange}
        isTutorial={
          project.id === sampleGameProject.id ||
          project.id === 'sample-game-id' ||
          project.id === 'tutorial' ||
          project.title.toLowerCase().includes('tutorial')
        }
        isOwnProject={
          !!(currentUser && (project.author === currentUser.displayName || project.authorId === currentUser.uid))
        }
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col min-h-0">
        {currentView === 'catalog' && (
          <PublicCatalog
            currentUser={currentUser}
            webAspect={webAspect}
            onAspectChange={handleAspectChange}
            onPlayProject={(selectedProj) => {
              setProject(selectedProj);
              resetGameStateForProject(selectedProj);
              setCurrentView('play');
            }}
            onOpenWorkspace={() => {
              if (!currentUser) {
                setShowAuthModal(true);
              } else {
                setCurrentView('workspace');
              }
            }}
          />
        )}

        {currentView === 'play' && (
          <GamePlayer
            project={project}
            updateProject={handleUpdateProject}
            gameState={gameState}
            setGameState={setGameState}
            onReset={handleResetGame}
            onOpenSaveLoad={() => setShowSaveLoad(true)}
            isHeaderCollapsed={isHeaderCollapsed}
            setIsHeaderCollapsed={setIsHeaderCollapsed}
            soundEnabled={soundEnabled}
            toggleSound={() => setSoundState(!soundEnabled)}
          />
        )}

        {currentView === 'edit' && (
          <GameEditor
            project={project}
            updateProject={handleUpdateProject}
            onSwitchToPlay={() => setCurrentView('play')}
            onOpenExport={() => setShowExport(true)}
            currentUser={currentUser}
            webAspect={webAspect}
          />
        )}

        {currentView === 'workspace' && (
          <ProjectWorkspace
            currentUser={currentUser}
            activeProject={project}
            onSelectProject={(selectedProj, docId) => {
              setProject(selectedProj);
              setCurrentCloudDocId(docId);
              resetGameStateForProject(selectedProj);
            }}
            onOpenEditor={() => setCurrentView('edit')}
            onPlayProject={(selectedProj) => {
              setProject(selectedProj);
              resetGameStateForProject(selectedProj);
              setCurrentView('play');
            }}
            onCreateNewProject={handleCreateNewProject}
            onOpenAuth={() => setShowAuthModal(true)}
            webAspect={webAspect}
          />
        )}

        {currentView === 'admin' && (
          <AdminReviewPanel
            currentUser={currentUser}
            onSelectProject={(selectedProj, docId) => {
              setProject(selectedProj);
              setCurrentCloudDocId(docId);
              resetGameStateForProject(selectedProj);
            }}
            onOpenEditor={() => setCurrentView('edit')}
            onPlayProject={(selectedProj) => {
              setProject(selectedProj);
              resetGameStateForProject(selectedProj);
              setCurrentView('play');
            }}
            webAspect={webAspect}
          />
        )}

        {currentView === 'profile' && currentUser && (
          <UserProfilePage
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            onLoadProjectToEditor={(projData, docId) => {
              setProject(projData);
              setCurrentCloudDocId(docId);
              setCurrentView('edit');
            }}
            onLoadGameStateToPlay={(projData, slotData) => {
              setProject(projData);
              setGameState({
                currentSceneId: slotData.currentSceneId,
                inventory: slotData.inventoryItemIds || [],
                flags: slotData.flags || {},
                history: slotData.narrativeHistory || [],
                appendedTextsPerScene: slotData.appendedTextsPerScene || {},
                usedHotspotIds: slotData.usedHotspotIds || [],
                difficulty: slotData.difficulty || 'facil',
              });
              setCurrentView('play');
            }}
            setCurrentView={setCurrentView}
            onOpenPrivacyModal={() => setShowPrivacyModal(true)}
            webAspect={webAspect}
          />
        )}
      </main>

      {!isHeaderCollapsed && (
        <Footer
          variant={currentView === 'play' ? 'published' : 'web'}
          webAspect={webAspect}
          onOpenPrivacyModal={() => setShowPrivacyModal(true)}
        />
      )}

      {/* Modals */}
      {showSaveLoad && (
        <SaveLoadModal
          project={project}
          currentGameState={gameState}
          onLoadGameState={(loadedState) => setGameState(loadedState)}
          onClose={() => setShowSaveLoad(false)}
        />
      )}

      {showExport && (
        <ExportModal
          project={project}
          onImportProject={handleImportProject}
          onClose={() => setShowExport(false)}
          currentUser={currentUser}
          onOpenAuth={() => setShowAuthModal(true)}
        />
      )}

      {showHelp && (
        <HelpModal
          currentUser={currentUser}
          currentView={currentView}
          onClose={() => setShowHelp(false)}
          webAspect={webAspect}
        />
      )}

      {showNewProjectModal && (
        <NewProjectModal
          onConfirmNewProject={handleCreateNewProject}
          onOpenSaveExport={() => setShowExport(true)}
          onClose={() => setShowNewProjectModal(false)}
        />
      )}

      {showAuthModal && (
        <AuthModal
          currentUser={currentUser}
          onUserChanged={setCurrentUser}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {showPrivacyModal && (
        <PrivacyPolicyModal
          isLoggedIn={!!currentUser}
          onClose={() => setShowPrivacyModal(false)}
          onOpenDeleteAccount={() => setCurrentView('profile')}
        />
      )}
    </div>
  );
}
