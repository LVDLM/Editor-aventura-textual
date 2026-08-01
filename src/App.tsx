import React, { useState } from 'react';
import { GameProject, EngineTheme } from './types';
import { sampleGameProject } from './data/sampleGame';
import { Navbar } from './components/Navbar';
import { GamePlayer } from './components/GamePlayer';
import { GameEditor } from './components/Editor/GameEditor';
import { SaveLoadModal } from './components/SaveLoadModal';
import { ExportModal } from './components/ExportModal';
import { HelpModal } from './components/HelpModal';
import { setSoundEnabled, isSoundEnabled } from './utils/audio';

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

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setSoundState(next);
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
            gameState={gameState}
            setGameState={setGameState}
            onReset={handleResetGame}
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
    </div>
  );
}
