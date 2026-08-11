import React, { useState } from 'react';
import { GameProject, UserProfile } from '../../types';
import { GeneralSettings } from './GeneralSettings';
import { SceneEditor } from './SceneEditor';
import { InventoryManager } from './InventoryManager';
import { FlagsManager } from './FlagsManager';
import { CharacterManager } from './CharacterManager';
import { FileText, Settings, Package, ToggleLeft, Play, AlertTriangle, FolderDown, Maximize2, Monitor, MoveHorizontal, CheckCircle, Save, User } from 'lucide-react';
import { validateProjectScenes } from '../../utils/sceneValidator';

interface GameEditorProps {
  project: GameProject;
  updateProject: (fn: (prev: GameProject) => GameProject) => void;
  onSwitchToPlay: () => void;
  onOpenExport?: () => void;
  currentUser?: UserProfile | null;
  webAspect?: 'clean' | 'classic';
  lastAutoSaveTime?: string;
}

export const GameEditor: React.FC<GameEditorProps> = ({
  project,
  updateProject,
  onSwitchToPlay,
  onOpenExport,
  currentUser,
  webAspect = 'clean',
  lastAutoSaveTime,
}) => {
  const [activeTab, setActiveTab] = useState<'scenes' | 'inventory' | 'characters' | 'flags' | 'settings'>('scenes');
  const [editorWidth, setEditorWidth] = useState<'standard' | 'wide' | 'full'>(() => {
    return (localStorage.getItem('editor_width_preference') as any) || 'wide';
  });

  const handleWidthChange = (width: 'standard' | 'wide' | 'full') => {
    setEditorWidth(width);
    localStorage.setItem('editor_width_preference', width);
  };

  const validationIssues = validateProjectScenes(project);
  const isClean = webAspect === 'clean';

  const containerWidthClass =
    editorWidth === 'standard'
      ? 'max-w-7xl'
      : editorWidth === 'wide'
      ? 'max-w-[1600px]'
      : 'max-w-none px-1 sm:px-4';

  return (
    <div className={`min-h-[calc(100vh-60px)] py-6 px-3 sm:px-6 transition-colors duration-300 ${
      isClean ? 'bg-[#f8fafc] text-slate-800' : 'bg-[#0a0a0c] text-white'
    }`}>
      <div className={`${containerWidthClass} mx-auto space-y-6 transition-all duration-300`}>
        
        {/* Top Bar for Editor */}
        <div className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border shadow-md ${
          isClean ? 'bg-white border-slate-200' : 'bg-[#0f0f12] border-white/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold">
              🛠️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`font-bold text-lg ${isClean ? 'text-slate-900' : 'text-white'}`}>
                  Editor de Aventuras Gráficas
                </h2>
                <div
                  className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5"
                  title="Autoguardado borrador local activo. Tus cambios en párrafos, acciones de palabras e imágenes se guardan automáticamente."
                >
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  <span>Autoguardado local activo {lastAutoSaveTime ? `(${lastAutoSaveTime})` : ''}</span>
                </div>
              </div>
              <p className={`text-xs ${isClean ? 'text-slate-500' : 'text-white/40'}`}>
                Diseña escenas, marca palabras interactivas y define la lógica de tu aventura.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Workspace Width Selector Selector */}
            <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs font-semibold ${
              isClean ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-black/40 border-white/10 text-slate-300'
            }`}>
              <span className="px-2 text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1" title="Ajusta el ancho de la zona de trabajo para pantallas grandes">
                <MoveHorizontal className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline">Ancho Zona:</span>
              </span>
              <button
                type="button"
                onClick={() => handleWidthChange('standard')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs font-bold ${
                  editorWidth === 'standard'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : isClean
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Ancho Estándar (1280px) - Para pantallas normales"
              >
                Estándar
              </button>
              <button
                type="button"
                onClick={() => handleWidthChange('wide')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs font-bold ${
                  editorWidth === 'wide'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : isClean
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Ancho Ampliado (1600px) - Recomendado para monitores grandes"
              >
                Amplio
              </button>
              <button
                type="button"
                onClick={() => handleWidthChange('full')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs font-bold ${
                  editorWidth === 'full'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : isClean
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Pantalla Completa (100%) - Maximiza el espacio horizontal"
              >
                Completo
              </button>
            </div>

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
            onClick={() => setActiveTab('characters')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'characters'
                ? 'bg-amber-600 text-white shadow'
                : isClean
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-4 h-4" />
            <span>3. Personajes (NPCs)</span>
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
            <span>4. Banderas y Variables</span>
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
            <span>5. Configuración y Fallbacks</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'scenes' && (
          <SceneEditor project={project} updateProject={updateProject} webAspect={webAspect} />
        )}
        {activeTab === 'inventory' && (
          <InventoryManager project={project} updateProject={updateProject} />
        )}
        {activeTab === 'characters' && (
          <CharacterManager project={project} updateProject={updateProject} webAspect={webAspect} />
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
