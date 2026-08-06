import React, { useState } from 'react';
import { Hotspot, ActionRule, GameProject, VerbType } from '../../types';
import { ALL_VERBS } from '../../utils/verbs';
import { X, Plus, Trash2, Sparkles, Check, ArrowRight, Sliders, Eye, EyeOff, ShieldAlert } from 'lucide-react';

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
  const [verb, setVerb] = useState<VerbType>('mirar');
  const [responseMessage, setResponseMessage] = useState('');
  const [requiredItemId, setRequiredItemId] = useState('');
  const [requiredFlagsMap, setRequiredFlagsMap] = useState<Record<string, boolean>>({});
  
  // State change consequences
  const [addItemId, setAddItemId] = useState('');
  const [removeItemId, setRemoveItemId] = useState('');
  const [flagToSet, setFlagToSet] = useState('');
  const [flagSetValue, setFlagSetValue] = useState<boolean>(true);
  const [setFlagsMap, setSetFlagsMap] = useState<Record<string, boolean>>({});
  const [goToSceneId, setGoToSceneId] = useState('');
  const [appendStoryText, setAppendStoryText] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);
  const [responseError, setResponseError] = useState(false);

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
    setAddItemId(action.stateChange?.addItemId || '');
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
    setIsGameOver(!!action.isGameOver || !!action.stateChange?.isGameOver);
  };

  const handleSaveAction = (forceMode?: 'replace' | 'subaction') => {
    let msg = responseMessage.trim();
    if (!msg) {
      // If no response message was typed, highlight field in red and warn
      setResponseError(true);
      return;
    }

    setResponseError(false);

    const stateChangeObj: any = {};

    if (addItemId) stateChangeObj.addItemId = addItemId;
    if (removeItemId) stateChangeObj.removeItemId = removeItemId;
    if (goToSceneId) stateChangeObj.goToSceneId = goToSceneId;
    if (appendStoryText.trim()) stateChangeObj.appendStoryText = appendStoryText.trim();
    if (isGameOver) stateChangeObj.isGameOver = true;
    
    if (flagToSet) {
      stateChangeObj.setFlags = { [flagToSet]: flagSetValue };
    } else if (Object.keys(setFlagsMap).length > 0) {
      stateChangeObj.setFlags = { ...setFlagsMap };
    }

    let actionRuleId = editingActionId;
    if (forceMode === 'subaction' || !actionRuleId) {
      actionRuleId = `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }

    const newRule: ActionRule = {
      id: actionRuleId,
      verb,
      responseMessage: msg,
      requiredItemId: requiredItemId || undefined,
      requiredFlags: Object.keys(requiredFlagsMap).length > 0 ? { ...requiredFlagsMap } : undefined,
      isGameOver: isGameOver || undefined,
      stateChange: Object.keys(stateChangeObj).length > 0 ? stateChangeObj : undefined,
    };

    const existingRule = currentHotspot.actions.find(
      (a) => a.verb === verb && a.id !== newRule.id && a.id !== editingActionId
    );

    if (existingRule && !forceMode) {
      const verbObj = ALL_VERBS.find((v) => v.id === verb);
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
    } else if (editingActionId && forceMode !== 'subaction') {
      updatedActions = updatedActions.map((a) => (a.id === editingActionId ? newRule : a));
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
    setAddItemId('');
    setRemoveItemId('');
    setFlagToSet('');
    setFlagSetValue(true);
    setSetFlagsMap({});
    setGoToSceneId('');
    setAppendStoryText('');
    setIsGameOver(false);
  };

  const toggleRequiredFlag = (flagKey: string) => {
    setRequiredFlagsMap((prev) => {
      const copy = { ...prev };
      if (copy[flagKey]) {
        delete copy[flagKey];
      } else {
        copy[flagKey] = true;
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
                  {ALL_VERBS.map((v) => (
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

            {/* Required Flags (Multiple Variable combination!) */}
            {globalFlagKeys.length > 0 && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2">
                <label className="block text-xs font-bold text-amber-300">
                  <span>Combinación de Banderas / Variables Requeridas para que funcione esta Acción:</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Selecciona una o múltiples variables que deben estar activadas para que se ejecute esta acción específica:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                  {globalFlagKeys.map((fk) => {
                    const isReq = !!requiredFlagsMap[fk];
                    return (
                      <label key={`req_${fk}`} className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isReq ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 font-bold' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}>
                        <input
                          type="checkbox"
                          checked={isReq}
                          onChange={() => toggleRequiredFlag(fk)}
                          className="accent-amber-500 rounded"
                        />
                        <span className="font-mono">{fk}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Response Message */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Mensaje de Respuesta al Jugador <span className="text-amber-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResponseMessage((prev) =>
                      prev
                        ? `${prev.trim()} [Terminar / Cargar partida]`
                        : 'Acción fatal. [Terminar / Cargar partida]'
                    );
                    setResponseError(false);
                    setIsGameOver(true);
                  }}
                  className="text-[10px] bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>💀 Insertar "[Terminar / Cargar partida]"</span>
                </button>
              </div>
              <textarea
                rows={2}
                value={responseMessage}
                onChange={(e) => {
                  setResponseMessage(e.target.value);
                  if (responseError) setResponseError(false);
                }}
                className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:ring-1 focus:ring-amber-500 font-serif leading-relaxed ${
                  responseError ? 'border-rose-500 bg-rose-950/20' : 'border-slate-800'
                }`}
                placeholder="Ej: Mueves el armario tapando la ventana. El viento deja de silbar..."
              />
              {responseError && (
                <p className="text-[11px] font-bold text-rose-400 mt-1 animate-pulse">
                  ⚠️ Por favor, escribe un mensaje de respuesta para el jugador antes de guardar.
                </p>
              )}
            </div>

            {/* State Change Consequences (Expanded without arbitrary limit!) */}
            <div className="border-t border-slate-800/80 pt-3 space-y-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                Múltiples Consecuencias y Efectos Inmediatos:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Give Item */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Entregar Objeto al Jugador</label>
                  <select
                    value={addItemId}
                    onChange={(e) => setAddItemId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="">-- Ninguno --</option>
                    {project.inventoryItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        + {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Remove Item */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Retirar Objeto del Inventario</label>
                  <select
                    value={removeItemId}
                    onChange={(e) => setRemoveItemId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="">-- Ninguno --</option>
                    {project.inventoryItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        - {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Change Scene */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Cambiar a Escena</label>
                  <select
                    value={goToSceneId}
                    onChange={(e) => setGoToSceneId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="">-- Permanecer aquí --</option>
                    {project.scenes.map((s) => (
                      <option key={s.id} value={s.id}>
                        🚪 {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Set Flag Dropdown */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Modificar Bandera Global</label>
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
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono"
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
                        className="bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1.5 text-xs font-bold text-amber-300"
                      >
                        <option value="true">TRUE</option>
                        <option value="false">FALSE</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Append extra text */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Añadir Párrafo de Texto Extra a la Narración
                </label>
                <input
                  type="text"
                  value={appendStoryText}
                  onChange={(e) => setAppendStoryText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                  placeholder="Ej: Ahora la puerta ha quedado libre y puedes salir."
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleSaveAction()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingActionId ? 'Actualizar Acción' : 'Guardar Acción'}</span>
              </button>
              {editingActionId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700 cursor-pointer"
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
                    const verbObj = ALL_VERBS.find((v) => v.id === act.verb);
                    const displayVerbName = verbObj?.label || act.verb;

                    const reqFlagsList = act.requiredFlags ? Object.keys(act.requiredFlags) : [];

                    return (
                      <div
                        key={act.id}
                        className={`bg-slate-950 border rounded-xl p-3.5 flex items-start justify-between gap-3 shadow-inner ${
                          verbIndex > 0 ? 'border-indigo-500/40 ml-4' : 'border-slate-800'
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
                                🚩 Requiere: {reqFlagsList.join(' + ')}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-200 italic font-serif">
                            "{act.responseMessage}"
                          </p>

                          {act.stateChange && (
                            <div className="flex items-center gap-2 text-[10px] text-amber-400/90 pt-1 flex-wrap">
                              {act.stateChange.addItemId && <span>+ Objeto añadido</span>}
                              {act.stateChange.removeItemId && <span>- Objeto retirado</span>}
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
    </div>
  );
};
