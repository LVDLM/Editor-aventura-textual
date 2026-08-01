import React, { useState } from 'react';
import { GameProject, InventoryItem } from '../../types';
import { Package, Plus, Trash2, Key, BookOpen, Flashlight, Box, Sparkles, Edit2 } from 'lucide-react';

interface InventoryManagerProps {
  project: GameProject;
  updateProject: (fn: (prev: GameProject) => GameProject) => void;
}

const AVAILABLE_ICONS = [
  { name: 'Key', label: 'Llave', Icon: Key },
  { name: 'BookOpen', label: 'Libro / Diario', Icon: BookOpen },
  { name: 'Flashlight', label: 'Linterna', Icon: Flashlight },
  { name: 'Box', label: 'Caja / Objeto', Icon: Box },
];

export const InventoryManager: React.FC<InventoryManagerProps> = ({ project, updateProject }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Box');
  const [isGameOver, setIsGameOver] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const handleCreateOrUpdateItem = () => {
    if (!name.trim()) return;

    if (editingItemId) {
      updateProject((prev) => ({
        ...prev,
        inventoryItems: prev.inventoryItems.map((item) =>
          item.id === editingItemId
            ? { ...item, name: name.trim(), description: description.trim(), icon: selectedIcon, isGameOver: isGameOver || undefined }
            : item
        ),
      }));
      setEditingItemId(null);
    } else {
      const newItem: InventoryItem = {
        id: `item_${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        icon: selectedIcon,
        isGameOver: isGameOver || undefined,
      };
      updateProject((prev) => ({
        ...prev,
        inventoryItems: [...prev.inventoryItems, newItem],
      }));
    }

    setName('');
    setDescription('');
    setSelectedIcon('Box');
    setIsGameOver(false);
  };

  const handleEditClick = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setName(item.name);
    setDescription(item.description);
    setSelectedIcon(item.icon);
    setIsGameOver(!!item.isGameOver);
  };

  const handleDeleteItem = (itemId: string) => {
    updateProject((prev) => ({
      ...prev,
      inventoryItems: prev.inventoryItems.filter((i) => i.id !== itemId),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Package className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-slate-100 text-base">
            {editingItemId ? 'Editar Objeto de Inventario' : 'Crear Nuevo Objeto de Inventario'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Objeto</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:ring-1 focus:ring-amber-500"
              placeholder="Ej: Llave pequeña de bronce"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Icono del Objeto</label>
            <div className="flex items-center gap-2">
              {AVAILABLE_ICONS.map((ic) => {
                const IconComp = ic.Icon;
                const isSel = selectedIcon === ic.name;
                return (
                  <button
                    key={ic.name}
                    type="button"
                    onClick={() => setSelectedIcon(ic.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                      isSel
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                    <span>{ic.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-300">Descripción para el Jugador</label>
            <button
              type="button"
              onClick={() => {
                setDescription((prev) =>
                  prev
                    ? `${prev.trim()} [Terminar / Cargar partida]`
                    : 'Inspeccionas este objeto y sufres un destino fatal. [Terminar / Cargar partida]'
                );
                setIsGameOver(true);
              }}
              className="text-[10px] bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-lg transition-colors"
            >
              💀 Insertar "[Terminar / Cargar partida]"
            </button>
          </div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:ring-1 focus:ring-amber-500"
            placeholder="Ej: Una pequeña llave gastada con forma de trébol. [Terminar / Cargar partida]"
          />
        </div>

        {/* Game Over toggle */}
        <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="font-bold text-xs text-rose-300 block">💀 Fin de Partida al Examinar / Usar</span>
            <span className="text-[11px] text-slate-400">
              Marca este objeto si al interactuar con él el jugador pierde o termina la historia.
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isGameOver}
              onChange={(e) => setIsGameOver(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
          </label>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={handleCreateOrUpdateItem}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-colors"
          >
            {editingItemId ? <Sparkles className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{editingItemId ? 'Guardar Cambios' : 'Añadir Objeto al Juego'}</span>
          </button>

          {editingItemId && (
            <button
              onClick={() => {
                setEditingItemId(null);
                setName('');
                setDescription('');
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Item List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
        <h3 className="font-bold text-slate-100 text-base border-b border-slate-800 pb-3">
          Objetos de Inventario Disponibles ({project.inventoryItems.length})
        </h3>

        {project.inventoryItems.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No hay objetos creados todavía.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {project.inventoryItems.map((item) => {
              const iconObj = AVAILABLE_ICONS.find((i) => i.name === item.icon);
              const IconComp = iconObj ? iconObj.Icon : Box;

              return (
                <div
                  key={item.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-start justify-between gap-3 shadow-inner"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">{item.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{item.description || 'Sin descripción'}</p>
                      <span className="inline-block mt-2 text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        ID: {item.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
