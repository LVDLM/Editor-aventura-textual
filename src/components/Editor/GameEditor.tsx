import React, { useState } from 'react';
import { GameProject, UserProfile } from '../../types';
import { GeneralSettings } from './GeneralSettings';
import { SceneEditor } from './SceneEditor';
import { InventoryManager } from './InventoryManager';
import { FlagsManager } from './FlagsManager';
import { CharacterManager } from './CharacterManager';
import { SoundManager } from './SoundManager';
import { FileText, Settings, Package, ToggleLeft, AlertTriangle, MoveHorizontal, User, Volume2 } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'scenes' | 'inventory' | 'characters' | 'flags' | 'sounds' | 'settings'>('scenes');
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
      isClean ? 'bg-[#F4EFE3] text-[#2A2118]' : 'bg-[#1F1913] text-[#F4EFE3]'
    }`}>
      <div className={`${containerWidthClass} mx-auto space-y-6 transition-all duration-300`}>
        
        {/* Tab Navigation & Workspace Width Selector */}
        <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-2.5 ${
          isClean ? 'border-[#E5DCB8]' : 'border-[#42362B]'
        }`}>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('scenes')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'scenes'
                  ? 'bg-[#A4332A] text-white shadow-sm'
                  : isClean
                  ? 'text-[#6B5C46] hover:text-[#2A2118] hover:bg-[#E5DCB8]/50'
                  : 'text-[#D1C7B7] hover:text-white hover:bg-[#2C241C]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>1. Escenas y Texto</span>
              {validationIssues.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-[#C9A24B] text-[#2A2118] font-black rounded-full text-[10px] flex items-center gap-0.5" title={`${validationIssues.length} observaciones de vinculación y retorno`}>
                  <AlertTriangle className="w-3 h-3" />
                  <span>{validationIssues.length}</span>
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-[#A4332A] text-white shadow-sm'
                  : isClean
                  ? 'text-[#6B5C46] hover:text-[#2A2118] hover:bg-[#E5DCB8]/50'
                  : 'text-[#D1C7B7] hover:text-white hover:bg-[#2C241C]'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>2. Inventario de Objetos</span>
            </button>

            <button
              onClick={() => setActiveTab('characters')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'characters'
                  ? 'bg-[#A4332A] text-white shadow-sm'
                  : isClean
                  ? 'text-[#6B5C46] hover:text-[#2A2118] hover:bg-[#E5DCB8]/50'
                  : 'text-[#D1C7B7] hover:text-white hover:bg-[#2C241C]'
              }`}
            >
              <User className="w-4 h-4" />
              <span>3. Personajes (NPCs)</span>
            </button>

            <button
              onClick={() => setActiveTab('flags')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'flags'
                  ? 'bg-[#A4332A] text-white shadow-sm'
                  : isClean
                  ? 'text-[#6B5C46] hover:text-[#2A2118] hover:bg-[#E5DCB8]/50'
                  : 'text-[#D1C7B7] hover:text-white hover:bg-[#2C241C]'
              }`}
            >
              <ToggleLeft className="w-4 h-4" />
              <span>4. Banderas y Variables</span>
            </button>

            <button
              onClick={() => setActiveTab('sounds')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'sounds'
                  ? 'bg-[#A4332A] text-white shadow-sm'
                  : isClean
                  ? 'text-[#6B5C46] hover:text-[#2A2118] hover:bg-[#E5DCB8]/50'
                  : 'text-[#D1C7B7] hover:text-white hover:bg-[#2C241C]'
              }`}
            >
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>5. Sonidos y Audio</span>
              {project.customSounds && project.customSounds.length > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-mono">
                  {project.customSounds.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#A4332A] text-white shadow-sm'
                  : isClean
                  ? 'text-[#6B5C46] hover:text-[#2A2118] hover:bg-[#E5DCB8]/50'
                  : 'text-[#D1C7B7] hover:text-white hover:bg-[#2C241C]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>6. Configuración y Fallbacks</span>
            </button>
          </div>

          {/* Workspace Width Selector */}
          <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs font-semibold shrink-0 shadow-xs ${
            isClean ? 'bg-[#FFFDF6] border-[#E5DCB8] text-[#2A2118]' : 'bg-[#2C241C] border-[#42362B] text-[#D1C7B7]'
          }`}>
            <span className={`px-2 text-[11px] font-bold uppercase flex items-center gap-1 ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`} title="Ajusta el ancho de la zona de trabajo para pantallas grandes">
              <MoveHorizontal className="w-3.5 h-3.5 text-[#C9A24B]" />
              <span className="hidden xl:inline">Ancho:</span>
            </span>
            <button
              type="button"
              onClick={() => handleWidthChange('standard')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs font-bold ${
                editorWidth === 'standard'
                  ? 'bg-[#A4332A] text-white shadow-sm'
                  : isClean
                  ? 'text-[#6B5C46] hover:text-[#2A2118]'
                  : 'text-[#D1C7B7] hover:text-white'
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
                  ? 'bg-[#A4332A] text-white shadow-sm'
                  : isClean
                  ? 'text-[#6B5C46] hover:text-[#2A2118]'
                  : 'text-[#D1C7B7] hover:text-white'
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
                  ? 'bg-[#A4332A] text-white shadow-sm'
                  : isClean
                  ? 'text-[#6B5C46] hover:text-[#2A2118]'
                  : 'text-[#D1C7B7] hover:text-white'
              }`}
              title="Pantalla Completa (100%) - Maximiza el espacio horizontal"
            >
              Completo
            </button>
          </div>
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
        {activeTab === 'sounds' && (
          <SoundManager project={project} updateProject={updateProject} currentUser={currentUser} webAspect={webAspect} />
        )}
        {activeTab === 'settings' && (
          <GeneralSettings project={project} updateProject={updateProject} currentUser={currentUser} webAspect={webAspect} />
        )}
      </div>
    </div>
  );
};
