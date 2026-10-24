import React, { useState, useEffect } from 'react';
import { GameProject, Hotspot, VerbType, ActionRule, InventoryItem, SaveSlotData, AppendedTextEntry, DialogueOption, DialogueBlock, GameCharacter, Scene } from '../types';
import { THEME_CONFIGS } from '../utils/themeStyles';
import { renderTextWithLinks, isWordMatchInText } from '../utils/textUtils';
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
  Info,
  Award,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Palette,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GamePlayerProps {
  project: GameProject;
  updateProject?: (fn: (prev: GameProject) => GameProject) => void;
  gameState: {
    currentSceneId: string;
    inventory: string[];
    flags: Record<string, boolean>;
    appendedTextsPerScene: Record<string, AppendedTextEntry[]>;
    history: { id: string; type: 'story' | 'response' | 'system'; text: string }[];
    usedHotspotIds?: string[];
    difficulty?: 'facil' | 'normal' | 'dificil';
  };
  setGameState: React.Dispatch<React.SetStateAction<any>>;
  onReset: () => void;
  onOpenSaveLoad?: () => void;
  isHeaderCollapsed?: boolean;
  setIsHeaderCollapsed?: (collapsed: boolean) => void;
  soundEnabled?: boolean;
  toggleSound?: () => void;
  isSceneTesting?: boolean;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Key: ({ className }) => <Key className={className} />,
  BookOpen: ({ className }) => <BookOpen className={className} />,
  Flashlight: ({ className }) => <Flashlight className={className} />,
  Box: ({ className }) => <Box className={className} />,
  Skull: ({ className }) => <Skull className={className} />,
};

// Determines if an inventory item is needed in the specified scene
const isItemNeededInScene = (item: InventoryItem, scene?: Scene): boolean => {
  if (!scene) return false;

  // 1. Explicitly required by any hotspot action
  const requiredByAction = (scene.hotspots || []).some((hs) =>
    (hs.actions || []).some((act) => act.requiredItemId === item.id)
  );
  if (requiredByAction) return true;

  // 2. Action removes or changes this item
  const touchesItemState = (scene.hotspots || []).some((hs) =>
    (hs.actions || []).some(
      (act) =>
        act.stateChange?.removeItemId === item.id ||
        act.stateChange?.removeItem2Id === item.id
    )
  );
  if (touchesItemState) return true;

  // 3. Flags: scene hotspots require flags that this item provides
  const neededFlagsInScene = new Set<string>();
  (scene.hotspots || []).forEach((hs) => {
    if (hs.visibleIfFlags) Object.keys(hs.visibleIfFlags).forEach((f) => neededFlagsInScene.add(f));
    if (hs.hiddenIfFlags) Object.keys(hs.hiddenIfFlags).forEach((f) => neededFlagsInScene.add(f));
    (hs.actions || []).forEach((act) => {
      if (act.requiredFlags) Object.keys(act.requiredFlags).forEach((f) => neededFlagsInScene.add(f));
    });
  });

  if (item.useEffectAction?.stateChange?.setFlags) {
    for (const flagKey of Object.keys(item.useEffectAction.stateChange.setFlags)) {
      if (neededFlagsInScene.has(flagKey)) return true;
    }
  }

  if (item.combinations) {
    for (const combo of item.combinations) {
      if (combo.stateChange?.setFlags) {
        for (const flagKey of Object.keys(combo.stateChange.setFlags)) {
          if (neededFlagsInScene.has(flagKey)) return true;
        }
      }
    }
  }

  // 4. Mentioned by name in scene text or hotspots
  const itemNameLower = item.name.toLowerCase().trim();
  if (itemNameLower.length >= 2) {
    const inText = (scene.textBlocks || []).some((b) =>
      b.text.toLowerCase().includes(itemNameLower)
    );
    if (inText) return true;

    const inHotspot = (scene.hotspots || []).some(
      (hs) =>
        hs.word.toLowerCase().includes(itemNameLower) ||
        (hs.label && hs.label.toLowerCase().includes(itemNameLower)) ||
        (hs.actions || []).some((act) => act.responseMessage?.toLowerCase().includes(itemNameLower))
    );
    if (inHotspot) return true;
  }

  // 5. QTE step target
  if (scene.qteConfig?.sequence) {
    const isQteTarget = scene.qteConfig.sequence.some(
      (step) =>
        step.label.toLowerCase().includes(itemNameLower) ||
        (step.word && step.word.toLowerCase().includes(itemNameLower))
    );
    if (isQteTarget) return true;
  }

  return false;
};

// Filter progressive text for QTE scenes: [1] appears after action 1, [2] after action 2, etc.
const filterQTEProgressiveText = (rawText: string, stepIndex: number, isFinished: boolean): string => {
  if (!/\[\d+\]/.test(rawText)) {
    return rawText;
  }

  const parts = rawText.split(/(?=\[\d+\])/g);
  const result: string[] = [];

  for (const part of parts) {
    const match = part.match(/^\s*\[(\d+)\]\s*([\s\S]*)$/);
    if (!match) {
      // Initial text before any [N] tag
      result.push(part.trim());
    } else {
      const targetStep = parseInt(match[1], 10);
      const textAfterTag = match[2];
      // Revealed when stepIndex >= targetStep (e.g. [1] unlocked after step 0 is completed)
      if (isFinished || stepIndex >= targetStep) {
        result.push(textAfterTag.trim());
      }
    }
  }

  return result.filter(Boolean).join('\n\n');
};

