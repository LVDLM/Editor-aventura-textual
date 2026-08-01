import React, { useState, useEffect } from 'react';
import { GameProject, SaveSlotData } from '../types';
import { Save, FolderOpen, Trash2, Download, Upload, X, Clock, MapPin, Check, Zap } from 'lucide-react';

interface SaveLoadModalProps {
  project: GameProject;
  currentGameState: any;
  onLoadGameState: (state: any) => void;
  onClose: () => void;
}

const LOCAL_STORAGE_KEY_PREFIX = 'text_adventure_save_slot_';

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
  project,
  currentGameState,
  onLoadGameState,
  onClose,
}) => {
  const [slots, setSlots] = useState<(SaveSlotData | null)[]>([null, null, null, null]);
  const [autosaveSlot, setAutosaveSlot] = useState<SaveSlotData | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAllSlots();
  }, [project.id]);

  const loadAllSlots = () => {
    const autosaveStr = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${project.id}_autosave`);
    if (autosaveStr) {
      try {
        setAutosaveSlot(JSON.parse(autosaveStr));
      } catch {
        setAutosaveSlot(null);
      }
    } else {
      setAutosaveSlot(null);
    }

    const loadedSlots: (SaveSlotData | null)[] = [1, 2, 3, 4].map((slotNum) => {
      const dataStr = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${project.id}_${slotNum}`);
      if (dataStr) {
        try {
          return JSON.parse(dataStr) as SaveSlotData;
        } catch {
          return null;
        }
      }
      return null;
    });
    setSlots(loadedSlots);
  };

  const showNotification = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveToSlot = (slotIndex: number) => {
    const currentScene = project.scenes.find((s) => s.id === currentGameState.currentSceneId);
    
    const saveData: SaveSlotData = {
      id: `slot_${slotIndex + 1}`,
      timestamp: new Date().toLocaleString('es-ES'),
      gameId: project.id,
      gameTitle: project.title,
      currentSceneId: currentGameState.currentSceneId,
      currentSceneName: currentScene?.name || 'Escena Desconocida',
      inventoryItemIds: currentGameState.inventory,
      flags: currentGameState.flags,
      narrativeHistory: currentGameState.history || [],
      appendedTextsPerScene: currentGameState.appendedTextsPerScene || {},
      usedHotspotIds: currentGameState.usedHotspotIds || [],
      difficulty: currentGameState.difficulty || 'facil',
    };

    localStorage.setItem(
      `${LOCAL_STORAGE_KEY_PREFIX}${project.id}_${slotIndex + 1}`,
      JSON.stringify(saveData)
    );

    loadAllSlots();
    showNotification(`¡Partida guardada en la Casilla ${slotIndex + 1}!`);
  };

  const handleLoadFromSlot = (slot: SaveSlotData) => {
    onLoadGameState({
      currentSceneId: slot.currentSceneId,
      inventory: slot.inventoryItemIds,
      flags: slot.flags,
      history: slot.narrativeHistory,
      appendedTextsPerScene: slot.appendedTextsPerScene || {},
      usedHotspotIds: slot.usedHotspotIds || [],
      difficulty: slot.difficulty || 'facil',
    });
    showNotification(`¡Partida cargada correctamente!`);
    onClose();
  };

  const handleDeleteSlot = (slotIndex: number) => {
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${project.id}_${slotIndex + 1}`);
    loadAllSlots();
    showNotification(`Casilla ${slotIndex + 1} borrada.`);
  };

  const handleDeleteAutosave = () => {
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${project.id}_autosave`);
    loadAllSlots();
    showNotification(`Autoguardado borrado.`);
  };

  // Export Save File
  const handleExportSaveFile = () => {
    const currentScene = project.scenes.find((s) => s.id === currentGameState.currentSceneId);
    const saveData: SaveSlotData = {
      id: `export_${Date.now()}`,
      timestamp: new Date().toLocaleString('es-ES'),
      gameId: project.id,
      gameTitle: project.title,
      currentSceneId: currentGameState.currentSceneId,
      currentSceneName: currentScene?.name || 'Escena',
      inventoryItemIds: currentGameState.inventory,
      flags: currentGameState.flags,
      narrativeHistory: currentGameState.history || [],
      appendedTextsPerScene: currentGameState.appendedTextsPerScene || {},
      usedHotspotIds: currentGameState.usedHotspotIds || [],
      difficulty: currentGameState.difficulty || 'facil',
    };

    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `partida_${project.id}_${Date.now()}.save.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Save File
  const handleImportSaveFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string) as SaveSlotData;
        if (parsed.currentSceneId && parsed.flags) {
          onLoadGameState({
            currentSceneId: parsed.currentSceneId,
            inventory: parsed.inventoryItemIds || [],
            flags: parsed.flags || {},
            history: parsed.narrativeHistory || [],
            appendedTextsPerScene: parsed.appendedTextsPerScene || {},
            usedHotspotIds: parsed.usedHotspotIds || [],
            difficulty: parsed.difficulty || 'facil',
          });
          showNotification('¡Partida importada y cargada con éxito!');
          onClose();
        } else {
          alert('El archivo no parece ser un guardado válido.');
        }
      } catch (err) {
        alert('Error al leer el archivo de partida guardada.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <Save className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-base text-slate-100">Progreso de Partida (Jugador)</h3>
              <p className="text-[11px] text-slate-400">Guarda o carga tu avance de juego en la historia en curso.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Clarification Notice Banner */}
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-200/90 flex items-start gap-2.5">
            <span className="text-base shrink-0">🎮</span>
            <div className="space-y-0.5">
              <p className="font-semibold text-emerald-300">Guardado de estado de juego</p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Aquí se almacenan tus datos de partida actual (escenas visitadas, inventario y respuestas descubiertas). Si deseas exportar o modificar la estructura de la aventura entera como autor, usa la opción <strong className="text-amber-300">"Proyecto (Editor / HTML)"</strong> del menú superior.
              </p>
            </div>
          </div>

          {message && (
            <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{message}</span>
            </div>
          )}

          {/* Autosave Card */}
          {autosaveSlot ? (
            <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/40 rounded-xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500 text-slate-950 flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-slate-950" />
                    Autoguardado Automático
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {autosaveSlot.timestamp}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-200 text-xs font-bold pt-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Escena: {autosaveSlot.currentSceneName}</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    ({autosaveSlot.inventoryItemIds.length} objetos)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleLoadFromSlot(autosaveSlot)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Cargar Autoguardado</span>
                </button>
                <button
                  onClick={handleDeleteAutosave}
                  className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  title="Borrar autoguardado"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-slate-600" />
                <span>Casilla de autoguardado (Se creará al recibir objetos o cambiar de escena)</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-500">Vacío</span>
            </div>
          )}

          {/* Standard Save Slots */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {slots.map((slot, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex flex-col justify-between min-h-[140px] transition-all ${
                  slot
                    ? 'bg-slate-950 border-amber-500/40 shadow-inner'
                    : 'bg-slate-950/40 border-slate-800 border-dashed'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Casilla {idx + 1}
                    </span>
                    {slot && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {slot.timestamp}
                      </span>
                    )}
                  </div>

                  {slot ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-200 text-xs font-bold">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{slot.currentSceneName}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {slot.inventoryItemIds.length} objeto(s) en inventario
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-2">Casilla vacía</p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => handleSaveToSlot(idx)}
                    className="flex-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar</span>
                  </button>

                  {slot && (
                    <>
                      <button
                        onClick={() => handleLoadFromSlot(slot)}
                        className="flex-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                        <span>Cargar</span>
                      </button>

                      <button
                        onClick={() => handleDeleteSlot(idx)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                        title="Borrar casilla"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Import / Export File Options */}
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleExportSaveFile}
              className="px-3.5 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Descargar Archivo de Partida (.json)</span>
            </button>

            <label className="px-3.5 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer">
              <Upload className="w-4 h-4 text-blue-400" />
              <span>Cargar Archivo de Partida</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportSaveFile}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
