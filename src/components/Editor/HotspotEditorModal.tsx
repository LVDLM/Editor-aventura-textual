import React, { useState } from 'react';
import { Hotspot, ActionRule, GameProject, VerbType, SoundEffectType, SOUND_EFFECT_OPTIONS, DialogueBlock } from '../../types';
import { ALL_VERBS, getProjectVerbs } from '../../utils/verbs';
import { playSound, getAllMergedSounds } from '../../utils/audio';
import { DialogueEditor } from './DialogueEditor';
import { AutoGrowTextarea } from '../common/AutoGrowTextarea';
import { X, Plus, Trash2, Sparkles, Check, ArrowRight, Sliders, Eye, EyeOff, ShieldAlert, Volume2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

interface HotspotEditorModalProps {
  hotspot: Hotspot;
  project: GameProject;
  onSave: (updatedHotspot: Hotspot) => void;
  onClose: () => void;
  onAddGlobalFlag?: (flagKey: string) => void;
}

export const HotspotEditorModal: React.FC<HotspotEditorModalProps> = ({
  hotspot,
  project,
  onSave,
  onClose,
  onAddGlobalFlag,
}) => {
  const projectVerbs = getProjectVerbs(project);
  const [currentHotspot, setCurrentHotspot] = useState<Hotspot>({ ...hotspot });
  const [editingActionId, setEditingActionId] = useState<string | null>(null);

  // New inline flag creation
  const [newFlagName, setNewFlagName] = useState('');

  const handleCreateInlineFlag = () => {
    const cleanKey = newFlagName.trim().toLowerCase().replace(/\s+/g, '_');
    if (!cleanKey) return;
    if (onAddGlobalFlag) {
      onAddGlobalFlag(cleanKey);
    }
    setNewFlagName('');
  };

  // Action form state
  const [verb, setVerb] = useState<VerbType>(() => projectVerbs[0]?.id || 'mirar');
  const [responseMessage, setResponseMessage] = useState('');
  const [requiredItemId, setRequiredItemId] = useState('');
  const [requiredFlagsMap, setRequiredFlagsMap] = useState<Record<string, boolean>>({});
  const [isRequiredFlagsExpanded, setIsRequiredFlagsExpanded] = useState(false);
  const [soundEffect, setSoundEffect] = useState<SoundEffectType>('none');
  const [dialogue, setDialogue] = useState<DialogueBlock | undefined>(undefined);
  const [characterId, setCharacterId] = useState<string | undefined>(undefined);
  const [isDialogueModalOpen, setIsDialogueModalOpen] = useState(false);
  
  // State change consequences (Conditions MET)
  const [addItemId, setAddItemId] = useState('');
  const [addItemsMap, setAddItemsMap] = useState<Record<string, number>>({});
  const [removeItemId, setRemoveItemId] = useState('');
  const [flagToSet, setFlagToSet] = useState('');
  const [flagSetValue, setFlagSetValue] = useState<boolean>(true);
  const [setFlagsMap, setSetFlagsMap] = useState<Record<string, boolean>>({});
  const [goToSceneId, setGoToSceneId] = useState('');
  const [appendStoryText, setAppendStoryText] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);
  const [responseError, setResponseError] = useState(false);

  // Fail consequences (Conditions NOT MET)
  const [failMessage, setFailMessage] = useState('');
  const [failIsGameOver, setFailIsGameOver] = useState(false);
  const [failSoundEffect, setFailSoundEffect] = useState<SoundEffectType>('none');
  const [failAddItemId, setFailAddItemId] = useState('');
  const [failAddItemsMap, setFailAddItemsMap] = useState<Record<string, number>>({});
  const [failRemoveItemId, setFailRemoveItemId] = useState('');
  const [failFlagToSet, setFailFlagToSet] = useState('');
  const [failFlagSetValue, setFailFlagSetValue] = useState<boolean>(true);
  const [failSetFlagsMap, setFailSetFlagsMap] = useState<Record<string, boolean>>({});
  const [failGoToSceneId, setFailGoToSceneId] = useState('');
  const [failAppendStoryText, setFailAppendStoryText] = useState('');
  const [isAddItemsDropdownOpen, setIsAddItemsDropdownOpen] = useState(false);
  const [isFailAddItemsDropdownOpen, setIsFailAddItemsDropdownOpen] = useState(false);

  const [duplicateConflict, setDuplicateConflict] = useState<{
    newRule: ActionRule;
    existingRule: ActionRule;
    verbLabel: string;
  } | null>(null);

  const globalFlagKeys = Object.keys(project.globalFlags || {});

  const handleEditAction = (action: ActionRule) => {
    setEditingActionId(action.id);
    setVerb(action.verb);
    setResponseMessage(action.responseMessage);
    setResponseError(false);
    setRequiredItemId(action.requiredItemId || '');
    setRequiredFlagsMap(action.requiredFlags || {});
    setIsRequiredFlagsExpanded(!!(action.requiredFlags && Object.keys(action.requiredFlags).length > 0));
    setDialogue(action.dialogue);
    setCharacterId(action.characterId);
    
    // Success consequences
    if (action.stateChange?.addItems && Object.keys(action.stateChange.addItems).length > 0) {
      setAddItemsMap(action.stateChange.addItems);
      setAddItemId(Object.keys(action.stateChange.addItems)[0] || '');
    } else if (action.stateChange?.addItemId) {
      setAddItemsMap({ [action.stateChange.addItemId]: 1 });
      setAddItemId(action.stateChange.addItemId);
    } else {
      setAddItemsMap({});
      setAddItemId('');
    }

    setRemoveItemId(action.stateChange?.removeItemId || '');
    if (action.stateChange?.setFlags) {
      const entries = Object.entries(action.stateChange.setFlags);
      if (entries.length > 0) {
        setFlagToSet(entries[0][0]);
        setFlagSetValue(entries[0][1]);
        setSetFlagsMap(action.stateChange.setFlags);
      } else {
        setFlagToSet('');
        setFlagSetValue(true);
        setSetFlagsMap({});
      }
    } else {
      setFlagToSet('');
      setFlagSetValue(true);
      setSetFlagsMap({});
    }
    setGoToSceneId(action.stateChange?.goToSceneId || '');
    setAppendStoryText(action.stateChange?.appendStoryText || '');
    setIsGameOver(
      !!action.isGameOver ||
      !!action.stateChange?.isGameOver ||
      /\[(?:Terminar \/ Cargar partida|Terminar|Cargar partida|Fin de partida)\]/i.test(action.responseMessage || '')
    );
    setSoundEffect(action.soundEffect || 'none');

    // Fail consequences
    setFailMessage(action.failMessage || '');
    setFailIsGameOver(
      !!action.failIsGameOver ||
      !!action.failStateChange?.isGameOver ||
      /\[(?:Terminar \/ Cargar partida|Terminar|Cargar partida|Fin de partida)\]/i.test(action.failMessage || '')
    );
    setFailSoundEffect(action.failSoundEffect || 'none');

    if (action.failStateChange?.addItems && Object.keys(action.failStateChange.addItems).length > 0) {
      setFailAddItemsMap(action.failStateChange.addItems);
      setFailAddItemId(Object.keys(action.failStateChange.addItems)[0] || '');
    } else if (action.failStateChange?.addItemId) {
      setFailAddItemsMap({ [action.failStateChange.addItemId]: 1 });
      setFailAddItemId(action.failStateChange.addItemId);
    } else {
      setFailAddItemsMap({});
      setFailAddItemId('');
    }

    setFailRemoveItemId(action.failStateChange?.removeItemId || '');
    if (action.failStateChange?.setFlags) {
      const entries = Object.entries(action.failStateChange.setFlags);
      if (entries.length > 0) {
        setFailFlagToSet(entries[0][0]);
        setFailFlagSetValue(entries[0][1]);
        setFailSetFlagsMap(action.failStateChange.setFlags);
      } else {
        setFailFlagToSet('');
        setFailFlagSetValue(true);
        setFailSetFlagsMap({});
      }
    } else {
      setFailFlagToSet('');
      setFailFlagSetValue(true);
      setFailSetFlagsMap({});
    }
    setFailGoToSceneId(action.failStateChange?.goToSceneId || '');
    setFailAppendStoryText(action.failStateChange?.appendStoryText || '');
  };

  const handleSaveAction = (forceMode?: 'replace' | 'subaction' | 'update') => {
    let msg = responseMessage.trim();
    if (verb === 'hablar' && !msg) {
      msg = dialogue?.greeting || 'Iniciando conversación...';
    }

    if (!msg) {
      // If no response message was typed, highlight field in red and warn
      setResponseError(true);
      return;
    }

    setResponseError(false);

    // Success state changes
    const stateChangeObj: any = {};
    const cleanAddItems: Record<string, number> = {};
    Object.entries(addItemsMap).forEach(([itemId, qty]) => {
      const n = Math.floor(Number(qty) || 0);
      if (n > 0) cleanAddItems[itemId] = n;
    });
    if (Object.keys(cleanAddItems).length > 0) {
      stateChangeObj.addItems = cleanAddItems;
      stateChangeObj.addItemId = Object.keys(cleanAddItems)[0];
    }

    if (removeItemId) stateChangeObj.removeItemId = removeItemId;
    if (goToSceneId) stateChangeObj.goToSceneId = goToSceneId;
    if (appendStoryText.trim()) stateChangeObj.appendStoryText = appendStoryText.trim();
    if (isGameOver) stateChangeObj.isGameOver = true;
    
    if (flagToSet) {
      stateChangeObj.setFlags = { [flagToSet]: flagSetValue };
    } else if (Object.keys(setFlagsMap).length > 0) {
      stateChangeObj.setFlags = { ...setFlagsMap };
    }

    // Fail state changes
    const failStateChangeObj: any = {};
    const cleanFailAddItems: Record<string, number> = {};
    Object.entries(failAddItemsMap).forEach(([itemId, qty]) => {
      const n = Math.floor(Number(qty) || 0);
      if (n > 0) cleanFailAddItems[itemId] = n;
    });
    if (Object.keys(cleanFailAddItems).length > 0) {
      failStateChangeObj.addItems = cleanFailAddItems;
      failStateChangeObj.addItemId = Object.keys(cleanFailAddItems)[0];
    }

    if (failRemoveItemId) failStateChangeObj.removeItemId = failRemoveItemId;
    if (failGoToSceneId) failStateChangeObj.goToSceneId = failGoToSceneId;
    if (failAppendStoryText.trim()) failStateChangeObj.appendStoryText = failAppendStoryText.trim();
    if (failIsGameOver) failStateChangeObj.isGameOver = true;

    if (failFlagToSet) {
      failStateChangeObj.setFlags = { [failFlagToSet]: failFlagSetValue };
    } else if (Object.keys(failSetFlagsMap).length > 0) {
      failStateChangeObj.setFlags = { ...failSetFlagsMap };
    }

    const hasSuccessTag = /\[(?:Terminar \/ Cargar partida|Terminar|Cargar partida|Fin de partida)\]/i.test(msg);
    const hasFailTag = /\[(?:Terminar \/ Cargar partida|Terminar|Cargar partida|Fin de partida)\]/i.test(failMessage);

    let actionRuleId = editingActionId;
    if (forceMode === 'subaction' || !actionRuleId) {
      actionRuleId = `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }

    const newRule: ActionRule = {
      id: actionRuleId,
      verb,
      responseMessage: msg,
      characterId: verb === 'hablar' ? (dialogue?.characterId || characterId) : undefined,
      dialogue: verb === 'hablar' ? dialogue : undefined,
      requiredItemId: requiredItemId || undefined,
      requiredFlags: Object.keys(requiredFlagsMap).length > 0 ? { ...requiredFlagsMap } : undefined,
      isGameOver: isGameOver || hasSuccessTag || undefined,
      soundEffect: soundEffect !== 'none' ? soundEffect : undefined,
      stateChange: Object.keys(stateChangeObj).length > 0 ? stateChangeObj : undefined,

      failMessage: failMessage.trim() || undefined,
      failStateChange: Object.keys(failStateChangeObj).length > 0 ? failStateChangeObj : undefined,
      failIsGameOver: failIsGameOver || hasFailTag || undefined,
      failSoundEffect: failSoundEffect !== 'none' ? failSoundEffect : undefined,
    };

    // Mode 1: If editing an action and saving changes in place
    if (editingActionId && forceMode !== 'subaction') {
      const updatedActions = currentHotspot.actions.map((a) => (a.id === editingActionId ? newRule : a));
      const updated = { ...currentHotspot, actions: updatedActions };
      setCurrentHotspot(updated);
      onSave(updated);
      setDuplicateConflict(null);
      resetForm();
      return;
    }

    // Mode 2: If explicitly saving as a new subaction (duplicate or conflict addition)
    if (forceMode === 'subaction') {
      const updatedActions = [...currentHotspot.actions, newRule];
      const updated = { ...currentHotspot, actions: updatedActions };
      setCurrentHotspot(updated);
      onSave(updated);
      setDuplicateConflict(null);
      resetForm();
      return;
    }

    // Mode 3: Brand new action (editingActionId === null)
    const existingRule = currentHotspot.actions.find(
      (a) => a.verb === verb && a.id !== newRule.id
    );

    if (existingRule && !forceMode) {
      const verbObj = projectVerbs.find((v) => v.id === verb) || ALL_VERBS.find((v) => v.id === verb);
      setDuplicateConflict({
        newRule,
        existingRule,
        verbLabel: verbObj?.label || verb,
      });
      return;
    }

    let updatedActions = [...currentHotspot.actions];

    if (forceMode === 'replace' && existingRule) {
      updatedActions = updatedActions.map((a) => (a.id === existingRule.id ? newRule : a));
    } else {
      updatedActions.push(newRule);
    }

    const updated = { ...currentHotspot, actions: updatedActions };
    setCurrentHotspot(updated);
    onSave(updated);
    setDuplicateConflict(null);
    resetForm();
  };

  const handleDeleteAction = (actionId: string) => {
    const updated = {
      ...currentHotspot,
      actions: currentHotspot.actions.filter((a) => a.id !== actionId),
    };
    setCurrentHotspot(updated);
    onSave(updated);
  };

  const resetForm = () => {
    setEditingActionId(null);
    setVerb('mirar');
    setResponseMessage('');
    setResponseError(false);
    setRequiredItemId('');
    setRequiredFlagsMap({});
    setDialogue(undefined);
    setCharacterId(undefined);

    setAddItemId('');
    setAddItemsMap({});
    setRemoveItemId('');
    setFlagToSet('');
    setFlagSetValue(true);
    setSetFlagsMap({});
    setGoToSceneId('');
    setAppendStoryText('');
    setIsGameOver(false);
    setSoundEffect('none');

    setFailMessage('');
    setFailIsGameOver(false);
    setFailSoundEffect('none');
    setFailAddItemId('');
    setFailAddItemsMap({});
    setFailRemoveItemId('');
    setFailFlagToSet('');
    setFailFlagSetValue(true);
    setFailSetFlagsMap({});
    setFailGoToSceneId('');
    setFailAppendStoryText('');
    setIsAddItemsDropdownOpen(false);
    setIsFailAddItemsDropdownOpen(false);
    setIsRequiredFlagsExpanded(false);
  };

  const toggleRequiredFlag = (flagKey: string) => {
    setRequiredFlagsMap((prev) => {
      const copy = { ...prev };
      const currentVal = copy[flagKey];
      if (currentVal === undefined) {
        copy[flagKey] = true;
      } else if (currentVal === true) {
        copy[flagKey] = false;
      } else {
        delete copy[flagKey];
      }
      return copy;
    });
  };

  const toggleHotspotVisibleFlag = (flagKey: string) => {
    setCurrentHotspot((prev) => {
      const existing = { ...(prev.visibleIfFlags || {}) };
      if (existing[flagKey]) {
        delete existing[flagKey];
      } else {
        existing[flagKey] = true;
      }
      return {
        ...prev,
        visibleIfFlags: Object.keys(existing).length > 0 ? existing : undefined,
      };
    });
  };

  const toggleHotspotHiddenFlag = (flagKey: string) => {
    setCurrentHotspot((prev) => {
      const existing = { ...(prev.hiddenIfFlags || {}) };
      if (existing[flagKey]) {
        delete existing[flagKey];
      } else {
        existing[flagKey] = true;
      }
      return {
        ...prev,
        hiddenIfFlags: Object.keys(existing).length > 0 ? existing : undefined,
      };
    });
  };

  const handleSetFlagValue = (flagKey: string, value: boolean | null) => {
    setSetFlagsMap((prev) => {
      const copy = { ...prev };
      if (value === null) {
        delete copy[flagKey];
      } else {
        copy[flagKey] = value;
      }
      return copy;
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div>
            <h3 className="font-bold text-lg text-amber-400 flex items-center gap-2">
              <span>Configurar Palabra Clave: "{currentHotspot.word}"</span>
            </h3>
            <p className="text-xs text-slate-400">
              Define respuestas, condiciones de activación y múltiples consecuencias para cada acción sobre esta palabra.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Label / Display details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Palabra en el Texto</label>
              <input
                type="text"
                value={currentHotspot.word}
                onChange={(e) => setCurrentHotspot((prev) => ({ ...prev, word: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-bold outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Descriptivo / Etiqueta</label>
              <input
                type="text"
                value={currentHotspot.label || ''}
                onChange={(e) => setCurrentHotspot((prev) => ({ ...prev, label: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                placeholder="Ej: Lámpara de mesa"
              />
            </div>
          </div>

          {/* Hotspot Overall Visibility Conditions */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Condiciones de Visibilidad Global de la Palabra</span>
            </h4>
            
            {globalFlagKeys.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">
                No hay banderas globales creadas. Para ocultar/mostrar esta palabra según el avance, define variables en la pestaña "Banderas y Variables".
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Visible if flag */}
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    Mostrar palabra SOLO si esta Bandera está ACTIVADA:
                  </label>
                  <select
                    value={currentHotspot.visibleIfFlags ? Object.keys(currentHotspot.visibleIfFlags)[0] || '' : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCurrentHotspot((prev) => ({
                        ...prev,
                        visibleIfFlags: val ? { [val]: true } : undefined,
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="">-- Sin restricción (Siempre visible) --</option>
                    {globalFlagKeys.map((fk) => (
                      <option key={fk} value={fk}>
                        {fk}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hidden if flag */}
                <div>
                  <label className="block text-[11px] font-semibold text-rose-400 mb-1 flex items-center gap-1">
                    <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                    Ocultar palabra si esta Bandera está ACTIVADA:
                  </label>
                  <select
                    value={currentHotspot.hiddenIfFlags ? Object.keys(currentHotspot.hiddenIfFlags)[0] || '' : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCurrentHotspot((prev) => ({
                        ...prev,
                        hiddenIfFlags: val ? { [val]: true } : undefined,
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-rose-500 font-mono"
                  >
                    <option value="">-- Sin restricción (Nunca ocultar) --</option>
                    {globalFlagKeys.map((fk) => (
                      <option key={fk} value={fk}>
                        {fk}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Action Form */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-amber-500/40 space-y-4 shadow-lg">
            <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2 border-b border-white/5 pb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{editingActionId ? 'Editar Regla de Acción y Consecuencias' : 'Crear Nueva Regla de Acción'}</span>
            </h4>

            {/* Inline create new flag if needed */}
            <div className="bg-slate-900/60 border border-amber-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>¿Necesitas crear una nueva bandera/variable global?</span>
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newFlagName}
                  onChange={(e) => setNewFlagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateInlineFlag();
                    }
                  }}
                  placeholder="ej: puerta_abierta"
                  className="bg-black/60 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono outline-none focus:border-amber-500 w-36"
                />
                <button
                  type="button"
                  onClick={handleCreateInlineFlag}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow transition-colors"
                >
                  + Crear Bandera
                </button>
              </div>
            </div>

            {/* Verb & Requirements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Verb selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Verbo / Acción del Jugador</label>
                <select
                  value={verb}
                  onChange={(e) => setVerb(e.target.value as VerbType)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-1 focus:ring-amber-500 font-semibold"
                >
                  {projectVerbs.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Required Item */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Objeto Requerido en Inventario (Opcional)</label>
                <select
                  value={requiredItemId}
                  onChange={(e) => setRequiredItemId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">-- Ninguno (Acción sin objeto) --</option>
                  {project.inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      📦 {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Required Flags (Multiple Variable combination - Collapsible Dropdown) */}
            {(() => {
              const allReqFlagKeys = Array.from(new Set([...globalFlagKeys, ...Object.keys(requiredFlagsMap)]));
              if (allReqFlagKeys.length === 0) return null;

              const activeTrueCount = Object.values(requiredFlagsMap).filter((v) => v === true).length;
              const activeFalseCount = Object.values(requiredFlagsMap).filter((v) => v === false).length;
              const totalActiveCount = activeTrueCount + activeFalseCount;

              return (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden transition-all">
                  {/* Collapsible Header Button */}
                  <button
                    type="button"
                    onClick={() => setIsRequiredFlagsExpanded((prev) => !prev)}
                    className={`w-full p-3 flex items-center justify-between text-left cursor-pointer transition-colors ${
                      isRequiredFlagsExpanded
                        ? 'bg-amber-500/10 border-b border-amber-500/20'
                        : totalActiveCount > 0
                        ? 'bg-slate-900 hover:bg-slate-800/80'
                        : 'bg-slate-900/60 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <Sliders className={`w-4 h-4 shrink-0 ${totalActiveCount > 0 || isRequiredFlagsExpanded ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold text-amber-300">
                        Combinación de Banderas / Variables Requeridas para esta Acción:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {activeTrueCount > 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold flex items-center gap-1">
                            <span>🟢</span> {activeTrueCount} activa{activeTrueCount > 1 ? 's' : ''}
                          </span>
                        )}
                        {activeFalseCount > 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-mono font-bold flex items-center gap-1">
                            <span>🔴</span> {activeFalseCount} desactivada{activeFalseCount > 1 ? 's' : ''}
                          </span>
                        )}
                        {totalActiveCount === 0 && (
                          <span className="text-[11px] text-slate-500 italic">
                            (Sin condiciones de banderas)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {totalActiveCount > 0 && (
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRequiredFlagsMap({});
                          }}
                          className="px-2 py-0.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/30 text-rose-300 font-medium rounded text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
                          title="Eliminar todas las condiciones de banderas para esta acción"
                        >
                          <X className="w-3 h-3" />
                          <span>Limpiar ({totalActiveCount})</span>
                        </span>
                      )}
                      {isRequiredFlagsExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isRequiredFlagsExpanded && (
                    <div className="p-3 space-y-2.5">
                      <p className="text-[11px] text-slate-400">
                        Haz clic en cada bandera para alternar su estado requerido: <span className="text-emerald-400 font-semibold">🟢 ACTIVADA (debe valer TRUE)</span> ➔ <span className="text-rose-400 font-semibold">🔴 DESACTIVADA (debe valer FALSE)</span> ➔ <span className="text-slate-400">⚪ Sin requisito (indiferente)</span>.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 max-h-64 overflow-y-auto pr-1">
                        {allReqFlagKeys.map((fk) => {
                          const flagVal = requiredFlagsMap[fk];
                          const isTrue = flagVal === true;
                          const isFalse = flagVal === false;
                          const isDeleted = !globalFlagKeys.includes(fk);
                          return (
                            <button
                              key={`req_${fk}`}
                              type="button"
                              onClick={() => toggleRequiredFlag(fk)}
                              className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                isTrue
                                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-bold'
                                  : isFalse
                                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-200 font-bold'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <span className="font-mono truncate mr-2" title={fk}>
                                {fk}
                                {isDeleted && <span className="ml-1 text-[10px] text-rose-400 font-sans font-bold">(⚠️ Eliminada)</span>}
                              </span>
                              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                isTrue ? 'bg-emerald-500/30 text-emerald-300' : isFalse ? 'bg-rose-500/30 text-rose-300' : 'bg-slate-800 text-slate-500'
                              }`}>
                                {isTrue ? '🟢 ACTIVADA' : isFalse ? '🔴 DESACTIVADA' : '⚪ SIN REQ'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Dialogue Launcher for Hablar action */}
            {verb === 'hablar' && (
              <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                  <h5 className="font-bold text-xs text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    <span>Configuración de Conversación ("Hablar con")</span>
                  </h5>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Personaje con el que se Habla
                    </label>
                    <select
                      value={characterId || dialogue?.characterId || ''}
                      onChange={(e) => {
                        const newCharId = e.target.value;
                        setCharacterId(newCharId);
                        if (dialogue) {
                          setDialogue({ ...dialogue, characterId: newCharId });
                        }
                      }}
                      className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-200 outline-none focus:border-amber-500 font-semibold"
                    >
                      <option value="">-- Seleccionar Personaje --</option>
                      {project.characters?.map((c) => (
                        <option key={c.id} value={c.id}>
                          👤 {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Árbol de Diálogo y Opciones
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsDialogueModalOpen(true)}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>
                        {dialogue && dialogue.nodes && dialogue.nodes.length > 0
                          ? `💬 Editar Árbol (${dialogue.nodes.length} Nodos)`
                          : '➕ Crear Árbol de Diálogo'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Section 1 & Section 2 Consequences (Hidden for 'hablar' action, as conversation logic handles branches/consequences) */}
            {verb !== 'hablar' && (
              <>
                {/* Section 1: SUCCESS CONSEQUENCES (Conditions MET) */}
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>✅ Consecuencias cuando SÍ se cumplen las condiciones</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const tag = '[Terminar / Cargar partida]';
                        if (isGameOver || responseMessage.includes(tag)) {
                          setResponseMessage((prev) => prev.replace(tag, '').trim());
                          setIsGameOver(false);
                        } else {
                          setResponseMessage((prev) => (prev ? `${prev.trim()}\n\n${tag}` : tag));
                          setIsGameOver(true);
                        }
                      }}
                      className={`text-[10px] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-bold border ${
                        isGameOver || responseMessage.includes('[Terminar / Cargar partida]')
                          ? 'bg-rose-500 text-white border-rose-400 shadow'
                          : 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      <span>💀 {isGameOver || responseMessage.includes('[Terminar / Cargar partida]') ? 'Quitar Fin de Partida' : 'Insertar "[Terminar / Cargar partida]"'}</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Mensaje de Respuesta al Jugador <span className="text-amber-400">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={responseMessage}
                      onChange={(e) => {
                        setResponseMessage(e.target.value);
                        if (responseError) setResponseError(false);
                      }}
                      className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:ring-1 focus:ring-emerald-500 font-serif leading-relaxed ${
                        responseError ? 'border-rose-500 bg-rose-950/20' : 'border-slate-800'
                      }`}
                      placeholder="Ej: Usas la llave y la puerta se abre con un quejido..."
                    />
                    {responseError && (
                      <p className="text-[11px] font-bold text-rose-400 mt-1 animate-pulse">
                        ⚠️ Por favor, escribe un mensaje de respuesta antes de guardar.
                      </p>
                    )}
                  </div>

                  {/* Sound effect for success */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Sonido al cumplir condiciones:</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={soundEffect}
                        onChange={(e) => setSoundEffect(e.target.value as SoundEffectType)}
                        className="bg-black/60 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-200 outline-none focus:border-amber-500 font-semibold"
                      >
                        <option value="none">Sin Sonido</option>
                        {project.customSounds && project.customSounds.length > 0 && (
                          <optgroup label="Sonidos del Proyecto">
                            {project.customSounds.map((cs) => (
                              <option key={cs.id} value={cs.id}>
                                {cs.name} ({cs.id})
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label="Biblioteca Oficial">
                          {getAllMergedSounds(project)
                            .filter((s) => s.isGlobal || !project.customSounds?.some((cs) => cs.id === s.id))
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.id})
                              </option>
                            ))}
                        </optgroup>
                      </select>
                      {soundEffect !== 'none' && (
                        <button
                          type="button"
                          onClick={() => playSound(soundEffect, project.customSounds)}
                          className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>Probar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* State change effects for success */}
                  <div className="border-t border-emerald-500/20 pt-2.5 space-y-2.5">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                      Efectos e Impactos en el Juego (Éxito):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                      <div className="relative">
                        <label className="block text-[10px] text-slate-400 mb-1">Entregar Objeto(s)</label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddItemsDropdownOpen((prev) => !prev);
                            setIsFailAddItemsDropdownOpen(false);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 flex items-center justify-between gap-1 text-left cursor-pointer transition-colors"
                        >
                          <span className="truncate">
                            {(() => {
                              const entries = Object.entries(addItemsMap).filter(([_, q]) => Number(q) > 0);
                              if (entries.length === 0) return <span className="text-slate-400">-- Ninguno --</span>;
                              const labels = entries.map(([id, qty]) => {
                                const item = project.inventoryItems.find((i) => i.id === id);
                                const name = item?.name || id;
                                return Number(qty) > 1 ? `${qty}x ${name}` : name;
                              });
                              return <span className="text-emerald-300 font-medium">+ {labels.join(', ')}</span>;
                            })()}
                          </span>
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isAddItemsDropdownOpen ? 'rotate-180 text-emerald-400' : ''}`} />
                        </button>

                        {isAddItemsDropdownOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setIsAddItemsDropdownOpen(false)}
                            />
                            <div className="absolute left-0 top-full mt-1.5 w-72 z-50 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-2 max-h-56 overflow-y-auto space-y-1.5">
                              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 px-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Entregar Objetos
                                </span>
                                {Object.values(addItemsMap).some((q: number) => Number(q) > 0) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddItemsMap({});
                                      setAddItemId('');
                                    }}
                                    className="text-[10px] text-rose-400 hover:underline cursor-pointer font-medium"
                                  >
                                    Quitar todos
                                  </button>
                                )}
                              </div>

                              {project.inventoryItems.length === 0 ? (
                                <p className="text-[11px] text-slate-500 italic p-2">Sin objetos creados en el juego.</p>
                              ) : (
                                project.inventoryItems.map((item) => {
                                  const qty = addItemsMap[item.id] || 0;
                                  const isChecked = qty > 0;
                                  return (
                                    <div
                                      key={item.id}
                                      className={`flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors ${
                                        isChecked
                                          ? 'bg-emerald-950/70 text-emerald-200 border border-emerald-500/40'
                                          : 'text-slate-300 hover:bg-slate-900 border border-transparent'
                                      }`}
                                    >
                                      <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={(e) => {
                                            const next = { ...addItemsMap };
                                            if (e.target.checked) {
                                              next[item.id] = 1;
                                            } else {
                                              delete next[item.id];
                                            }
                                            setAddItemsMap(next);
                                            setAddItemId(Object.keys(next)[0] || '');
                                          }}
                                          className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                                        />
                                        <span className="truncate text-xs font-medium" title={item.name}>
                                          {item.name}
                                        </span>
                                      </label>

                                      <div className="flex items-center gap-1 shrink-0">
                                        <input
                                          type="number"
                                          min="0"
                                          max="999"
                                          value={qty > 0 ? qty : ''}
                                          placeholder="0"
                                          onChange={(e) => {
                                            const val = parseInt(e.target.value, 10);
                                            const next = { ...addItemsMap };
                                            if (isNaN(val) || val <= 0) {
                                              delete next[item.id];
                                            } else {
                                              next[item.id] = val;
                                            }
                                            setAddItemsMap(next);
                                            setAddItemId(Object.keys(next)[0] || '');
                                          }}
                                          className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-center font-mono font-bold text-amber-300 focus:border-amber-400 outline-none"
                                          title={`Unidades de ${item.name} a entregar`}
                                        />
                                        <span className="text-[10px] text-slate-500 font-mono">uds</span>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Retirar Objeto</label>
                        <select
                          value={removeItemId}
                          onChange={(e) => setRemoveItemId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200"
                        >
                          <option value="">-- Ninguno --</option>
                          {project.inventoryItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              - {item.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Cambiar a Escena</label>
                        <select
                          value={goToSceneId}
                          onChange={(e) => setGoToSceneId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200"
                        >
                          <option value="">-- Permanecer aquí --</option>
                          {project.scenes.map((s) => (
                            <option key={s.id} value={s.id}>
                              🚪 {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Modificar Bandera Global</label>
                        <div className="flex gap-1">
                          <select
                            value={flagToSet}
                            onChange={(e) => {
                              const fk = e.target.value;
                              setFlagToSet(fk);
                              if (fk) {
                                setSetFlagsMap({ [fk]: flagSetValue });
                              } else {
                                setSetFlagsMap({});
                              }
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1.5 text-xs text-slate-200 font-mono"
                          >
                            <option value="">-- Sin cambio --</option>
                            {globalFlagKeys.map((fk) => (
                              <option key={fk} value={fk}>
                                🚩 {fk}
                              </option>
                            ))}
                          </select>
                          {flagToSet && (
                            <select
                              value={flagSetValue ? 'true' : 'false'}
                              onChange={(e) => {
                                const val = e.target.value === 'true';
                                setFlagSetValue(val);
                                setSetFlagsMap({ [flagToSet]: val });
                              }}
                              className="bg-slate-900 border border-slate-800 rounded-lg px-1 py-1.5 text-xs font-bold text-amber-300"
                            >
                              <option value="true">ACTIVAR (TRUE)</option>
                              <option value="false">DESACTIVAR (FALSE)</option>
                            </select>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        Añadir Párrafo de Texto Extra a la Narración
                      </label>
                      <AutoGrowTextarea
                        value={appendStoryText}
                        onChange={(e) => setAppendStoryText(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500 font-serif leading-relaxed"
                        placeholder="Ej: Ahora la puerta ha quedado abierta de par en par."
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: FAIL CONSEQUENCES (Conditions NOT MET) */}
                <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                    <div>
                      <span className="text-xs font-bold text-rose-300 uppercase tracking-wider block">
                        ❌ Consecuencias cuando NO se cumplen las condiciones (Opcional)
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Si se requiere un objeto o banderas y el jugador NO los cumple, ocurrirá esto:
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const tag = '[Terminar / Cargar partida]';
                        if (failIsGameOver || failMessage.includes(tag)) {
                          setFailMessage((prev) => prev.replace(tag, '').trim());
                          setFailIsGameOver(false);
                        } else {
                          setFailMessage((prev) => (prev ? `${prev.trim()}\n\n${tag}` : tag));
                          setFailIsGameOver(true);
                        }
                      }}
                      className={`text-[10px] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-bold border ${
                        failIsGameOver || failMessage.includes('[Terminar / Cargar partida]')
                          ? 'bg-rose-500 text-white border-rose-400 shadow'
                          : 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      <span>💀 {failIsGameOver || failMessage.includes('[Terminar / Cargar partida]') ? 'Quitar Fin de Partida en Fallo' : 'Insertar "[Terminar / Cargar partida]"'}</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Mensaje alternativo al Fallar
                    </label>
                    <textarea
                      rows={2}
                      value={failMessage}
                      onChange={(e) => setFailMessage(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:ring-1 focus:ring-rose-500 font-serif leading-relaxed"
                      placeholder="Ej: Intentas forzarla sin la llave. Una trampa de agujas se activa y caes fulminado. [Terminar / Cargar partida]"
                    />
                  </div>

                  {/* Fail sound effect */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Sonido al fallar condiciones:</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={failSoundEffect}
                        onChange={(e) => setFailSoundEffect(e.target.value as SoundEffectType)}
                        className="bg-black/60 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-rose-200 outline-none focus:border-rose-500 font-semibold"
                      >
                        <option value="none">Sin Sonido</option>
                        {project.customSounds && project.customSounds.length > 0 && (
                          <optgroup label="Sonidos del Proyecto">
                            {project.customSounds.map((cs) => (
                              <option key={cs.id} value={cs.id}>
                                {cs.name} ({cs.id})
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label="Biblioteca Oficial">
                          {getAllMergedSounds(project)
                            .filter((s) => s.isGlobal || !project.customSounds?.some((cs) => cs.id === s.id))
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.id})
                              </option>
                            ))}
                        </optgroup>
                      </select>
                      {failSoundEffect !== 'none' && (
                        <button
                          type="button"
                          onClick={() => playSound(failSoundEffect, project.customSounds)}
                          className="px-2 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>Probar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* State change effects for failure */}
                  <div className="border-t border-rose-500/20 pt-2.5 space-y-2.5">
                    <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
                      Efectos e Impactos en el Juego al Fallar (Muerte / Cambio de escena / Banderas / Texto):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                      <div className="relative">
                        <label className="block text-[10px] text-slate-400 mb-1">Entregar al Fallar</label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsFailAddItemsDropdownOpen((prev) => !prev);
                            setIsAddItemsDropdownOpen(false);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 flex items-center justify-between gap-1 text-left cursor-pointer transition-colors"
                        >
                          <span className="truncate">
                            {(() => {
                              const entries = Object.entries(failAddItemsMap).filter(([_, q]) => Number(q) > 0);
                              if (entries.length === 0) return <span className="text-slate-400">-- Ninguno --</span>;
                              const labels = entries.map(([id, qty]) => {
                                const item = project.inventoryItems.find((i) => i.id === id);
                                const name = item?.name || id;
                                return Number(qty) > 1 ? `${qty}x ${name}` : name;
                              });
                              return <span className="text-rose-300 font-medium">+ {labels.join(', ')}</span>;
                            })()}
                          </span>
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isFailAddItemsDropdownOpen ? 'rotate-180 text-rose-400' : ''}`} />
                        </button>

                        {isFailAddItemsDropdownOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setIsFailAddItemsDropdownOpen(false)}
                            />
                            <div className="absolute left-0 top-full mt-1.5 w-72 z-50 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-2 max-h-56 overflow-y-auto space-y-1.5">
                              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 px-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Entregar Objetos (Fallo)
                                </span>
                                {Object.values(failAddItemsMap).some((q: number) => Number(q) > 0) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFailAddItemsMap({});
                                      setFailAddItemId('');
                                    }}
                                    className="text-[10px] text-rose-400 hover:underline cursor-pointer font-medium"
                                  >
                                    Quitar todos
                                  </button>
                                )}
                              </div>

                              {project.inventoryItems.length === 0 ? (
                                <p className="text-[11px] text-slate-500 italic p-2">Sin objetos creados en el juego.</p>
                              ) : (
                                project.inventoryItems.map((item) => {
                                  const qty = failAddItemsMap[item.id] || 0;
                                  const isChecked = qty > 0;
                                  return (
                                    <div
                                      key={item.id}
                                      className={`flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors ${
                                        isChecked
                                          ? 'bg-rose-950/70 text-rose-200 border border-rose-500/40'
                                          : 'text-slate-300 hover:bg-slate-900 border border-transparent'
                                      }`}
                                    >
                                      <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={(e) => {
                                            const next = { ...failAddItemsMap };
                                            if (e.target.checked) {
                                              next[item.id] = 1;
                                            } else {
                                              delete next[item.id];
                                            }
                                            setFailAddItemsMap(next);
                                            setFailAddItemId(Object.keys(next)[0] || '');
                                          }}
                                          className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                                        />
                                        <span className="truncate text-xs font-medium" title={item.name}>
                                          {item.name}
                                        </span>
                                      </label>

                                      <div className="flex items-center gap-1 shrink-0">
                                        <input
                                          type="number"
                                          min="0"
                                          max="999"
                                          value={qty > 0 ? qty : ''}
                                          placeholder="0"
                                          onChange={(e) => {
                                            const val = parseInt(e.target.value, 10);
                                            const next = { ...failAddItemsMap };
                                            if (isNaN(val) || val <= 0) {
                                              delete next[item.id];
                                            } else {
                                              next[item.id] = val;
                                            }
                                            setFailAddItemsMap(next);
                                            setFailAddItemId(Object.keys(next)[0] || '');
                                          }}
                                          className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-center font-mono font-bold text-rose-300 focus:border-rose-400 outline-none"
                                          title={`Unidades de ${item.name} a entregar al fallar`}
                                        />
                                        <span className="text-[10px] text-slate-500 font-mono">uds</span>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Retirar Objeto al Fallar</label>
                        <select
                          value={failRemoveItemId}
                          onChange={(e) => setFailRemoveItemId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200"
                        >
                          <option value="">-- Ninguno --</option>
                          {project.inventoryItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              - {item.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Cambiar a Escena al Fallar</label>
                        <select
                          value={failGoToSceneId}
                          onChange={(e) => setFailGoToSceneId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200"
                        >
                          <option value="">-- Permanecer aquí --</option>
                          {project.scenes.map((s) => (
                            <option key={s.id} value={s.id}>
                              🚪 {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Modificar Bandera al Fallar</label>
                        <div className="flex gap-1">
                          <select
                            value={failFlagToSet}
                            onChange={(e) => {
                              const fk = e.target.value;
                              setFailFlagToSet(fk);
                              if (fk) {
                                setFailSetFlagsMap({ [fk]: failFlagSetValue });
                              } else {
                                setFailSetFlagsMap({});
                              }
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1.5 text-xs text-slate-200 font-mono"
                          >
                            <option value="">-- Sin cambio --</option>
                            {globalFlagKeys.map((fk) => (
                              <option key={fk} value={fk}>
                                🚩 {fk}
                              </option>
                            ))}
                          </select>
                          {failFlagToSet && (
                            <select
                              value={failFlagSetValue ? 'true' : 'false'}
                              onChange={(e) => {
                                const val = e.target.value === 'true';
                                setFailFlagSetValue(val);
                                setFailSetFlagsMap({ [failFlagToSet]: val });
                              }}
                              className="bg-slate-900 border border-slate-800 rounded-lg px-1 py-1.5 text-xs font-bold text-amber-300"
                            >
                              <option value="true">ACTIVAR (TRUE)</option>
                              <option value="false">DESACTIVAR (FALSE)</option>
                            </select>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        Añadir Párrafo de Texto Extra al Fallar (Aparece en la narración)
                      </label>
                      <AutoGrowTextarea
                        value={failAppendStoryText}
                        onChange={(e) => setFailAppendStoryText(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-rose-500 font-serif leading-relaxed"
                        placeholder="Ej: Te has precipitado y la trampa ha quedado destruida junto con el mecanismo."
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center gap-2 pt-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleSaveAction(editingActionId ? 'update' : undefined)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow cursor-pointer"
                title={editingActionId ? 'Guarda las modificaciones en esta misma acción' : 'Guardar nueva acción'}
              >
                <Check className="w-4 h-4" />
                <span>{editingActionId ? 'Actualizar Acción (Guardar Cambios)' : 'Guardar Acción'}</span>
              </button>

              {editingActionId && (
                <button
                  type="button"
                  onClick={() => handleSaveAction('subaction')}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow cursor-pointer"
                  title="Crea una nueva regla/subacción independiente con estos datos, sin sobreescribir la original"
                >
                  <Plus className="w-4 h-4" />
                  <span>Guardar como Nueva Subacción</span>
                </button>
              )}

              {editingActionId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  Cancelar Edición
                </button>
              )}
            </div>
          </div>

          {/* Existing Rules List */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-200">Acciones Configuradas ({currentHotspot.actions.length})</h4>

            {currentHotspot.actions.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No hay acciones específicas todavía para esta palabra.</p>
            ) : (
              <div className="space-y-2">
                {(() => {
                  const grouped: Record<string, ActionRule[]> = {};
                  const verbOrder: string[] = [];

                  currentHotspot.actions.forEach((act) => {
                    if (!grouped[act.verb]) {
                      grouped[act.verb] = [];
                      verbOrder.push(act.verb);
                    }
                    grouped[act.verb].push(act);
                  });

                  const orderedActions: ActionRule[] = [];
                  verbOrder.forEach((v) => {
                    orderedActions.push(...grouped[v]);
                  });

                  return orderedActions.map((act) => {
                    const sameVerbActions = grouped[act.verb] || [];
                    const verbIndex = sameVerbActions.findIndex((a) => a.id === act.id);
                    const verbObj = projectVerbs.find((v) => v.id === act.verb) || ALL_VERBS.find((v) => v.id === act.verb);
                    const displayVerbName = verbObj?.label || act.verb;

                    const reqFlagsList = act.requiredFlags ? Object.keys(act.requiredFlags) : [];
                    const isCurrentlyEditing = editingActionId === act.id;

                    return (
                      <div
                        key={act.id}
                        className={`bg-slate-950 border rounded-xl p-3.5 flex items-start justify-between gap-3 shadow-inner transition-all ${
                          isCurrentlyEditing
                            ? 'border-amber-400 ring-2 ring-amber-400/40 bg-amber-950/20'
                            : verbIndex > 0 ? 'border-indigo-500/40 ml-4' : 'border-slate-800'
                        }`}
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                                verbIndex === 0
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono'
                              }`}
                            >
                              {verbIndex === 0
                                ? displayVerbName
                                : `↳ ${displayVerbName} ${verbIndex + 1} (Subacción)`}
                            </span>

                            {isCurrentlyEditing && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded font-bold">
                                ✏️ En edición
                              </span>
                            )}

                            {act.isGameOver && (
                              <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded font-bold">
                                💀 Fin de Partida
                              </span>
                            )}

                            {act.requiredItemId && (
                              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                                📦 Objeto: {project.inventoryItems.find((i) => i.id === act.requiredItemId)?.name || act.requiredItemId}
                              </span>
                            )}

                            {reqFlagsList.length > 0 && (
                              <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
                                🚩 Requiere: {reqFlagsList.map((fk) => `${fk}=${act.requiredFlags![fk] ? 'ACTIVADA' : 'DESACTIVADA'}`).join(', ')}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-200 italic font-serif">
                            "{act.responseMessage}"
                          </p>

                          {(act.failMessage || act.failStateChange || act.failIsGameOver) && (
                            <div className="text-[11px] text-rose-300/90 font-sans bg-rose-950/30 border border-rose-900/40 p-2 rounded-lg space-y-1">
                              <div className="flex items-center gap-2 font-bold text-rose-400">
                                <span>⚠️ Si NO cumple requisitos / objeto:</span>
                                {act.failIsGameOver && (
                                  <span className="text-[9px] bg-rose-500/30 text-rose-200 border border-rose-500/50 px-1.5 py-0.2 rounded uppercase">
                                    💀 Fin de Partida
                                  </span>
                                )}
                              </div>
                              {act.failMessage && <p className="italic font-serif">"{act.failMessage}"</p>}
                              {act.failStateChange && (
                                <div className="flex items-center gap-2 text-[10px] text-rose-300/80 pt-0.5 flex-wrap">
                                  {(() => {
                                    const itemsMap = act.failStateChange.addItems;
                                    if (itemsMap && Object.keys(itemsMap).length > 0) {
                                      const labels = Object.entries(itemsMap).map(([id, qty]) => {
                                        const itemObj = project.inventoryItems.find((i) => i.id === id);
                                        const name = itemObj?.name || id;
                                        return qty > 1 ? `${qty}x ${name}` : name;
                                      });
                                      return <span>+ {labels.join(', ')}</span>;
                                    }
                                    if (act.failStateChange.addItemId) {
                                      const itemObj = project.inventoryItems.find((i) => i.id === act.failStateChange.addItemId);
                                      return <span>+ {itemObj?.name || 'Objeto añadido'}</span>;
                                    }
                                    return null;
                                  })()}
                                  {act.failStateChange.removeItemId && (
                                    <span>- {project.inventoryItems.find((i) => i.id === act.failStateChange.removeItemId)?.name || 'Objeto retirado'}</span>
                                  )}
                                  {act.failStateChange.setFlags && <span>🚩 Banderas cambiadas</span>}
                                  {act.failStateChange.goToSceneId && <span>🚪 Cambio de escena</span>}
                                  {act.failStateChange.appendStoryText && <span>📝 Párrafo añadido</span>}
                                </div>
                              )}
                            </div>
                          )}

                          {act.stateChange && (
                            <div className="flex items-center gap-2 text-[10px] text-amber-400/90 pt-1 flex-wrap">
                              {(() => {
                                const itemsMap = act.stateChange.addItems;
                                if (itemsMap && Object.keys(itemsMap).length > 0) {
                                  const labels = Object.entries(itemsMap).map(([id, qty]) => {
                                    const itemObj = project.inventoryItems.find((i) => i.id === id);
                                    const name = itemObj?.name || id;
                                    return qty > 1 ? `${qty}x ${name}` : name;
                                  });
                                  return <span>+ {labels.join(', ')}</span>;
                                }
                                if (act.stateChange.addItemId) {
                                  const itemObj = project.inventoryItems.find((i) => i.id === act.stateChange.addItemId);
                                  return <span>+ {itemObj?.name || 'Objeto añadido'}</span>;
                                }
                                return null;
                              })()}
                              {act.stateChange.removeItemId && (
                                <span>- {project.inventoryItems.find((i) => i.id === act.stateChange.removeItemId)?.name || 'Objeto retirado'}</span>
                              )}
                              {act.stateChange.setFlags && <span>🚩 Banderas cambiadas</span>}
                              {act.stateChange.goToSceneId && <span>🚪 Cambio de escena</span>}
                              {act.stateChange.appendStoryText && <span>📝 Párrafo añadido</span>}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditAction(act)}
                            className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 rounded text-xs cursor-pointer font-medium"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteAction(act.id)}
                            className="p-1 text-slate-500 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-2 bg-slate-950">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onSave(currentHotspot);
              onClose();
            }}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

      {/* Duplicate Verb Conflict Modal */}
      {duplicateConflict && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="bg-slate-900 border-2 border-amber-500/60 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base text-slate-100 border-b border-slate-800 pb-2">
              Acción para "{duplicateConflict.verbLabel}" ya configurada
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              Ya existe una regla previa para la acción <strong className="text-amber-300 uppercase">{duplicateConflict.verbLabel}</strong> en la palabra clave <strong className="text-amber-300 font-bold">"{currentHotspot.word}"</strong>:
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 italic">
              "{duplicateConflict.existingRule.responseMessage}"
            </div>

            <p className="text-xs text-slate-400">
              ¿Qué deseas hacer con la nueva acción propuesta?
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleSaveAction('replace')}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center cursor-pointer shadow"
              >
                <span>Reemplazar Acción Existente</span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveAction('subaction')}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center cursor-pointer shadow"
              >
                <span>
                  Agregar como Subacción ({duplicateConflict.verbLabel} {currentHotspot.actions.filter((a) => a.verb === verb).length + 1})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDuplicateConflict(null)}
                className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Overlay for Dialogue Tree Editor */}
      {isDialogueModalOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-default animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="bg-slate-950 border-2 border-amber-500/60 rounded-2xl w-full max-w-4xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-amber-300">
                  Editor de Diálogo y Árbol de Opciones
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDialogueModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-1">
              <DialogueEditor
                project={project}
                dialogue={dialogue}
                onChange={(updated) => {
                  setDialogue(updated);
                  if (updated?.characterId) {
                    setCharacterId(updated.characterId);
                  }
                }}
                webAspect="classic"
              />
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsDialogueModalOpen(false)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow"
              >
                Guardar y Cerrar Diálogo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
