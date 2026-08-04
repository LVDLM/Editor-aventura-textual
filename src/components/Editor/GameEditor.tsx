import React, { useState } from 'react';
import { GameProject, UserProfile } from '../../types';
import { GeneralSettings } from './GeneralSettings';
import { SceneEditor } from './SceneEditor';
import { InventoryManager } from './InventoryManager';
import { FlagsManager } from './FlagsManager';
import { FileText, Settings, Package, ToggleLeft, Play, AlertTriangle } from 'lucide-react';
import { validateProjectScenes } from '../../utils/sceneValidator';

interface GameEditorProps {
  project: GameProject;
  updateProject: (fn: (prev: GameProject) => GameProject) => void;
  onSwitchToPlay: () => void;
  currentUser?: UserProfile | null;
}

export const GameEditor: React.FC<GameEditorProps> = ({
  project,
  updateProject,
  onSwitchToPlay,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'scenes' | 'settings' | 'inventory' | 'flags'>('scenes');
  const validationIssues = validateProjectScenes(project);

  return (
    <div className="min-h-[calc(100vh-60px)] bg-[#0a0a0c] text-white py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Bar for Editor */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0f0f12] border border-white/10 p-4 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              🛠️
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">Editor de Aventuras Gráficas</h2>
              <p className="text-xs text-white/40">
                Diseña escenas, marca palabras interactivas y define la lógica de tu aventura.
              </p>
            </div>
          </div>

          <button
            onClick={onSwitchToPlay}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl text-xs flex items-center gap-2 shadow transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>Probar Juego Ahora</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('scenes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'scenes'
                ? 'bg-amber-600 text-white shadow'
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
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'inventory'
                ? 'bg-amber-600 text-white shadow'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>2. Inventario de Objetos</span>
          </button>

          <button
            onClick={() => setActiveTab('flags')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'flags'
                ? 'bg-amber-600 text-white shadow'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <ToggleLeft className="w-4 h-4" />
            <span>3. Banderas y Variables</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-amber-600 text-white shadow'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>4. Configuración y Fallbacks</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'scenes' && (
          <SceneEditor project={project} updateProject={updateProject} />
        )}
        {activeTab === 'inventory' && (
          <InventoryManager project={project} updateProject={updateProject} />
        )}
        {activeTab === 'flags' && (
          <FlagsManager project={project} updateProject={updateProject} />
        )}
        {activeTab === 'settings' && (
          <GeneralSettings project={project} updateProject={updateProject} currentUser={currentUser} />
        )}
      </div>
    </div>
  );
};