export const GamePlayer: React.FC<GamePlayerProps> = ({
  project,
  updateProject,
  gameState,
  setGameState,
  onReset,
  onOpenSaveLoad,
  isHeaderCollapsed: propIsHeaderCollapsed,
  setIsHeaderCollapsed: propSetIsHeaderCollapsed,
  soundEnabled = true,
  toggleSound,
  isSceneTesting = false,
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
  
  // Details & Credits modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  // Collapsible Header State
  const [localIsHeaderCollapsed, setLocalIsHeaderCollapsed] = useState(false);
  const isHeaderCollapsed = propIsHeaderCollapsed !== undefined ? propIsHeaderCollapsed : localIsHeaderCollapsed;
  const setIsHeaderCollapsed = propSetIsHeaderCollapsed || setLocalIsHeaderCollapsed;

  // Direct click word context menu modal
  const [contextMenu, setContextMenu] = useState<{
    hotspotId: string;
    word: string;
    x: number;
    y: number;
  } | null>(null);

  // Active Pop-up Dialogue Modal state
  const [activeDialogue, setActiveDialogue] = useState<{
    character: GameCharacter;
    blockId?: string;
    currentNodeId: string;
    dialogueBlock: DialogueBlock;
    currentNpcReply?: string;
    receivedItemIds?: string[];
  } | null>(null);

  const closeActiveDialogue = (currentReceivedItems?: string[]) => {
    const itemsToNotify = currentReceivedItems || activeDialogue?.receivedItemIds || [];
    if (itemsToNotify.length > 0) {
      const lastItemId = itemsToNotify[itemsToNotify.length - 1];
      const itemObj = project.inventoryItems.find((i) => i.id === lastItemId);
      if (itemObj) {
        setModalFeedback({
          type: 'action',
          title: 'OBJETO RECIBIDO',
          verbIconName: 'Plus',
          isAutosaved: true,
          itemImageUrl: itemObj.imageFileData || itemObj.imageUrl,
          message: `¡Has conseguido: ${itemObj.name.toUpperCase()}!`,
        });
      }
    }
    setActiveDialogue(null);
  };

  // Quick Time Event (QTE) State
  const [qteTimeLeft, setQteTimeLeft] = useState<number>(0);
  const [qteStepIndex, setQteStepIndex] = useState<number>(0);
  const [qteStatus, setQteStatus] = useState<'active' | 'success' | 'failed' | 'idle'>('idle');
  const [qteMistakeMsg, setQteMistakeMsg] = useState<string | null>(null);

  const currentTheme = project?.theme || 'sepia-parchment';
  const themeConfig = THEME_CONFIGS[currentTheme] || THEME_CONFIGS['sepia-parchment'];
  const isSepia = currentTheme === 'sepia-parchment';
  const currentScene = project.scenes.find((s) => s.id === gameState.currentSceneId) || project.scenes[0];

  const isQTEScene = (currentScene?.type === 'qte' || !!currentScene?.qteConfig) && !!currentScene?.qteConfig?.sequence?.length;

  useEffect(() => {
    setQteMistakeMsg(null);
    if (currentScene?.sfx) {
      playSound(currentScene.sfx);
    }
    if (currentScene && (currentScene.type === 'qte' || currentScene.qteConfig) && currentScene.qteConfig?.sequence?.length) {
      const timeLimit = currentScene.qteConfig.timeLimitSeconds || 10;
      setQteTimeLeft(timeLimit);
      setQteStepIndex(0);
      setQteStatus('active');
    } else {
      setQteStatus('idle');
    }
  }, [gameState.currentSceneId, currentScene?.id]);

  useEffect(() => {
    if (qteStatus !== 'active' || !currentScene?.qteConfig) return;

    const interval = setInterval(() => {
      setQteTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(interval);
          handleQTEFail('¡Tiempo agotado!');
          return 0;
        }
        return +(prev - 0.1).toFixed(1);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [qteStatus, gameState.currentSceneId, currentScene?.id]);

  const handleQTEFail = (reasonMsg?: string) => {
    setQteStatus('failed');
    playSound('error');
    const config = currentScene?.qteConfig;
    const failMsg = reasonMsg || config?.onFailMessage || '¡No lograste reaccionar a tiempo!';

    if (config?.onFailFlag) {
      setGameState((prev: any) => ({
        ...prev,
        flags: {
          ...prev.flags,
          [config.onFailFlag!]: true,
        },
      }));
    }

    if (config?.isFailGameOver) {
      setGameState((prev: any) => ({ ...prev, isGameOver: true }));
      setModalFeedback({
        type: 'gameover',
        title: '⚡ ¡EVENTO DE TIEMPO FALLADO!',
        verbIconName: 'Skull',
        isGameOver: true,
        message: failMsg,
      });
    } else if (config?.onFailSceneId) {
      setModalFeedback({
        type: 'action',
        title: '⚡ ¡TIEMPO AGOTADO!',
        verbIconName: 'Zap',
        message: failMsg,
      });
      setTimeout(() => {
        setGameState((prev: any) => ({
          ...prev,
          currentSceneId: config.onFailSceneId,
        }));
      }, 1200);
    } else {
      setModalFeedback({
        type: 'action',
        title: '⚡ EVENTO FALLADO',
        verbIconName: 'Zap',
        message: failMsg,
      });
    }
  };

  const handleQTESuccess = () => {
    setQteStatus('success');
    playSound('pickup');
    const config = currentScene?.qteConfig;
    const successMsg = config?.onSuccessMessage || '¡Sucesión completada a tiempo con éxito!';

    if (config?.onSuccessFlag) {
      setGameState((prev: any) => ({
        ...prev,
        flags: {
          ...prev.flags,
          [config.onSuccessFlag!]: true,
        },
      }));
    }

    if (config?.onSuccessSceneId) {
      setModalFeedback({
        type: 'action',
        title: '⚡ ¡EVENTO COMPLETADO CON ÉXITO!',
        verbIconName: 'Zap',
        message: successMsg,
      });
      setTimeout(() => {
        setGameState((prev: any) => ({
          ...prev,
          currentSceneId: config.onSuccessSceneId,
        }));
      }, 1200);
    } else {
      setModalFeedback({
        type: 'action',
        title: '⚡ ¡ÉXITO EN EL EVENTO!',
        verbIconName: 'Zap',
        message: successMsg,
      });
    }
  };

  const isSceneGameOver =
    !!gameState.isGameOver ||
    (currentScene?.textBlocks || []).some(
      (b) => b.isGameOver || b.type === 'final' || /\[(?:Terminar \/ Cargar partida|Terminar|Cargar partida|Fin de partida)\]/i.test(b.text)
    ) ||
    currentScene?.type === 'final' ||
    ((currentScene && gameState.appendedTextsPerScene[currentScene.id]) || []).some((t) => {
      const textVal = typeof t === 'string' ? t : t.text;
      return /\[(?:Terminar \/ Cargar partida|Terminar|Cargar partida|Fin de partida)\]/i.test(textVal);
    });

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
    const targetItem = project.inventoryItems.find((i) => i.id === itemId);
    if (!targetItem) return;

    if (selectedInventoryItemId === itemId) {
      // If clicking the same item while 'usar' is active or it has a direct effect, use it!
      if (activeVerb === 'usar' && targetItem.useEffectAction) {
        handleUseInventoryItemDirectly(targetItem);
        return;
      }
      setSelectedInventoryItemId(null);
      return;
    }

    if (selectedInventoryItemId && selectedInventoryItemId !== itemId) {
      const sourceItemId = selectedInventoryItemId;
      const sourceItem = project.inventoryItems.find((i) => i.id === sourceItemId);

      let rule = (targetItem.combinations || []).find((c) => c.requiredItemId === sourceItemId);
      if (!rule && sourceItem) {
        rule = (sourceItem.combinations || []).find((c) => c.requiredItemId === targetItem.id);
      }

      let flagsMatch = true;
      if (rule?.requiredFlags) {
        flagsMatch = Object.entries(rule.requiredFlags).every(([flagKey, expectedVal]) => {
          return !!gameState.flags[flagKey] === expectedVal;
        });
      }

      if (rule && flagsMatch) {
        const sc = rule.stateChange;
        const soundToPlay = rule.soundEffect || 'pickup';
        playSound(soundToPlay);

        setGameState((prev: any) => {
          const newFlags = { ...prev.flags, ...(sc?.setFlags || {}) };
          let newInventory = [...prev.inventory];
          let nextSceneId = prev.currentSceneId;

          if (sc?.addItemId && !newInventory.includes(sc.addItemId)) {
            newInventory.push(sc.addItemId);
          }
          if (sc?.removeItemId) {
            newInventory = newInventory.filter((id) => id !== sc.removeItemId);
          }
          if (sc?.removeItem2Id) {
            newInventory = newInventory.filter((id) => id !== sc.removeItem2Id);
          }
          if (sc?.goToSceneId) {
            nextSceneId = sc.goToSceneId;
          }

          return {
            ...prev,
            flags: newFlags,
            inventory: newInventory,
            currentSceneId: nextSceneId,
          };
        });

        setSelectedInventoryItemId(null);
        setActiveVerb(null);

        const isGameOverCombo = !!rule.isGameOver || !!sc?.isGameOver;

        setModalFeedback({
          type: isGameOverCombo ? 'gameover' : 'item',
          title: `🧩 ${targetItem.name} + ${sourceItem?.name || ''}`,
          verbIconName: isGameOverCombo ? 'Skull' : 'Sparkles',
          isGameOver: isGameOverCombo,
          itemImageUrl: targetItem.imageFileData || targetItem.imageUrl || sourceItem?.imageFileData || sourceItem?.imageUrl,
          message: rule.responseMessage || 'Has combinado los objetos con éxito.',
        });
        return;
      }

      setSelectedInventoryItemId(null);
      setActiveVerb(null);

      if (rule && !flagsMatch && rule.failMessage) {
        setModalFeedback({
          type: 'item',
          title: 'Combinación no disponible',
          verbIconName: 'Info',
          message: rule.failMessage,
        });
      } else {
        setModalFeedback({
          type: 'item',
          title: 'Sin efecto',
          verbIconName: 'Info',
          message: `No parece ocurrir nada al usar ${sourceItem?.name || 'este objeto'} con ${targetItem.name}.`,
        });
      }
      return;
    }

    // If activeVerb is 'usar' and this item has a direct use effect: execute it immediately!
    if (activeVerb === 'usar' && targetItem.useEffectAction) {
      handleUseInventoryItemDirectly(targetItem);
      return;
    }

    setSelectedInventoryItemId(itemId);

    // If activeVerb is 'mirar', show the modal popup with item description
    if (activeVerb === 'mirar') {
      const isItemGameOver = !!targetItem.isGameOver || /\[Terminar|\[Cargar partida|\[Fin de partida\]/i.test(targetItem.description || '');
      const rawDesc = targetItem.description || 'Sin descripción adicional.';
      const cleanDesc = rawDesc.replace(/\[(?:Terminar \/ Cargar partida|Terminar|Cargar partida|Fin de partida)\]/gi, '').trim();

      setModalFeedback({
        type: isItemGameOver ? 'gameover' : 'item',
        title: targetItem.name,
        verbIconName: isItemGameOver ? 'Skull' : 'Eye',
        isGameOver: isItemGameOver,
        itemImageUrl: targetItem.imageFileData || targetItem.imageUrl,
        message: cleanDesc,
      });
    } else {
      // If activeVerb is 'usar' or any other verb (or no verb selected):
      // Set activeVerb to 'usar' so sentence bar reads "Usar [nombre de objeto] con"
      setActiveVerb('usar');
      // Do NOT show the modal feedback popup with object information!
    }
  };

  const handleUseInventoryItemDirectly = (targetItem: InventoryItem) => {
    playSound('select');
    const rule = targetItem.useEffectAction;

    if (!rule) {
      setModalFeedback({
        type: 'item',
        title: targetItem.name,
        verbIconName: 'Info',
        itemImageUrl: targetItem.imageFileData || targetItem.imageUrl,
        message: `No parece que puedas usar ${targetItem.name} por sí solo. Prueba a usarlo con alguna palabra interactiva de la escena o a combinarlo con otro objeto.`,
      });
      return;
    }

    let flagsMatch = true;
    if (rule.requiredFlags) {
      flagsMatch = Object.entries(rule.requiredFlags).every(([flagKey, expectedVal]) => {
        return !!gameState.flags[flagKey] === expectedVal;
      });
    }

    if (!flagsMatch) {
      playSound('error');
      setModalFeedback({
        type: 'item',
        title: targetItem.name,
        verbIconName: 'Info',
        itemImageUrl: targetItem.imageFileData || targetItem.imageUrl,
        message: rule.failMessage || 'No se cumplen las condiciones para usar este objeto en este momento.',
      });
      return;
    }

    // Effect conditions met!
    const sc = rule.stateChange;
    const soundToPlay = rule.soundEffect || 'pickup';
    playSound(soundToPlay);

    setGameState((prev: any) => {
      const newFlags = { ...prev.flags, ...(sc?.setFlags || {}) };
      let newInventory = [...prev.inventory];
      let nextSceneId = prev.currentSceneId;

      if (sc?.addItemId && !newInventory.includes(sc.addItemId)) {
        newInventory.push(sc.addItemId);
      }
      if (sc?.removeItemId) {
        newInventory = newInventory.filter((id: string) => id !== sc.removeItemId);
      }
      if (sc?.goToSceneId) {
        nextSceneId = sc.goToSceneId;
      }

      let newAppendedStoryTexts = { ...prev.appendedStoryTexts };
      if (sc?.appendStoryText && nextSceneId) {
        const currentList = newAppendedStoryTexts[nextSceneId] || [];
        if (!currentList.some((t: any) => (typeof t === 'string' ? t : t.text) === sc.appendStoryText)) {
          newAppendedStoryTexts = {
            ...newAppendedStoryTexts,
            [nextSceneId]: [...currentList, { text: sc.appendStoryText }],
          };
        }
      }

      return {
        ...prev,
        flags: newFlags,
        inventory: newInventory,
        currentSceneId: nextSceneId,
        appendedStoryTexts: newAppendedStoryTexts,
      };
    });

    setSelectedInventoryItemId(null);
    setActiveVerb(null);

    const isGameOverUse = !!rule.isGameOver || !!sc?.isGameOver;

    setModalFeedback({
      type: isGameOverUse ? 'gameover' : 'item',
      title: `✨ ${targetItem.name}`,
      verbIconName: isGameOverUse ? 'Skull' : 'Sparkles',
      isGameOver: isGameOverUse,
      itemImageUrl: targetItem.imageFileData || targetItem.imageUrl,
      message: rule.responseMessage || `Has usado ${targetItem.name}.`,
    });
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

    // If Quick Time Event (QTE) is currently active on this scene
    if (qteStatus === 'active' && currentScene?.qteConfig && currentScene.qteConfig.sequence.length > 0) {
      const expectedStep = currentScene.qteConfig.sequence[qteStepIndex];
      if (expectedStep) {
        const isHotspotMatch = !expectedStep.hotspotId || expectedStep.hotspotId === hotspot.id;
        const isWordMatch = !expectedStep.word || expectedStep.word.toLowerCase() === hotspot.word.toLowerCase();
        const isVerbMatch = !expectedStep.expectedVerb || expectedStep.expectedVerb === verbToUse;

        if ((isHotspotMatch || isWordMatch) && isVerbMatch) {
          setQteMistakeMsg(null);
          const nextStep = qteStepIndex + 1;
          if (nextStep >= currentScene.qteConfig.sequence.length) {
            handleQTESuccess();
          } else {
            setQteStepIndex(nextStep);
            playSound('pickup');
            // Reset timer if per-action mode is active
            if (currentScene.qteConfig.timerMode === 'per_action') {
              setQteTimeLeft(currentScene.qteConfig.timeLimitSeconds || 10);
            }
          }
        } else {
          // Wrong action in QTE sequence -> Penalize time & show inline HUD feedback
          playSound('error');
          const penalty = 2.5;
          setQteMistakeMsg(`⚠️ ¡Acción o verbo incorrecto! (-${penalty}s)`);
          setTimeout(() => setQteMistakeMsg(null), 1800);

          let isTimeOut = false;
          setQteTimeLeft((prev) => {
            const pen = Math.max(0, +(prev - penalty).toFixed(1));
            if (pen <= 0) isTimeOut = true;
            return pen;
          });

          if (isTimeOut || qteTimeLeft - penalty <= 0) {
            handleQTEFail('¡Acción incorrecta y tiempo agotado!');
          }
        }
      }
      // Return early during active QTE so standard useless action modals do not interrupt countdown
      return;
    }

    const verbObj = ALL_VERBS.find((v) => v.id === verbToUse);
    const verbIconName = verbObj?.iconName || 'Eye';

    const selectedItemObj = selectedInventoryItemId
      ? project.inventoryItems.find((i) => i.id === selectedInventoryItemId)
      : null;

    const targetWordLabel = hotspot.label || hotspot.word;
    let actionTitle = '';
    if (selectedItemObj) {
      actionTitle = `Usar ${selectedItemObj.name} con ${targetWordLabel}`;
    } else if (verbObj) {
      actionTitle = `${verbObj.label}: ${targetWordLabel}`;
    } else {
      actionTitle = targetWordLabel;
    }

    // Find all action rules for this verb
    const rulesForVerb = hotspot.actions.filter((a) => a.verb === verbToUse);

    // Filter rules that pass all required item, required flags, and visible/hidden flags
    const matchingRules = rulesForVerb.filter((a) => {
      // Check required item
      if (a.requiredItemId) {
        if (selectedInventoryItemId) {
          if (selectedInventoryItemId !== a.requiredItemId) return false;
        } else {
          if (!gameState.inventory.includes(a.requiredItemId)) return false;
        }
      }
      // Check required flags & conditions
      if (a.requiredFlags && !checkConditions(a.requiredFlags)) return false;
      if (!checkConditions(a.visibleIfFlags, a.hiddenIfFlags)) return false;
      return true;
    });

    // Sort passing rules so rules with specific required flags/items take precedence over unconditional fallback rules
    const getRuleScore = (r: ActionRule) =>
      (r.requiredFlags ? Object.keys(r.requiredFlags).length : 0) + (r.requiredItemId ? 1 : 0);

    matchingRules.sort((r1, r2) => getRuleScore(r2) - getRuleScore(r1));

    // Priority filter: rules with higher specificity/conditions must ALWAYS take precedence over fallback rules!
    const maxScore = matchingRules.length > 0 ? getRuleScore(matchingRules[0]) : 0;
    const topRules = matchingRules.filter((r) => getRuleScore(r) === maxScore);

    const useKey = `${hotspot.id}_${verbToUse}_${maxScore}`;
    const currentUseCount = gameState.verbUseCounts?.[useKey] || 0;
    const ruleIndex = topRules.length > 0 ? Math.min(currentUseCount, topRules.length - 1) : -1;
    const rule = ruleIndex >= 0 ? topRules[ruleIndex] : null;

    const currentSceneObj = project.scenes.find((s) => s.id === gameState.currentSceneId);
    const currentSceneAppended = gameState.appendedTextsPerScene[gameState.currentSceneId] || [];
    const parentBlock = currentSceneObj?.textBlocks.find((b) => {
      if (isWordMatchInText(hotspot.word, b.text)) return true;
      return currentSceneAppended.some((entry: any) => {
        if (typeof entry !== 'string' && entry.blockId === b.id) {
          return isWordMatchInText(hotspot.word, entry.text);
        }
        return false;
      });
    });

    let dialogueToStart: DialogueBlock | null = rule?.dialogue || parentBlock?.dialogue || null;
    let characterToStart: GameCharacter | null =
      (rule?.characterId ? project.characters?.find((c) => c.id === rule.characterId) : null) ||
      (parentBlock?.characterId ? project.characters?.find((c) => c.id === parentBlock.characterId) : null) ||
      null;

    if (verbToUse === 'hablar') {
      if (!characterToStart || !dialogueToStart) {
        const searchWord = (hotspot.label || hotspot.word).toLowerCase();
        const matchedChar = project.characters?.find((c) =>
          c.name.toLowerCase().includes(searchWord) || searchWord.includes(c.name.toLowerCase())
        );

        if (matchedChar) {
          characterToStart = matchedChar;
          if (!dialogueToStart) {
            const blockWithDialogue = currentSceneObj?.textBlocks.find(
              (b) => b.characterId === matchedChar.id && b.dialogue
            );
            dialogueToStart = blockWithDialogue?.dialogue || {
              characterId: matchedChar.id,
              greeting: rule?.responseMessage || matchedChar.description || '¿Qué deseas?',
              nodes: [
                {
                  id: 'node_root',
                  title: 'Inicio',
                  npcPrompt: rule?.responseMessage || matchedChar.description || '¿Qué deseas?',
                  options: [
                    {
                      id: 'opt_close',
                      playerText: 'Nada por ahora.',
                      endConversation: true,
                    },
                  ],
                },
              ],
            };
          }
        } else if (rule?.responseMessage || parentBlock) {
          const charName = hotspot.label || hotspot.word;
          const dynamicChar: GameCharacter = {
            id: `char_dyn_${hotspot.id}`,
            name: charName.charAt(0).toUpperCase() + charName.slice(1),
            description: 'Personaje de la historia.',
          };
          characterToStart = dynamicChar;
          const promptText = rule?.responseMessage || parentBlock?.dialogue?.greeting || 'Te observa en silencio...';
          dialogueToStart = parentBlock?.dialogue || {
            characterId: dynamicChar.id,
            greeting: promptText,
            nodes: [
              {
                id: 'node_root',
                title: 'Inicio',
                npcPrompt: promptText,
                options: [
                  {
                    id: 'opt_close',
                    playerText: 'Despedirse.',
                    endConversation: true,
                  },
                ],
              },
            ],
          };
        }
      }

      if (characterToStart && dialogueToStart) {
        handleStartDialogue(characterToStart, dialogueToStart, parentBlock?.id);
        setActiveVerb(null);
        setSelectedInventoryItemId(null);
        setContextMenu(null);
        return;
      }
    }

    let messageToShow: string | null = null;

    if (rule) {
      if (rule.soundEffect && rule.soundEffect !== 'none') {
        playSound(rule.soundEffect);
      } else if (rule.stateChange?.addItemId) {
        playSound('pickup');
      } else if (rule.stateChange?.goToSceneId) {
        playSound('door');
      } else {
        playSound('select');
      }

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

        if (sc?.removeItem2Id) {
          newInventory = newInventory.filter((id) => id !== sc.removeItem2Id);
        }

        if (sc?.appendStoryText) {
          const currentList = newAppended[prev.currentSceneId] || [];
          const parentBlock = currentSceneObj?.textBlocks.find((b) => {
            if (isWordMatchInText(hotspot.word, b.text)) return true;
            return currentList.some((t: any) => {
              if (typeof t !== 'string' && t.blockId === b.id) {
                return isWordMatchInText(hotspot.word, t.text);
              }
              return false;
            });
          });
          const isAlreadyAppended = currentList.some((t) => (typeof t === 'string' ? t : t.text) === sc.appendStoryText);
          if (!isAlreadyAppended) {
            const entryObj: AppendedTextEntry = parentBlock
              ? { text: sc.appendStoryText, blockId: parentBlock.id }
              : { text: sc.appendStoryText };
            newAppended[prev.currentSceneId] = [...currentList, entryObj];
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
      // Fallback response - check if any rule for this verb specifies fail configurations (failMessage, failStateChange, failIsGameOver, failSoundEffect)
      const failedRule = rulesForVerb.find((a) => a.failMessage || a.failStateChange || a.failIsGameOver || a.failSoundEffect);

      let lookCharDesc: string | null = null;
      if (verbToUse === 'mirar') {
        const searchWord = (hotspot.label || hotspot.word).toLowerCase();
        const matchedChar = project.characters?.find((c) =>
          c.name.toLowerCase().includes(searchWord) || searchWord.includes(c.name.toLowerCase())
        );
        if (matchedChar && matchedChar.description) {
          lookCharDesc = matchedChar.description;
        }
      }

      const fallbackText =
        failedRule?.failMessage ||
        lookCharDesc ||
        (hotspot.customDefaultResponses && hotspot.customDefaultResponses[verbToUse]) ||
        (selectedItemObj ? `No parece ocurrir nada al usar ${selectedItemObj.name} con ${hotspot.label || hotspot.word}.` : null) ||
        (project.defaultResponses && project.defaultResponses[verbToUse]) ||
        'Eso no parece surtir efecto.';

      const fsc = failedRule?.failStateChange;
      const isFailGameOver =
        !!failedRule?.failIsGameOver ||
        !!fsc?.isGameOver ||
        /\[(?:Terminar \/ Cargar partida|Terminar|Cargar partida|Fin de partida)\]/i.test(failedRule?.failMessage || '');

      if (failedRule?.failSoundEffect && failedRule.failSoundEffect !== 'none') {
        playSound(failedRule.failSoundEffect);
      } else {
        playSound('error');
      }

      setGameState((prev: any) => {
        const currentUsedHotspots = prev.usedHotspotIds || [];
        const newUsedHotspots = currentUsedHotspots.includes(hotspot.id)
          ? currentUsedHotspots
          : [...currentUsedHotspots, hotspot.id];

        let newFlags = { ...prev.flags, ...(fsc?.setFlags || {}) };
        let newInventory = [...prev.inventory];
        let nextSceneId = prev.currentSceneId;
        const newAppended = { ...prev.appendedTextsPerScene };

        if (fsc?.addItemId && !newInventory.includes(fsc.addItemId)) {
          newInventory.push(fsc.addItemId);
        }

        if (fsc?.removeItemId) {
          newInventory = newInventory.filter((id) => id !== fsc.removeItemId);
        }

        if (fsc?.removeItem2Id) {
          newInventory = newInventory.filter((id) => id !== fsc.removeItem2Id);
        }

        if (fsc?.appendStoryText) {
          const currentList = newAppended[prev.currentSceneId] || [];
          const parentBlock = currentSceneObj?.textBlocks.find((b) => {
            if (isWordMatchInText(hotspot.word, b.text)) return true;
            return currentList.some((t: any) => {
              if (typeof t !== 'string' && t.blockId === b.id) {
                return isWordMatchInText(hotspot.word, t.text);
              }
              return false;
            });
          });
          const isAlreadyAppended = currentList.some((t) => (typeof t === 'string' ? t : t.text) === fsc.appendStoryText);
          if (!isAlreadyAppended) {
            const entryObj: AppendedTextEntry = parentBlock
              ? { text: fsc.appendStoryText, blockId: parentBlock.id }
              : { text: fsc.appendStoryText };
            newAppended[prev.currentSceneId] = [...currentList, entryObj];
          }
        }

        if (fsc?.goToSceneId) {
          nextSceneId = fsc.goToSceneId;
        }

        const newHistory = [
          ...prev.history,
          { id: Date.now().toString(), type: 'response', text: fallbackText },
        ];

        return {
          ...prev,
          flags: newFlags,
          inventory: newInventory,
          currentSceneId: nextSceneId,
          appendedTextsPerScene: newAppended,
          usedHotspotIds: newUsedHotspots,
          isGameOver: prev.isGameOver || isFailGameOver,
          history: newHistory,
        };
      });

      const cleanMsg = fallbackText.replace(/\[(?:Terminar \/ Cargar partida|Terminar|Cargar partida|Fin de partida)\]/gi, '').trim();

      if (isFailGameOver) {
        setModalFeedback({
          type: 'gameover',
          title: 'FIN DE PARTIDA',
          verbIconName: 'Skull',
          isGameOver: true,
          message: cleanMsg || 'Has alcanzado un desenlace fatal.',
        });
      } else {
        setModalFeedback({
          type: 'action',
          title: actionTitle,
          verbIconName,
          message: cleanMsg,
        });
      }
    }

    // Reset command state
    setActiveVerb(null);
    setSelectedInventoryItemId(null);
    setContextMenu(null);
  };

  const handleWordClick = (hotspot: Hotspot, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSceneGameOver || gameState.isGameOver || modalFeedback?.isGameOver) return;

    // Fast QTE action: If QTE is active and current step accepts any verb (no expectedVerb specified),
    // clicking the action word directly triggers the action without needing to pick a verb first!
    if (isQTEScene && qteStatus === 'active') {
      const expectedStep = currentScene?.qteConfig?.sequence?.[qteStepIndex];
      if (!expectedStep?.expectedVerb) {
        handleExecuteAction(hotspot, undefined);
        return;
      }
    }

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

    // Create a regex matching any hotspot word with exact word boundaries
    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const isWordChar = (char: string) => /[\p{L}\p{N}_]/u.test(char);
    const sortedHotspots = [...activeHotspots].sort((a, b) => b.word.length - a.word.length);

    const hotspotPatterns = sortedHotspots.map((h) => {
      const escaped = escapeRegExp(h.word);
      const startChar = h.word.charAt(0);
      const endChar = h.word.charAt(h.word.length - 1);
      const prefix = isWordChar(startChar) ? '(?<![\\p{L}\\p{N}_])' : '';
      const suffix = isWordChar(endChar) ? '(?![\\p{L}\\p{N}_])' : '';
      return `${prefix}${escaped}${suffix}`;
    });

    const pattern = new RegExp(`(${hotspotPatterns.join('|')})`, 'giu');

    const parts = text.split(pattern);
    const isNormalMode = gameState.difficulty === 'normal';
    const isHardMode = gameState.difficulty === 'dificil';
    const usedHotspots = gameState.usedHotspotIds || [];

    return parts.map((part, idx) => {
      const matchedHotspot = sortedHotspots.find(
        (h) => h.word.toLowerCase() === part.toLowerCase()
      );

      if (matchedHotspot) {
        const isUsed = usedHotspots.includes(matchedHotspot.id);

        if (isHardMode || (isNormalMode && !isUsed)) {
          // Hard mode or Normal mode before being used: render like standard text, clickable but without highlight or cursor hint
          return (
            <span
              key={idx}
              onClick={(e) => handleWordClick(matchedHotspot, e)}
              className="inline"
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
              className={`${themeConfig.hotspotClass} ${themeConfig.hotspotHoverClass} inline cursor-pointer transition-colors duration-150`}
              title={`Clic para interactuar con "${matchedHotspot.label || matchedHotspot.word}"`}
            >
              {part}
            </span>
          );
        }
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  const handleStartDialogue = (
    character: GameCharacter,
    dialogueBlock: DialogueBlock,
    blockId?: string
  ) => {
    playSound('select');
    const initialNodeId =
      dialogueBlock.initialNodeId ||
      dialogueBlock.nodes?.[0]?.id ||
      'node_root';
    setActiveDialogue({
      character,
      blockId,
      currentNodeId: initialNodeId,
      dialogueBlock,
    });
  };

  const handleSelectDialogueOption = (
    option: DialogueOption,
    character: GameCharacter,
    blockId?: string
  ) => {
    playSound(option.soundEffect || 'select');

    // Item giving (+Objeto)
    const giveItemObj = option.giveItemId
      ? project.inventoryItems.find((i) => i.id === option.giveItemId)
      : null;

    // Item consuming (-Objeto)
    const consumeItemObj =
      option.requiredItemId && option.consumeRequiredItem
        ? project.inventoryItems.find((i) => i.id === option.requiredItemId)
        : null;

    // Prepare response text
    let responseText = '';
    if (option.playerText) {
      responseText += `— ${option.playerText}\n\n`;
    }
    if (option.npcResponse) {
      responseText += `${character.name}: ${option.npcResponse}`;
    }

    if (giveItemObj) {
      responseText += `\n\n[Recibido: ${giveItemObj.name}]`;
    }
    if (consumeItemObj) {
      responseText += `\n\n[Entregado: ${consumeItemObj.name}]`;
    }

    // Track items received during this dialogue session
    const currentReceived = activeDialogue?.receivedItemIds || [];
    const updatedReceived = giveItemObj ? [...currentReceived, giveItemObj.id] : currentReceived;

    setGameState((prev: any) => {
      const newFlags = { ...prev.flags, ...(option.setFlags || {}) };
      let newInventory = [...prev.inventory];
      let nextSceneId = prev.currentSceneId;

      if (option.giveItemId && !newInventory.includes(option.giveItemId)) {
        newInventory.push(option.giveItemId);
      }

      if (option.requiredItemId && option.consumeRequiredItem) {
        newInventory = newInventory.filter((id) => id !== option.requiredItemId);
      }

      if (option.goToSceneId) {
        nextSceneId = option.goToSceneId;
      }

      const usedDialogueOptionIds = [...(prev.usedDialogueOptionIds || [])];
      if (!usedDialogueOptionIds.includes(option.id)) {
        usedDialogueOptionIds.push(option.id);
      }

      const newAppended = { ...prev.appendedTextsPerScene };
      if (responseText.trim()) {
        const sceneAppended = newAppended[prev.currentSceneId] || [];
        newAppended[prev.currentSceneId] = [
          ...sceneAppended,
          { text: responseText, blockId },
        ];
      }

      if (option.appendStoryText) {
        const sceneAppended = newAppended[prev.currentSceneId] || [];
        newAppended[prev.currentSceneId] = [
          ...newAppended[prev.currentSceneId],
          { text: option.appendStoryText, blockId },
        ];
      }

      return {
        ...prev,
        flags: newFlags,
        inventory: newInventory,
        currentSceneId: nextSceneId,
        usedDialogueOptionIds,
        appendedTextsPerScene: newAppended,
        isGameOver: option.isGameOver || prev.isGameOver,
      };
    });

    // Advance tree node, update current reply, or close dialogue pop-up
    if (option.endConversation || option.nextNodeId === 'end' || option.goToSceneId) {
      closeActiveDialogue(updatedReceived);
    } else if (option.nextNodeId && option.nextNodeId !== activeDialogue?.currentNodeId) {
      setActiveDialogue((prev) =>
        prev
          ? {
              ...prev,
              currentNodeId: option.nextNodeId!,
              currentNpcReply: undefined,
              receivedItemIds: updatedReceived,
            }
          : null
      );
    } else if (option.npcResponse) {
      setActiveDialogue((prev) =>
        prev
          ? {
              ...prev,
              currentNpcReply: option.npcResponse,
              receivedItemIds: updatedReceived,
            }
          : null
      );
    }

    if (giveItemObj || option.goToSceneId) {
      setShowSaveNotification(true);
      setTimeout(() => setShowSaveNotification(false), 2500);
    }
  };

  // Parses HTML formatting tags (h1, h2, b, i, u, p, etc.) and renders styled elements while maintaining interactive hotspot words and line breaks
  const renderFormattedAndInteractiveText = (rawText: string) => {
    if (!rawText) return null;

    const normalizedText = rawText.replace(/\r\n/g, '\n');

    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
      return (
        <div className="whitespace-pre-line leading-relaxed">
          {renderInteractiveText(normalizedText)}
        </div>
      );
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${normalizedText}</div>`, 'text/html');
      const container = doc.body.firstChild;
      if (!container) {
        return (
          <div className="whitespace-pre-line leading-relaxed">
            {renderInteractiveText(normalizedText)}
          </div>
        );
      }

      const renderNode = (node: Node, keyIndex: string): React.ReactNode => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.nodeValue || '';
          return <React.Fragment key={keyIndex}>{renderInteractiveText(text)}</React.Fragment>;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tagName = el.tagName.toLowerCase();
          const children = Array.from(el.childNodes).map((child, i) =>
            renderNode(child, `${keyIndex}-${i}`)
          );

          switch (tagName) {
            case 'h1':
              return (
                <h1 key={keyIndex} className={`text-2xl sm:text-3xl font-extrabold my-3 tracking-tight border-b pb-1 ${isSepia ? 'text-[#822b16] border-[#822b16]/30' : 'text-amber-300 border-amber-500/20'}`}>
                  {children}
                </h1>
              );
            case 'h2':
              return (
                <h2 key={keyIndex} className={`text-xl sm:text-2xl font-bold my-2.5 ${isSepia ? 'text-[#822b16]' : 'text-amber-200'}`}>
                  {children}
                </h2>
              );
            case 'h3':
              return (
                <h3 key={keyIndex} className={`text-lg font-bold my-2 ${isSepia ? 'text-[#5a1d0d]' : 'text-amber-100'}`}>
                  {children}
                </h3>
              );
            case 'b':
            case 'strong':
              return (
                <strong key={keyIndex} className={`font-bold ${isSepia ? 'text-[#3b2d1d]' : 'text-amber-100'}`}>
                  {children}
                </strong>
              );
            case 'i':
            case 'em':
              return (
                <em key={keyIndex} className={`italic ${isSepia ? 'text-[#5a422a]' : 'text-slate-200'}`}>
                  {children}
                </em>
              );
            case 'u':
              return (
                <u key={keyIndex} className={`underline underline-offset-4 ${isSepia ? 'decoration-[#822b16]/60 text-[#822b16]' : 'decoration-amber-500/50'}`}>
                  {children}
                </u>
              );
            case 'p':
              return (
                <p key={keyIndex} className="my-2 leading-relaxed">
                  {children}
                </p>
              );
            case 'br':
              return <br key={keyIndex} />;
            default:
              return <span key={keyIndex}>{children}</span>;
          }
        }

        return null;
      };

      return (
        <div className="whitespace-pre-line leading-relaxed">
          {Array.from(container.childNodes).map((childNode, i) =>
            renderNode(childNode, `root-${i}`)
          )}
        </div>
      );
    } catch (e) {
      console.error('Error parsing formatted text:', e);
      return (
        <div className="whitespace-pre-line leading-relaxed">
          {renderInteractiveText(normalizedText)}
        </div>
      );
    }
  };

  // Parses [Terminar / Cargar partida] or similar bracket tags into interactive End Game action bars
  const renderTextWithTags = (rawText: string, isBlockGameOver?: boolean, isBlockFinal?: boolean) => {
    if (!rawText) return null;

    let processedText = rawText;
    if (isQTEScene) {
      const isFinished = qteStatus === 'success';
      processedText = filterQTEProgressiveText(rawText, qteStepIndex, isFinished);
    } else {
      // In non-QTE scenes, strip [N] tags so they never appear to players
      processedText = rawText.replace(/\[\d+\]\s*/g, '');
    }

    if (!processedText.trim()) return null;

    const tagRegex = /(\[(?:Terminar \/ Cargar partida|Terminar|Cargar partida|Fin de partida)\])/gi;
    const parts = processedText.split(tagRegex);
    const hasTag = /\[(?:Terminar \/ Cargar partida|Terminar|Cargar partida|Fin de partida)\]/i.test(processedText);

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
          {renderFormattedAndInteractiveText(part)}
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

    if (isBlockFinal) {
      const finalTitle = project.gameCompleteTitle?.trim() || '¡FIN DE LA AVENTURA!';
      const finalSubtitle = project.gameCompleteSubtitle?.trim() || 'Has completado felizmente la historia.';

      return (
        <>
          {renderedContent}
          <div className="my-6 p-5 rounded-2xl bg-slate-900 border border-amber-500/40 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="text-base font-black text-amber-300 uppercase tracking-wide">{finalTitle}</div>
              <div className="text-xs text-slate-300 font-normal mt-0.5">{finalSubtitle}</div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={onReset}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Volver a jugar</span>
              </button>
              {onOpenSaveLoad && (
                <button
                  onClick={onOpenSaveLoad}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-200 border border-amber-500/30 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Bookmark className="w-4 h-4 text-amber-400" />
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

        {/* Mobile & Desktop Header Controls when expanded */}
        {!isHeaderCollapsed && (
          <>
            {/* Mobile Top Minimal Bar */}
            <div className={`md:hidden flex items-center justify-between gap-2 p-2.5 rounded-2xl mb-2 shadow-lg border ${themeConfig.buttonBgClass} ${themeConfig.buttonBorderClass}`}>
              {onOpenSaveLoad && (
                <button
                  onClick={onOpenSaveLoad}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Bookmark className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Guardar Partida</span>
                </button>
              )}

              <div className="flex items-center gap-1.5">
                {toggleSound && (
                  <button
                    onClick={toggleSound}
                    className={`p-2 rounded-xl border cursor-pointer transition-colors ${themeConfig.buttonBgClass} ${themeConfig.buttonBorderClass} ${themeConfig.buttonTextClass} ${themeConfig.buttonHoverClass}`}
                    title={soundEnabled ? 'Sonido Activado' : 'Sonido Desactivado'}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-500" /> : <VolumeX className={`w-4 h-4 ${themeConfig.textMutedClass}`} />}
                  </button>
                )}
                <button
                  onClick={() => setShowDetailsModal(true)}
                  className={`p-2 rounded-xl border cursor-pointer transition-colors ${
                    isSepia
                      ? 'bg-[#822b16]/15 border-[#822b16]/40 text-[#822b16] hover:bg-[#822b16]/25'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:text-amber-300'
                  }`}
                  title="Detalles y Créditos"
                >
                  <Info className="w-4 h-4" />
                </button>
                <button
                  onClick={onReset}
                  className={`p-2 rounded-xl border cursor-pointer transition-colors ${themeConfig.buttonBgClass} ${themeConfig.buttonBorderClass} ${themeConfig.buttonTextClass} ${themeConfig.buttonHoverClass}`}
                  title="Reiniciar"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PC Scene Header with Difficulty Selector */}
            <div className={`hidden md:flex flex-wrap items-center justify-between gap-3 border-b pb-3 ${themeConfig.cardBorderClass}`}>
              <div className="flex items-center gap-2">
                <Compass className={`w-5 h-5 ${themeConfig.accentClass}`} />
                <h2 className={`font-bold text-xl ${themeConfig.textMainClass}`}>
                  {currentScene?.name || 'Escena'}
                </h2>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Audio Toggle Button (In text-game header) */}
                {toggleSound && (
                  <button
                    onClick={toggleSound}
                    className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center justify-center ${themeConfig.buttonBgClass} ${themeConfig.buttonBorderClass} ${themeConfig.buttonTextClass} ${themeConfig.buttonHoverClass}`}
                    title={soundEnabled ? 'Sonido Activado' : 'Sonido Desactivado'}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-500" /> : <VolumeX className={`w-4 h-4 ${themeConfig.textMutedClass}`} />}
                  </button>
                )}

                {/* Visual Style Selector (Test / Play mode) */}
                <div className={`flex items-center gap-1.5 border rounded-xl px-2.5 py-1 text-xs shadow-inner ${themeConfig.buttonBgClass} ${themeConfig.buttonBorderClass}`}>
                  <Palette className={`w-3.5 h-3.5 ${themeConfig.accentClass} shrink-0`} />
                  <select
                    value={currentTheme}
                    onChange={(e) => {
                      if (updateProject) {
                        updateProject((prev) => ({ ...prev, theme: e.target.value as any }));
                      }
                    }}
                    className={`bg-transparent text-xs focus:outline-none cursor-pointer font-medium ${themeConfig.buttonTextClass}`}
                    title="Estilo Visual del Texto-Juego (Modo Prueba)"
                  >
                    <option value="classic-retro" className={isSepia ? 'bg-[#ebdcb9] text-[#3b2d1d]' : 'bg-slate-900 text-white'}>🕹️ LucasArts Retro</option>
                    <option value="modern-dark" className={isSepia ? 'bg-[#ebdcb9] text-[#3b2d1d]' : 'bg-slate-900 text-white'}>🌙 Oscuro Elegante</option>
                    <option value="sepia-parchment" className={isSepia ? 'bg-[#ebdcb9] text-[#3b2d1d]' : 'bg-slate-900 text-white'}>📜 Pergamino Sepia</option>
                    <option value="cyber-terminal" className={isSepia ? 'bg-[#ebdcb9] text-[#3b2d1d]' : 'bg-slate-900 text-white'}>💻 Terminal Cyber</option>
                    <option value="emerald-vintage" className={isSepia ? 'bg-[#ebdcb9] text-[#3b2d1d]' : 'bg-slate-900 text-white'}>🌲 Esmeralda Vintage</option>
                  </select>
                </div>

                {/* Difficulty Selector */}
                <div className={`flex items-center border rounded-xl p-1 text-xs shadow-inner ${themeConfig.buttonBgClass} ${themeConfig.buttonBorderClass}`}>
                  <span className={`text-[10px] uppercase font-mono font-bold ${themeConfig.textMutedClass} px-2 flex items-center gap-1`}>
                    <Shield className={`w-3 h-3 ${themeConfig.accentClass}`} />
                    Modo:
                  </span>
                  <button
                    onClick={() => setGameState((prev: any) => ({ ...prev, difficulty: 'facil' }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      (gameState.difficulty || 'facil') === 'facil'
                        ? `${themeConfig.verbActiveBg} ${themeConfig.verbActiveText} shadow`
                        : `${themeConfig.textMutedClass} ${themeConfig.buttonHoverClass}`
                    }`}
                    title="Modo Fácil: Palabras con acción destacadas siempre"
                  >
                    Fácil
                  </button>
                  <button
                    onClick={() => setGameState((prev: any) => ({ ...prev, difficulty: 'normal' }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      gameState.difficulty === 'normal'
                        ? `${themeConfig.verbActiveBg} ${themeConfig.verbActiveText} shadow`
                        : `${themeConfig.textMutedClass} ${themeConfig.buttonHoverClass}`
                    }`}
                    title="Modo Normal: Palabras sin destacar hasta ser usadas"
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => setGameState((prev: any) => ({ ...prev, difficulty: 'dificil' }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      gameState.difficulty === 'dificil'
                        ? `${themeConfig.verbActiveBg} ${themeConfig.verbActiveText} shadow`
                        : `${themeConfig.textMutedClass} ${themeConfig.buttonHoverClass}`
                    }`}
                    title="Modo Difícil: Las palabras usables no están marcadas ni quedan marcadas tras usarse"
                  >
                    Difícil
                  </button>
                </div>

                <button
                  onClick={() => setShowDetailsModal(true)}
                  className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                    isSepia
                      ? 'bg-[#822b16]/12 border-[#822b16]/40 text-[#822b16] hover:bg-[#822b16]/20 font-bold'
                      : 'text-amber-300 hover:text-amber-200 bg-amber-500/10 border-amber-500/30'
                  }`}
                  title="Ver detalles, sinopsis y créditos del autor"
                >
                  <Info className={`w-3.5 h-3.5 ${isSepia ? 'text-[#822b16]' : 'text-amber-400'}`} />
                  <span>Detalles y Créditos</span>
                </button>

                <button
                  onClick={onReset}
                  className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${themeConfig.buttonBgClass} ${themeConfig.buttonBorderClass} ${themeConfig.buttonTextClass} ${themeConfig.buttonHoverClass}`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reiniciar</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Sentence Builder Bar (LucasArts Style Command Bar) */}
        <div className={`p-3 rounded-xl border ${themeConfig.accentBorderClass} ${themeConfig.actionBoxBgClass} flex items-center justify-between gap-3 shadow-sm`}>
          <div className="flex items-center gap-2 font-bold text-sm sm:text-base tracking-wide flex-wrap">
            <span className={`text-xs font-semibold uppercase tracking-wider ${themeConfig.accentClass}`}>Acción:</span>
            <span className={themeConfig.actionBoxTextClass}>
              {selectedItemObj && activeVerb === 'usar'
                ? `Usar ${selectedItemObj.name} con`
                : selectedItemObj && activeVerb === 'mirar'
                ? `Mirar ${selectedItemObj.name}`
                : selectedItemObj
                ? `Usar ${selectedItemObj.name} con`
                : activeVerb
                ? ALL_VERBS.find((v) => v.id === activeVerb)?.label.toUpperCase() || activeVerb.toUpperCase()
                : 'SELECCIONAR ACCIÓN...'}
            </span>
            {!activeVerb && !selectedItemObj && (
              <span className={`text-xs font-normal ${themeConfig.textMutedClass} italic hidden sm:inline`}>
                (Haz clic en un verbo abajo o en una palabra destacada)
              </span>
            )}
          </div>

          {(activeVerb || selectedItemObj) && (
            <button
              onClick={handleClearCommand}
              className={`px-2.5 py-1 rounded-lg border text-xs transition-colors cursor-pointer ${themeConfig.buttonBgClass} ${themeConfig.buttonBorderClass} ${themeConfig.buttonTextClass} ${themeConfig.buttonHoverClass}`}
            >
              Cancelar
            </button>
          )}
        </div>

        {/* Main Narrative Card (~60% height in focus mode) */}
        <div className={`p-5 sm:p-7 rounded-2xl border ${themeConfig.cardBorderClass} ${themeConfig.cardBgClass} shadow-xl relative overflow-hidden transition-all ${
          isHeaderCollapsed ? 'max-h-[58vh] min-h-[260px] overflow-y-auto' : ''
        }`}>
          {/* Subtle grid pattern background */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Quick Time Event (QTE) Live HUD Banner */}
          {isQTEScene && qteStatus === 'active' && currentScene?.qteConfig && (
            <div className="bg-gradient-to-r from-amber-950/90 via-red-950/90 to-amber-950/90 border-2 border-amber-500/70 rounded-2xl p-4 shadow-2xl space-y-3 mb-6 animate-pulse-subtle relative z-20">
              <div className="flex flex-wrap items-center justify-between gap-2 text-amber-300 font-black text-xs sm:text-sm uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400 animate-bounce shrink-0" />
                  <span>⚡ QUICK TIME EVENT EN CURSO</span>
                </div>
                <div className={`font-mono text-base sm:text-lg px-3 py-1 rounded-xl border font-black flex items-center gap-1.5 ${
                  qteTimeLeft <= 3
                    ? 'bg-rose-600 text-white border-rose-400 animate-ping'
                    : 'bg-black/70 text-amber-300 border-amber-500/50'
                }`}>
                  <span>⏱️</span>
                  <span>{qteTimeLeft.toFixed(1)}s</span>
                  {currentScene.qteConfig.timerMode === 'per_action' && (
                    <span className="text-[10px] text-amber-300/80 font-sans font-bold bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30 ml-1">
                      / acción
                    </span>
                  )}
                </div>
              </div>

              {/* Countdown Progress Bar */}
              <div className="w-full h-3.5 bg-black/70 rounded-full overflow-hidden border border-amber-500/40 p-0.5 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-100 ${
                    qteTimeLeft <= 3 ? 'bg-rose-500' : qteTimeLeft <= 6 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{
                    width: `${Math.max(0, Math.min(100, (qteTimeLeft / (currentScene.qteConfig.timeLimitSeconds || 10)) * 100))}%`,
                  }}
                />
              </div>

              {/* Mistake warning message indicator */}
              {qteMistakeMsg && (
                <div className="bg-rose-600/90 text-white font-bold text-xs px-3 py-1.5 rounded-xl border border-rose-400 shadow-md flex items-center justify-center gap-2 animate-bounce">
                  <span>{qteMistakeMsg}</span>
                </div>
              )}

              {/* Step indicator - Centered instruction */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 text-xs border-t border-amber-500/20 pt-2.5 text-center">
                <span className="text-amber-200/80 font-medium">
                  Paso <strong className="text-amber-300 text-sm font-black">{qteStepIndex + 1}</strong> de {currentScene.qteConfig.sequence.length}
                </span>
                <span className="hidden sm:inline text-amber-500/50">•</span>
                <span className="bg-amber-500/25 text-amber-200 border border-amber-500/50 px-4 py-1.5 rounded-full font-bold shadow-sm text-xs sm:text-sm text-center inline-block">
                  {currentScene.qteConfig.sequence[qteStepIndex]?.label || '¡Realiza la acción requerida!'}
                </span>
              </div>
            </div>
          )}

          {/* Main Story Text Blocks & Interleaved Appended Paragraphs */}
          <div className={`space-y-6 text-lg leading-relaxed ${themeConfig.textMainClass} relative z-10`}>
            {(() => {
              const sceneAppendedList = gameState.appendedTextsPerScene[gameState.currentSceneId] || [];
              const blockAppendedMap: Record<string, string[]> = {};
              const unattachedAppended: string[] = [];

              sceneAppendedList.forEach((entry) => {
                const txt = typeof entry === 'string' ? entry : entry.text;
                const bId = typeof entry === 'string' ? undefined : entry.blockId;
                if (bId) {
                  if (!blockAppendedMap[bId]) blockAppendedMap[bId] = [];
                  blockAppendedMap[bId].push(txt);
                } else {
                  unattachedAppended.push(txt);
                }
              });

              return (
                <>
                  {currentScene?.textBlocks.map((block, index) => {
                    if (!checkConditions(block.visibleIfFlags, block.hiddenIfFlags)) {
                      return null;
                    }
                    const blockImg = block.imageFileData || block.imageUrl;
                    const isPortada = block.type === 'portada' || currentScene?.type === 'portada';
                    const isFinal = block.type === 'final' || (currentScene?.type === 'final' && index === currentScene.textBlocks.length - 1);
                    const hasText = !!(block.text && block.text.trim().length > 0);
                    const attachedTexts = blockAppendedMap[block.id] || [];

                    return (
                      <React.Fragment key={block.id}>
                        <div
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

                          {hasText && renderTextWithTags(block.text, block.isGameOver, isFinal)}
                        </div>

                        {/* Appended Story Paragraphs attached to THIS block */}
                        {attachedTexts.map((appended, i) => (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={`block-appended-${block.id}-${i}`}
                            className="tracking-wide"
                          >
                            {renderTextWithTags(appended)}
                          </motion.div>
                        ))}
                      </React.Fragment>
                    );
                  })}

                  {/* Unattached Appended Story Paragraphs */}
                  {unattachedAppended.map((appended, i) => (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={`unattached-appended-${i}`}
                      className="tracking-wide"
                    >
                      {renderTextWithTags(appended)}
                    </motion.div>
                  ))}
                </>
              );
            })()}
          </div>
        </div>

        {/* Action & Item Outcome Pop-up Modal */}
        <AnimatePresence>
          {modalFeedback && (
            <div
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
              onClick={() => setModalFeedback(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className={`w-[calc(100vw-1.5rem)] max-w-lg p-4 sm:p-6 rounded-2xl border cursor-default max-h-[85vh] overflow-y-auto font-sans break-words ${
                  modalFeedback.type === 'gameover' || modalFeedback.isGameOver
                    ? isSepia
                      ? 'border-2 border-rose-800/80 bg-[#ebdcb9] text-[#3b2d1d] shadow-2xl'
                      : 'border-2 border-rose-500 bg-slate-950/95 text-slate-100 shadow-[0_0_35px_rgba(244,63,94,0.35)]'
                    : `${themeConfig.cardBorderClass} ${themeConfig.cardBgClass} ${themeConfig.textMainClass} shadow-2xl border-2`
                } space-y-4`}
              >
                <div className={`flex items-center justify-between border-b pb-3 ${
                  modalFeedback.type === 'gameover' || modalFeedback.isGameOver
                    ? isSepia ? 'border-[#cbb382]' : 'border-rose-500/30'
                    : themeConfig.cardBorderClass
                }`}>
                  <div className="flex items-center gap-2.5">
                    {modalFeedback.type === 'gameover' || modalFeedback.isGameOver ? (
                      <Skull className="w-5 h-5 text-rose-500 shrink-0 animate-bounce" />
                    ) : modalFeedback.type === 'item' ? (
                      <PackageCheck className={`w-5 h-5 ${themeConfig.accentClass} shrink-0`} />
                    ) : (
                      <div className={`w-5 h-5 ${themeConfig.accentClass} flex items-center justify-center shrink-0`}>
                        {getVerbIcon(modalFeedback.verbIconName || 'Eye')}
                      </div>
                    )}

                    {modalFeedback.type !== 'action' && (
                      <h3
                        className={`font-bold text-base ${
                          modalFeedback.type === 'gameover' || modalFeedback.isGameOver
                            ? isSepia ? 'text-rose-900' : 'text-rose-300'
                            : themeConfig.accentClass
                        }`}
                      >
                        {modalFeedback.title ||
                          (modalFeedback.type === 'gameover' || modalFeedback.isGameOver
                            ? 'FIN DE PARTIDA'
                            : modalFeedback.type === 'item'
                            ? 'Objeto'
                            : '')}
                      </h3>
                    )}

                    {modalFeedback.isAutosaved && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border shadow-sm ${
                          isSepia
                            ? 'bg-[#822b16]/15 border-[#822b16]/40 text-[#822b16]'
                            : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
                        }`}
                        title="Partida guardada automáticamente"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.25, 1], rotate: [0, -12, 12, 0] }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                          className="flex items-center justify-center"
                        >
                          <Save className={`w-3.5 h-3.5 ${isSepia ? 'text-[#822b16]' : 'text-emerald-400'}`} />
                        </motion.div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isSepia ? 'text-[#822b16]' : 'text-emerald-300'}`}>
                          Guardado
                        </span>
                      </motion.div>
                    )}
                  </div>
                  <button
                    onClick={() => setModalFeedback(null)}
                    className={`p-1 rounded-lg transition-colors ${themeConfig.textMutedClass} ${themeConfig.buttonHoverClass}`}
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
                        className={`max-h-48 max-w-full rounded-xl border object-contain mx-auto shadow-lg ${themeConfig.cardBorderClass}`}
                      />
                    </div>
                  )}
                  <p
                    className={`text-base leading-relaxed whitespace-pre-line ${
                      modalFeedback.type === 'gameover' || modalFeedback.isGameOver
                        ? isSepia ? 'text-rose-950 font-bold' : 'text-rose-100 font-medium'
                        : themeConfig.textMainClass
                    }`}
                  >
                    {modalFeedback.message}
                  </p>
                </div>

                <div className={`flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t ${
                  modalFeedback.type === 'gameover' || modalFeedback.isGameOver
                    ? isSepia ? 'border-[#cbb382]' : 'border-white/10'
                    : themeConfig.cardBorderClass
                }`}>
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
                          className={`px-4 py-2 font-bold rounded-xl text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                            isSepia ? 'bg-[#822b16] hover:bg-[#6b2210] text-[#fbf5e8]' : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                          }`}
                        >
                          <Bookmark className={`w-4 h-4 ${isSepia ? 'text-[#fbf5e8]' : 'text-emerald-300'}`} />
                          <span>Cargar partida</span>
                        </button>
                      )}
                      <button
                        onClick={() => setModalFeedback(null)}
                        className={`px-3.5 py-2 rounded-xl text-xs transition-colors border ${themeConfig.buttonBgClass} ${themeConfig.buttonBorderClass} ${themeConfig.buttonTextClass} ${themeConfig.buttonHoverClass}`}
                      >
                        Cerrar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setModalFeedback(null)}
                      className={`px-5 py-2 font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer ${themeConfig.verbActiveBg} ${themeConfig.verbActiveText}`}
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
                    className={`flex items-center gap-2 px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 border cursor-pointer ${
                      isActive
                        ? `${themeConfig.verbActiveBg} ${themeConfig.verbActiveText} border-amber-400 shadow-md scale-[1.02]`
                        : `${themeConfig.buttonBgClass} ${themeConfig.buttonBorderClass} ${themeConfig.buttonTextClass} ${themeConfig.buttonHoverClass}`
                    }`}
                  >
                    {getVerbIcon(v.iconName)}
                    <span>{v.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inventory Panel (1 column) */}
          <div className={`p-5 rounded-2xl border ${themeConfig.cardBorderClass} ${themeConfig.cardBgClass} shadow-lg flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${themeConfig.textMutedClass}`}>
                  Inventario {isSceneTesting ? `(Modo Prueba: ${project.inventoryItems.length} objetos)` : `(${gameState.inventory.length})`}
                </h3>
              </div>

              {isSceneTesting && (
                <div className="flex flex-wrap items-center gap-2 mb-3 text-[10px] bg-black/60 px-2.5 py-1.5 rounded-xl border border-white/10">
                  <span className="font-bold text-white/70">Prueba:</span>
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
                    Obtenido
                  </span>
                  <span className="inline-flex items-center gap-1 text-blue-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></span>
                    Necesario en escena
                  </span>
                  <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>
                    No obtenido
                  </span>
                </div>
              )}

              {(() => {
                const itemsToDisplay: InventoryItem[] = isSceneTesting
                  ? project.inventoryItems
                  : (gameState.inventory
                      .map((itemId: string) => project.inventoryItems.find((i) => i.id === itemId))
                      .filter(Boolean) as InventoryItem[]);

                if (itemsToDisplay.length === 0) {
                  return (
                    <div className={`text-center py-6 border border-dashed rounded-xl ${themeConfig.cardBorderClass}`}>
                      <Box className={`w-7 h-7 mx-auto mb-2 ${themeConfig.textMutedClass}`} />
                      <p className={`text-xs italic ${themeConfig.textMutedClass}`}>No hay ningún objeto disponible.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
                    {itemsToDisplay.map((item) => {
                      const isSelected = selectedInventoryItemId === item.id;
                      const itemImg = item.imageFileData || item.imageUrl;
                      const isObtained = gameState.inventory.includes(item.id);
                      const isNeeded = isItemNeededInScene(item, currentScene);

                      let slotBorderClass = `${themeConfig.buttonBgClass} ${themeConfig.buttonBorderClass} ${themeConfig.buttonTextClass} ${themeConfig.buttonHoverClass}`;

                      if (isSelected) {
                        slotBorderClass = `${themeConfig.verbActiveBg} ${themeConfig.verbActiveText} border-amber-400 font-bold shadow-md scale-[1.03] ring-2 ring-amber-400/50`;
                      } else if (isSceneTesting) {
                        if (isObtained) {
                          slotBorderClass = 'bg-emerald-950/30 border-2 border-emerald-500 ring-1 ring-emerald-500/40 text-emerald-200 shadow-sm';
                        } else if (isNeeded) {
                          slotBorderClass = 'bg-blue-950/30 border-2 border-blue-500 ring-1 ring-blue-500/40 text-blue-200 shadow-sm';
                        } else {
                          slotBorderClass = 'bg-rose-950/20 border-2 border-rose-500/80 ring-1 ring-rose-500/30 text-rose-300/70 opacity-75 shadow-sm';
                        }
                      }

                      return (
                        <div key={item.id} className="relative group">
                          <button
                            type="button"
                            onClick={() => handleSelectInventoryItem(item.id)}
                            className={`w-full flex items-center justify-center p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer relative min-h-[44px] ${slotBorderClass}`}
                            title={item.name}
                          >
                            {/* Mobile view (< sm): SHOW ONLY TEXT */}
                            <span className="sm:hidden truncate text-xs font-semibold px-1 text-center">
                              {item.name}
                            </span>

                            {/* Desktop view (>= sm): SHOW ONLY MINIATURE THUMBNAIL IMAGE */}
                            <div className="hidden sm:flex items-center justify-center w-12 h-12 relative rounded-lg bg-slate-950/80 border border-amber-500/30 overflow-hidden shadow-sm shrink-0">
                              {itemImg ? (
                                <img
                                  src={itemImg}
                                  alt={item.name}
                                  className="w-full h-full object-contain p-0.5"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-amber-900/40 via-slate-900 to-amber-950/60 flex items-center justify-center text-amber-300 font-black text-xs uppercase">
                                  {item.name.substring(0, 2)}
                                </div>
                              )}

                              {isSelected && (
                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-slate-900 shadow animate-pulse z-10" />
                              )}
                            </div>

                            {/* Status indicator badge in testing mode */}
                            {isSceneTesting && (
                              <span
                                className={`absolute -top-1 -left-1 w-3 h-3 rounded-full border border-slate-950 shadow-sm z-20 ${
                                  isObtained ? 'bg-emerald-500' : isNeeded ? 'bg-blue-500' : 'bg-rose-500'
                                }`}
                                title={isObtained ? 'Obtenido' : isNeeded ? 'Necesario en esta escena' : 'No obtenido'}
                              />
                            )}
                          </button>

                          {/* Hover Tooltip showing item name and testing status on desktop */}
                          <div className="hidden sm:block opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 absolute -top-10 left-1/2 -translate-x-1/2 z-30 bg-slate-950/95 border border-amber-400/60 text-amber-200 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap backdrop-blur-md">
                            <span>{item.name}</span>
                            {isSceneTesting && (
                              <span className={`ml-1.5 text-[10px] ${
                                isObtained ? 'text-emerald-400' : isNeeded ? 'text-blue-400' : 'text-rose-400'
                              }`}>
                                • {isObtained ? '🟢 Obtenido' : isNeeded ? '🔵 Necesario en escena' : '🔴 No obtenido'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {selectedItemObj && (
              <div className={`mt-3 p-3 rounded-xl border text-xs ${themeConfig.actionBoxBgClass} ${themeConfig.cardBorderClass} ${themeConfig.textMainClass} space-y-2`}>
                <div className="flex items-start justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <p className={`font-bold text-sm ${themeConfig.accentClass}`}>{selectedItemObj.name}</p>
                    <p className={`text-[11px] leading-relaxed mt-0.5 ${themeConfig.textMutedClass}`}>{selectedItemObj.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUseInventoryItemDirectly(selectedItemObj)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
                    title={`Usar ${selectedItemObj.name}`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Usar</span>
                  </button>
                </div>

                {isSceneTesting && (
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Estado:{' '}
                      <strong className={
                        gameState.inventory.includes(selectedItemObj.id)
                          ? 'text-emerald-400'
                          : isItemNeededInScene(selectedItemObj, currentScene)
                          ? 'text-blue-400'
                          : 'text-rose-400'
                      }>
                        {gameState.inventory.includes(selectedItemObj.id)
                          ? '🟢 Obtenido'
                          : isItemNeededInScene(selectedItemObj, currentScene)
                          ? '🔵 Necesario en escena'
                          : '🔴 No obtenido'}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setGameState((prev: any) => ({
                          ...prev,
                          inventory: prev.inventory.includes(selectedItemObj.id)
                            ? prev.inventory.filter((id: string) => id !== selectedItemObj.id)
                            : [...prev.inventory, selectedItemObj.id],
                        }));
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        gameState.inventory.includes(selectedItemObj.id)
                          ? 'bg-rose-950/70 border-rose-500/40 text-rose-300 hover:bg-rose-900'
                          : 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900'
                      }`}
                    >
                      {gameState.inventory.includes(selectedItemObj.id) ? '✕ Quitar de inventario' : '+ Añadir a inventario'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Word Direct Click Context Popover Menu */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setContextMenu(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-[calc(100vw-2rem)] max-w-sm border-2 rounded-2xl shadow-2xl p-4 space-y-3 cursor-default ${themeConfig.cardBgClass} ${themeConfig.cardBorderClass} ${themeConfig.textMainClass}`}
          >
            <div className={`flex items-center justify-between border-b pb-2 ${themeConfig.cardBorderClass}`}>
              <span className={`text-sm font-extrabold ${themeConfig.accentClass}`}>
                ¿Qué quieres hacer con "{contextMenu.word}"?
              </span>
              <button
                onClick={() => setContextMenu(null)}
                className={`p-1 rounded-lg transition-colors ${themeConfig.textMutedClass} ${themeConfig.buttonHoverClass}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
              {ALL_VERBS.map((v) => {
                const hs = currentScene?.hotspots.find((h) => h.id === contextMenu.hotspotId);
                return (
                  <button
                    key={v.id}
                    onClick={() => {
                      if (hs) handleExecuteAction(hs, v.id);
                    }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${themeConfig.buttonBgClass} ${themeConfig.buttonBorderClass} ${themeConfig.buttonTextClass} ${themeConfig.buttonHoverClass}`}
                  >
                    {getVerbIcon(v.iconName)}
                    <span>{v.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* Details and Credits Modal */}
      <AnimatePresence>
        {showDetailsModal && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className={`border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden cursor-default ${
                isSepia
                  ? 'bg-[#f5ebd7] border-[#822b16]/40 text-[#3b2d1d]'
                  : 'bg-slate-900 border-amber-500/40 text-slate-200'
              }`}
            >
              {/* Header */}
              <div className={`px-6 py-4 border-b flex items-center justify-between ${
                isSepia ? 'bg-[#e4d2ad] border-[#c2aa79]' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center gap-2.5">
                  <BookOpen className={`w-5 h-5 ${isSepia ? 'text-[#822b16]' : 'text-amber-400'}`} />
                  <div>
                    <h3 className={`font-bold text-base ${isSepia ? 'text-[#3b2d1d]' : 'text-slate-100'}`}>{project.title}</h3>
                    <p className={`text-xs ${isSepia ? 'text-[#786146]' : 'text-slate-400'}`}>Por {project.author || 'Autor anónimo'} • v{project.version || '1.0'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isSepia ? 'text-[#786146] hover:text-[#3b2d1d] hover:bg-[#ebdcb9]' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm leading-relaxed">
                {/* Synopsis */}
                <div className={`space-y-2 p-4 rounded-xl border ${
                  isSepia ? 'bg-[#ebdcb9] border-[#c2aa79]' : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <h4 className={`font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 ${
                    isSepia ? 'text-[#822b16]' : 'text-amber-400'
                  }`}>
                    <Sparkles className="w-4 h-4" />
                    Sinopsis de la Historia
                  </h4>
                  <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                    isSepia ? 'text-[#3b2d1d]' : 'text-slate-200'
                  }`}>
                    {project.synopsis || project.description || 'Sin sinopsis disponible.'}
                  </p>
                </div>

                {/* Credits */}
                <div className={`space-y-2 p-4 rounded-xl border ${
                  isSepia ? 'bg-[#ebdcb9] border-[#c2aa79]' : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <h4 className={`font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 ${
                    isSepia ? 'text-[#822b16]' : 'text-amber-400'
                  }`}>
                    <Award className="w-4 h-4" />
                    Créditos Finales, Fuentes de Imágenes y Colaboradores
                  </h4>
                  {project.credits ? (
                    <p className={`text-xs font-mono leading-relaxed whitespace-pre-line p-3 rounded-lg border ${
                      isSepia ? 'bg-[#dfceaa] border-[#c2aa79] text-[#3b2d1d]' : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}>
                      {renderTextWithLinks(project.credits)}
                    </p>
                  ) : (
                    <p className={`italic text-xs ${isSepia ? 'text-[#786146]' : 'text-slate-500'}`}>
                      No se han registrado créditos adicionales para este texto-juego.
                    </p>
                  )}
                </div>

                {/* Technical Specs */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className={`p-3 rounded-xl border text-center ${
                    isSepia ? 'bg-[#ebdcb9] border-[#c2aa79]' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <span className={`block text-[10px] uppercase font-bold ${isSepia ? 'text-[#786146]' : 'text-slate-400'}`}>Escenas</span>
                    <span className={`font-bold text-xs ${isSepia ? 'text-[#3b2d1d]' : 'text-slate-200'}`}>{project.scenes.length} escenas</span>
                  </div>
                  <div className={`p-3 rounded-xl border text-center ${
                    isSepia ? 'bg-[#ebdcb9] border-[#c2aa79]' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <span className={`block text-[10px] uppercase font-bold ${isSepia ? 'text-[#786146]' : 'text-slate-400'}`}>Objetos</span>
                    <span className={`font-bold text-xs ${isSepia ? 'text-[#3b2d1d]' : 'text-slate-200'}`}>{project.inventoryItems.length} objetos</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className={`px-6 py-3.5 border-t flex items-center justify-end ${
                isSepia ? 'bg-[#e4d2ad] border-[#c2aa79]' : 'bg-slate-950 border-slate-800'
              }`}>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className={`px-4 py-2 font-bold rounded-xl text-xs transition-colors cursor-pointer ${
                    isSepia ? 'bg-[#822b16] hover:bg-[#6b2210] text-[#fbf5e8]' : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pop-up Conversation Modal (Aventura Gráfica Style) */}
      {activeDialogue && (() => {
        const { character, dialogueBlock, currentNodeId, blockId, currentNpcReply } = activeDialogue;

        // Get active node or fallback to root
        const nodes = dialogueBlock.nodes && dialogueBlock.nodes.length > 0
          ? dialogueBlock.nodes
          : [
              {
                id: 'node_root',
                title: 'Inicio',
                npcPrompt: dialogueBlock.greeting || '¿Qué deseas?',
                options: dialogueBlock.options || [],
              },
            ];

        const currentNode = nodes.find((n) => n.id === currentNodeId) || nodes[0];
        const npcPrompt = currentNpcReply || currentNode?.npcPrompt || dialogueBlock.greeting || 'Te observa en silencio...';

        // Filter available player options based on flags and used options
        const availableOptions = (currentNode?.options || []).filter((opt) => {
          if (gameState.usedDialogueOptionIds?.includes(opt.id)) {
            return false;
          }
          if (opt.requiredItemId && !gameState.inventory.includes(opt.requiredItemId)) {
            return false;
          }
          if (opt.requiredFlags && !checkConditions(opt.requiredFlags)) {
            return false;
          }
          if (!checkConditions(opt.visibleIfFlags, opt.hiddenIfFlags)) {
            return false;
          }
          return true;
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className={`w-full max-w-lg border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${themeConfig.cardBgClass} ${themeConfig.cardBorderClass} ${themeConfig.textMainClass}`}>
              
              {/* Modal Header */}
              <div className={`px-5 py-3.5 border-b flex items-center justify-between gap-3 shrink-0 ${themeConfig.buttonBgClass} ${themeConfig.cardBorderClass}`}>
                <div className="flex items-center gap-3">
                  {character.imageFileData || character.imageUrl ? (
                    <img
                      src={character.imageFileData || character.imageUrl}
                      alt={character.name}
                      className={`w-10 h-10 object-cover rounded-lg border shadow shrink-0 ${themeConfig.cardBorderClass}`}
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-lg font-bold flex items-center justify-center shrink-0 text-base shadow border ${themeConfig.accentBgClass} ${themeConfig.accentClass} ${themeConfig.accentBorderClass}`}>
                      {character.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h3 className={`font-bold text-base ${themeConfig.accentClass}`}>{character.name}</h3>
                </div>

                <button
                  onClick={() => closeActiveDialogue()}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${themeConfig.textMutedClass} ${themeConfig.buttonHoverClass}`}
                  title="Cerrar conversación"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body: NPC Prompt + Player Options */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {/* NPC Dialogue Prompt Box */}
                <div className={`p-4 rounded-xl border text-base leading-relaxed shadow-inner ${themeConfig.actionBoxBgClass} ${themeConfig.cardBorderClass} ${themeConfig.textMainClass}`}>
                  <span className={`font-bold mr-2 ${themeConfig.accentClass}`}>{character.name}:</span>
                  "{npcPrompt}"
                </div>

                {/* Clickable Player Options List (Clean, without numbers or headers) */}
                {availableOptions.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {availableOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectDialogueOption(opt, character, blockId)}
                        className={`w-full text-left p-3.5 rounded-xl border text-sm font-medium transition-all group cursor-pointer shadow-sm ${themeConfig.buttonBgClass} ${themeConfig.buttonBorderClass} ${themeConfig.buttonTextClass} ${themeConfig.buttonHoverClass}`}
                      >
                        <span className="group-hover:translate-x-1 transition-transform inline-block leading-snug">
                          "{opt.playerText || '...'}"
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className={`text-xs italic text-center py-2 ${themeConfig.textMutedClass}`}>
                    (No hay más opciones de respuesta. Puedes despedirte).
                  </p>
                )}
              </div>

              {/* Modal Footer */}
              <div className={`px-5 py-3 border-t flex items-center justify-end ${themeConfig.buttonBgClass} ${themeConfig.cardBorderClass}`}>
                <button
                  onClick={() => closeActiveDialogue()}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${themeConfig.verbActiveBg} ${themeConfig.verbActiveText}`}
                >
                  Despedirse
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};
