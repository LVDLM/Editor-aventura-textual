import React, { useState, useEffect } from 'react';
import { GameProject, Hotspot, VerbType, InventoryItem, SaveSlotData } from '../types';
import { THEME_CONFIGS } from '../utils/themeStyles';
import { ALL_VERBS } from '../utils/verbs';
import { playSound } from '../utils/audio';
import {
  Eye,
  Zap,
  DoorOpen,
  Hand,
  MessageSquare,
  Move,
  Footprints,
  Key,
  BookOpen,
  Flashlight,
  Box,
  RotateCcw,
  Sparkles,
  HelpCircle,
  X,
  CheckCircle2,
  Compass,
  Shield,
  PackageCheck,
  Save,
  Skull,
  Bookmark,
  ArrowRight,
  ArrowDown,
  Play,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GamePlayerProps {
  project: GameProject;
  updateProject?: (fn: (prev: GameProject) => GameProject) => void;
  gameState: {
    currentSceneId: string;
    inventory: string[];
    flags: Record<string, boolean>;
    appendedTextsPerScene: Record<string, string[]>;
    history: { id: string; type: 'story' | 'response' | 'system'; text: string }[];
    usedHotspotIds?: string[];
    difficulty?: 'facil' | 'normal';
  };
  setGameState: React.Dispatch<React.SetStateAction<any>>;
  onReset: () => void;
  onOpenSaveLoad?: () => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Key: ({ className }) => <Key className={className} />,
  BookOpen: ({ className }) => <BookOpen className={className} />,
  Flashlight: ({ className }) => <Flashlight className={className} />,
  Box: ({ className }) => <Box className={className} />,
  Skull: ({ className }) => <Skull className={className} />,
};

export const GamePlayer: React.FC<GamePlayerProps> = ({
  project,
  updateProject,
  gameState,
  setGameState,
  onReset,
  onOpenSaveLoad,
}) => {
  const [activeVerb, setActiveVerb] = useState<VerbType | null>(null);
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState<string | null>(null);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<{
    type: 'action' | 'item' | 'gameover';
    title?: string;
    verbIconName?: string;
    isAutosaved?: boolean;
    isGameOver?: boolean;
    itemImageUrl?: string;
    message: string;
  } | null>(null);
  
  // Direct click word context menu modal
  const [contextMenu, setContextMenu] = useState<{
    hotspotId: string;
    word: string;
    x: number;
    y: number;
  } | null>(null);

  const themeConfig = THEME_CONFIGS[project.theme] || THEME_CONFIGS['classic-retro'];
  const currentScene = project.scenes.find((s) => s.id === gameState.currentSceneId) || project.scenes[0];

  const isSceneGameOver =
    !!gameState.isGameOver ||
    (currentScene?.textBlocks || []).some(
      (b) => b.isGameOver || /\[(?:Terminar \/ Cargar partida|Terminar|Cargar partida|Fin de partida)\]/i.test(b.text)
    ) ||
    ((currentScene && gameState.appendedTextsPerScene[currentScene.id]) || []).some((t) =>
      /\[(?:Terminar \/ Cargar partida|Terminar|Cargar partida|Fin de partida)\]/i.test(t)
    );

  const checkConditions = (visibleFlags?: Record<string, boolean>, hiddenFlags?: Record<string, boolean>) => {
    if (visibleFlags) {
      for (const [k, v] of Object.entries(visibleFlags)) {
        if (!!gameState.flags[k] !== !!v) return false;
      }
    }
    if (hiddenFlags) {
      for (const [k, v] of Object.entries(hiddenFlags)) {
        if (!!gameState.flags[k] === !!v) return false;
      }
    }
    return true;
  };

  const handleSelectVerb = (verb: VerbType) => {
    playSound('select');
    if (activeVerb === verb) {
      setActiveVerb(null);
    } else {
      setActiveVerb(verb);
    }
  };

  const handleSelectInventoryItem = (itemId: string) => {
    playSound('select');
    const item = project.inventoryItems.find((i) => i.id === itemId);

    if (selectedInventoryItemId === itemId) {
      setSelectedInventoryItemId(null);
    } else {
      setSelectedInventoryItemId(itemId);
    }

    if (item) {
      const isItemGameOver = !!item.isGameOver || /\[Terminar|\[Cargar partida|\[Fin de partida\]/i.test(item.description || '');
      const rawDesc = item.description || 'Sin descripción adicional.';
      const cleanDesc = rawDesc.replace(/\[(?:Terminar \/ Cargar partida|Terminar|Cargar partida|Fin de partida)\]/gi, '').trim();

      setModalFeedback({
        type: isItemGameOver ? 'gameover' : 'item',
        title: item.name,
        verbIconName: isItemGameOver ? 'Skull' : 'Eye',
        isGameOver: isItemGameOver,
        itemImageUrl: item.imageFileData || item.imageUrl,
        message: cleanDesc,
      });
    }
  };

  const handleClearCommand = () => {
    playSound('click');
    setActiveVerb(null);
    setSelectedInventoryItemId(null);
    setContextMenu(null);
  };

  const handleExecuteAction = (hotspot: Hotspot, verbOverride?: VerbType) => {
    const verbToUse = verbOverride || activeVerb || 'mirar';
    playSound('click');

    const verbObj = ALL_VERBS.find((v) => v.id === verbToUse);
    const verbIconName = verbObj?.iconName || 'Eye';
    const actionTitle = verbObj
      ? `${verbObj.label}: ${hotspot.label || hotspot.word}`
      : (hotspot.label || hotspot.word);

    // Find all matching action rules for this verb
    const matchingRules = hotspot.actions.filter((a) => {
      if (a.verb !== verbToUse) return false;
      // Check required item
      if (a.requiredItemId) {
        if (selectedInventoryItemId !== a.requiredItemId && !gameState.inventory.includes(a.requiredItemId)) {
          return false;
        }
      }
      // Check required flags & conditions
      if (a.requiredFlags && !checkConditions(a.requiredFlags)) return false;
      if (!checkConditions(a.visibleIfFlags, a.hiddenIfFlags)) return false;
      return true;
    });

    const useKey = `${hotspot.id}_${verbToUse}`;
    const currentUseCount = gameState.verbUseCounts?.[useKey] || 0;
    const ruleIndex = matchingRules.length > 0 ? Math.min(currentUseCount, matchingRules.length - 1) : -1;
    const rule = ruleIndex >= 0 ? matchingRules[ruleIndex] : null;

    let messageToShow: string | null = null;

    if (rule) {
      // If action appends text to paragraph, display full paragraph directly in story (no response popup message)
      if (rule.stateChange?.appendStoryText) {
        messageToShow = null;
      } else if (rule.responseMessage) {
        messageToShow = rule.responseMessage;
      }

      const sc = rule.stateChange;
      const itemObj = sc?.addItemId ? project.inventoryItems.find((i) => i.id === sc.addItemId) : null;
      const willPickupItem = !!(itemObj && !gameState.inventory.includes(sc!.addItemId!));
      const isAutosaveTriggered = willPickupItem || !!sc?.goToSceneId;
      const isRuleGameOver = !!rule.isGameOver || !!rule.stateChange?.isGameOver || /\[Terminar|\[Cargar partida|\[Fin de partida\]/i.test(rule.responseMessage || '');

      setGameState((prev: any) => {
        const newFlags = { ...prev.flags, ...(sc?.setFlags || {}) };
        let newInventory = [...prev.inventory];
        let nextSceneId = prev.currentSceneId;
        const newAppended = { ...prev.appendedTextsPerScene };

        const currentUsedHotspots = prev.usedHotspotIds || [];
        const newUsedHotspots = currentUsedHotspots.includes(hotspot.id)
          ? currentUsedHotspots
          : [...currentUsedHotspots, hotspot.id];

        const newVerbUseCounts = {
          ...(prev.verbUseCounts || {}),
          [useKey]: (prev.verbUseCounts?.[useKey] || 0) + 1,
        };

        if (sc?.addItemId && !newInventory.includes(sc.addItemId)) {
          newInventory.push(sc.addItemId);
        }

        if (sc?.removeItemId) {
          newInventory = newInventory.filter((id) => id !== sc.removeItemId);
        }

        if (sc?.appendStoryText) {
          const currentList = newAppended[prev.currentSceneId] || [];
          if (!currentList.includes(sc.appendStoryText)) {
            newAppended[prev.currentSceneId] = [...currentList, sc.appendStoryText];
          }
        }

        if (sc?.goToSceneId) {
          nextSceneId = sc.goToSceneId;
        }

        const newHistory = [
          ...prev.history,
          { id: Date.now().toString(), type: 'response', text: rule.responseMessage || 'Acción ejecutada' },
        ];

        // Trigger Autosave side-effects if item received or scene changed
        if (isAutosaveTriggered) {
          setTimeout(() => {
            setShowSaveNotification(true);
            setTimeout(() => setShowSaveNotification(false), 2400);
          }, 0);

          const currentSceneObj = project.scenes.find((s) => s.id === nextSceneId);
          const autosaveData: SaveSlotData = {
            id: 'autosave',
            timestamp: new Date().toLocaleString('es-ES'),
            gameId: project.id,
            gameTitle: project.title,
            currentSceneId: nextSceneId,
            currentSceneName: currentSceneObj?.name || 'Escena',
            inventoryItemIds: newInventory,
            flags: newFlags,
            narrativeHistory: newHistory,
            appendedTextsPerScene: newAppended,
            usedHotspotIds: newUsedHotspots,
            difficulty: prev.difficulty || 'facil',
          };
          try {
            localStorage.setItem(
              `text_adventure_save_slot_${project.id}_autosave`,
              JSON.stringify(autosaveData)
            );
          } catch (e) {
            console.error('Error in autosave:', e);
          }
        }

        return {
          ...prev,
          flags: newFlags,
          inventory: newInventory,
          currentSceneId: nextSceneId,
          appendedTextsPerScene: newAppended,
          usedHotspotIds: newUsedHotspots,
          verbUseCounts: newVerbUseCounts,
          isGameOver: prev.isGameOver || isRuleGameOver,
          history: newHistory,
        };
      });

      if (isRuleGameOver) {
        playSound('error');
        const rawMsg = messageToShow || rule.responseMessage || 'Has alcanzado un desenlace fatal.';
        setModalFeedback({
          type: 'gameover',
          title: 'FIN DE PARTIDA',
          verbIconName: 'Skull',
          isGameOver: true,
          message: rawMsg.replace(/\[(?:Terminar \/ Cargar partida|Terminar|Cargar partida|Fin de partida)\]/gi, '').trim(),
        });
      } else if (willPickupItem && itemObj) {
        playSound('pickup');
        const itemMsg = `¡Has conseguido: ${itemObj.name}!`;
        setModalFeedback({
          type: 'item',
          title: itemObj.name,
          verbIconName: 'Hand',
          isAutosaved: true,
          itemImageUrl: itemObj.imageFileData || itemObj.imageUrl,
          message: messageToShow ? `${messageToShow}\n\n${itemMsg}` : itemMsg,
        });
      } else if (messageToShow) {
        setModalFeedback({
          type: 'action',
          title: actionTitle,
          verbIconName,
          message: messageToShow.replace(/\[(?:Terminar \/ Cargar partida|Terminar|Cargar partida|Fin de partida)\]/gi, '').trim(),
        });
      }

      if (sc?.goToSceneId) {
        playSound('door');
      }
    } else {
      // Fallback message popup
      const fallback =
        (hotspot.customDefaultResponses && hotspot.customDefaultResponses[verbToUse]) ||
        (project.defaultResponses && project.defaultResponses[verbToUse]) ||
        'Eso no parece surtir efecto.';

      messageToShow = fallback;
      playSound('error');

      setGameState((prev: any) => {
        const currentUsedHotspots = prev.usedHotspotIds || [];
        return {
          ...prev,
          usedHotspotIds: currentUsedHotspots.includes(hotspot.id)
            ? currentUsedHotspots
            : [...currentUsedHotspots, hotspot.id],
        };
      });

      setModalFeedback({
        type: 'action',
        title: actionTitle,
        verbIconName,
        message: fallback,
      });
    }

    // Reset command state
    setActiveVerb(null);
    setSelectedInventoryItemId(null);
    setContextMenu(null);
  };

  const handleWordClick = (hotspot: Hotspot, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSceneGameOver || gameState.isGameOver || modalFeedback?.isGameOver) return;
    if (activeVerb) {
      // Direct action execution
      handleExecuteAction(hotspot, activeVerb);
    } else {
      // Show context popover
      const rect = e.currentTarget.getBoundingClientRect();
      setContextMenu({
        hotspotId: hotspot.id,
        word: hotspot.word,
        x: Math.min(rect.left, window.innerWidth - 220),
        y: rect.bottom + 8,
      });
      playSound('select');
    }
  };

  // Render text with highlighted interactive words depending on difficulty mode
  const renderInteractiveText = (text: string) => {
    if (!text) return text;
    if (isSceneGameOver || gameState.isGameOver) return text;
    if (!currentScene || !currentScene.hotspots) return text;

    // Visible hotspots
    const activeHotspots = currentScene.hotspots.filter((h) => {
      if (!h.initialVisible) return false;
      return checkConditions(h.visibleIfFlags, h.hiddenIfFlags);
    });

    if (activeHotspots.length === 0) return text;

    // Create a regex matching any hotspot word
    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sortedHotspots = [...activeHotspots].sort((a, b) => b.word.length - a.word.length);
    const pattern = new RegExp(`(${sortedHotspots.map((h) => escapeRegExp(h.word)).join('|')})`, 'gi');

    const parts = text.split(pattern);
    const isNormalMode = gameState.difficulty === 'normal';
    const usedHotspots = gameState.usedHotspotIds || [];

    return parts.map((part, idx) => {
      const matchedHotspot = sortedHotspots.find(
        (h) => h.word.toLowerCase() === part.toLowerCase()
      );

      if (matchedHotspot) {
        const isUsed = usedHotspots.includes(matchedHotspot.id);

        if (isNormalMode && !isUsed) {
          // Normal mode before being used: render like standard text, clickable but without highlight or hover indicator
          return (
            <span
              key={idx}
              onClick={(e) => handleWordClick(matchedHotspot, e)}
              className="inline-block cursor-pointer"
            >
              {part}
            </span>
          );
        } else {
          // Easy mode, OR Normal mode after being used: render highlighted
          return (
            <span
              key={idx}
              onClick={(e) => handleWordClick(matchedHotspot, e)}
              className={`${themeConfig.hotspotClass} ${themeConfig.hotspotHoverClass} inline-block cursor-pointer transition-colors duration-150`}
              title={`Clic para interactuar con "${matchedHotspot.label || matchedHotspot.word}"`}
            >
              {part}
            </span>
          );
        }
      }
      return <span key={idx}>{part}</span>;
    });
  };

  // Parses [Terminar / Cargar partida] or similar bracket tags into interactive End Game action bars
  const renderTextWithTags = (rawText: string, isBlockGameOver?: boolean) => {
    if (!rawText) return null;

    const tagRegex = /(\[(?:Terminar \/ Cargar partida|Terminar|Cargar partida|Fin de partida)\])/gi;
    const parts = rawText.split(tagRegex);
    const hasTag = /\[(?:Terminar \/ Cargar partida|Terminar|Cargar partida|Fin de partida)\]/i.test(rawText);

    const renderedContent = parts.map((part, index) => {
      const matchTag = part.match(/\[(?:Terminar \/ Cargar partida|Terminar|Cargar partida|Fin de partida)\]/i);
      if (matchTag) {
        const tagText = matchTag[0].toLowerCase();
        const showRestart = tagText.includes('terminar') || tagText.includes('fin');
        const showLoad = tagText.includes('cargar') || tagText.includes('terminar');

        return (
          <div
            key={index}
            className="my-4 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-sm"
          >
            <div className="flex items-center gap-2.5 text-rose-300 font-bold text-xs uppercase tracking-wider">
              <Skull className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
              <span>Fin de la Historia</span>
            </div>
            <div className="flex items-center gap-2">
              {showRestart && (
                <button
                  onClick={onReset}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Terminar / Reiniciar</span>
                </button>
              )}
              {showLoad && onOpenSaveLoad && (
                <button
                  onClick={onOpenSaveLoad}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Bookmark className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Cargar partida</span>
                </button>
              )}
            </div>
          </div>
        );
      }
      return (
        <React.Fragment key={index}>
          {isSceneGameOver || isBlockGameOver || hasTag || gameState.isGameOver
            ? part
            : renderInteractiveText(part)}
        </React.Fragment>
      );
    });

    if (isBlockGameOver && !hasTag) {
      return (
        <>
          {renderedContent}
          <div className="my-4 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-sm">
            <div className="flex items-center gap-2.5 text-rose-300 font-bold text-xs uppercase tracking-wider">
              <Skull className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
              <span>Fin de la Historia</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onReset}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Terminar / Reiniciar</span>
              </button>
              {onOpenSaveLoad && (
                <button
                  onClick={onOpenSaveLoad}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Bookmark className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Cargar partida</span>
                </button>
              )}
            </div>
          </div>
        </>
      );
    }

    return renderedContent;
  };

  const getVerbIcon = (iconName: string) => {
    switch (iconName) {
      case 'Eye': return <Eye className="w-5 h-5" />;
      case 'Zap': return <Zap className="w-5 h-5" />;
      case 'DoorOpen': return <DoorOpen className="w-5 h-5" />;
      case 'Hand': return <Hand className="w-5 h-5" />;
      case 'MessageSquare': return <MessageSquare className="w-5 h-5" />;
      case 'Move': return <Move className="w-5 h-5" />;
      case 'Footprints': return <Footprints className="w-5 h-5" />;
      default: return <Eye className="w-5 h-5" />;
    }
  };

  // Selected item object
  const selectedItemObj = project.inventoryItems.find((i) => i.id === selectedInventoryItemId);

  return (
    <div className={`min-h-[calc(100vh-60px)] ${themeConfig.bgClass} ${themeConfig.fontFamily} py-6 px-4 transition-colors duration-300`}>
      <div className="max-w-4xl mx-auto flex flex-col gap-5">

        {/* Floating Auto-save Notification Toast */}
        <AnimatePresence>
          {showSaveNotification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="fixed top-16 right-6 z-50 bg-slate-900/95 border border-emerald-500/40 text-emerald-300 px-3.5 py-2 rounded-xl font-mono text-xs shadow-xl backdrop-blur-md flex items-center gap-2.5"
            >
              <motion.div
                animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.25, 1] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              >
                <Save className="w-4 h-4 text-emerald-400" />
              </motion.div>
              <span className="font-bold text-[11px] uppercase tracking-wider text-emerald-300">
                Progreso Autoguardado
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scene Header with Difficulty Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Compass className={`w-5 h-5 ${themeConfig.accentClass}`} />
            <h2 className={`font-bold text-xl ${themeConfig.textMainClass}`}>
              {currentScene?.name || 'Escena'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Difficulty Selector */}
            <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-1 text-xs shadow-inner">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 px-2 flex items-center gap-1">
                <Shield className="w-3 h-3 text-amber-400" />
                Modo:
              </span>
              <button
                onClick={() => setGameState((prev: any) => ({ ...prev, difficulty: 'facil' }))}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  (gameState.difficulty || 'facil') === 'facil'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Modo Fácil: Palabras con acción destacadas siempre"
              >
                Fácil
              </button>
              <button
                onClick={() => setGameState((prev: any) => ({ ...prev, difficulty: 'normal' }))}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  gameState.difficulty === 'normal'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Modo Normal: Palabras sin destacar hasta serusadas"
              >
                Normal
              </button>
            </div>

            <button
              onClick={onReset}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>
          </div>
        </div>

        {/* Sentence Builder Bar (LucasArts Style Command Bar) */}
        <div className={`p-3.5 rounded-xl border ${themeConfig.accentBorderClass} ${themeConfig.accentBgClass} flex items-center justify-between gap-3 shadow-sm`}>
          <div className="flex items-center gap-2 font-bold text-base tracking-wide text-amber-300">
            <span className="text-amber-400 text-sm font-semibold uppercase tracking-wider">Acción:</span>
            <span>
              {activeVerb ? activeVerb.toUpperCase() : 'SELECCIONAR ACCIÓN...'}
            </span>
            {selectedItemObj && (
              <span className="text-amber-200">
                [{selectedItemObj.name}]
              </span>
            )}
            {!activeVerb && !selectedItemObj && (
              <span className="text-xs font-normal text-slate-400 italic">
                (Haz clic en un verbo abajo o directamente sobre una palabra destacada)
              </span>
            )}
          </div>

          {(activeVerb || selectedItemObj) && (
            <button
              onClick={handleClearCommand}
              className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 text-xs hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>

        {/* Main Narrative Card */}
        <div className={`p-6 sm:p-8 rounded-2xl border ${themeConfig.cardBorderClass} ${themeConfig.cardBgClass} shadow-xl relative overflow-hidden`}>
          {/* Subtle grid pattern background */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {currentScene?.type === 'portada' && (
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest mb-4 pb-2 border-b border-amber-500/20">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Escena de Portada</span>
            </div>
          )}

          {currentScene?.type === 'introduccion' && (
            <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-widest mb-4 pb-2 border-b border-sky-500/20">
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span>Escena de Introducción</span>
            </div>
          )}
          
          {/* Main Story Text Blocks */}
          <div className={`space-y-6 text-lg leading-relaxed ${themeConfig.textMainClass} relative z-10`}>
            {currentScene?.textBlocks.map((block) => {
              if (!checkConditions(block.visibleIfFlags, block.hiddenIfFlags)) {
                return null;
              }
              const blockImg = block.imageFileData || block.imageUrl;
              const isPortada = block.type === 'portada' || currentScene?.type === 'portada';
              const isIntro = block.type === 'introduccion' || currentScene?.type === 'introduccion';
              const hasText = !!(block.text && block.text.trim().length > 0);

              return (
                <div
                  key={block.id}
                  id={`block-${block.id}`}
                  className="tracking-wide space-y-3 transition-all"
                >
                  {blockImg && (
                    <div className="w-full text-center">
                      <img
                        src={blockImg}
                        alt="Ilustración"
                        className={
                          isPortada
                            ? 'w-full max-h-[380px] object-cover rounded-2xl border-2 border-amber-500/50 shadow-2xl mx-auto'
                            : 'w-full max-h-[280px] object-cover rounded-xl border border-white/10 shadow-lg mx-auto'
                        }
                      />
                    </div>
                  )}

                  {hasText && renderTextWithTags(block.text, block.isGameOver)}
                </div>
              );
            })}

            {/* Appended Story Paragraphs */}
            {(gameState.appendedTextsPerScene[gameState.currentSceneId] || []).map((appended, i) => (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                key={i}
                className="tracking-wide"
              >
                {renderTextWithTags(appended)}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Action & Item Outcome Pop-up Modal */}
        <AnimatePresence>
          {modalFeedback && (
            <div
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setModalFeedback(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-lg p-6 rounded-2xl border ${
                  modalFeedback.type === 'gameover' || modalFeedback.isGameOver
                    ? 'border-2 border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.35)] bg-slate-950/95'
                    : modalFeedback.type === 'item'
                    ? 'border-2 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)] bg-slate-900'
                    : `${themeConfig.cardBorderClass} ${themeConfig.cardBgClass} shadow-2xl`
                } space-y-4`}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    {modalFeedback.type === 'gameover' || modalFeedback.isGameOver ? (
                      <Skull className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
                    ) : modalFeedback.type === 'item' ? (
                      <PackageCheck className="w-5 h-5 text-amber-400 shrink-0" />
                    ) : (
                      <div className={`w-5 h-5 ${themeConfig.accentClass} flex items-center justify-center shrink-0`}>
                        {getVerbIcon(modalFeedback.verbIconName || 'Eye')}
                      </div>
                    )}

                    <h3
                      className={`font-bold text-base ${
                        modalFeedback.type === 'gameover' || modalFeedback.isGameOver
                          ? 'text-rose-300'
                          : modalFeedback.type === 'item'
                          ? 'text-amber-300'
                          : themeConfig.textMainClass
                      }`}
                    >
                      {modalFeedback.title ||
                        (modalFeedback.type === 'gameover' || modalFeedback.isGameOver
                          ? 'FIN DE PARTIDA'
                          : modalFeedback.type === 'item'
                          ? 'Objeto'
                          : '')}
                    </h3>

                    {modalFeedback.isAutosaved && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-mono shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                        title="Partida guardada automáticamente"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.25, 1], rotate: [0, -12, 12, 0] }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                          className="flex items-center justify-center"
                        >
                          <Save className="w-3.5 h-3.5 text-emerald-400" />
                        </motion.div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                          Guardado
                        </span>
                      </motion.div>
                    )}
                  </div>
                  <button
                    onClick={() => setModalFeedback(null)}
                    className="p-1 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="py-2 space-y-3">
                  {modalFeedback.itemImageUrl && (
                    <div className="w-full text-center py-1">
                      <img
                        src={modalFeedback.itemImageUrl}
                        alt={modalFeedback.title || 'Objeto'}
                        className="max-h-48 max-w-full rounded-xl border border-amber-500/40 object-contain mx-auto shadow-lg"
                      />
                    </div>
                  )}
                  <p
                    className={`text-base leading-relaxed whitespace-pre-line ${
                      modalFeedback.type === 'gameover' || modalFeedback.isGameOver
                        ? 'text-rose-100 font-medium'
                        : modalFeedback.type === 'item'
                        ? 'text-amber-100 font-medium'
                        : `${themeConfig.textMainClass} italic`
                    }`}
                  >
                    {modalFeedback.message}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                  {modalFeedback.type === 'gameover' || modalFeedback.isGameOver ? (
                    <>
                      <button
                        onClick={() => {
                          setModalFeedback(null);
                          onReset();
                        }}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Terminar / Reiniciar</span>
                      </button>
                      {onOpenSaveLoad && (
                        <button
                          onClick={() => {
                            setModalFeedback(null);
                            onOpenSaveLoad();
                          }}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Bookmark className="w-4 h-4 text-emerald-300" />
                          <span>Cargar partida</span>
                        </button>
                      )}
                      <button
                        onClick={() => setModalFeedback(null)}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors"
                      >
                        Cerrar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setModalFeedback(null)}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer"
                    >
                      Entendido
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Verbs Palette & Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* SCUMM Verbs Panel (2 columns) */}
          <div className={`md:col-span-2 p-5 rounded-2xl border ${themeConfig.cardBorderClass} ${themeConfig.cardBgClass} shadow-lg`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMutedClass}`}>
                Acciones de Aventura (Verbos)
              </h3>
              <span className="text-[11px] text-slate-500">Haz clic para activar acción</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {ALL_VERBS.map((v) => {
                const isActive = activeVerb === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => handleSelectVerb(v.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 border ${
                      isActive
                        ? `${themeConfig.verbActiveBg} ${themeConfig.verbActiveText} border-amber-400 shadow-md scale-[1.02]`
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-amber-500/50 hover:text-amber-300'
                    }`}
                  >
                    {getVerbIcon(v.iconName)}
                    <span>{v.label.split(' / ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inventory Panel (1 column) */}
          <div className={`p-5 rounded-2xl border ${themeConfig.cardBorderClass} ${themeConfig.cardBgClass} shadow-lg flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMutedClass}`}>
                  Inventario ({gameState.inventory.length})
                </h3>
              </div>

              {gameState.inventory.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl">
                  <Box className="w-7 h-7 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 italic">No llevas ningún objeto todavía.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {gameState.inventory.map((itemId) => {
                    const item = project.inventoryItems.find((i) => i.id === itemId);
                    if (!item) return null;
                    const isSelected = selectedInventoryItemId === itemId;
                    const IconComp = ICON_MAP[item.icon] || Box;

                    return (
                      <button
                        key={itemId}
                        onClick={() => handleSelectInventoryItem(itemId)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow'
                            : 'bg-slate-950/60 border-slate-800 text-slate-200 hover:border-amber-500/40 hover:text-amber-300'
                        }`}
                        title={item.description}
                      >
                        <div className="flex items-center gap-2">
                          <IconComp className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </div>
                        {isSelected && <span className="text-[10px] uppercase font-extrabold tracking-wider bg-slate-950 text-amber-400 px-1.5 py-0.5 rounded">Usando</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedItemObj && (
              <div className="mt-3 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 text-xs">
                <p className="font-semibold text-amber-300 mb-0.5">{selectedItemObj.name}</p>
                <p className="text-[11px] text-slate-400 leading-tight">{selectedItemObj.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Word Direct Click Context Popover Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="fixed z-50 bg-slate-900 border border-amber-500/50 rounded-xl shadow-2xl p-3 min-w-[200px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs font-bold text-amber-400 truncate max-w-[140px]">
                "{contextMenu.word}"
              </span>
              <button
                onClick={() => setContextMenu(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {ALL_VERBS.map((v) => {
                const hs = currentScene?.hotspots.find((h) => h.id === contextMenu.hotspotId);
                return (
                  <button
                    key={v.id}
                    onClick={() => {
                      if (hs) handleExecuteAction(hs, v.id);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-slate-950 hover:bg-amber-500 hover:text-slate-950 border border-slate-800 transition-colors"
                  >
                    {getVerbIcon(v.iconName)}
                    <span>{v.label.split(' / ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};
