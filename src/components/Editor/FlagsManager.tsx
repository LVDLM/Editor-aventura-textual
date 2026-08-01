import React, { useState } from 'react';
import { GameProject } from '../../types';
import { ToggleLeft, Plus, Trash2 } from 'lucide-react';

interface FlagsManagerProps {
  project: GameProject;
  updateProject: (fn: (prev: GameProject) => GameProject) => void;
}

export const FlagsManager: React.FC<FlagsManagerProps> = ({ project, updateProject }) => {
  const [flagName, setFlagName] = useState('');
  const [initialValue, setInitialValue] = useState(false);

  const handleAddFlag = () => {
    const cleanKey = flagName.trim().toLowerCase().replace(/\s+/g, '_');
    if (!cleanKey) return;

    updateProject((prev) => ({
      ...prev,
      globalFlags: {
        ...prev.globalFlags,
        [cleanKey]: initialValue,
      },
    }));

    setFlagName('');
    setInitialValue(false);
  };

  const handleDeleteFlag = (key: string) => {
    updateProject((prev) => {
      const nextFlags = { ...prev.globalFlags };
      delete nextFlags[key];
      return {
        ...prev,
        globalFlags: nextFlags,
      };
    });
  };

  const handleToggleInitialValue = (key: string) => {
    updateProject((prev) => ({
      ...prev,
      globalFlags: {
        ...prev.globalFlags,
        [key]: !prev.globalFlags[key],
      },
    }));
  };

  const flagEntries = Object.entries(project.globalFlags || {});

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <ToggleLeft className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-slate-100 text-base">Variables y Banderas Globales del Estado del Juego</h3>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Las banderas (flags) permiten recordar eventos o cambios en el mundo. Por ejemplo: <code className="text-amber-300">habitacion_iluminada</code>, <code className="text-amber-300">cajon_abierto</code> o <code className="text-amber-300">llave_encontrada</code>.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={flagName}
            onChange={(e) => setFlagName(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:ring-1 focus:ring-amber-500 min-w-[200px]"
            placeholder="Nombre de la bandera (ej: luz_encendida)"
          />

          <label className="flex items-center gap-2 cursor-pointer bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-300">
            <input
              type="checkbox"
              checked={initialValue}
              onChange={(e) => setInitialValue(e.target.checked)}
              className="accent-amber-500"
            />
            <span>Valor Inicial: {initialValue ? 'VERDADERO (True)' : 'FALSO (False)'}</span>
          </label>

          <button
            onClick={handleAddFlag}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Bandera</span>
          </button>
        </div>
      </div>

      {/* Flags List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
        <h3 className="font-bold text-slate-100 text-base border-b border-slate-800 pb-3">
          Banderas Registradas ({flagEntries.length})
        </h3>

        {flagEntries.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No hay banderas registradas en este proyecto.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {flagEntries.map(([key, value]) => (
              <div
                key={key}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2 shadow-inner"
              >
                <div>
                  <span className="font-mono font-bold text-xs text-amber-300 block">{key}</span>
                  <span className="text-[10px] text-slate-400">
                    Inicial: {value ? 'TRUE' : 'FALSE'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleInitialValue(key)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                      value ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {value ? 'True' : 'False'}
                  </button>

                  <button
                    onClick={() => handleDeleteFlag(key)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    title="Eliminar bandera"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
