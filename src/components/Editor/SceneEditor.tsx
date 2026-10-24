import React, { useState, useRef } from 'react';
import { GameProject, Scene, Hotspot, SceneTextBlock, VerbType, QTEStep, SoundEffectType, SOUND_EFFECT_OPTIONS, DialogueBlock } from '../../types';
import { ALL_VERBS } from '../../utils/verbs';
import { playSound } from '../../utils/audio';
import { isWordMatchInText, isWordChar } from '../../utils/textUtils';
import { HotspotEditorModal } from './HotspotEditorModal';
import { DialogueEditor } from './DialogueEditor';
import { validateProjectScenes } from '../../utils/sceneValidator';
import { ValidationPanel } from './ValidationPanel';
import { GamePlayer } from '../GamePlayer';
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
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
  ChevronUp,
  ChevronDown,
  Clock,
  Skull,
  AlertTriangle,
  AlertCircle,
  Link2,
  CornerDownLeft,
  Bold,
  Italic,
  Underline,
  Type,
  Heading1,
  Heading2,
  Image as ImageIcon,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Settings,
  Volume2,
  Play,
  RotateCcw,
  MessageSquare,
  GripVertical,
} from 'lucide-react';

interface SceneEditorProps {
  project: GameProject;
  updateProject: (fn: (prev: GameProject) => GameProject) => void;
  webAspect?: 'clean' | 'classic';
}

