import React, { useState } from 'react';
import { Hotspot, ActionRule, GameProject, VerbType } from '../../types';
import { ALL_VERBS } from '../../utils/verbs';
import { X, Plus, Trash2, Sparkles, Check, ArrowRight } from 'lucide-react';

interface HotspotEditorModalProps {
  hotspot: Hotspot;
  project: GameProject;
  onSave: (updatedHotspot: Hotspot) => void;
  onClose: () => void;
}

export const HotspotEditorModal: React.FC<HotspotEditorModalProps> = ({
  hotspot,
  project,
  onSave,
  onClose,
}) => {
  const [currentHotspot, setCurrentHotspot] = useState<Hotspot>({ ...hotspot });
  const [editingActionId, setEditingActionId] = useState<string | null>(null);

  // Action form state
  const [verb, setVerb] = useState<VerbType>('mirar');
  const [responseMessage, setResponseMessage] = useState('');
  const [requiredItemId, setRequiredItemId] = useState('');
  const [addItemId, setAddItemId] = useState('');
  const [removeItemId, setRemoveItemId] = useState('');
  const [flagToSet, setFlagToSet] = useState('');
  const [flagSetValue, setFieldSetValue] = useState(true);
  const [goToSceneId, setGoToSceneId] = useState('');
  const [appendStoryText, setAppendStoryText] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);

  const [duplicateConflict, setDuplicateConflict] = useState<{
    newRule: ActionRule;
    existingRule: ActionRule;
    verbLabel: string;
  } | null>(null);

  const handleEditAction = (action: ActionRule) => {
    setEditingActionId(action.id);
    setVerb(action.verb);
    setResponseMessage(action.responseMessage);
    setRequiredItemId(action.requiredItemId || '');
    setAddItemId(action.stateChange?.addItemId || '');
    setRemoveItemId(action.stateChange?.removeItemId || '');
    setGoToSceneId(action.stateChange?.goToSceneId || '');
    setAppendStoryText(action.stateChange?.appendStoryText || '');
    setIsGameOver(!!action.isGameOver || !!action.stateChange?.isGameOver);

    if (action.stateChange?.setFlags) {
      const entries = Object.entries(action.stateChange.setFlags);
      if (entries.length > 0) {
        setFlagToSet(entries[0][0]);
        setFieldSetValue(entries[0][1]);
      } else {
        setFlagToSet('');
      }
    } else {
      setFlagToSet('');
    }
  };

  const handleSaveAction = (forceMode?: 'replace' | 'subaction') => {
    if (!responseMessage.trim()) return;

    const stateChangeObj: any = {};

    if (addItemId) stateChangeObj.addItemId = addItemId;
    if (removeItemId) stateChangeObj.removeItemId = removeItemId;
    if (goToSceneId) stateChangeObj.goToSceneId = goToSceneId;
    if (appendStoryText.trim()) stateChangeObj.appendStoryText = appendStoryText.trim();
    if (isGameOver) stateChangeObj.isGameOver = true;
    if (flagToSet) {
      stateChangeObj.setFlags = { [flagToSet]: flagSetValue };
    }

    const newRule: ActionRule = {
      id: editingActionId || `act_${Date.now()}`,
      verb,
      responseMessage: responseMessage.trim(),
      requiredItemId: requiredItemId || undefined,
      isGameOver: isGameOver || undefined,
      stateChange: Object.keys(stateChangeObj).length > 0 ? stateChangeObj : undefined,
    };

    const existingRule = currentHotspot.actions.find(
      (a) => a.verb === verb && a.id !== (editingActionId || newRule.id)
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

    if (forceMode === 'replace') {
      updatedActions = updatedActions.map((a) => (a.id === existingRule?.id ? newRule : a));
    } else if (editingActionId) {
      updatedActions = updatedActions.map((a) => (a.id === editingActionId ? newRule : a));
    } else {
      updatedActions.push(newRule);
    }

    const updated = { ...currentHotspot, actions: updatedActions };
    setCurrentHotspot(updated);
    setDuplicateConflict(null);
    resetForm();
  };

  const handleDeleteAction = (actionId: string) => {
    const updated = {
      ...currentHotspot,
      actions: currentHotspot.actions.filter((a) => a.id !== actionId),
    };
    setCurrentHotspot(updated);
  };

  const resetForm = () => {
    setEditingActionId(null);
    setVerb('mirar');
    setResponseMessage('');
    setRequiredItemId('');
    setAddItemId('');
    setRemoveItemId('');
    setFlagToSet('');
    setGoToSceneId('');
    setAppendStoryText('');
    setIsGameOver(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div>
            <h3 className="font-bold text-lg text-amber-400">
              Configurar Palabra Clave: "{currentHotspot.word}"
            </h3>
            <p className="text-xs text-slate-400">
              Define respuestas y consecuencias para las acciones que realice el jugador sobre esta palabra.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-100">
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
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Descriptivo / Etiqueta</label>
              <input
                type="text"
                value={currentHotspot.label || ''}
                onChange={(e) => setCurrentHotspot((prev) => ({ ...prev, label: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                placeholder="Ej: Lámpara de mesa"
              />
            </div>
          </div>

          {/* Action Form */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-amber-500/30 space-y-4">
            <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{editingActionId ? 'Editar Regla de Acción' : 'Crear Nueva Regla de Acción'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Verb selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Verbo / Acción</label>
                <select
                  value={verb}
                  onChange={(e) => setVerb(e.target.value as VerbType)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:ring-1 focus:ring-amber-500"
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
                  <option value="">-- Ninguno (Acción directa) --</option>
                  {project.inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      📦 {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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
                    setIsGameOver(true);
                  }}
                  className="text-[10px] bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                >
                  <span>💀 Insertar "[Terminar / Cargar partida]"</span>
                </button>
              </div>
              <textarea
                rows={2}
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:ring-1 focus:ring-amber-500"
                placeholder="Ej: Pulsas el botón y una descarga eléctrica recorre tu cuerpo... [Terminar / Cargar partida]"
              />
            </div>

            {/* Game Over toggle box */}
            <div className="bg-rose-950/30 border border-rose-500/40 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-rose-300 block flex items-center gap-1.5">
                  <span>💀 Fin de Partida / Terminar Historia</span>
                </span>
                <span className="text-[11px] text-slate-300">
                  Marca esta acción para terminar la historia o mostrar los botones de fin de juego (Reiniciar / Cargar partida).
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isGameOver}
                  onChange={(e) => setIsGameOver(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>

            {/* State Change Consequences */}
            <div className="border-t border-slate-800/80 pt-3 space-y-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                Consecuencias y Efectos (Opcional):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                {/* Set Flag */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Modificar Bandera Global</label>
                  <select
                    value={flagToSet}
                    onChange={(e) => setFlagToSet(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="">-- Ninguna --</option>
                    {Object.keys(project.globalFlags || {}).map((f) => (
                      <option key={f} value={f}>
                        🚩 {f}
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
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  placeholder="Ej: Ahora la cómoda queda completamente al descubierto."
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSaveAction}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow"
              >
                <Check className="w-4 h-4" />
                <span>{editingActionId ? 'Actualizar Acción' : 'Guardar Acción'}</span>
              </button>
              {editingActionId && (
                <button
                  onClick={resetForm}
                  className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700"
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

                    return (
                      <div
                        key={act.id}
                        className={`bg-slate-950 border rounded-xl p-3.5 flex items-start justify-between gap-3 shadow-inner ${
                          verbIndex > 0 ? 'border-indigo-500/40 ml-4' : 'border-slate-800'
                        }`}
                      >
                        <div className="space-y-1 flex-1">
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
                                Requiere objeto: {project.inventoryItems.find((i) => i.id === act.requiredItemId)?.name || act.requiredItemId}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-200 italic font-serif">
                            "{act.responseMessage}"
                          </p>

                          {act.stateChange && (
                            <div className="flex items-center gap-2 text-[10px] text-amber-400/90 pt-1 flex-wrap">
                              {act.stateChange.addItemId && <span>+ Objeto añadido</span>}
                              {act.stateChange.setFlags && <span>🚩 Bandera cambiada</span>}
                              {act.stateChange.goToSceneId && <span>🚪 Cambio de escena</span>}
                              {act.stateChange.appendStoryText && <span>📝 Párrafo añadido</span>}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditAction(act)}
                            className="px-2 py-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 rounded text-xs"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteAction(act.id)}
                            className="p-1 text-slate-500 hover:text-red-400"
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
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onSave(currentHotspot);
              onClose();
            }}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

      {/* Duplicate Verb Conflict Modal */}
      {duplicateConflict && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/60 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <Sparkles className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-slate-100">
                Acción para "{duplicateConflict.verbLabel}" ya configurada
              </h3>
            </div>

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
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                <span>🔄 Reemplazar Acción Existente</span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveAction('subaction')}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                <ArrowRight className="w-4 h-4 text-indigo-300" />
                <span>
                  ➕ Agregar como Subacción ({duplicateConflict.verbLabel} {currentHotspot.actions.filter((a) => a.verb === verb).length + 1})
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
