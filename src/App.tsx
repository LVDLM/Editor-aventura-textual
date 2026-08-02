import React, { useState } from 'react';
import { GameProject, EngineTheme } from './types';
import { sampleGameProject } from './data/sampleGame';
import { Navbar } from './components/Navbar';
import { GamePlayer } from './components/GamePlayer';
import { GameEditor } from './components/Editor/GameEditor';
import { SaveLoadModal } from './components/SaveLoadModal';
import { ExportModal } from './components/ExportModal';
import { HelpModal } from './components/HelpModal';
import { NewProjectModal } from './components/NewProjectModal';
import { setSoundEnabled } from './utils/audio';

export default function App() {
  const [project, setProject] = useState<GameProject>(sampleGameProject);
  const [mode, setMode] = useState<'play' | 'edit'>('play');
  const [soundEnabled, setSoundState] = useState<boolean>(true);

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

  // Modals state
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

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
      author: 'Autor',
      version: '1.0.0',
      description: 'Escribe la sinopsis de tu juego.',
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
    setGameState({
      currentSceneId: freshProject.initialSceneId,
      inventory: [],
      flags: {},
      appendedTextsPerScene: {},
      history: [],
      usedHotspotIds: [],
      difficulty: gameState.difficulty || 'facil',
    });
    setMode('edit');
  };

  const handleResetGame = () => {
    setGameState((prev) => ({
      currentSceneId: project.initialSceneId,
      inventory: [],
      flags: { ...project.globalFlags },
      appendedTextsPerScene: {},
      history: [],
      usedHotspotIds: [],
      difficulty: prev.difficulty || 'facil',
    }));
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
      setGameState({
        currentSceneId: sampleGameProject.initialSceneId,
        inventory: [],
        flags: { ...sampleGameProject.globalFlags },
        appendedTextsPerScene: {},
        history: [],
        usedHotspotIds: [],
        difficulty: gameState.difficulty || 'facil',
      });
      setMode('play');
    }
  };

  const handleImportProject = (imported: GameProject) => {
    setProject(imported);
    setGameState({
      currentSceneId: imported.initialSceneId,
      inventory: [],
      flags: { ...imported.globalFlags },
      appendedTextsPerScene: {},
      history: [],
      usedHotspotIds: [],
      difficulty: gameState.difficulty || 'facil',
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#d1d1d1] flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Navigation Header */}
      <Navbar
        mode={mode}
        setMode={setMode}
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
        onLoadSampleGame={handleLoadSampleGame}
      />

      {/* Main Mode Container */}
      <main className="flex-1 flex flex-col">
        {mode === 'play' ? (
          <GamePlayer
            project={project}
            updateProject={handleUpdateProject}
            gameState={gameState}
            setGameState={setGameState}
            onReset={handleResetGame}
            onOpenSaveLoad={() => setShowSaveLoad(true)}
          />
        ) : (
          <GameEditor
            project={project}
            updateProject={handleUpdateProject}
            onSwitchToPlay={() => setMode('play')}
          />
        )}
      </main>

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
        />
      )}

      {showHelp && (
        <HelpModal onClose={() => setShowHelp(false)} />
      )}

      {showNewProjectModal && (
        <NewProjectModal
          onConfirmNewProject={handleCreateNewProject}
          onOpenSaveExport={() => setShowExport(true)}
          onClose={() => setShowNewProjectModal(false)}
        />
      )}
    </div>
  );
}
