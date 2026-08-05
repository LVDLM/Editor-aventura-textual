import React, { useState } from 'react';
import { GameProject, UserProfile } from '../../types';
import { GeneralSettings } from './GeneralSettings';
import { SceneEditor } from './SceneEditor';
import { InventoryManager } from './InventoryManager';
import { FlagsManager } from './FlagsManager';
import { FileText, Settings, Package, ToggleLeft, Play, AlertTriangle, FolderDown } from 'lucide-react';
import { validateProjectScenes } from '../../utils/sceneValidator';

interface GameEditorProps {
  project: GameProject;
  updateProject: (fn: (prev: GameProject) => GameProject) => void;
  onSwitchToPlay: () => void;
  onOpenExport?: () => void;
  currentUser?: UserProfile | null;
  webAspect?: 'clean' | 'classic';
}

export const GameEditor: React.FC<GameEditorProps> = ({
  project,
  updateProject,
  onSwitchToPlay,
  onOpenExport,
  currentUser,
  webAspect = 'clean',
}) => {
  const [activeTab, setActiveTab] = useState<'scenes' | 'settings' | 'inventory' | 'flags'>('scenes');
  const validationIssues = validateProjectScenes(project);
  const isClean = webAspect === 'clean';

  return (
    <div className={`min-h-[calc(100vh-60px)] py-6 px-4 transition-colors duration-300 ${
      isClean ? 'bg-[#f8fafc] text-slate-800' : 'bg-[#0a0a0c] text-white'
    }`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Bar for Editor */}
        <div className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border shadow-md ${
          isClean ? 'bg-white border-slate-200' : 'bg-[#0f0f12] border-white/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold">
              🛠️
            </div>
            <div>
              <h2 className={`font-bold text-lg ${isClean ? 'text-slate-900' : 'text-white'}`}>
                Editor de Aventuras Gráficas
              </h2>
              <p className={`text-xs ${isClean ? 'text-slate-500' : 'text-white/40'}`}>
                Diseña escenas, marca palabras interactivas y define la lógica de tu aventura.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onOpenExport && (
              <button
                onClick={onOpenExport}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow transition-all cursor-pointer"
                title="Guardar proyecto en la nube, descargar JSON o exportar HTML/ZIP"
              >
                <FolderDown className="w-4 h-4 text-amber-200" />
                <span>Guardar Proyecto</span>
              </button>
            )}

            <button
              onClick={onSwitchToPlay}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 text-emerald-200" />
              <span>Probar Juego Ahora</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`flex items-center gap-2 border-b pb-2 overflow-x-auto ${
          isClean ? 'border-slate-200' : 'border-white/10'
        }`}>
          <button
            onClick={() => setActiveTab('scenes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'scenes'
                ? 'bg-amber-600 text-white shadow'
                : isClean
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. Escenas y Texto</span>
            {validationIssues.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black rounded-full text-[10px] flex items-center gap-0.5" title={`${validationIssues.length} observaciones de vinculación y retorno`}>
                <AlertTriangle className="w-3 h-3" />
                <span>{validationIssues.length}</span>
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-amber-600 text-white shadow'
                : isClean
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>2. Inventario de Objetos</span>
          </button>

          <button
            onClick={() => setActiveTab('flags')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'flags'
                ? 'bg-amber-600 text-white shadow'
                : isClean
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <ToggleLeft className="w-4 h-4" />
            <span>3. Banderas y Variables</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-amber-600 text-white shadow'
                : isClean
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>4. Configuración y Fallbacks</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'scenes' && (
          <SceneEditor project={project} updateProject={updateProject} webAspect={webAspect} />
        )}
        {activeTab === 'inventory' && (
          <InventoryManager project={project} updateProject={updateProject} />
        )}
        {activeTab === 'flags' && (
          <FlagsManager project={project} updateProject={updateProject} />
        )}
        {activeTab === 'settings' && (
          <GeneralSettings project={project} updateProject={updateProject} currentUser={currentUser} webAspect={webAspect} />
        )}
      </div>
    </div>
  );
};