export const SceneEditor: React.FC<SceneEditorProps> = ({ project, updateProject, webAspect = 'clean' }) => {
  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    project.scenes[0]?.id || ''
  );

  const activeScene = project.scenes.find((s) => s.id === selectedSceneId) || project.scenes[0];

  // Live Scene Preview state inside editor
  const [isPreviewingActiveScene, setIsPreviewingActiveScene] = useState(false);
  const [testSceneGameState, setTestSceneGameState] = useState<any>(null);

  const startTestingSceneWithId = (sceneId: string) => {
    setSelectedSceneId(sceneId);
    setTestSceneGameState({
      currentSceneId: sceneId,
      inventory: project.inventoryItems.filter((i) => i.isStartingItem).map((i) => i.id),
      flags: { ...project.globalFlags },
      appendedTextsPerScene: {},
      history: [],
      usedHotspotIds: [],
      difficulty: 'facil',
    });
    setIsPreviewingActiveScene(true);
  };

  const startTestingActiveScene = () => {
    if (activeScene) {
      startTestingSceneWithId(activeScene.id);
    }
  };

  const [activeHotspotForEdit, setActiveHotspotForEdit] = useState<Hotspot | null>(null);
  const [showSceneAlerts, setShowSceneAlerts] = useState(false);

  // Sidebar collapse preference
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('editor_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('editor_sidebar_collapsed', String(next));
      return next;
    });
  };

  // New scene form
  const [newSceneName, setNewSceneName] = useState('');
  const [newSceneType, setNewSceneType] = useState<'normal' | 'portada' | 'introduccion' | 'qte' | 'final'>('normal');
  
  // Selection keyword helper
  const [selectedText, setSelectedText] = useState('');
  const [manualKeyword, setManualKeyword] = useState('');
  const [inlineFlagName, setInlineFlagName] = useState('');
  const [editingAppendedKey, setEditingAppendedKey] = useState<string | null>(null);
  const [editingAppendedText, setEditingAppendedText] = useState<string>('');

  const handleAddGlobalFlag = (flagKey: string) => {
    const cleanKey = flagKey.trim().toLowerCase().replace(/\s+/g, '_');
    if (!cleanKey) return;
    updateProject((prev) => ({
      ...prev,
      globalFlags: {
        ...(prev.globalFlags || {}),
        [cleanKey]: false,
      },
    }));
  };

  // Image section visibility & textarea refs for text formatting toolbar
  const [openImageSectionBlockIds, setOpenImageSectionBlockIds] = useState<Record<string, boolean>>({});
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const applyTextFormat = (
    blockId: string,
    currentText: string,
    formatType: 'bold' | 'italic' | 'underline' | 'h1' | 'h2' | 'normal'
  ) => {
    const el = textareaRefs.current[blockId];
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selectedTextSegment = currentText.substring(start, end);

    let replacement = '';
    let cursorOffset = 0;

    switch (formatType) {
      case 'bold':
        replacement = `<b>${selectedTextSegment || 'texto en negrita'}</b>`;
        cursorOffset = selectedTextSegment ? replacement.length : 3;
        break;
      case 'italic':
        replacement = `<i>${selectedTextSegment || 'texto en cursiva'}</i>`;
        cursorOffset = selectedTextSegment ? replacement.length : 3;
        break;
      case 'underline':
        replacement = `<u>${selectedTextSegment || 'texto subrayado'}</u>`;
        cursorOffset = selectedTextSegment ? replacement.length : 3;
        break;
      case 'h1':
        replacement = `<h1>${selectedTextSegment || 'Encabezado 1'}</h1>`;
        cursorOffset = selectedTextSegment ? replacement.length : 4;
        break;
      case 'h2':
        replacement = `<h2>${selectedTextSegment || 'Encabezado 2'}</h2>`;
        cursorOffset = selectedTextSegment ? replacement.length : 4;
        break;
      case 'normal':
        replacement = selectedTextSegment
          .replace(/<\/?(h1|h2|b|i|u)>/gi, '')
          .replace(/^(#\s*|##\s*)/, '');
        cursorOffset = replacement.length;
        break;
    }

    const newText = currentText.substring(0, start) + replacement + currentText.substring(end);
    handleUpdateBlockText(blockId, newText);

    setTimeout(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(start + cursorOffset, start + cursorOffset);
      }
    }, 50);
  };

  const flagKeys = Object.keys(project.globalFlags || {});

  const handleCreateScene = () => {
    const timestamp = Date.now();
    const sceneId = `scene_${timestamp}`;
    const name = newSceneName.trim() || (newSceneType === 'portada' ? 'Portada' : newSceneType === 'introduccion' ? 'Introducción' : newSceneType === 'final' ? 'Final Feliz' : 'Nueva Escena');

    let defaultText = 'Escribe aquí la narración de tu escena.';
    let hotspots: Hotspot[] = [];

    if (newSceneType === 'portada') {
      defaultText = `${project.title.toUpperCase() || 'MI NUEVA AVENTURA'}\n\nUna historia interactiva en texto.\n\nHaz clic en [Comenzar] para iniciar la aventura.`;
      const targetSceneId = project.scenes.find((s) => s.type === 'introduccion')?.id || project.scenes[0]?.id || sceneId;
      hotspots = [
        {
          id: `hotspot_comenzar_${timestamp}`,
          word: 'Comenzar',
          label: 'Comenzar la aventura',
          initialVisible: true,
          actions: [
            {
              id: `act_comenzar_${timestamp}`,
              verb: 'ir_a',
              responseMessage: 'Iniciando la historia...',
              stateChange: {
                goToSceneId: targetSceneId,
              },
            },
          ],
        },
      ];
    } else if (newSceneType === 'introduccion') {
      defaultText = `INTRODUCCIÓN\n\nPrólogo y detalles de la historia. Describe el mundo o el punto de partida...\n\nHaz clic en [Entrar] para comenzar.`;
      const targetSceneId = project.scenes.find((s) => s.type === 'normal')?.id || project.scenes[0]?.id || sceneId;
      hotspots = [
        {
          id: `hotspot_entrar_${timestamp}`,
          word: 'Entrar',
          label: 'Entrar en el juego',
          initialVisible: true,
          actions: [
            {
              id: `act_entrar_${timestamp}`,
              verb: 'ir_a',
              responseMessage: 'Entrando en la aventura...',
              stateChange: {
                goToSceneId: targetSceneId,
              },
            },
          ],
        },
      ];
    } else if (newSceneType === 'qte') {
      defaultText = `⚡ ¡EVENTO DE TIEMPO RÁPIDO!\n\nUna trampa o amenaza inminente se aproxima. ¡Debes actuar antes de que el contador llegue a cero!\n\nHaz clic en [Esquivar] rápidamente.`;
      const hsId = `hotspot_esquivar_${timestamp}`;
      hotspots = [
        {
          id: hsId,
          word: 'Esquivar',
          label: '¡Esquivar el golpe!',
          initialVisible: true,
          actions: [
            {
              id: `act_esquivar_${timestamp}`,
              verb: 'mirar',
              responseMessage: '¡Lograste reaccionar a tiempo!',
            },
          ],
        },
      ];
    } else if (newSceneType === 'final') {
      defaultText = `¡FIN DE LA AVENTURA!\n\nHas alcanzado una conclusión favorable en la historia. ¡Enhorabuena por completar la aventura!`;
    }

    const newScene: Scene = {
      id: sceneId,
      name: name || (newSceneType === 'qte' ? 'Escena QTE' : newSceneType === 'final' ? 'Párrafo Final' : 'Nueva Escena'),
      type: newSceneType,
      description: newSceneType === 'portada' ? 'Carátula inicial' : newSceneType === 'introduccion' ? 'Prólogo narrativo' : newSceneType === 'qte' ? 'Evento de tiempo rápido' : newSceneType === 'final' ? 'Final feliz de la historia' : 'Escena de aventura',
      textBlocks: [
        {
          id: `block_${timestamp}`,
          text: defaultText,
          type: newSceneType === 'final' ? 'final' : undefined,
          coverMode: newSceneType === 'portada' ? 'with_text' : undefined,
        },
      ],
      hotspots,
      qteConfig: newSceneType === 'qte' ? {
        timeLimitSeconds: 10,
        sequence: [
          {
            id: `qte_step_${timestamp}`,
            hotspotId: `hotspot_esquivar_${timestamp}`,
            word: 'Esquivar',
            label: '¡Haz clic en Esquivar a tiempo!',
          },
        ],
        onSuccessMessage: '¡Reaccionaste a tiempo con éxito!',
        onFailMessage: '¡No fuiste lo suficientemente rápido!',
        isFailGameOver: true,
      } : undefined,
    };

    updateProject((prev) => {
      const selectedIndex = prev.scenes.findIndex((s) => s.id === selectedSceneId);
      let newScenes: Scene[];
      if (selectedIndex !== -1) {
        newScenes = [
          ...prev.scenes.slice(0, selectedIndex + 1),
          newScene,
          ...prev.scenes.slice(selectedIndex + 1),
        ];
      } else {
        newScenes = [...prev.scenes, newScene];
      }
      return {
        ...prev,
        scenes: newScenes,
      };
    });

    setNewSceneName('');
    setNewSceneType('normal');
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

  const handleMoveScene = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= project.scenes.length) return;
    const newScenes = [...project.scenes];
    const [moved] = newScenes.splice(index, 1);
    newScenes.splice(targetIndex, 0, moved);

    updateProject((prev) => ({
      ...prev,
      scenes: newScenes,
    }));
  };

  // Drag and drop state for scenes list
  const [draggedSceneIndex, setDraggedSceneIndex] = useState<number | null>(null);
  const [dragOverSceneIndex, setDragOverSceneIndex] = useState<number | null>(null);

  const handleDragStartScene = (e: React.DragEvent, index: number) => {
    setDraggedSceneIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOverScene = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSceneIndex !== index) {
      setDragOverSceneIndex(index);
    }
  };

  const handleDropScene = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = draggedSceneIndex;
    setDraggedSceneIndex(null);
    setDragOverSceneIndex(null);

    if (sourceIndex === null || sourceIndex === targetIndex) return;

    updateProject((prev) => {
      const newScenes = [...prev.scenes];
      const [moved] = newScenes.splice(sourceIndex, 1);
      newScenes.splice(targetIndex, 0, moved);
      return {
        ...prev,
        scenes: newScenes,
      };
    });
  };

  const handleUpdateBlockText = (blockId: string, text: string) => {
    const hasTag = /\[(?:Terminar \/ Cargar partida|Terminar|Cargar partida|Fin de partida)\]/i.test(text);
    updateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => {
        if (s.id !== activeScene.id) return s;
        return {
          ...s,
          textBlocks: s.textBlocks.map((b) => {
            if (b.id !== blockId) return b;
            return {
              ...b,
              text,
              isGameOver: hasTag ? true : b.isGameOver && hasTag,
            };
          }),
        };
      }),
    }));
  };

  const handleAddTextBlock = () => {
    const newBlock: SceneTextBlock = {
      id: `block_${Date.now()}`,
      text: '',
      type: 'normal',
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

  const handleUpdateBlockType = (blockId: string, type: 'portada' | 'introduccion' | 'normal' | 'final') => {
    updateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => {
        if (s.id !== activeScene.id) return s;
        return {
          ...s,
          textBlocks: s.textBlocks.map((b) => (b.id === blockId ? { ...b, type } : b)),
        };
      }),
    }));
  };

  const handleUpdateBlockCoverMode = (blockId: string, coverMode: 'full' | 'with_text') => {
    updateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => {
        if (s.id !== activeScene.id) return s;
        return {
          ...s,
          textBlocks: s.textBlocks.map((b) => (b.id === blockId ? { ...b, coverMode } : b)),
        };
      }),
    }));
  };

  const handleBlockImageUpload = (blockId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const sanitizedFileName = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '_');
      updateProject((prev) => ({
        ...prev,
        scenes: prev.scenes.map((s) => {
          if (s.id !== activeScene.id) return s;
          return {
            ...s,
            textBlocks: s.textBlocks.map((b) =>
              b.id === blockId
                ? { ...b, imageFileData: dataUrl, imageFileName: sanitizedFileName, imageUrl: undefined }
                : b
            ),
          };
        }),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateBlockImageUrl = (blockId: string, url: string) => {
    updateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => {
        if (s.id !== activeScene.id) return s;
        return {
          ...s,
          textBlocks: s.textBlocks.map((b) =>
            b.id === blockId ? { ...b, imageUrl: url, imageFileData: undefined } : b
          ),
        };
      }),
    }));
  };

  const handleClearBlockImage = (blockId: string) => {
    updateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => {
        if (s.id !== activeScene.id) return s;
        return {
          ...s,
          textBlocks: s.textBlocks.map((b) =>
            b.id === blockId
              ? { ...b, imageUrl: undefined, imageFileData: undefined, imageFileName: undefined }
              : b
          ),
        };
      }),
    }));
  };

  const handleToggleBlockGameOver = (blockId: string, isGameOver: boolean) => {
    updateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => {
        if (s.id !== activeScene.id) return s;
        return {
          ...s,
          textBlocks: s.textBlocks.map((b) => (b.id === blockId ? { ...b, isGameOver } : b)),
        };
      }),
    }));
  };

  const handleToggleGameOverOnBlock = (blockId: string, currentText: string, currentIsGameOver?: boolean) => {
    const gameOverRegex = /\[(?:Terminar \/ Cargar partida|Terminar|Cargar partida|Fin de partida)\]/gi;
    const hasTag = gameOverRegex.test(currentText);
    const isCurrentlyGameOver = !!currentIsGameOver || hasTag;

    if (isCurrentlyGameOver) {
      const cleanedText = currentText.replace(gameOverRegex, '').trim();
      updateProject((prev) => ({
        ...prev,
        scenes: prev.scenes.map((s) => {
          if (s.id !== activeScene.id) return s;
          return {
            ...s,
            textBlocks: s.textBlocks.map((b) =>
              b.id === blockId ? { ...b, text: cleanedText, isGameOver: false } : b
            ),
          };
        }),
      }));
    } else {
      const newText = currentText ? `${currentText.trim()}\n\n[Terminar / Cargar partida]` : '[Terminar / Cargar partida]';
      updateProject((prev) => ({
        ...prev,
        scenes: prev.scenes.map((s) => {
          if (s.id !== activeScene.id) return s;
          return {
            ...s,
            textBlocks: s.textBlocks.map((b) =>
              b.id === blockId ? { ...b, text: newText, isGameOver: true } : b
            ),
          };
        }),
      }));
    }
  };

  const [editingDialogueContext, setEditingDialogueContext] = useState<{
    type: 'block' | 'hotspot';
    blockId: string;
    hotspotId?: string;
    actionId?: string;
    dialogue?: DialogueBlock;
  } | null>(null);

  const handleUpdateBlockDialogue = (blockId: string, dialogue: DialogueBlock | undefined) => {
    updateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => {
        if (s.id !== activeScene.id) return s;
        return {
          ...s,
          textBlocks: s.textBlocks.map((b) => {
            if (b.id !== blockId) return b;
            return {
              ...b,
              characterId: dialogue?.characterId,
              dialogue,
            };
          }),
        };
      }),
    }));
  };

  const handleUpdateHotspotDialogue = (
    hotspotId: string,
    actionId?: string,
    dialogue?: DialogueBlock
  ) => {
    updateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => {
        if (s.id !== activeScene.id) return s;
        return {
          ...s,
          hotspots: s.hotspots.map((hs) => {
            if (hs.id !== hotspotId) return hs;
            const updatedActions = hs.actions.map((act) => {
              if (actionId ? act.id === actionId : act.verb === 'hablar') {
                return {
                  ...act,
                  characterId: dialogue?.characterId || act.characterId,
                  dialogue,
                };
              }
              return act;
            });
            return { ...hs, actions: updatedActions };
          }),
        };
      }),
    }));
  };

  const handleToggleBlockFlagCondition = (
    blockId: string,
    conditionType: 'visibleIf' | 'hiddenIf',
    flagKey: string
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
              const current = { ...(updated.visibleIfFlags || {}) };
              if (current[flagKey]) {
                delete current[flagKey];
              } else {
                current[flagKey] = true;
              }
              updated.visibleIfFlags = Object.keys(current).length > 0 ? current : undefined;
            } else if (conditionType === 'hiddenIf') {
              const current = { ...(updated.hiddenIfFlags || {}) };
              if (current[flagKey]) {
                delete current[flagKey];
              } else {
                current[flagKey] = true;
              }
              updated.hiddenIfFlags = Object.keys(current).length > 0 ? current : undefined;
            }
            return updated;
          }),
        };
      }),
    }));
  };

  const handlePurgeOrphanBlockFlags = (blockId: string) => {
    const validKeys = Object.keys(project.globalFlags || {});
    updateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => {
        if (s.id !== activeScene.id) return s;
        return {
          ...s,
          textBlocks: s.textBlocks.map((b) => {
            if (b.id !== blockId) return b;
            const updatedVis: Record<string, boolean> = {};
            if (b.visibleIfFlags) {
              Object.entries(b.visibleIfFlags).forEach(([k, v]) => {
                if (validKeys.includes(k)) updatedVis[k] = Boolean(v);
              });
            }
            const updatedHid: Record<string, boolean> = {};
            if (b.hiddenIfFlags) {
              Object.entries(b.hiddenIfFlags).forEach(([k, v]) => {
                if (validKeys.includes(k)) updatedHid[k] = Boolean(v);
              });
            }
            return {
              ...b,
              visibleIfFlags: Object.keys(updatedVis).length > 0 ? updatedVis : undefined,
              hiddenIfFlags: Object.keys(updatedHid).length > 0 ? updatedHid : undefined,
            };
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
    const rawClean = wordToAdd.trim().replace(/^[¿¡"«'“(\s]+|[.,;:?!)»’”\s]+$/g, '');
    const cleanWord = rawClean || wordToAdd.trim();
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

  const handleUpdateAppendedText = (
    hotspotId: string,
    actionId: string,
    isFailAction: boolean,
    newText: string
  ) => {
    if (!activeScene) return;
    updateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => {
        if (s.id !== activeScene.id) return s;
        return {
          ...s,
          hotspots: s.hotspots.map((hs) => {
            if (hs.id !== hotspotId) return hs;
            return {
              ...hs,
              actions: hs.actions.map((act) => {
                if (act.id !== actionId) return act;
                if (isFailAction) {
                  return {
                    ...act,
                    failStateChange: {
                      ...(act.failStateChange || {}),
                      appendStoryText: newText,
                    },
                  };
                }
                return {
                  ...act,
                  stateChange: {
                    ...(act.stateChange || {}),
                    appendStoryText: newText,
                  },
                };
              }),
            };
          }),
        };
      }),
    }));
  };

  interface AppendedResponseItem {
    hotspot: Hotspot;
    action: any;
    cause: string;
    text: string;
    isGameOver?: boolean;
    isFailAction: boolean;
  }

  const getBlockHotspotsAndAppended = (
    scene: Scene | undefined,
    blockText: string
  ): {
    blockHotspots: Hotspot[];
    appendedResponses: AppendedResponseItem[];
    allBlockTexts: string[];
    hotspotOriginMap: Record<string, { isFromAppended: boolean; cause?: string; triggerWord?: string }>;
  } => {
    if (!scene) {
      return {
        blockHotspots: [],
        appendedResponses: [],
        allBlockTexts: [blockText || ''],
        hotspotOriginMap: {},
      };
    }

    const visitedHotspotIds = new Set<string>();
    const blockHotspots: Hotspot[] = [];
    const appendedResponses: AppendedResponseItem[] = [];
    const hotspotOriginMap: Record<string, { isFromAppended: boolean; cause?: string; triggerWord?: string }> = {};

    // 1. Initial direct hotspots matching block.text
    (scene.hotspots || []).forEach((hs) => {
      if (isWordMatchInText(hs.word, blockText)) {
        if (!visitedHotspotIds.has(hs.id)) {
          visitedHotspotIds.add(hs.id);
          blockHotspots.push(hs);
          hotspotOriginMap[hs.id] = { isFromAppended: false };
        }
      }
    });

    // 2. Iteratively gather appended texts and chained hotspots in appended texts
    let foundNew = true;
    let iterations = 0;
    while (foundNew && iterations < 8) {
      iterations++;
      foundNew = false;

      // Check actions on all current blockHotspots
      blockHotspots.forEach((hs) => {
        (hs.actions || []).forEach((act) => {
          // Normal stateChange.appendStoryText
          const txt = act.stateChange?.appendStoryText?.trim();
          if (txt) {
            const already = appendedResponses.some(
              (r) => r.hotspot.id === hs.id && r.action.id === act.id && !r.isFailAction
            );
            if (!already) {
              let verbAction = 'activar';
              if (act.verb === 'mirar') verbAction = 'examinar';
              else if (act.verb === 'coger') verbAction = 'coger';
              else if (act.verb === 'usar') verbAction = 'usar';
              else if (act.verb === 'abrir') verbAction = 'abrir';
              else if (act.verb === 'hablar') verbAction = 'hablar con';
              else if (act.verb === 'empujar') verbAction = 'empujar';
              else if (act.verb === 'ir_a') verbAction = 'ir a';

              const causeStr = `Al ${verbAction} ${hs.word}`;
              appendedResponses.push({
                hotspot: hs,
                action: act,
                cause: causeStr,
                text: txt,
                isGameOver: act.isGameOver || act.stateChange?.isGameOver,
                isFailAction: false,
              });
              foundNew = true;
            }
          }

          // failStateChange.appendStoryText
          const failTxt = act.failStateChange?.appendStoryText?.trim();
          if (failTxt) {
            const alreadyFail = appendedResponses.some(
              (r) => r.hotspot.id === hs.id && r.action.id === act.id && r.isFailAction
            );
            if (!alreadyFail) {
              let verbAction = 'activar';
              if (act.verb === 'mirar') verbAction = 'examinar';
              else if (act.verb === 'coger') verbAction = 'coger';
              else if (act.verb === 'usar') verbAction = 'usar';
              else if (act.verb === 'abrir') verbAction = 'abrir';
              else if (act.verb === 'hablar') verbAction = 'hablar con';
              else if (act.verb === 'empujar') verbAction = 'empujar';
              else if (act.verb === 'ir_a') verbAction = 'ir a';

              const causeStr = `Al fallar ${verbAction} ${hs.word}`;
              appendedResponses.push({
                hotspot: hs,
                action: act,
                cause: causeStr,
                text: failTxt,
                isGameOver: act.isGameOver || act.failStateChange?.isGameOver,
                isFailAction: true,
              });
              foundNew = true;
            }
          }
        });
      });

      // Check all hotspots in scene to see if any match the collected appended texts
      (scene.hotspots || []).forEach((hs) => {
        if (!visitedHotspotIds.has(hs.id)) {
          const matchingAppended = appendedResponses.find((r) => isWordMatchInText(hs.word, r.text));
          if (matchingAppended) {
            visitedHotspotIds.add(hs.id);
            blockHotspots.push(hs);
            hotspotOriginMap[hs.id] = {
              isFromAppended: true,
              triggerWord: matchingAppended.hotspot.word,
              cause: matchingAppended.cause,
            };
            foundNew = true;
          }
        }
      });
    }

    const allBlockTexts = [blockText || '', ...appendedResponses.map((r) => r.text)];

    return { blockHotspots, appendedResponses, allBlockTexts, hotspotOriginMap };
  };

  const renderAppendedTextContent = (
    text: string,
    sceneHotspots: Hotspot[],
    onHotspotClick: (hs: Hotspot) => void
  ) => {
    if (!text) return null;

    const matchingHotspots = (sceneHotspots || []).filter((hs) => isWordMatchInText(hs.word, text));
    if (matchingHotspots.length === 0) {
      return <span className="text-amber-100">{text}</span>;
    }

    const sorted = [...matchingHotspots].sort((a, b) => b.word.length - a.word.length);
    const regexPatterns = sorted.map((hs) => {
      const escape = hs.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const startChar = hs.word.charAt(0);
      const endChar = hs.word.charAt(hs.word.length - 1);
      const prefix = isWordChar(startChar) ? '(?<![\\p{L}\\p{N}_])' : '';
      const suffix = isWordChar(endChar) ? '(?![\\p{L}\\p{N}_])' : '';
      return `(${prefix}${escape}${suffix})`;
    });

    try {
      const fullRegex = new RegExp(regexPatterns.join('|'), 'giu');
      const parts = text.split(fullRegex).filter(Boolean);

      return (
        <span className="text-amber-100">
          {parts.map((part, idx) => {
            const matched = sorted.find((hs) => hs.word.toLowerCase() === part.toLowerCase());
            if (matched) {
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const sel = window.getSelection()?.toString().trim();
                    if (sel && sel.length > 0) return;
                    onHotspotClick(matched);
                  }}
                  className="inline text-amber-300 font-semibold underline decoration-amber-400/80 hover:decoration-amber-300 hover:text-amber-100 hover:bg-amber-500/25 px-1 py-0.5 rounded cursor-pointer transition-colors"
                  title={`Palabra clave "${matched.word}" (Clic para editar acciones)`}
                >
                  {part}
                </button>
              );
            }
            return <span key={idx}>{part}</span>;
          })}
        </span>
      );
    } catch (err) {
      console.error('Error rendering appended text with keywords:', err);
      return <span className="text-amber-100">{text}</span>;
    }
  };

  const validationIssues = validateProjectScenes(project);
  const activeSceneIssues = validationIssues.filter((i) => i.sceneId === activeScene?.id);

  return (
    <div className="space-y-6">
      {/* Top Validation & Audit Panel */}
      <ValidationPanel
        issues={validationIssues}
        onSelectScene={setSelectedSceneId}
        activeSceneId={activeScene?.id}
      />

      {/* Top Collapsed Scenes Bar if sidebar is hidden */}
      {isSidebarCollapsed && (
        <div className="bg-[#0c0c0e] border border-amber-500/30 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={toggleSidebar}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
              title="Desplegar panel lateral de escenas"
            >
              <PanelLeftOpen className="w-4 h-4 text-amber-400" />
              <span>Ver Lista de Escenas ({project.scenes.length})</span>
            </button>

            {/* Quick scene switcher dropdown */}
            <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl px-3 py-1 text-xs">
              <span className="text-white/50 font-medium">Escena Actual:</span>
              <select
                value={selectedSceneId}
                onChange={(e) => setSelectedSceneId(e.target.value)}
                className="bg-transparent text-amber-300 font-bold outline-none cursor-pointer"
              >
                {project.scenes.map((s, idx) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                    {idx + 1}. {s.name} ({s.type === 'portada' ? 'Portada' : s.type === 'introduccion' ? 'Intro' : s.type === 'qte' ? 'QTE' : s.type === 'final' ? 'Final' : 'Normal'})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={isPreviewingActiveScene ? () => setIsPreviewingActiveScene(false) : startTestingActiveScene}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer border ${
                isPreviewingActiveScene
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/30'
              }`}
              title={isPreviewingActiveScene ? 'Volver a editar esta escena' : 'Probar esta escena en vivo'}
            >
              {isPreviewingActiveScene ? (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Volver al Editor</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Probar Escena</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Add Scene */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newSceneName}
              onChange={(e) => setNewSceneName(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-xl px-3 py-1 text-xs text-white focus:border-amber-500 outline-none w-44"
              placeholder="+ Nueva escena..."
            />
            <button
              type="button"
              onClick={handleCreateScene}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir</span>
            </button>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 ${isSidebarCollapsed ? 'lg:grid-cols-1' : 'lg:grid-cols-4'} gap-6`}>
        
        {/* Scenes List Sidebar */}
        {!isSidebarCollapsed && (
          <div className="lg:col-span-1 bg-[#0c0c0e] border border-white/10 rounded-2xl p-5 space-y-4 h-fit">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                  Escenas ({project.scenes.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-1 rounded-lg text-white/40 hover:text-amber-400 hover:bg-white/10 transition-colors cursor-pointer"
                title="Plegar panel lateral para maximizar el área de escritura"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

          {/* Add scene */}
          <div className="space-y-2">
            <input
              type="text"
              value={newSceneName}
              onChange={(e) => setNewSceneName(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:border-amber-500 outline-none"
              placeholder="Nombre de la escena..."
            />
            
            <select
              value={newSceneType}
              onChange={(e) => setNewSceneType(e.target.value as any)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white/80 focus:border-amber-500 outline-none"
            >
              <option value="normal">Escena Normal de Aventura</option>
              <option value="portada">Escena de Portada</option>
              <option value="introduccion">Escena de Introducción</option>
              <option value="qte">Escena Especial: Quick Time Event (QTE)</option>
              <option value="final">Escena de Final (Conclusión)</option>
            </select>

            <button
              onClick={handleCreateScene}
              className="w-full px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Escena</span>
            </button>
          </div>

          {/* Scene list */}
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {project.scenes.map((scene, index) => {
              const isSelected = scene.id === activeScene?.id;
              const isInitial = scene.id === project.initialSceneId;
              const isQTE = scene.type === 'qte' || !!scene.qteConfig;
              const sceneIssues = validationIssues.filter((i) => i.sceneId === scene.id);
              const hasUnlinked = sceneIssues.some((i) => i.type === 'unlinked');
              const hasNoReturn = sceneIssues.some((i) => i.type === 'no_return');
              const hasDeadEnd = sceneIssues.some((i) => i.type === 'dead_end');

              return (
                <div
                  key={scene.id}
                  draggable
                  onDragStart={(e) => handleDragStartScene(e, index)}
                  onDragOver={(e) => handleDragOverScene(e, index)}
                  onDrop={(e) => handleDropScene(e, index)}
                  onDragEnd={() => {
                    setDraggedSceneIndex(null);
                    setDragOverSceneIndex(null);
                  }}
                  onClick={() => setSelectedSceneId(scene.id)}
                  className={`w-full text-left p-2.5 rounded-r-lg border-y border-r transition-all cursor-pointer flex items-center justify-between group ${
                    dragOverSceneIndex === index && draggedSceneIndex !== index
                      ? 'border-t-2 border-t-amber-400 bg-amber-500/10'
                      : ''
                  } ${
                    isSelected
                      ? 'bg-white/5 border-l-2 border-amber-500 border-white/10 text-white font-medium'
                      : 'bg-black/30 border-white/5 border-l-transparent text-white/40 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-start gap-1.5 flex-1 min-w-0">
                    <span
                      className="cursor-grab active:cursor-grabbing text-white/30 hover:text-amber-400 pt-0.5 rounded transition-colors shrink-0 group-hover:opacity-100 opacity-60"
                      title="Pinchar y arrastrar para recolocar escena"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </span>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs truncate max-w-[110px]">{scene.name}</span>
                      {scene.type === 'portada' && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold px-1 py-0.2 rounded">
                          PORTADA
                        </span>
                      )}
                      {scene.type === 'introduccion' && (
                        <span className="text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/40 font-mono font-bold px-1 py-0.2 rounded">
                          INTRO
                        </span>
                      )}
                      {scene.type === 'final' && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold px-1 py-0.2 rounded">
                          FINAL
                        </span>
                      )}
                      {isQTE && (
                        <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded flex items-center gap-0.5 shadow-sm">
                          ⚡ QTE
                        </span>
                      )}
                      {isInitial && (
                        <span className="text-[9px] bg-emerald-500 text-black font-mono font-bold px-1.5 py-0.2 rounded">
                          INICIO
                        </span>
                      )}
                    </div>

                    {/* Validation Warning Badges on Sidebar */}
                    {sceneIssues.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {hasUnlinked && (
                          <span className="text-[9px] bg-rose-500/30 text-rose-300 border border-rose-500/40 font-mono font-bold px-1 py-0.2 rounded flex items-center gap-0.5" title="Párrafo no vinculado desde ninguna otra escena">
                            🔴 No vinculado
                          </span>
                        )}
                        {hasNoReturn && (
                          <span className="text-[9px] bg-amber-500/30 text-amber-300 border border-amber-500/40 font-mono font-bold px-1 py-0.2 rounded flex items-center gap-0.5" title="Sin acción ni opción para regresar a la escena anterior">
                            ⚠️ Sin retorno
                          </span>
                        )}
                        {hasDeadEnd && (
                          <span className="text-[9px] bg-amber-500/30 text-amber-300 border border-amber-500/40 font-mono font-bold px-1 py-0.2 rounded flex items-center gap-0.5" title="Sin enlaces salientes ni fin de juego">
                            ⚠️ Sin salida
                          </span>
                        )}
                      </div>
                    )}

                    <span className="text-[10px] text-white/30 font-normal block">
                      {scene.hotspots.length} palabras clave
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startTestingSceneWithId(scene.id);
                      }}
                      className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded transition-colors cursor-pointer"
                      title="Probar esta escena"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveScene(index, 'up');
                      }}
                      disabled={index === 0}
                      className="p-1 text-white/40 hover:text-amber-400 disabled:opacity-20 hover:bg-white/10 rounded transition-colors cursor-pointer"
                      title="Mover arriba"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveScene(index, 'down');
                      }}
                      disabled={index === project.scenes.length - 1}
                      className="p-1 text-white/40 hover:text-amber-400 disabled:opacity-20 hover:bg-white/10 rounded transition-colors cursor-pointer"
                      title="Mover abajo"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScene(scene.id);
                      }}
                      className="p-1 text-white/30 hover:text-rose-400 hover:bg-white/10 rounded transition-colors cursor-pointer"
                      title="Eliminar escena"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

      {/* Main Scene Editor & Hotspots Workspace */}
      <div className={`${isSidebarCollapsed ? 'lg:col-span-1' : 'lg:col-span-3'} space-y-6`}>
        {isPreviewingActiveScene ? (
          <div className="bg-[#0f0f12] border border-emerald-500/40 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 animate-fadeIn">
            {/* Preview Header Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-sm">
                  <Play className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-200 text-base flex items-center gap-2 flex-wrap">
                    <span>Probando Escena:</span>
                    <span className="text-white font-mono bg-black/60 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                      {activeScene?.name}
                    </span>
                  </h3>
                  <p className="text-xs text-emerald-300/70">
                    Interactúa con los verbos y palabras clave directamente para probar tu diseño en tiempo real.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startTestingActiveScene}
                  className="px-3.5 py-2 bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  title="Reiniciar el estado de prueba de esta escena"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reiniciar Escena</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPreviewingActiveScene(false)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2 shadow-lg"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Volver al Editor</span>
                </button>
              </div>
            </div>

            {/* Live Game Player inside Editor */}
            {testSceneGameState && (
              <div className="rounded-2xl border border-white/10 overflow-hidden bg-black shadow-2xl">
                <GamePlayer
                  project={project}
                  updateProject={updateProject}
                  gameState={testSceneGameState}
                  setGameState={setTestSceneGameState}
                  onReset={startTestingActiveScene}
                  isSceneTesting={true}
                />
              </div>
            )}
          </div>
        ) : (
          <>
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

              <div className="flex items-center justify-between border-b border-white/5 pb-3 relative z-10 gap-2 flex-wrap">
                <div>
                  <span className="text-xs font-mono text-amber-500/70 block mb-1">
                    EDITOR DE TEXTO // {activeScene?.id.toUpperCase()}
                  </span>
                  <h3 className="font-medium text-white text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" />
                    <span>Escena: {activeScene?.name}</span>
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={startTestingActiveScene}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow transition-all cursor-pointer border border-emerald-400/30"
                  title="Probar interactivamente esta escena sin salir del editor"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-200 fill-emerald-200" />
                  <span>Probar esta Escena</span>
                </button>
              </div>

          {/* Active Scene Specific Validation Alerts */}
          {activeSceneIssues.length > 0 && (
            <div className="space-y-2 relative z-10">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => setShowSceneAlerts(!showSceneAlerts)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-sm"
                  title="Ver u ocultar los avisos de vinculación de esta escena"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Avisos de vinculación ({activeSceneIssues.length})</span>
                  {showSceneAlerts ? (
                    <ChevronUp className="w-3.5 h-3.5 ml-1" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 ml-1" />
                  )}
                </button>

                {showSceneAlerts && (
                  <button
                    onClick={() => setShowSceneAlerts(false)}
                    className="text-[11px] text-white/50 hover:text-white underline cursor-pointer"
                  >
                    Ocultar
                  </button>
                )}
              </div>

              {showSceneAlerts && (
                <div className="space-y-2 pt-1">
                  {activeSceneIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-2.5 ${
                        issue.type === 'unlinked'
                          ? 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                          : 'bg-amber-950/50 border-amber-500/40 text-amber-200'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                        <div className="space-y-1">
                          <div className="font-bold flex items-center gap-2">
                            <span>{issue.title}</span>
                            <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-black/40 border border-current">
                              {issue.type === 'unlinked'
                                ? 'ERROR DE VINCULACIÓN'
                                : 'ALERTA DE RETORNO/SALIDA'}
                            </span>
                          </div>
                          <p>{issue.message}</p>
                          <p className="font-mono text-[11px] text-amber-300">
                            💡 {issue.suggestion}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowSceneAlerts(false)}
                        className="p-1 text-white/40 hover:text-white rounded transition-colors cursor-pointer"
                        title="Ocultar alertas"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
            <div>
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

            <div>
              <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Tipo / Función de la Escena</label>
              <select
                value={activeScene?.type || (activeScene?.qteConfig ? 'qte' : 'normal')}
                onChange={(e) => {
                  const type = e.target.value as any;
                  updateProject((prev) => ({
                    ...prev,
                    scenes: prev.scenes.map((s) => {
                      if (s.id !== activeScene.id) return s;
                      if (type === 'qte' && !s.qteConfig) {
                        const firstHs = s.hotspots[0];
                        return {
                          ...s,
                          type,
                          qteConfig: {
                            timeLimitSeconds: 10,
                            sequence: firstHs
                              ? [
                                  {
                                    id: `qte_${Date.now()}`,
                                    hotspotId: firstHs.id,
                                    word: firstHs.word,
                                    label: `¡Haz clic en ${firstHs.word} a tiempo!`,
                                  },
                                ]
                              : [],
                            onSuccessMessage: '¡Completaste el evento de tiempo con éxito!',
                            onFailMessage: '¡No lograste reaccionar a tiempo!',
                            isFailGameOver: true,
                          },
                        };
                      }
                      return { ...s, type };
                    }),
                  }));
                }}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-medium focus:border-amber-500 outline-none"
              >
                <option value="normal">Escena Normal de Aventura</option>
                <option value="portada">Escena de Portada (Carátula)</option>
                <option value="introduccion">Escena de Introducción (Prólogo)</option>
                <option value="qte">Escena Especial: Quick Time Event (QTE)</option>
                <option value="final">Escena de Final (Conclusión)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-amber-300 flex items-center justify-between mb-1">
                <span className="flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  Sonido al Cargar Escena
                </span>
                {activeScene?.sfx && activeScene.sfx !== 'none' && (
                  <button
                    type="button"
                    onClick={() => playSound(activeScene.sfx)}
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>▶ Probar</span>
                  </button>
                )}
              </label>
              <select
                value={activeScene?.sfx || 'none'}
                onChange={(e) => {
                  const sfx = (e.target.value as SoundEffectType) || 'none';
                  updateProject((prev) => ({
                    ...prev,
                    scenes: prev.scenes.map((s) =>
                      s.id === activeScene.id ? { ...s, sfx: sfx !== 'none' ? sfx : undefined } : s
                    ),
                  }));
                  if (sfx !== 'none') playSound(sfx);
                }}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-amber-200 font-medium focus:border-amber-500 outline-none"
              >
                {SOUND_EFFECT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Time Event (QTE) Configuration Panel */}
          {(activeScene?.type === 'qte' || activeScene?.qteConfig) && (
            <div className="bg-gradient-to-br from-amber-950/60 via-red-950/40 to-slate-900 border-2 border-amber-500/60 rounded-2xl p-5 shadow-2xl space-y-4 relative z-10">
              <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="font-bold text-amber-300 text-sm">Configuración de Quick Time Event (QTE)</h4>
                    <p className="text-xs text-white/50">El jugador debe realizar las acciones requeridas en orden dentro del tiempo límite.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    updateProject((prev) => ({
                      ...prev,
                      scenes: prev.scenes.map((s) =>
                        s.id === activeScene.id
                          ? { ...s, type: s.type === 'qte' ? 'normal' : s.type, qteConfig: undefined }
                          : s
                      ),
                    }));
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 border border-rose-500/30 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Quitar QTE
                </button>
              </div>

              {/* Timer & Sequence Mode settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-black/40 p-3.5 rounded-xl border border-white/10">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-amber-300 mb-1">
                    ⏱️ Tiempo Límite (Segundos)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={120}
                    value={activeScene?.qteConfig?.timeLimitSeconds || 10}
                    onChange={(e) => {
                      const secs = Math.max(1, parseInt(e.target.value) || 10);
                      updateProject((prev) => ({
                        ...prev,
                        scenes: prev.scenes.map((s) => {
                          if (s.id !== activeScene.id) return s;
                          const prevConfig = s.qteConfig || { timeLimitSeconds: 10, sequence: [] };
                          return {
                            ...s,
                            qteConfig: { ...prevConfig, timeLimitSeconds: secs },
                          };
                        }),
                      }));
                    }}
                    className="w-full bg-black/60 border border-amber-500/40 rounded-xl px-3 py-2 text-sm text-amber-200 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-amber-300 mb-1">
                    ⌛ Modo del Temporizador
                  </label>
                  <select
                    value={activeScene?.qteConfig?.timerMode || 'sequence'}
                    onChange={(e) => {
                      const mode = e.target.value as 'sequence' | 'per_action';
                      updateProject((prev) => ({
                        ...prev,
                        scenes: prev.scenes.map((s) => {
                          if (s.id !== activeScene.id) return s;
                          const prevConfig = s.qteConfig || { timeLimitSeconds: 10, sequence: [] };
                          return {
                            ...s,
                            qteConfig: { ...prevConfig, timerMode: mode },
                          };
                        }),
                      }));
                    }}
                    className="w-full bg-black/60 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="sequence">Toda la secuencia (tiempo total acumulado)</option>
                    <option value="per_action">Por cada acción (se reinicia en cada paso)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-center">
                  <label className="block text-[10px] uppercase font-bold text-amber-300 mb-1">
                    📖 Párrafos Progresivos
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-200 bg-black/40 border border-white/10 rounded-xl px-3 py-2 hover:bg-black/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={!!activeScene?.qteConfig?.incrementalParagraphs}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        updateProject((prev) => ({
                          ...prev,
                          scenes: prev.scenes.map((s) => {
                            if (s.id !== activeScene.id) return s;
                            const prevConfig = s.qteConfig || { timeLimitSeconds: 10, sequence: [] };
                            return {
                              ...s,
                              qteConfig: { ...prevConfig, incrementalParagraphs: checked },
                            };
                          }),
                        }));
                      }}
                      className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="truncate">Insertar párrafo por acción ([1], [2]...)</span>
                  </label>
                </div>
              </div>

              {activeScene?.qteConfig?.incrementalParagraphs && (
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200/90 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300">
                    <span>💡 Instrucciones de párrafos progresivos en QTE:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-200/80">
                    Escribe <strong className="text-white font-mono bg-black/60 px-1 rounded">[1]</strong> al inicio del párrafo que se mostrará tras completar la 1ª acción, <strong className="text-white font-mono bg-black/60 px-1 rounded">[2]</strong> tras la 2ª, etc. El texto antes de [1] será el visible al cargar la escena. La clave [número] será invisible para el jugador.
                  </p>
                </div>
              )}

              {/* Side by side: Al terminar con éxito vs Al fallar o agotarse el tiempo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/40 p-4 rounded-xl border border-white/10">
                {/* Column 1: Al terminar con éxito */}
                <div className="space-y-3 border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-4">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider border-b border-emerald-500/20 pb-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>Al terminar con éxito</span>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-emerald-300/80 mb-1">
                      Mensaje
                    </label>
                    <textarea
                      rows={2}
                      value={activeScene?.qteConfig?.onSuccessMessage || ''}
                      placeholder="¡Reaccionaste a tiempo y lograste esquivar el peligro!"
                      onChange={(e) => {
                        const msg = e.target.value;
                        updateProject((prev) => ({
                          ...prev,
                          scenes: prev.scenes.map((s) => {
                            if (s.id !== activeScene.id) return s;
                            const prevConfig = s.qteConfig || { timeLimitSeconds: 10, sequence: [] };
                            return { ...s, qteConfig: { ...prevConfig, onSuccessMessage: msg } };
                          }),
                        }));
                      }}
                      className="w-full bg-black/50 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-emerald-300/80 mb-1">
                      Bandera (Se activará en true)
                    </label>
                    <input
                      type="text"
                      list="qte-flags-list"
                      value={activeScene?.qteConfig?.onSuccessFlag || ''}
                      placeholder="ej. peligro_esquivado (opcional)"
                      onChange={(e) => {
                        const flag = e.target.value.trim().toLowerCase().replace(/\s+/g, '_');
                        updateProject((prev) => ({
                          ...prev,
                          scenes: prev.scenes.map((s) => {
                            if (s.id !== activeScene.id) return s;
                            const prevConfig = s.qteConfig || { timeLimitSeconds: 10, sequence: [] };
                            return { ...s, qteConfig: { ...prevConfig, onSuccessFlag: flag } };
                          }),
                        }));
                      }}
                      className="w-full bg-black/50 border border-emerald-500/30 rounded-xl px-3 py-1.5 text-xs text-emerald-200 font-mono outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-emerald-300/80 mb-1">
                      Escena Destino (Opcional)
                    </label>
                    <select
                      value={activeScene?.qteConfig?.onSuccessSceneId || ''}
                      onChange={(e) => {
                        const scId = e.target.value;
                        updateProject((prev) => ({
                          ...prev,
                          scenes: prev.scenes.map((s) => {
                            if (s.id !== activeScene.id) return s;
                            const prevConfig = s.qteConfig || { timeLimitSeconds: 10, sequence: [] };
                            return { ...s, qteConfig: { ...prevConfig, onSuccessSceneId: scId } };
                          }),
                        }));
                      }}
                      className="w-full bg-black/50 border border-emerald-500/30 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                    >
                      <option value="">(Permanecer en esta escena)</option>
                      {project.scenes.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.name} ({sc.id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Column 2: Al fallar o agotarse el tiempo */}
                <div className="space-y-3 md:pl-2">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider border-b border-rose-500/20 pb-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Al fallar o agotarse el tiempo</span>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-rose-300/80 mb-1">
                      Mensaje
                    </label>
                    <textarea
                      rows={2}
                      value={activeScene?.qteConfig?.onFailMessage || ''}
                      placeholder="No fuiste lo suficientemente rápido..."
                      onChange={(e) => {
                        const msg = e.target.value;
                        updateProject((prev) => ({
                          ...prev,
                          scenes: prev.scenes.map((s) => {
                            if (s.id !== activeScene.id) return s;
                            const prevConfig = s.qteConfig || { timeLimitSeconds: 10, sequence: [] };
                            return { ...s, qteConfig: { ...prevConfig, onFailMessage: msg } };
                          }),
                        }));
                      }}
                      className="w-full bg-black/50 border border-rose-500/30 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-rose-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-rose-300/80 mb-1">
                      Bandera (Se activará en true)
                    </label>
                    <input
                      type="text"
                      list="qte-flags-list"
                      value={activeScene?.qteConfig?.onFailFlag || ''}
                      placeholder="ej. herido_en_trampa (opcional)"
                      onChange={(e) => {
                        const flag = e.target.value.trim().toLowerCase().replace(/\s+/g, '_');
                        updateProject((prev) => ({
                          ...prev,
                          scenes: prev.scenes.map((s) => {
                            if (s.id !== activeScene.id) return s;
                            const prevConfig = s.qteConfig || { timeLimitSeconds: 10, sequence: [] };
                            return { ...s, qteConfig: { ...prevConfig, onFailFlag: flag } };
                          }),
                        }));
                      }}
                      className="w-full bg-black/50 border border-rose-500/30 rounded-xl px-3 py-1.5 text-xs text-rose-200 font-mono outline-none focus:border-rose-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-rose-300/80 mb-1">
                      Escena Destino en Fallo
                    </label>
                    <select
                      value={activeScene?.qteConfig?.onFailSceneId || ''}
                      onChange={(e) => {
                        const scId = e.target.value;
                        updateProject((prev) => ({
                          ...prev,
                          scenes: prev.scenes.map((s) => {
                            if (s.id !== activeScene.id) return s;
                            const prevConfig = s.qteConfig || { timeLimitSeconds: 10, sequence: [] };
                            return { ...s, qteConfig: { ...prevConfig, onFailSceneId: scId } };
                          }),
                        }));
                      }}
                      className="w-full bg-black/50 border border-rose-500/30 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-rose-500"
                    >
                      <option value="">(Ninguna escena / Ver mensaje)</option>
                      {project.scenes.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.name} ({sc.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-rose-300 font-bold">
                      <input
                        type="checkbox"
                        checked={!!activeScene?.qteConfig?.isFailGameOver}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          updateProject((prev) => ({
                            ...prev,
                            scenes: prev.scenes.map((s) => {
                              if (s.id !== activeScene.id) return s;
                              const prevConfig = s.qteConfig || { timeLimitSeconds: 10, sequence: [] };
                              return { ...s, qteConfig: { ...prevConfig, isFailGameOver: checked } };
                            }),
                          }));
                        }}
                        className="accent-rose-500 w-4 h-4 rounded cursor-pointer"
                      />
                      <span>💀 Activar Pantalla de Fin de Partida al Fallar</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Shared Flags Datalist for easy selection */}
              <datalist id="qte-flags-list">
                {flagKeys.map((fKey) => (
                  <option key={fKey} value={fKey} />
                ))}
              </datalist>

              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <span>📋 Secuencia de Acciones Requeridas ({activeScene?.qteConfig?.sequence?.length || 0})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const firstHotspot = activeScene.hotspots[0];
                      const newStep: QTEStep = {
                        id: `qte_step_${Date.now()}`,
                        hotspotId: firstHotspot?.id,
                        word: firstHotspot?.word,
                        label: firstHotspot ? `¡Interactuar con ${firstHotspot.word}!` : '¡Siguiente acción!',
                      };
                      updateProject((prev) => ({
                        ...prev,
                        scenes: prev.scenes.map((s) => {
                          if (s.id !== activeScene.id) return s;
                          const prevConfig = s.qteConfig || { timeLimitSeconds: 10, sequence: [] };
                          return {
                            ...s,
                            qteConfig: { ...prevConfig, sequence: [...(prevConfig.sequence || []), newStep] },
                          };
                        }),
                      }));
                    }}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir Paso a la Secuencia</span>
                  </button>
                </div>

                {(activeScene?.qteConfig?.sequence || []).length === 0 ? (
                  <div className="p-3 bg-black/40 border border-dashed border-white/20 rounded-xl text-center text-xs text-white/40">
                    Añade los pasos que el jugador deberá realizar secuencialmente antes de que se agote el tiempo.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeScene?.qteConfig?.sequence.map((step, idx) => (
                      <div
                        key={step.id}
                        className="flex flex-wrap items-center gap-2 bg-black/50 border border-amber-500/30 rounded-xl p-2.5 text-xs"
                      >
                        <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>

                        <div className="flex-1 min-w-[140px]">
                          <select
                            value={step.hotspotId || ''}
                            onChange={(e) => {
                              const hsId = e.target.value;
                              const selectedHs = activeScene.hotspots.find((h) => h.id === hsId);
                              updateProject((prev) => ({
                                ...prev,
                                scenes: prev.scenes.map((s) => {
                                  if (s.id !== activeScene.id || !s.qteConfig) return s;
                                  return {
                                    ...s,
                                    qteConfig: {
                                      ...s.qteConfig,
                                      sequence: s.qteConfig.sequence.map((st) =>
                                        st.id === step.id
                                          ? {
                                              ...st,
                                              hotspotId: hsId,
                                              word: selectedHs?.word,
                                              label: selectedHs ? `¡Hacer clic en ${selectedHs.word}!` : st.label,
                                            }
                                          : st
                                      ),
                                    },
                                  };
                                }),
                              }));
                            }}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none"
                          >
                            <option value="">(Cualquier palabra interactiva)</option>
                            {activeScene.hotspots.map((hs) => (
                              <option key={hs.id} value={hs.id}>
                                Palabra: "{hs.word}"
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-28">
                          <select
                            value={step.expectedVerb || ''}
                            onChange={(e) => {
                              const v = (e.target.value as VerbType) || undefined;
                              updateProject((prev) => ({
                                ...prev,
                                scenes: prev.scenes.map((s) => {
                                  if (s.id !== activeScene.id || !s.qteConfig) return s;
                                  return {
                                    ...s,
                                    qteConfig: {
                                      ...s.qteConfig,
                                      sequence: s.qteConfig.sequence.map((st) =>
                                        st.id === step.id ? { ...st, expectedVerb: v } : st
                                      ),
                                    },
                                  };
                                }),
                              }));
                            }}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none"
                          >
                            <option value="">Cualquier verbo</option>
                            {ALL_VERBS.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex-1 min-w-[160px]">
                          <input
                            type="text"
                            value={step.label}
                            placeholder="Instrucción en pantalla..."
                            onChange={(e) => {
                              const l = e.target.value;
                              updateProject((prev) => ({
                                ...prev,
                                scenes: prev.scenes.map((s) => {
                                  if (s.id !== activeScene.id || !s.qteConfig) return s;
                                  return {
                                    ...s,
                                    qteConfig: {
                                      ...s.qteConfig,
                                      sequence: s.qteConfig.sequence.map((st) =>
                                        st.id === step.id ? { ...st, label: l } : st
                                      ),
                                    },
                                  };
                                }),
                              }));
                            }}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            updateProject((prev) => ({
                              ...prev,
                              scenes: prev.scenes.map((s) => {
                                if (s.id !== activeScene.id || !s.qteConfig) return s;
                                return {
                                  ...s,
                                  qteConfig: {
                                    ...s.qteConfig,
                                    sequence: s.qteConfig.sequence.filter((st) => st.id !== step.id),
                                  },
                                };
                              }),
                            }));
                          }}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-lg"
                          title="Eliminar paso"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between bg-black/30 border border-white/5 rounded-xl p-3 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/70">Escena Inicial de Inicio del Juego:</span>
              {project.initialSceneId === activeScene?.id ? (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                  ✓ Es la escena de inicio actual
                </span>
              ) : (
                <span className="text-xs text-white/40">No es la escena inicial</span>
              )}
            </div>

            {project.initialSceneId !== activeScene?.id && (
              <button
                onClick={() => {
                  updateProject((prev) => ({
                    ...prev,
                    initialSceneId: activeScene.id,
                  }));
                }}
                className="px-3 py-1 bg-amber-600/80 hover:bg-amber-500 text-white font-medium rounded-lg text-xs transition-colors"
              >
                Fijar como Inicio
              </button>
            )}
          </div>

          {/* Text Blocks (Paragraphs) Section */}
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-white/40 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Bloques de Texto Narrativo ({activeScene?.textBlocks.length || 0})</span>
              </label>
            </div>

            {activeScene?.textBlocks.map((block, index) => {
              const visibleFlagsList = block.visibleIfFlags ? Object.keys(block.visibleIfFlags) : [];
              const hiddenFlagsList = block.hiddenIfFlags ? Object.keys(block.hiddenIfFlags) : [];

              return (
                <div
                  key={block.id}
                  className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3 relative group"
                >
                  <div className="flex flex-wrap items-center justify-between text-xs border-b border-white/5 pb-2.5 gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        Párrafo #{index + 1}
                      </span>

                      {/* Block type selector */}
                      <select
                        value={block.type || 'normal'}
                        onChange={(e) => handleUpdateBlockType(block.id, e.target.value as any)}
                        className="bg-black/60 border border-white/10 text-white text-[11px] rounded-lg px-2 py-0.5 focus:border-amber-500 outline-none cursor-pointer font-medium"
                      >
                        <option value="portada">🖼️ Portada</option>
                        <option value="introduccion">📖 Introducción</option>
                        <option value="normal">📝 Normal</option>
                        <option value="final">Final (Fin de historia)</option>
                      </select>

                      {/* Cover Mode Options for Portada */}
                      {(block.type === 'portada' || (block.imageFileData || block.imageUrl)) && (
                        <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10 text-[10px]">
                          <button
                            type="button"
                            onClick={() => handleUpdateBlockCoverMode(block.id, 'full')}
                            className={`px-2 py-0.5 rounded ${
                              block.coverMode === 'full' || !block.coverMode
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Portada Completa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateBlockCoverMode(block.id, 'with_text')}
                            className={`px-2 py-0.5 rounded ${
                              block.coverMode === 'with_text'
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Acompañada de Texto
                          </button>
                        </div>
                      )}

                      {block.isGameOver && (
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                          💀 Fin de Partida
                        </span>
                      )}
                      {block.type === 'final' && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded font-bold flex items-center gap-1 shadow-sm">
                          Párrafo Final
                        </span>
                      )}
                      {visibleFlagsList.length > 0 && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono flex items-center gap-1">
                          <Eye className="w-3 h-3 text-emerald-400" />
                          Visible si: {visibleFlagsList.join(' + ')}
                        </span>
                      )}
                      {hiddenFlagsList.length > 0 && (
                        <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded font-mono flex items-center gap-1">
                          <EyeOff className="w-3 h-3 text-rose-400" />
                          Oculto si: {hiddenFlagsList.join(' + ')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {(() => {
                        const isBlockGameOver =
                          !!block.isGameOver ||
                          /\[(?:Terminar \/ Cargar partida|Terminar|Cargar partida|Fin de partida)\]/i.test(block.text);

                        return (
                          <button
                            type="button"
                            onClick={() => handleToggleGameOverOnBlock(block.id, block.text, block.isGameOver)}
                            className={`text-[10px] px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 font-bold border cursor-pointer ${
                              isBlockGameOver
                                ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                                : 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border-rose-500/40'
                            }`}
                            title={
                              isBlockGameOver
                                ? 'Quitar etiqueta y marca de Fin de Partida de este párrafo'
                                : 'Añade automáticamente [Terminar / Cargar partida] al final de este párrafo'
                            }
                          >
                            <span>💀 {isBlockGameOver ? 'Quitar Fin de Partida' : 'Insertar Botón de Fin de Partida'}</span>
                          </button>
                        );
                      })()}

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
                  </div>

                  {/* Image for Paragraph (Expanded if image exists OR if toggled via Insertar Imagen button) */}
                  {(block.imageFileData || block.imageUrl || openImageSectionBlockIds[block.id]) && (
                    <div className="bg-black/40 border border-amber-500/30 rounded-xl p-3 space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-amber-400" />
                          <span>Imagen del Párrafo {block.type === 'portada' ? '(Portada)' : '(Escena / Lugar)'}</span>
                        </label>
                        {(block.imageFileData || block.imageUrl) && (
                          <button
                            type="button"
                            onClick={() => handleClearBlockImage(block.id)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                          >
                            Quitar Imagen
                          </button>
                        )}
                      </div>

                      {(block.imageFileData || block.imageUrl) ? (
                        <div className="flex items-center gap-3 bg-slate-900/90 border border-amber-500/30 rounded-xl p-2.5">
                          <img
                            src={block.imageFileData || block.imageUrl}
                            alt="Previsualización"
                            className="w-20 h-16 object-cover rounded-lg border border-white/10 shrink-0"
                          />
                          <div className="text-xs space-y-1 overflow-hidden">
                            <p className="font-semibold text-amber-300 truncate">
                              {block.imageFileName || 'Imagen cargada'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Se exportará dentro de la carpeta <code className="text-amber-200">IMG/</code> si exportas en ZIP.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <label className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl cursor-pointer text-xs text-slate-300 transition-colors">
                            <span>📂 Subir archivo de imagen</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleBlockImageUpload(block.id, f);
                              }}
                            />
                          </label>
                          <input
                            type="text"
                            value={block.imageUrl || ''}
                            onChange={(e) => handleUpdateBlockImageUrl(block.id, e.target.value)}
                            placeholder="O escribe URL de imagen (https://...)"
                            className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:border-amber-500 outline-none"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Text Formatting Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-[#16161d] border border-white/10 rounded-t-xl px-3 py-1.5 border-b-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Text Size Selector */}
                      <div className="flex items-center gap-0.5 bg-black/60 p-0.5 rounded-lg border border-white/10 text-[11px]">
                        <button
                          type="button"
                          onClick={() => applyTextFormat(block.id, block.text, 'normal')}
                          className="px-2 py-0.5 rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors font-sans flex items-center gap-1 cursor-pointer"
                          title="Texto Normal"
                        >
                          <Type className="w-3.5 h-3.5 text-slate-400" />
                          <span>Normal</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => applyTextFormat(block.id, block.text, 'h1')}
                          className="px-2 py-0.5 rounded text-amber-300 hover:text-amber-200 hover:bg-white/10 transition-colors font-bold flex items-center gap-1 cursor-pointer"
                          title="Encabezado 1 (Título principal)"
                        >
                          <Heading1 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Encabezado 1</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => applyTextFormat(block.id, block.text, 'h2')}
                          className="px-2 py-0.5 rounded text-amber-200/90 hover:text-amber-100 hover:bg-white/10 transition-colors font-semibold flex items-center gap-1 cursor-pointer"
                          title="Encabezado 2 (Subtítulo)"
                        >
                          <Heading2 className="w-3.5 h-3.5 text-amber-300" />
                          <span>Encabezado 2</span>
                        </button>
                      </div>

                      <div className="h-4 w-[1px] bg-white/10 mx-0.5 hidden sm:block" />

                      {/* Style Formatting Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => applyTextFormat(block.id, block.text, 'bold')}
                          className="p-1 rounded bg-black/50 hover:bg-white/15 text-slate-200 hover:text-white border border-white/10 transition-colors cursor-pointer"
                          title="Formatear como Negrita (<b>)"
                        >
                          <Bold className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => applyTextFormat(block.id, block.text, 'italic')}
                          className="p-1 rounded bg-black/50 hover:bg-white/15 text-slate-200 hover:text-white border border-white/10 transition-colors cursor-pointer"
                          title="Formatear como Cursiva (<i>)"
                        >
                          <Italic className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => applyTextFormat(block.id, block.text, 'underline')}
                          className="p-1 rounded bg-black/50 hover:bg-white/15 text-slate-200 hover:text-white border border-white/10 transition-colors cursor-pointer"
                          title="Formatear como Subrayado (<u>)"
                        >
                          <Underline className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* QTE Progressive Paragraph Button */}
                      {(activeScene?.type === 'qte' || activeScene?.qteConfig) && (
                        <button
                          type="button"
                          onClick={() => {
                            const matches = Array.from((block.text || '').matchAll(/\[(\d+)\]/g));
                            const nextNum = matches.length > 0 ? Math.max(...matches.map((m) => parseInt(m[1], 10))) + 1 : 1;
                            const tagToInsert = `\n\n[${nextNum}] `;
                            handleUpdateBlockText(block.id, (block.text || '') + tagToInsert);
                          }}
                          className="px-2 py-0.5 rounded text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Insertar nuevo párrafo progresivo QTE [1], [2], [3]..."
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>+ Párrafo [QTE]</span>
                        </button>
                      )}
                    </div>

                    {/* Insert Image Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setOpenImageSectionBlockIds((prev) => ({
                          ...prev,
                          [block.id]: !prev[block.id],
                        }))
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        block.imageFileData || block.imageUrl || openImageSectionBlockIds[block.id]
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                          : 'bg-black/50 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                      title="Abrir u ocultar opciones de imagen de este párrafo"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>Insertar Imagen</span>
                      {(block.imageFileData || block.imageUrl) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      )}
                    </button>
                  </div>

                  {/* Appended Story Text and Keywords for this Paragraph Block */}
                  {(() => {
                    const { blockHotspots, appendedResponses, allBlockTexts, hotspotOriginMap } =
                      getBlockHotspotsAndAppended(activeScene, block.text);
                    const hasAppended = appendedResponses.length > 0;

                    const cleanSelected = selectedText.trim();
                    const isSelectedInThisBlock =
                      cleanSelected.length > 0 &&
                      allBlockTexts.some(
                        (txt) =>
                          isWordMatchInText(cleanSelected, txt) ||
                          txt.toLowerCase().includes(cleanSelected.toLowerCase())
                      );

                    const hotspotDialogues: Array<{
                      hotspot: Hotspot;
                      action: any;
                    }> = [];

                    blockHotspots.forEach((hs) => {
                      hs.actions.forEach((act) => {
                        if (act.verb === 'hablar' || act.dialogue) {
                          hotspotDialogues.push({ hotspot: hs, action: act });
                        }
                      });
                    });

                    const hasBlockDialogue = !!block.dialogue;
                    const totalDialogues = (hasBlockDialogue ? 1 : 0) + hotspotDialogues.length;

                    return (
                      <>
                        <textarea
                          ref={(el) => {
                            textareaRefs.current[block.id] = el;
                          }}
                          rows={4}
                          value={block.text}
                          onChange={(e) => handleUpdateBlockText(block.id, e.target.value)}
                          onMouseUp={handleMouseUpTextSelection}
                          className={`w-full bg-black/60 border border-white/10 p-3 text-sm text-white leading-relaxed focus:border-amber-500 outline-none font-serif border-t-0 ${
                            hasAppended ? 'rounded-b-none border-b-0' : 'rounded-b-xl'
                          }`}
                          placeholder={`Escribe el texto del párrafo #${index + 1}...`}
                        />

                        {hasAppended && (
                          <div
                            onMouseUp={handleMouseUpTextSelection}
                            className="bg-black/85 border border-white/10 border-t border-t-amber-500/40 rounded-b-xl p-3.5 space-y-3 font-serif text-slate-200 text-sm leading-relaxed shadow-inner"
                          >
                            <div className="flex items-center justify-between text-[11px] text-amber-400/90 font-sans border-b border-amber-500/20 pb-2">
                              <span className="font-semibold flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span>Párrafos añadidos dinámicamente por acciones:</span>
                              </span>
                              <span className="text-[10px] text-slate-400 hidden sm:inline">
                                Selecciona cualquier palabra para convertirla en palabra de acción
                              </span>
                            </div>

                            {appendedResponses.map((item, i) => {
                              const itemKey = `${item.hotspot.id}_${item.action.id}_${item.isFailAction ? 'fail' : 'succ'}`;
                              const isEditingThis = editingAppendedKey === itemKey;

                              return (
                                <div
                                  key={i}
                                  className="p-2.5 rounded-lg bg-black/50 border border-amber-500/20 space-y-2 group transition-all"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveHotspotForEdit(item.hotspot);
                                        }}
                                        className="font-sans font-bold text-[11px] text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded border border-amber-500/30 inline-flex items-center gap-1 cursor-pointer transition-colors"
                                        title={`Configurar acción de "${item.hotspot.word}" que genera este párrafo`}
                                      >
                                        <span>[{item.cause}]</span>
                                        <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                      </button>

                                      {item.isGameOver && (
                                        <span className="font-sans text-[10px] bg-rose-950 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded font-bold">
                                          💀 Fin de partida
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-1">
                                      {!isEditingThis && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingAppendedKey(itemKey);
                                            setEditingAppendedText(item.text);
                                          }}
                                          className="px-2 py-0.5 rounded text-[10px] text-amber-300/80 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                                          title="Editar el texto de este párrafo añadido directamente"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                          <span>Editar texto</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {isEditingThis ? (
                                    <div className="space-y-2 pt-1 font-sans">
                                      <textarea
                                        value={editingAppendedText}
                                        onChange={(e) => setEditingAppendedText(e.target.value)}
                                        rows={3}
                                        className="w-full bg-slate-900 border border-amber-500/40 rounded-lg p-2.5 text-sm text-slate-100 font-serif leading-relaxed outline-none focus:border-amber-400"
                                        placeholder="Escribe el texto añadido..."
                                      />
                                      <div className="flex items-center gap-2 justify-end">
                                        <button
                                          type="button"
                                          onClick={() => setEditingAppendedKey(null)}
                                          className="px-2.5 py-1 text-xs text-slate-400 hover:text-white rounded bg-white/5 hover:bg-white/10 cursor-pointer"
                                        >
                                          Cancelar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleUpdateAppendedText(
                                              item.hotspot.id,
                                              item.action.id,
                                              item.isFailAction,
                                              editingAppendedText
                                            );
                                            setEditingAppendedKey(null);
                                          }}
                                          className="px-3 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded flex items-center gap-1 cursor-pointer shadow-sm"
                                        >
                                          <Check className="w-3 h-3" />
                                          <span>Guardar texto</span>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      onMouseUp={handleMouseUpTextSelection}
                                      onDoubleClick={handleMouseUpTextSelection}
                                      className="text-slate-200 text-sm leading-relaxed select-text"
                                    >
                                      {renderAppendedTextContent(
                                        item.text,
                                        activeScene?.hotspots || [],
                                        (hs) => setActiveHotspotForEdit(hs)
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Hotspots / Interactive Keywords for THIS paragraph block */}
                        <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-xs font-bold text-amber-300">
                              <span>Palabras Clave en este Párrafo:</span>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Haz clic sobre una palabra para configurar acciones (mirar, usar, etc.)
                            </span>
                          </div>

                          {blockHotspots.length === 0 && !isSelectedInThisBlock ? (
                            <p className="text-[11px] text-slate-400 italic">
                              No se detectan palabras clave en este párrafo ni en sus textos añadidos. Selecciona texto arriba para convertirlo en palabra clave.
                            </p>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {blockHotspots.map((hs) => {
                                const originInfo = hotspotOriginMap[hs.id];
                                const isFromAppended = originInfo?.isFromAppended;

                                return (
                                  <div
                                    key={hs.id}
                                    onClick={() => setActiveHotspotForEdit(hs)}
                                    className="bg-black/80 border border-amber-500/40 hover:border-amber-400 rounded-xl px-3 py-1.5 flex items-center gap-2 cursor-pointer group transition-all shadow-sm hover:shadow-amber-500/10"
                                  >
                                    <span className="text-xs font-bold text-amber-300 group-hover:text-amber-200">
                                      "{hs.word}"
                                    </span>

                                    {isFromAppended && (
                                      <span
                                        className="text-[9px] font-mono text-amber-300 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 rounded"
                                        title={`Palabra clave perteneciente al párrafo añadido (${originInfo?.cause || ''})`}
                                      >
                                        añadido
                                      </span>
                                    )}

                                    {/* Action verb pills */}
                                    <div className="flex items-center gap-1">
                                      {hs.actions.map((act) => (
                                        <span
                                          key={act.id}
                                          className="text-[9px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded"
                                        >
                                          {act.verb}
                                        </span>
                                      ))}
                                      {hs.actions.length === 0 && (
                                        <span className="text-[9px] text-slate-500 italic">sin acciones</span>
                                      )}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveHotspotForEdit(hs);
                                      }}
                                      className="p-0.5 text-slate-400 hover:text-amber-300 cursor-pointer"
                                      title="Editar acciones de esta palabra"
                                    >
                                      <Settings className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteHotspot(hs.id);
                                      }}
                                      className="p-0.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                                      title="Eliminar esta palabra clave"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              })}

                              {isSelectedInThisBlock && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleAddHotspot(cleanSelected);
                                    setSelectedText('');
                                  }}
                                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md animate-pulse cursor-pointer border border-amber-400/50"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Convertir "{cleanSelected}" en Palabra Clave</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Dialogue Editor Section directly below Keywords block */}
                        <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                              <MessageSquare className="w-4 h-4 text-amber-400" />
                              <span>Diálogos y Conversaciones en este Párrafo ({totalDialogues})</span>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Edita o corrige el árbol de diálogo fácilmente
                            </span>
                          </div>

                        {totalDialogues === 0 ? (
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <p className="text-[11px] text-slate-400 italic">
                              No hay un diálogo creado para este párrafo o sus palabras clave.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                const initialDialogue: DialogueBlock = {
                                  characterId: project.characters[0]?.id || 'char_npc',
                                  greeting: 'Hola, ¿en qué puedo ayudarte?',
                                  nodes: [
                                    {
                                      id: 'node_root',
                                      title: 'Inicio de Conversación',
                                      npcPrompt: 'Hola, ¿en qué puedo ayudarte?',
                                      options: [
                                        {
                                          id: 'opt_close',
                                          playerText: 'Despedirse',
                                          npcResponse: 'Hasta luego.',
                                          endConversation: true,
                                        },
                                      ],
                                    },
                                  ],
                                };
                                handleUpdateBlockDialogue(block.id, initialDialogue);
                                setEditingDialogueContext({
                                  type: 'block',
                                  blockId: block.id,
                                  dialogue: initialDialogue,
                                });
                              }}
                              className="px-3 py-1.5 bg-amber-600/80 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm border border-amber-400/30"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Crear Árbol de Diálogo en este Párrafo</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2 pt-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {hasBlockDialogue && (
                                <div className="flex items-center gap-2 bg-amber-950/60 border border-amber-500/40 rounded-xl px-3 py-1.5 shadow-sm">
                                  <span className="text-xs font-bold text-amber-200">
                                    💬 Diálogo Párrafo #{index + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingDialogueContext({
                                        type: 'block',
                                        blockId: block.id,
                                        dialogue: block.dialogue,
                                      })
                                    }
                                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Editar / Corregir Diálogo</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateBlockDialogue(block.id, undefined)}
                                    className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                                    title="Eliminar diálogo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}

                              {hotspotDialogues.map(({ hotspot, action }) => (
                                <div
                                  key={`hs_dia_${hotspot.id}_${action.id}`}
                                  className="flex items-center gap-2 bg-slate-950 border border-amber-500/30 rounded-xl px-3 py-1.5 shadow-sm"
                                >
                                  <span className="text-xs font-bold text-slate-200">
                                    🗣️ Diálogo con "{hotspot.word}"
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingDialogueContext({
                                        type: 'hotspot',
                                        blockId: block.id,
                                        hotspotId: hotspot.id,
                                        actionId: action.id,
                                        dialogue: action.dialogue,
                                      })
                                    }
                                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Editar / Corregir Diálogo</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}

                  {/* Flag Condition Controls */}
                  {(() => {
                    const registeredKeys = Object.keys(project.globalFlags || {});
                    const visKeys = Object.keys(block.visibleIfFlags || {});
                    const hidKeys = Object.keys(block.hiddenIfFlags || {});
                    const allBlockFlagKeys = Array.from(new Set([...registeredKeys, ...visKeys, ...hidKeys]));
                    const orphanCount = visKeys.concat(hidKeys).filter((k) => !registeredKeys.includes(k)).length;

                    return (
                      <div className="bg-slate-900/80 border border-white/5 rounded-lg p-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 text-slate-300 text-xs font-bold">
                            <Sliders className="w-3.5 h-3.5 text-amber-400" />
                            <span>Condiciones de Visibilidad de este Párrafo (Banderas):</span>
                          </div>

                          {orphanCount > 0 && (
                            <button
                              type="button"
                              onClick={() => handlePurgeOrphanBlockFlags(block.id)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                              title="Elimina de este párrafo las condiciones asociadas a banderas borradas"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Limpiar {orphanCount} bandera{orphanCount > 1 ? 's' : ''} eliminada{orphanCount > 1 ? 's' : ''}</span>
                            </button>
                          )}
                        </div>

                        {allBlockFlagKeys.length === 0 ? (
                          <p className="text-[11px] text-slate-500 italic">
                            No hay banderas globales registradas. Puedes crearlas abajo o en la pestaña "Banderas y Variables".
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {/* Visible if flags */}
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                <Eye className="w-3 h-3 text-emerald-400" />
                                Mostrar SOLO si se cumplen TODAS estas banderas:
                              </label>
                              <div className="bg-black/60 border border-white/10 rounded-lg p-2 max-h-32 overflow-y-auto space-y-1">
                                {allBlockFlagKeys.map((fk) => {
                                  const isChecked = !!block.visibleIfFlags?.[fk];
                                  const isDeleted = !registeredKeys.includes(fk);
                                  return (
                                    <label key={`blk_vis_${block.id}_${fk}`} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleToggleBlockFlagCondition(block.id, 'visibleIf', fk)}
                                        className="accent-emerald-500 rounded"
                                      />
                                      <span className={isChecked ? 'font-bold text-emerald-300 font-mono' : 'font-mono'}>
                                        {fk}
                                        {isDeleted && <span className="ml-1.5 text-[10px] text-rose-400 font-sans font-bold">(⚠️ Eliminada)</span>}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Hidden if flags */}
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-rose-400 flex items-center gap-1">
                                <EyeOff className="w-3 h-3 text-rose-400" />
                                Ocultar si se cumple CUALQUIERA de estas banderas:
                              </label>
                              <div className="bg-black/60 border border-white/10 rounded-lg p-2 max-h-32 overflow-y-auto space-y-1">
                                {allBlockFlagKeys.map((fk) => {
                                  const isChecked = !!block.hiddenIfFlags?.[fk];
                                  const isDeleted = !registeredKeys.includes(fk);
                                  return (
                                    <label key={`blk_hid_${block.id}_${fk}`} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleToggleBlockFlagCondition(block.id, 'hiddenIf', fk)}
                                        className="accent-rose-500 rounded"
                                      />
                                      <span className={isChecked ? 'font-bold text-rose-300 font-mono' : 'font-mono'}>
                                        {fk}
                                        {isDeleted && <span className="ml-1.5 text-[10px] text-rose-400 font-sans font-bold">(⚠️ Eliminada)</span>}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                    {/* Inline Flag Creator */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] text-slate-400 font-medium">¿Crear nueva bandera global desde este párrafo?</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={inlineFlagName}
                          onChange={(e) => setInlineFlagName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (inlineFlagName.trim()) {
                                handleAddGlobalFlag(inlineFlagName);
                                setInlineFlagName('');
                              }
                            }
                          }}
                          placeholder="ej: linterna_encendida"
                          className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono outline-none focus:border-amber-500 w-40"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (inlineFlagName.trim()) {
                              handleAddGlobalFlag(inlineFlagName);
                              setInlineFlagName('');
                            }
                          }}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow transition-colors"
                        >
                          + Crear
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
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
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-amber-400 font-medium border border-white/10 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Marcar Palabra Clave</span>
            </button>
          </div>
        </div>

        {/* Hotspots / Keywords Summary for Scene */}
        <div className="bg-[#0f0f12] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h3 className="font-medium text-white text-base flex items-center gap-2">
                <MousePointer className="w-4 h-4 text-amber-500" />
                <span>Resumen General de Palabras Clave de la Escena ({activeScene?.hotspots.length || 0})</span>
              </h3>
              <p className="text-xs text-white/40 mt-0.5">
                Listado completo de palabras interactivas de esta escena.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {activeScene.hotspots.map((hs) => (
                <div
                  key={hs.id}
                  onClick={() => setActiveHotspotForEdit(hs)}
                  className="bg-black/40 border border-white/10 hover:border-amber-500/50 rounded-xl p-3.5 cursor-pointer transition-all shadow-sm group"
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
                      className="p-1 text-white/30 hover:text-rose-400 cursor-pointer"
                      title="Eliminar palabra clave"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Actions summary badges */}
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
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
      </>
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
          onAddGlobalFlag={handleAddGlobalFlag}
        />
      )}

      {/* Dialogue Editor Modal Overlay */}
      {editingDialogueContext && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-950 border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                <span>Editor de Árbol de Diálogo de la Escena</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingDialogueContext(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <DialogueEditor
                project={project}
                dialogue={editingDialogueContext.dialogue}
                onChange={(updatedDialogue) => {
                  if (editingDialogueContext.type === 'block') {
                    handleUpdateBlockDialogue(editingDialogueContext.blockId, updatedDialogue);
                  } else if (
                    editingDialogueContext.type === 'hotspot' &&
                    editingDialogueContext.hotspotId
                  ) {
                    handleUpdateHotspotDialogue(
                      editingDialogueContext.hotspotId,
                      editingDialogueContext.actionId,
                      updatedDialogue
                    );
                  }
                  setEditingDialogueContext((prev) =>
                    prev ? { ...prev, dialogue: updatedDialogue } : null
                  );
                }}
                webAspect="classic"
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setEditingDialogueContext(null)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow"
              >
                Guardar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
