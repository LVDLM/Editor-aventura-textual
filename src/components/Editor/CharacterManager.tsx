import React, { useState } from 'react';
import { GameProject, GameCharacter, InventoryItem } from '../../types';
import { User, Plus, Trash2, Edit, Upload, Image as ImageIcon, Heart, Package } from 'lucide-react';

interface CharacterManagerProps {
  project: GameProject;
  updateProject: (fn: (prev: GameProject) => GameProject) => void;
  webAspect?: 'clean' | 'classic';
}

export const CharacterManager: React.FC<CharacterManagerProps> = ({
  project,
  updateProject,
  webAspect = 'clean',
}) => {
  const characters = project.characters || [];
  const inventoryItems = project.inventoryItems || [];

  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    characters.length > 0 ? characters[0].id : null
  );

  const isClean = webAspect === 'clean';

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId) || null;

  const handleAddCharacter = () => {
    const newId = `char_${Date.now()}`;
    const newChar: GameCharacter = {
      id: newId,
      name: 'Nuevo Personaje',
      description: 'Descripción breve de la apariencia o actitud del personaje.',
      healthPoints: 100,
    };

    updateProject((prev) => ({
      ...prev,
      characters: [...(prev.characters || []), newChar],
    }));

    setSelectedCharacterId(newId);
  };

  const handleUpdateCharacter = (updated: GameCharacter) => {
    updateProject((prev) => ({
      ...prev,
      characters: (prev.characters || []).map((c) => (c.id === updated.id ? updated : c)),
    }));
  };

  const handleDeleteCharacter = (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este personaje?')) return;

    updateProject((prev) => ({
      ...prev,
      characters: (prev.characters || []).filter((c) => c.id !== id),
    }));

    if (selectedCharacterId === id) {
      const remaining = characters.filter((c) => c.id !== id);
      setSelectedCharacterId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCharacter) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const cleanFileName = file.name.toLowerCase().replace(/[^a-z0-9_.]/g, '_');
      handleUpdateCharacter({
        ...selectedCharacter,
        imageFileData: base64,
        imageFileName: `img/npc_${selectedCharacter.id}_${cleanFileName}`,
        imageUrl: base64,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Header info bar */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isClean ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-white/10'
        }`}
      >
        <div>
          <h3 className={`font-bold text-base ${isClean ? 'text-slate-900' : 'text-slate-100'}`}>
            Gestión de Personajes (NPCs)
          </h3>
          <p className={`text-xs mt-0.5 ${isClean ? 'text-slate-500' : 'text-slate-400'}`}>
            Define los personajes de tu aventura con su retórica, avatar, puntos de vida u objetos que poseen.
          </p>
        </div>
        <button
          onClick={handleAddCharacter}
          className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Personaje</span>
        </button>
      </div>

      {characters.length === 0 ? (
        <div
          className={`p-10 rounded-2xl border text-center space-y-3 ${
            isClean ? 'bg-white border-slate-200' : 'bg-slate-950 border-white/10'
          }`}
        >
          <User className="w-10 h-10 mx-auto text-slate-400 opacity-50" />
          <h4 className={`font-bold text-sm ${isClean ? 'text-slate-800' : 'text-slate-200'}`}>
            No hay personajes creados en este proyecto
          </h4>
          <p className={`text-xs max-w-md mx-auto ${isClean ? 'text-slate-500' : 'text-slate-400'}`}>
            Crea tu primer personaje para poder asociarlo a párrafos o acciones y redactar árboles de diálogo con opciones intercambiables.
          </p>
          <button
            onClick={handleAddCharacter}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Primer Personaje</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left panel: List of Characters */}
          <div className="space-y-2">
            <span className={`text-xs font-semibold px-1 ${isClean ? 'text-slate-600' : 'text-slate-400'}`}>
              Lista de Personajes ({characters.length})
            </span>
            <div className="space-y-1.5">
              {characters.map((c) => {
                const isSelected = c.id === selectedCharacterId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCharacterId(c.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 dark:text-amber-300 font-semibold shadow-sm'
                        : isClean
                        ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                        : 'bg-slate-900 hover:bg-slate-850 border-white/10 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {c.imageUrl || c.imageFileData ? (
                        <img
                          src={c.imageFileData || c.imageUrl}
                          alt={c.name}
                          className="w-9 h-9 rounded-lg object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                        />
                      ) : (
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                            isClean ? 'bg-slate-100 border-slate-300' : 'bg-slate-800 border-white/10'
                          }`}
                        >
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">{c.name || 'Sin Nombre'}</div>
                        <div className={`text-[11px] truncate ${isClean ? 'text-slate-500' : 'text-slate-400'}`}>
                          {c.description || 'Sin descripción'}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel: Character Editor details */}
          {selectedCharacter && (
            <div
              className={`md:col-span-2 p-5 rounded-2xl border space-y-5 ${
                isClean ? 'bg-white border-slate-200' : 'bg-slate-900 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-500" />
                  <h4 className={`font-bold text-sm ${isClean ? 'text-slate-900' : 'text-slate-100'}`}>
                    Detalles del Personaje
                  </h4>
                </div>
                <button
                  onClick={() => handleDeleteCharacter(selectedCharacter.id)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Personaje</span>
                </button>
              </div>

              <div className="space-y-4">
                {/* ID & Name */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${isClean ? 'text-slate-600' : 'text-slate-400'}`}>
                      Identificador (ID)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={selectedCharacter.id}
                      className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono border opacity-70 ${
                        isClean ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-black/30 border-white/10 text-slate-400'
                      }`}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={`block text-[11px] font-semibold mb-1 ${isClean ? 'text-slate-600' : 'text-slate-400'}`}>
                      Nombre del Personaje
                    </label>
                    <input
                      type="text"
                      value={selectedCharacter.name}
                      onChange={(e) => handleUpdateCharacter({ ...selectedCharacter, name: e.target.value })}
                      placeholder="Ej: El Guardián del Puente, Tabernero Juan..."
                      className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                        isClean
                          ? 'bg-white border-slate-300 text-slate-900'
                          : 'bg-slate-950 border-white/15 text-slate-100'
                      }`}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isClean ? 'text-slate-600' : 'text-slate-400'}`}>
                    Descripción o Rol
                  </label>
                  <textarea
                    rows={2}
                    value={selectedCharacter.description}
                    onChange={(e) => handleUpdateCharacter({ ...selectedCharacter, description: e.target.value })}
                    placeholder="Descripción o trasfondo relevante del personaje..."
                    className={`w-full px-3 py-2 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isClean
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-white/15 text-slate-100'
                    }`}
                  />
                </div>

                {/* Health & Initial Item */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 flex items-center gap-1.5 ${isClean ? 'text-slate-600' : 'text-slate-400'}`}>
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      <span>Puntos de Vida (Salud)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={selectedCharacter.healthPoints ?? 100}
                      onChange={(e) =>
                        handleUpdateCharacter({
                          ...selectedCharacter,
                          healthPoints: Math.max(0, parseInt(e.target.value) || 0),
                        })
                      }
                      className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                        isClean
                          ? 'bg-white border-slate-300 text-slate-900'
                          : 'bg-slate-950 border-white/15 text-slate-100'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 flex items-center gap-1.5 ${isClean ? 'text-slate-600' : 'text-slate-400'}`}>
                      <Package className="w-3.5 h-3.5 text-amber-500" />
                      <span>Objeto en Posesión Inicial</span>
                    </label>
                    <select
                      value={selectedCharacter.initialItemId || ''}
                      onChange={(e) =>
                        handleUpdateCharacter({
                          ...selectedCharacter,
                          initialItemId: e.target.value || undefined,
                        })
                      }
                      className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                        isClean
                          ? 'bg-white border-slate-300 text-slate-900'
                          : 'bg-slate-950 border-white/15 text-slate-100'
                      }`}
                    >
                      <option value="">-- Sin Objeto Poseído --</option>
                      {inventoryItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Avatar / Image upload */}
                <div>
                  <label className={`block text-[11px] font-semibold mb-1.5 flex items-center gap-1.5 ${isClean ? 'text-slate-600' : 'text-slate-400'}`}>
                    <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
                    <span>Retrato o Imagen del Personaje</span>
                  </label>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 rounded-xl border border-dashed border-slate-300 dark:border-white/10">
                    {selectedCharacter.imageFileData || selectedCharacter.imageUrl ? (
                      <div className="relative group shrink-0">
                        <img
                          src={selectedCharacter.imageFileData || selectedCharacter.imageUrl}
                          alt={selectedCharacter.name}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-300 dark:border-slate-700 shadow-sm"
                        />
                        <button
                          onClick={() =>
                            handleUpdateCharacter({
                              ...selectedCharacter,
                              imageUrl: undefined,
                              imageFileData: undefined,
                              imageFileName: undefined,
                            })
                          }
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-xs opacity-80 hover:opacity-100 transition-opacity"
                          title="Eliminar imagen"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 border ${
                        isClean ? 'bg-slate-100 border-slate-300' : 'bg-slate-950 border-white/10'
                      }`}>
                        <User className="w-6 h-6 text-slate-400" />
                      </div>
                    )}

                    <div className="space-y-2 flex-1">
                      <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>Subir Imagen Local</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <div className="text-[11px]">
                        <input
                          type="text"
                          value={selectedCharacter.imageUrl || ''}
                          onChange={(e) =>
                            handleUpdateCharacter({
                              ...selectedCharacter,
                              imageUrl: e.target.value || undefined,
                            })
                          }
                          placeholder="O introduce una URL externa de imagen..."
                          className={`w-full px-2.5 py-1 rounded-md border text-[11px] ${
                            isClean ? 'bg-white border-slate-300 text-slate-800' : 'bg-black/40 border-white/10 text-slate-200'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
