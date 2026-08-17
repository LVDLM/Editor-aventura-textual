import React, { useState, useEffect } from 'react';
import { GameProject, SaveSlotData } from '../types';
import { Save, FolderOpen, Trash2, Download, Upload, X, Clock, MapPin, Check, Zap } from 'lucide-react';

interface SaveLoadModalProps {
  project: GameProject;
  currentGameState: any;
  onLoadGameState: (state: any) => void;
  onClose: () => void;
  webAspect?: 'clean' | 'classic';
}

const LOCAL_STORAGE_KEY_PREFIX = 'text_adventure_save_slot_';

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
  project,
  currentGameState,
  onLoadGameState,
  onClose,
  webAspect = 'clean',
}) => {
  const isClean = webAspect === 'clean';
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
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className={`rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl cursor-default border transition-colors ${
          isClean
            ? 'bg-[#FFFDF6] border-[#E5DCB8] text-[#2A2118]'
            : 'bg-[#2C241C] border-[#42362B] text-[#F4EFE3]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isClean ? 'bg-[#F4EFE3] border-[#E5DCB8]' : 'bg-[#241D17] border-[#42362B]'
        }`}>
          <div className="flex items-center gap-2">
            <Save className={`w-5 h-5 ${isClean ? 'text-[#A4332A]' : 'text-[#C9A24B]'}`} />
            <div>
              <h3 className={`font-serif font-bold text-base ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>
                Progreso de Partida (Jugador)
              </h3>
              <p className={`text-[11px] ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
                Guarda o carga tu avance de juego en la historia en curso.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isClean ? 'text-[#6B5C46] hover:text-[#2A2118] hover:bg-[#E5DCB8]/50' : 'text-[#A89880] hover:text-[#F4EFE3] hover:bg-[#3B3026]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Clarification Notice Banner */}
          <div className={`rounded-xl p-3 text-xs flex items-start gap-2.5 border ${
            isClean
              ? 'bg-[#3B6D11]/10 border-[#3B6D11]/30 text-[#2A2118]'
              : 'bg-[#3B6D11]/20 border-[#3B6D11]/40 text-[#F4EFE3]'
          }`}>
            <span className="text-base shrink-0">🎮</span>
            <div className="space-y-0.5">
              <p className={`font-serif font-bold ${isClean ? 'text-[#3B6D11]' : 'text-[#5B9E22]'}`}>
                Guardado de estado de juego
              </p>
              <p className={`text-[11px] leading-relaxed ${isClean ? 'text-[#6B5C46]' : 'text-[#C9BFA8]'}`}>
                Aquí se almacenan tus datos de partida actual (escenas visitadas, inventario y respuestas descubiertas). Si deseas exportar o modificar la estructura de la aventura entera como autor, usa la opción <strong className={isClean ? 'text-[#A4332A]' : 'text-[#C9A24B]'}>"Proyecto (Editor / HTML)"</strong> del menú superior.
              </p>
            </div>
          </div>

          {message && (
            <div className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border ${
              isClean
                ? 'bg-[#3B6D11]/10 border-[#3B6D11]/40 text-[#3B6D11]'
                : 'bg-[#3B6D11]/20 border-[#3B6D11]/50 text-[#5B9E22]'
            }`}>
              <Check className="w-4 h-4" />
              <span>{message}</span>
            </div>
          )}

          {/* Autosave Card */}
          {autosaveSlot ? (
            <div className={`border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isClean
                ? 'bg-[#F4EFE3] border-[#E5DCB8]'
                : 'bg-[#241D17] border-[#42362B]'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase flex items-center gap-1 ${
                    isClean ? 'bg-[#C9A24B] text-[#2A2118]' : 'bg-[#C9A24B] text-[#2C241C]'
                  }`}>
                    <Zap className="w-3 h-3 fill-current" />
                    Autoguardado Automático
                  </span>
                  <span className={`text-[11px] flex items-center gap-1 ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
                    <Clock className="w-3 h-3" />
                    {autosaveSlot.timestamp}
                  </span>
                </div>
                <div className={`flex items-center gap-2 text-xs font-serif font-bold pt-1 ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>
                  <MapPin className={`w-3.5 h-3.5 shrink-0 ${isClean ? 'text-[#A4332A]' : 'text-[#C9A24B]'}`} />
                  <span>Escena: {autosaveSlot.currentSceneName}</span>
                  <span className={`text-[11px] font-sans font-normal ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
                    ({autosaveSlot.inventoryItemIds.length} objetos)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleLoadFromSlot(autosaveSlot)}
                  className={`px-4 py-2 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer ${
                    isClean
                      ? 'bg-[#A4332A] hover:bg-[#8B2A22] text-white'
                      : 'bg-[#C9A24B] hover:bg-[#B38E3B] text-[#2C241C]'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Cargar Autoguardado</span>
                </button>
                <button
                  onClick={handleDeleteAutosave}
                  className={`p-2 transition-colors cursor-pointer ${
                    isClean ? 'text-[#6B5C46] hover:text-[#A4332A]' : 'text-[#A89880] hover:text-[#A4332A]'
                  }`}
                  title="Borrar autoguardado"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className={`border rounded-xl p-3 flex items-center justify-between text-xs ${
              isClean
                ? 'bg-[#F4EFE3]/60 border-[#E5DCB8] text-[#6B5C46]'
                : 'bg-[#241D17]/60 border-[#42362B] text-[#A89880]'
            }`}>
              <div className="flex items-center gap-2">
                <Zap className={`w-4 h-4 ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`} />
                <span>Casilla de autoguardado (Se creará al recibir objetos o cambiar de escena)</span>
              </div>
              <span className={`text-[10px] uppercase font-sans font-bold px-2 py-0.5 rounded ${
                isClean ? 'bg-[#E5DCB8] text-[#2A2118]' : 'bg-[#3B3026] text-[#A89880]'
              }`}>
                Vacío
              </span>
            </div>
          )}

          {/* Standard Save Slots */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {slots.map((slot, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex flex-col justify-between min-h-[140px] transition-all ${
                  slot
                    ? isClean
                      ? 'bg-[#FFFDF6] border-[#A4332A]/40 shadow-sm'
                      : 'bg-[#241D17] border-[#C9A24B]/40'
                    : isClean
                      ? 'bg-[#F4EFE3]/50 border-[#E5DCB8] border-dashed'
                      : 'bg-[#241D17]/40 border-[#42362B] border-dashed'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-serif font-bold uppercase tracking-wider ${
                      isClean ? 'text-[#A4332A]' : 'text-[#C9A24B]'
                    }`}>
                      Casilla {idx + 1}
                    </span>
                    {slot && (
                      <span className={`text-[10px] flex items-center gap-1 ${
                        isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {slot.timestamp}
                      </span>
                    )}
                  </div>

                  {slot ? (
                    <div className="space-y-1">
                      <div className={`flex items-center gap-1.5 text-xs font-serif font-bold ${
                        isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'
                      }`}>
                        <MapPin className={`w-3.5 h-3.5 shrink-0 ${isClean ? 'text-[#C9A24B]' : 'text-[#C9A24B]'}`} />
                        <span className="truncate">{slot.currentSceneName}</span>
                      </div>
                      <p className={`text-[11px] ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
                        {slot.inventoryItemIds.length} objeto(s) en inventario
                      </p>
                    </div>
                  ) : (
                    <p className={`text-xs italic py-2 ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
                      Casilla vacía
                    </p>
                  )}
                </div>

                <div className={`flex items-center gap-2 pt-3 border-t ${
                  isClean ? 'border-[#E5DCB8]' : 'border-[#42362B]'
                }`}>
                  <button
                    onClick={() => handleSaveToSlot(idx)}
                    className={`flex-1 px-3 py-1.5 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                      isClean
                        ? 'bg-[#A4332A] hover:bg-[#8B2A22] text-white shadow-sm'
                        : 'bg-[#C9A24B] hover:bg-[#B38E3B] text-[#2C241C]'
                    }`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar</span>
                  </button>

                  {slot && (
                    <>
                      <button
                        onClick={() => handleLoadFromSlot(slot)}
                        className={`flex-1 px-3 py-1.5 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                          isClean
                            ? 'bg-[#F4EFE3] hover:bg-[#E5DCB8] text-[#2A2118] border border-[#E5DCB8]'
                            : 'bg-[#3B3026] hover:bg-[#4A3D30] text-[#F4EFE3] border border-[#42362B]'
                        }`}
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-[#3B6D11]" />
                        <span>Cargar</span>
                      </button>

                      <button
                        onClick={() => handleDeleteSlot(idx)}
                        className={`p-1.5 transition-colors cursor-pointer ${
                          isClean ? 'text-[#6B5C46] hover:text-[#A4332A]' : 'text-[#A89880] hover:text-[#A4332A]'
                        }`}
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
          <div className={`pt-3 border-t flex flex-wrap items-center justify-between gap-3 ${
            isClean ? 'border-[#E5DCB8]' : 'border-[#42362B]'
          }`}>
            <button
              onClick={handleExportSaveFile}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border ${
                isClean
                  ? 'bg-[#F4EFE3] hover:bg-[#E5DCB8] text-[#2A2118] border-[#E5DCB8]'
                  : 'bg-[#241D17] hover:bg-[#3B3026] text-[#F4EFE3] border-[#42362B]'
              }`}
            >
              <Download className={`w-4 h-4 ${isClean ? 'text-[#A4332A]' : 'text-[#C9A24B]'}`} />
              <span>Descargar Archivo de Partida (.json)</span>
            </button>

            <label className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border ${
              isClean
                ? 'bg-[#F4EFE3] hover:bg-[#E5DCB8] text-[#2A2118] border-[#E5DCB8]'
                : 'bg-[#241D17] hover:bg-[#3B3026] text-[#F4EFE3] border-[#42362B]'
            }`}>
              <Upload className={`w-4 h-4 ${isClean ? 'text-[#3B6D11]' : 'text-[#C9A24B]'}`} />
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
