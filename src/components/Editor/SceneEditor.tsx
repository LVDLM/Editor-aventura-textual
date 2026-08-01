import React, { useState } from 'react';
import { GameProject, Scene, Hotspot, SceneTextBlock } from '../../types';
import { HotspotEditorModal } from './HotspotEditorModal';
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  MousePointer,
  Check,
  Eye,
  EyeOff,
  Zap,
  DoorOpen,
  ArrowRight,
  Layers,
  Sliders,
} from 'lucide-react';

interface SceneEditorProps {
  project: GameProject;
  updateProject: (fn: (prev: GameProject) => GameProject) => void;
}

export const SceneEditor: React.FC<SceneEditorProps> = ({ project, updateProject }) => {
  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    project.scenes[0]?.id || ''
  );

  const [activeHotspotForEdit, setActiveHotspotForEdit] = useState<Hotspot | null>(null);

  // New scene form
  const [newSceneName, setNewSceneName] = useState('');
  
  // Selection keyword helper
  const [selectedText, setSelectedText] = useState('');
  const [manualKeyword, setManualKeyword] = useState('');

  const activeScene = project.scenes.find((s) => s.id === selectedSceneId) || project.scenes[0];
  const flagKeys = Object.keys(project.globalFlags || {});

  const handleCreateScene = () => {
    if (!newSceneName.trim()) return;
    const sceneId = `scene_${Date.now()}`;
    const newScene: Scene = {
      id: sceneId,
      name: newSceneName.trim(),
      description: 'Nueva escena de la historia',
      textBlocks: [
        {
          id: `block_${Date.now()}`,
          text: 'Escribe aquí la narración de tu escena. Selecciona cualquier palabra o frase para convertirla en una palabra clave interactiva.',
        },
      ],
      hotspots: [],
    };

    updateProject((prev) => ({
      ...prev,
      scenes: [...prev.scenes, newScene],
    }));

    setNewSceneName('');
    setSelectedSceneId(sceneId);
  };

  const handleDeleteScene = (sceneId: string) => {
    if (project.scenes.length <= 1) {
      alert('Debes mantener al menos una escena en el juego.');
      return;
    }
    updateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.filter((s) => s.id !== sceneId),
      initialSceneId: prev.initialSceneId === sceneId ? prev.scenes[0].id : prev.initialSceneId,
    }));
    if (selectedSceneId === sceneId) {
      setSelectedSceneId(project.scenes[0].id);
    }
  };

  const handleUpdateBlockText = (blockId: string, text: string) => {
    updateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => {
        if (s.id !== activeScene.id) return s;
        return {
          ...s,
          textBlocks: s.textBlocks.map((b) => (b.id === blockId ? { ...b, text } : b)),
        };
      }),
    }));
  };

  const handleAddTextBlock = () => {
    const newBlock: SceneTextBlock = {
      id: `block_${Date.now()}`,
      text: '',
    };
    updateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => {
        if (s.id !== activeScene.id) return s;
        return {
          ...s,
          textBlocks: [...s.textBlocks, newBlock],
        };
      }),
    }));
  };

  const handleDeleteTextBlock = (blockId: string) => {
    if (activeScene.textBlocks.length <= 1) return;
    updateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => {
        if (s.id !== activeScene.id) return s;
        return {
          ...s,
          textBlocks: s.textBlocks.filter((b) => b.id !== blockId),
        };
      }),
    }));
  };

  const handleUpdateBlockFlagCondition = (
    blockId: string,
    conditionType: 'visibleIf' | 'hiddenIf',
    flagKey: string | null
  ) => {
    updateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => {
        if (s.id !== activeScene.id) return s;
        return {
          ...s,
          textBlocks: s.textBlocks.map((b) => {
            if (b.id !== blockId) return b;
            const updated = { ...b };
            if (conditionType === 'visibleIf') {
              if (!flagKey) {
                delete updated.visibleIfFlags;
              } else {
                updated.visibleIfFlags = { [flagKey]: true };
              }
            } else if (conditionType === 'hiddenIf') {
              if (!flagKey) {
                delete updated.hiddenIfFlags;
              } else {
                updated.hiddenIfFlags = { [flagKey]: true };
              }
            }
            return updated;
          }),
        };
      }),
    }));
  };

  const handleMouseUpTextSelection = () => {
    const sel = window.getSelection()?.toString().trim();
    if (sel && sel.length > 0) {
      setSelectedText(sel);
    }
  };

  const handleAddHotspot = (wordToAdd: string) => {
    const cleanWord = wordToAdd.trim();
    if (!cleanWord || !activeScene) return;

    // Check if hotspot already exists
    const existing = activeScene.hotspots.find(
      (h) => h.word.toLowerCase() === cleanWord.toLowerCase()
    );

    if (existing) {
      setActiveHotspotForEdit(existing);
    } else {
      const newHotspot: Hotspot = {
        id: `hs_${Date.now()}`,
        word: cleanWord,
        label: cleanWord,
        initialVisible: true,
        actions: [
          {
            id: `act_${Date.now()}`,
            verb: 'mirar',
            responseMessage: `Miras con detenimiento ${cleanWord}.`,
          },
        ],
      };

      updateProject((prev) => ({
        ...prev,
        scenes: prev.scenes.map((s) => {
          if (s.id !== activeScene.id) return s;
          return {
            ...s,
            hotspots: [...s.hotspots, newHotspot],
          };
        }),
      }));

      setActiveHotspotForEdit(newHotspot);
    }

    setSelectedText('');
    setManualKeyword('');
  };

  const handleSaveHotspot = (updatedHs: Hotspot) => {
    updateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => {
        if (s.id !== activeScene.id) return s;
        return {
          ...s,
          hotspots: s.hotspots.map((h) => (h.id === updatedHs.id ? updatedHs : h)),
        };
      }),
    }));
  };

  const handleDeleteHotspot = (hsId: string) => {
    updateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => {
        if (s.id !== activeScene.id) return s;
        return {
          ...s,
          hotspots: s.hotspots.filter((h) => h.id !== hsId),
        };
      }),
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* Scenes List Sidebar */}
      <div className="lg:col-span-1 bg-[#0c0c0e] border border-white/10 rounded-2xl p-5 space-y-4 h-fit">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
              Escenas ({project.scenes.length})
            </h3>
          </div>
        </div>

        {/* Add scene */}
        <div className="space-y-2">
          <input
            type="text"
            value={newSceneName}
            onChange={(e) => setNewSceneName(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:border-amber-500 outline-none"
            placeholder="Nueva escena (ej: El Sótano)"
          />
          <button
            onClick={handleCreateScene}
            className="w-full px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Escena</span>
          </button>
        </div>

        {/* Scene list */}
        <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
          {project.scenes.map((scene) => {
            const isSelected = scene.id === activeScene?.id;
            const isInitial = scene.id === project.initialSceneId;

            return (
              <div
                key={scene.id}
                onClick={() => setSelectedSceneId(scene.id)}
                className={`w-full text-left p-3 rounded-r-lg border-y border-r transition-all cursor-pointer flex items-center justify-between group ${
                  isSelected
                    ? 'bg-white/5 border-l-2 border-amber-500 border-white/10 text-white font-medium'
                    : 'bg-black/30 border-white/5 border-l-transparent text-white/40 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs truncate max-w-[130px]">{scene.name}</span>
                    {isInitial && (
                      <span className="text-[9px] bg-amber-500 text-black font-mono font-bold px-1.5 py-0.2 rounded">
                        INICIO
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-white/30 font-normal block mt-0.5">
                    {scene.hotspots.length} palabras clave
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteScene(scene.id);
                  }}
                  className="p-1 text-white/30 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Eliminar escena"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Scene Editor & Hotspots Workspace */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Story Text Editor Card */}
        <div className="bg-[#0f0f12] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
          {/* Subtle grid pattern background */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="flex items-center justify-between border-b border-white/5 pb-3 relative z-10">
            <div>
              <span className="text-xs font-mono text-amber-500/70 block mb-1">
                EDITOR DE TEXTO // {activeScene?.id.toUpperCase()}
              </span>
              <h3 className="font-medium text-white text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>Escena: {activeScene?.name}</span>
              </h3>
            </div>
          </div>

          <div className="relative z-10">
            <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Nombre de la Escena</label>
            <input
              type="text"
              value={activeScene?.name || ''}
              onChange={(e) => {
                const name = e.target.value;
                updateProject((prev) => ({
                  ...prev,
                  scenes: prev.scenes.map((s) => (s.id === activeScene.id ? { ...s, name } : s)),
                }));
              }}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-medium focus:border-amber-500 outline-none"
            />
          </div>

          {/* Text Blocks (Paragraphs) Section */}
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-white/40 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Bloques de Texto Narrativo ({activeScene?.textBlocks.length || 0})</span>
              </label>

              {selectedText && (
                <button
                  onClick={() => handleAddHotspot(selectedText)}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-md animate-pulse"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Convertir "{selectedText}" en Palabra Clave</span>
                </button>
              )}
            </div>

            {activeScene?.textBlocks.map((block, index) => {
              const visibleFlag = block.visibleIfFlags ? Object.keys(block.visibleIfFlags)[0] : '';
              const hiddenFlag = block.hiddenIfFlags ? Object.keys(block.hiddenIfFlags)[0] : '';

              return (
                <div
                  key={block.id}
                  className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        Párrafo #{index + 1}
                      </span>
                      {visibleFlag && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono flex items-center gap-1">
                          <Eye className="w-3 h-3 text-emerald-400" />
                          Visible si: {visibleFlag}
                        </span>
                      )}
                      {hiddenFlag && (
                        <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded font-mono flex items-center gap-1">
                          <EyeOff className="w-3 h-3 text-rose-400" />
                          Oculto si: {hiddenFlag}
                        </span>
                      )}
                    </div>

                    {activeScene.textBlocks.length > 1 && (
                      <button
                        onClick={() => handleDeleteTextBlock(block.id)}
                        className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                        title="Eliminar este párrafo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <textarea
                    rows={4}
                    value={block.text}
                    onChange={(e) => handleUpdateBlockText(block.id, e.target.value)}
                    onMouseUp={handleMouseUpTextSelection}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white leading-relaxed focus:border-amber-500 outline-none font-serif"
                    placeholder={`Escribe el texto del párrafo #${index + 1}...`}
                  />

                  {/* Flag Condition Controls */}
                  <div className="bg-slate-900/80 border border-white/5 rounded-lg p-2.5 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <span>Condiciones de Visibilidad Dinámica (Banderas):</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Visible if flag */}
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                          <Eye className="w-3 h-3 text-emerald-400" />
                          Mostrar SOLO si esta Bandera está ACTIVADA:
                        </label>
                        <select
                          value={visibleFlag}
                          onChange={(e) =>
                            handleUpdateBlockFlagCondition(
                              block.id,
                              'visibleIf',
                              e.target.value || null
                            )
                          }
                          className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-500 outline-none"
                        >
                          <option value="">-- Sin restricción (Siempre visible) --</option>
                          {flagKeys.map((fk) => (
                            <option key={fk} value={fk}>
                              {fk}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Hidden if flag */}
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                          <EyeOff className="w-3 h-3 text-rose-400" />
                          Ocultar si esta Bandera está ACTIVADA:
                        </label>
                        <select
                          value={hiddenFlag}
                          onChange={(e) =>
                            handleUpdateBlockFlagCondition(
                              block.id,
                              'hiddenIf',
                              e.target.value || null
                            )
                          }
                          className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-500 outline-none"
                        >
                          <option value="">-- Sin restricción (Nunca ocultar) --</option>
                          {flagKeys.map((fk) => (
                            <option key={fk} value={fk}>
                              {fk}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              onClick={handleAddTextBlock}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-amber-400 font-semibold border border-dashed border-amber-500/30 hover:border-amber-500/60 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Añadir Nuevo Bloque de Texto / Párrafo a esta Escena</span>
            </button>
          </div>

          {/* Quick manual keyword add */}
          <div className="flex items-center gap-3 pt-2 relative z-10">
            <input
              type="text"
              value={manualKeyword}
              onChange={(e) => setManualKeyword(e.target.value)}
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500"
              placeholder="O escribe manualmente una palabra clave (ej: lámpara)"
            />
            <button
              onClick={() => handleAddHotspot(manualKeyword)}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-amber-400 font-medium border border-white/10 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Marcar Palabra Clave</span>
            </button>
          </div>
        </div>

        {/* Hotspots / Keywords Interactive Manager */}
        <div className="bg-[#0f0f12] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h3 className="font-medium text-white text-base flex items-center gap-2">
                <MousePointer className="w-4 h-4 text-amber-500" />
                <span>Palabras Clave Interactivas ({activeScene?.hotspots.length || 0})</span>
              </h3>
              <p className="text-xs text-white/40 mt-0.5">
                Configura qué sucede al aplicar acciones sobre cada palabra destacada.
              </p>
            </div>
          </div>

          {!activeScene?.hotspots || activeScene.hotspots.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-xl">
              <Sparkles className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/40">
                Aún no has marcado ninguna palabra interactiva en esta escena.
              </p>
              <p className="text-[11px] text-white/30 mt-1">
                Selecciona una palabra en el texto de arriba para añadirla.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeScene.hotspots.map((hs) => (
                <div
                  key={hs.id}
                  onClick={() => setActiveHotspotForEdit(hs)}
                  className="bg-black/40 border border-white/10 hover:border-amber-500/50 rounded-xl p-4 cursor-pointer transition-all shadow-sm group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-semibold text-sm text-amber-300 bg-amber-500/20 border-b-2 border-amber-500 px-1 rounded-xs">
                        "{hs.word}"
                      </span>
                      {hs.label && hs.label !== hs.word && (
                        <span className="text-xs text-white/40 block font-normal mt-1">
                          {hs.label}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteHotspot(hs.id);
                      }}
                      className="p-1 text-white/30 hover:text-rose-400"
                      title="Eliminar palabra clave"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Actions summary badges */}
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    {hs.actions.map((act) => (
                      <span
                        key={act.id}
                        className="text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded"
                      >
                        {act.verb}
                      </span>
                    ))}
                    {hs.actions.length === 0 && (
                      <span className="text-[10px] text-white/30 italic">Sin acciones personalizadas</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hotspot Config Modal */}
      {activeHotspotForEdit && (
        <HotspotEditorModal
          hotspot={activeHotspotForEdit}
          project={project}
          onSave={handleSaveHotspot}
          onClose={() => setActiveHotspotForEdit(null)}
        />
      )}
    </div>
  );
};
