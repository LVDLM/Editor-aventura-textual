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

  const handleEditAction = (action: ActionRule) => {
    setEditingActionId(action.id);
    setVerb(action.verb);
    setResponseMessage(action.responseMessage);
    setRequiredItemId(action.requiredItemId || '');
    setAddItemId(action.stateChange?.addItemId || '');
    setRemoveItemId(action.stateChange?.removeItemId || '');
    setGoToSceneId(action.stateChange?.goToSceneId || '');
    setAppendStoryText(action.stateChange?.appendStoryText || '');

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

  const handleSaveAction = () => {
    if (!responseMessage.trim()) return;

    const stateChangeObj: any = {};

    if (addItemId) stateChangeObj.addItemId = addItemId;
    if (removeItemId) stateChangeObj.removeItemId = removeItemId;
    if (goToSceneId) stateChangeObj.goToSceneId = goToSceneId;
    if (appendStoryText.trim()) stateChangeObj.appendStoryText = appendStoryText.trim();
    if (flagToSet) {
      stateChangeObj.setFlags = { [flagToSet]: flagSetValue };
    }

    const newRule: ActionRule = {
      id: editingActionId || `act_${Date.now()}`,
      verb,
      responseMessage: responseMessage.trim(),
      requiredItemId: requiredItemId || undefined,
      stateChange: Object.keys(stateChangeObj).length > 0 ? stateChangeObj : undefined,
    };

    let updatedActions = [...currentHotspot.actions];
    if (editingActionId) {
      updatedActions = updatedActions.map((a) => (a.id === editingActionId ? newRule : a));
    } else {
      updatedActions.push(newRule);
    }

    const updated = { ...currentHotspot, actions: updatedActions };
    setCurrentHotspot(updated);
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
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mensaje de Respuesta al Jugador <span className="text-amber-400">*</span>
              </label>
              <textarea
                rows={2}
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:ring-1 focus:ring-amber-500"
                placeholder="Ej: La habitación se ilumina con una cálida luz."
              />
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
                {currentHotspot.actions.map((act) => (
                  <div
                    key={act.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-start justify-between gap-3 shadow-inner"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                          {act.verb}
                        </span>
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
                ))}
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
            <span>Guardar Palabra Clave</span>
          </button>
        </div>
      </div>
    </div>
  );
};
