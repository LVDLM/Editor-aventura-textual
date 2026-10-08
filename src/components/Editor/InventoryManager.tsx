import React, { useState } from 'react';
import { GameProject, InventoryItem, ActionRule, SoundEffectType, SOUND_EFFECT_OPTIONS } from '../../types';
import { Package, Plus, Trash2, Key, BookOpen, Flashlight, Box, Sparkles, Edit2, Puzzle, ArrowRight, Zap, Check } from 'lucide-react';

interface InventoryManagerProps {
  project: GameProject;
  updateProject: (fn: (prev: GameProject) => GameProject) => void;
}

const AVAILABLE_ICONS = [
  { name: 'Key', label: 'Llave', Icon: Key },
  { name: 'BookOpen', label: 'Libro / Diario', Icon: BookOpen },
  { name: 'Flashlight', label: 'Linterna', Icon: Flashlight },
  { name: 'Box', label: 'Caja / Objeto', Icon: Box },
];

export const InventoryManager: React.FC<InventoryManagerProps> = ({ project, updateProject }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Box');
  const [isGameOver, setIsGameOver] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFileData, setImageFileData] = useState<string | undefined>(undefined);
  const [imageFileName, setImageFileName] = useState<string | undefined>(undefined);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // State for Managing Combinations on an Item
  const [comboManagingItemId, setComboManagingItemId] = useState<string | null>(null);
  const [comboRequiredItemId, setComboRequiredItemId] = useState('');
  const [comboResponseMsg, setComboResponseMsg] = useState('');
  const [comboAddItem, setComboAddItem] = useState('');
  const [comboRemoveThis, setComboRemoveThis] = useState(true);
  const [comboRemoveRequired, setComboRemoveRequired] = useState(false);
  const [comboSetFlag, setComboSetFlag] = useState('');
  const [comboSound, setComboSound] = useState<SoundEffectType>('pickup');

  // State for Direct Use Effect on Item (e.g. Health Potion, Flashlight, Book)
  const [hasUseEffect, setHasUseEffect] = useState(false);
  const [useEffectMessage, setUseEffectMessage] = useState('');
  const [useEffectConsume, setUseEffectConsume] = useState(true);
  const [useEffectAddItem, setUseEffectAddItem] = useState('');
  const [useEffectFlagName, setUseEffectFlagName] = useState('');
  const [useEffectFlagVal, setUseEffectFlagVal] = useState(true);
  const [useEffectSound, setUseEffectSound] = useState<SoundEffectType>('pickup');
  const [useEffectGoToScene, setUseEffectGoToScene] = useState('');
  const [useEffectAppendText, setUseEffectAppendText] = useState('');
  const [useEffectIsGameOver, setUseEffectIsGameOver] = useState(false);
  const [useEffectReqFlagName, setUseEffectReqFlagName] = useState('');
  const [useEffectReqFlagVal, setUseEffectReqFlagVal] = useState(true);
  const [useEffectFailMsg, setUseEffectFailMsg] = useState('');

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedIcon('Box');
    setIsGameOver(false);
    setImageUrl('');
    setImageFileData(undefined);
    setImageFileName(undefined);
    setEditingItemId(null);
    setHasUseEffect(false);
    setUseEffectMessage('');
    setUseEffectConsume(true);
    setUseEffectAddItem('');
    setUseEffectFlagName('');
    setUseEffectFlagVal(true);
    setUseEffectSound('pickup');
    setUseEffectGoToScene('');
    setUseEffectAppendText('');
    setUseEffectIsGameOver(false);
    setUseEffectReqFlagName('');
    setUseEffectReqFlagVal(true);
    setUseEffectFailMsg('');
  };

  const handleImageFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const sanitizedFileName = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '_');
      setImageFileData(dataUrl);
      setImageFileName(sanitizedFileName);
      setImageUrl('');
    };
    reader.readAsDataURL(file);
  };

  const handleCreateOrUpdateItem = () => {
    if (!name.trim()) return;

    const targetId = editingItemId || `item_${Date.now()}`;

    const useEffectAction: ActionRule | undefined = hasUseEffect
      ? {
          id: (editingItemId && project.inventoryItems.find((i) => i.id === editingItemId)?.useEffectAction?.id) || `use_${Date.now()}`,
          verb: 'usar',
          responseMessage: useEffectMessage.trim() || `Has usado ${name.trim()}.`,
          soundEffect: useEffectSound,
          isGameOver: useEffectIsGameOver || undefined,
          requiredFlags: useEffectReqFlagName.trim() ? { [useEffectReqFlagName.trim()]: useEffectReqFlagVal } : undefined,
          failMessage: useEffectFailMsg.trim() || undefined,
          stateChange: {
            removeItemId: useEffectConsume ? targetId : undefined,
            addItemId: useEffectAddItem || undefined,
            goToSceneId: useEffectGoToScene || undefined,
            appendStoryText: useEffectAppendText.trim() || undefined,
            isGameOver: useEffectIsGameOver || undefined,
            setFlags: useEffectFlagName.trim() ? { [useEffectFlagName.trim()]: useEffectFlagVal } : undefined,
          },
        }
      : undefined;

    if (editingItemId) {
      updateProject((prev) => ({
        ...prev,
        inventoryItems: prev.inventoryItems.map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                name: name.trim(),
                description: description.trim(),
                icon: selectedIcon,
                isGameOver: isGameOver || undefined,
                imageUrl: imageUrl ? imageUrl : undefined,
                imageFileData: imageFileData,
                imageFileName: imageFileName,
                useEffectAction: useEffectAction,
              }
            : item
        ),
      }));
    } else {
      const newItem: InventoryItem = {
        id: targetId,
        name: name.trim(),
        description: description.trim(),
        icon: selectedIcon,
        isGameOver: isGameOver || undefined,
        imageUrl: imageUrl ? imageUrl : undefined,
        imageFileData: imageFileData,
        imageFileName: imageFileName,
        useEffectAction: useEffectAction,
      };
      updateProject((prev) => ({
        ...prev,
        inventoryItems: [...prev.inventoryItems, newItem],
      }));
    }

    resetForm();
  };

  const handleEditClick = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setName(item.name);
    setDescription(item.description);
    setSelectedIcon(item.icon);
    setIsGameOver(!!item.isGameOver);
    setImageUrl(item.imageUrl || '');
    setImageFileData(item.imageFileData);
    setImageFileName(item.imageFileName);

    const ue = item.useEffectAction;
    if (ue) {
      setHasUseEffect(true);
      setUseEffectMessage(ue.responseMessage || '');
      setUseEffectConsume(ue.stateChange?.removeItemId === item.id);
      setUseEffectAddItem(ue.stateChange?.addItemId || '');
      const flagEntries = Object.entries(ue.stateChange?.setFlags || {});
      if (flagEntries.length > 0) {
        setUseEffectFlagName(flagEntries[0][0]);
        setUseEffectFlagVal(flagEntries[0][1]);
      } else {
        setUseEffectFlagName('');
        setUseEffectFlagVal(true);
      }
      setUseEffectSound(ue.soundEffect || 'pickup');
      setUseEffectGoToScene(ue.stateChange?.goToSceneId || '');
      setUseEffectAppendText(ue.stateChange?.appendStoryText || '');
      setUseEffectIsGameOver(!!ue.isGameOver || !!ue.stateChange?.isGameOver);
      const reqEntries = Object.entries(ue.requiredFlags || {});
      if (reqEntries.length > 0) {
        setUseEffectReqFlagName(reqEntries[0][0]);
        setUseEffectReqFlagVal(reqEntries[0][1]);
      } else {
        setUseEffectReqFlagName('');
        setUseEffectReqFlagVal(true);
      }
      setUseEffectFailMsg(ue.failMessage || '');
    } else {
      setHasUseEffect(false);
      setUseEffectMessage('');
      setUseEffectConsume(true);
      setUseEffectAddItem('');
      setUseEffectFlagName('');
      setUseEffectFlagVal(true);
      setUseEffectSound('pickup');
      setUseEffectGoToScene('');
      setUseEffectAppendText('');
      setUseEffectIsGameOver(false);
      setUseEffectReqFlagName('');
      setUseEffectReqFlagVal(true);
      setUseEffectFailMsg('');
    }
  };

  const handleDeleteItem = (itemId: string) => {
    updateProject((prev) => ({
      ...prev,
      inventoryItems: prev.inventoryItems.filter((i) => i.id !== itemId),
    }));
  };

  const handleAddCombination = (targetItemId: string) => {
    if (!comboRequiredItemId) return;

    const newRule: ActionRule = {
      id: `combo_${Date.now()}`,
      verb: 'usar',
      requiredItemId: comboRequiredItemId,
      responseMessage: comboResponseMsg.trim() || 'Has combinado los objetos con éxito.',
      soundEffect: comboSound,
      stateChange: {
        addItemId: comboAddItem || undefined,
        removeItemId: comboRemoveThis ? targetItemId : undefined,
        removeItem2Id: comboRemoveRequired ? comboRequiredItemId : undefined,
        setFlags: comboSetFlag.trim() ? { [comboSetFlag.trim()]: true } : undefined,
      },
    };

    updateProject((prev) => ({
      ...prev,
      inventoryItems: prev.inventoryItems.map((item) =>
        item.id === targetItemId
          ? {
              ...item,
              combinations: [...(item.combinations || []), newRule],
            }
          : item
      ),
    }));

    // Reset combination inputs
    setComboRequiredItemId('');
    setComboResponseMsg('');
    setComboAddItem('');
    setComboRemoveThis(true);
    setComboRemoveRequired(false);
    setComboSetFlag('');
    setComboSound('pickup');
  };

  const handleDeleteCombination = (targetItemId: string, comboRuleId: string) => {
    updateProject((prev) => ({
      ...prev,
      inventoryItems: prev.inventoryItems.map((item) =>
        item.id === targetItemId
          ? {
              ...item,
              combinations: (item.combinations || []).filter((c) => c.id !== comboRuleId),
            }
          : item
      ),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Form: Create or Edit Item */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Package className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-slate-100 text-base">
            {editingItemId ? 'Editar Objeto de Inventario' : 'Crear Nuevo Objeto de Inventario'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Objeto</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:ring-1 focus:ring-amber-500"
              placeholder="Ej: Tijeras afiladas"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Icono del Objeto</label>
            <div className="flex items-center gap-2">
              {AVAILABLE_ICONS.map((ic) => {
                const IconComp = ic.Icon;
                const isSel = selectedIcon === ic.name;
                return (
                  <button
                    key={ic.name}
                    type="button"
                    onClick={() => setSelectedIcon(ic.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                      isSel
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                    <span>{ic.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-300">Descripción para el Jugador</label>
            <button
              type="button"
              onClick={() => {
                setDescription((prev) =>
                  prev
                    ? `${prev.trim()} [Terminar / Cargar partida]`
                    : 'Inspeccionas este objeto y sufres un destino fatal. [Terminar / Cargar partida]'
                );
                setIsGameOver(true);
              }}
              className="text-[10px] bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
            >
              💀 Insertar "[Terminar / Cargar partida]"
            </button>
          </div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:ring-1 focus:ring-amber-500"
            placeholder="Ej: Unas tijeras bien afiladas con mango de metal. [Terminar / Cargar partida]"
          />
        </div>

        {/* Item Image Upload / URL */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span className="text-amber-400">🖼️</span>
              <span>Imagen del Objeto (Opcional)</span>
            </label>
            {(imageFileData || imageUrl) && (
              <button
                type="button"
                onClick={() => {
                  setImageFileData(undefined);
                  setImageFileName(undefined);
                  setImageUrl('');
                }}
                className="text-[10px] text-rose-400 hover:text-rose-300 underline"
              >
                Quitar Imagen
              </button>
            )}
          </div>

          {(imageFileData || imageUrl) ? (
            <div className="flex items-center gap-3 bg-slate-900 border border-amber-500/30 rounded-xl p-2.5">
              <img
                src={imageFileData || imageUrl}
                alt="Objeto"
                className="w-16 h-16 object-contain rounded-lg border border-slate-700 bg-slate-950 shrink-0"
              />
              <div className="text-xs space-y-0.5 overflow-hidden">
                <p className="font-semibold text-amber-300 truncate">
                  {imageFileName || 'Imagen de objeto lista'}
                </p>
                <p className="text-[10px] text-slate-400">
                  Se incluirá en la carpeta <code className="text-amber-200">IMG/</code> al exportar.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer text-xs text-slate-300 transition-colors">
                <span>📂 Subir imagen de objeto</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageFileUpload(f);
                  }}
                />
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="O escribe URL de la imagen (https://...)"
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:border-amber-500 outline-none"
              />
            </div>
          )}
        </div>

        {/* Game Over toggle */}
        <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="font-bold text-xs text-rose-300 block">💀 Fin de Partida al Examinar / Usar</span>
            <span className="text-[11px] text-slate-400">
              Marca este objeto si al interactuar con él el jugador pierde o termina la historia.
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

        {/* Direct Use Effect from Inventory (e.g. Health Potion, Flashlight, Book) */}
        <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-amber-300 block">
                  Efecto al Usar Directamente desde el Inventario
                </span>
                <span className="text-[11px] text-slate-400">
                  Permite usar este objeto por sí solo (ej: beber poción de vida, leer un mapa, encender mechero).
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hasUseEffect}
                onChange={(e) => setHasUseEffect(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {hasUseEffect && (
            <div className="pt-3 border-t border-slate-800/80 space-y-3.5">
              {/* Response Message */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mensaje / Narración del Efecto al Usar el Objeto *
                </label>
                <textarea
                  rows={2}
                  value={useEffectMessage}
                  onChange={(e) => setUseEffectMessage(e.target.value)}
                  placeholder="Ej: Te bebes la poción de vida de un trago. Sientes cómo el calor recorre tu cuerpo y tus heridas sanan al instante."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Consume checkbox */}
                <label className="flex items-center gap-2.5 p-3 bg-slate-900/90 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={useEffectConsume}
                    onChange={(e) => setUseEffectConsume(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-200 block">Consumir objeto al usar</span>
                    <span className="text-[10px] text-slate-400">Se elimina del inventario tras usarlo (ideal para pociones, comida, etc.)</span>
                  </div>
                </label>

                {/* Sound effect selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Efecto de Sonido
                  </label>
                  <select
                    value={useEffectSound}
                    onChange={(e) => setUseEffectSound(e.target.value as SoundEffectType)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 outline-none"
                  >
                    {SOUND_EFFECT_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Set Flag */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Activar / Cambiar Bandera (Flag)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={useEffectFlagName}
                      onChange={(e) => setUseEffectFlagName(e.target.value)}
                      placeholder="Ej: pocion_usada, vida_llena"
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setUseEffectFlagVal(!useEffectFlagVal)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        useEffectFlagVal
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {useEffectFlagVal ? 'ACTIVA (true)' : 'INACTIVA (false)'}
                    </button>
                  </div>
                </div>

                {/* Give Item */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Añadir otro objeto al inventario (Opcional)
                  </label>
                  <select
                    value={useEffectAddItem}
                    onChange={(e) => setUseEffectAddItem(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 outline-none"
                  >
                    <option value="">-- Ninguno --</option>
                    {project.inventoryItems
                      .filter((inv) => inv.id !== editingItemId)
                      .map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.name} (ID: {inv.id})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Jump to scene */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Teletransportar a Escena (Opcional)
                  </label>
                  <select
                    value={useEffectGoToScene}
                    onChange={(e) => setUseEffectGoToScene(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 outline-none"
                  >
                    <option value="">-- No cambiar de escena --</option>
                    {project.scenes.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.name} ({sc.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Game over on use */}
                <label className="flex items-center gap-2.5 p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl cursor-pointer hover:border-rose-500/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={useEffectIsGameOver}
                    onChange={(e) => setUseEffectIsGameOver(e.target.checked)}
                    className="rounded border-rose-700 text-rose-500 focus:ring-rose-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-rose-300 block">💀 Fin de Partida al usar</span>
                    <span className="text-[10px] text-slate-400">El jugador pierde o termina la partida (ej: veneno mortal)</span>
                  </div>
                </label>
              </div>

              {/* Conditions (Optional) */}
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-amber-300 block">Condición requerida para poder usarlo (Opcional):</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Bandera requerida</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={useEffectReqFlagName}
                        onChange={(e) => setUseEffectReqFlagName(e.target.value)}
                        placeholder="Ej: herido, sediento"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setUseEffectReqFlagVal(!useEffectReqFlagVal)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                          useEffectReqFlagVal
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        {useEffectReqFlagVal ? 'SÍ' : 'NO'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Mensaje si no se cumple</label>
                    <input
                      type="text"
                      value={useEffectFailMsg}
                      onChange={(e) => setUseEffectFailMsg(e.target.value)}
                      placeholder="Ej: Ya tienes la salud al máximo."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={handleCreateOrUpdateItem}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            {!editingItemId && <Plus className="w-4 h-4" />}
            <span>{editingItemId ? 'Guardar Cambios' : 'Añadir Objeto al Juego'}</span>
          </button>

          {editingItemId && (
            <button
              onClick={resetForm}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs cursor-pointer"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Item List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <span>Objetos de Inventario Disponibles ({project.inventoryItems.length})</span>
          </h3>
        </div>

        {project.inventoryItems.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No hay objetos creados todavía.</p>
        ) : (
          <div className="space-y-4">
            {project.inventoryItems.map((item) => {
              const iconObj = AVAILABLE_ICONS.find((i) => i.name === item.icon);
              const IconComp = iconObj ? iconObj.Icon : Box;
              const itemImg = item.imageFileData || item.imageUrl;
              const isManagingCombos = comboManagingItemId === item.id;
              const existingCombos = item.combinations || [];

              return (
                <div
                  key={item.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-inner"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {itemImg ? (
                        <img
                          src={itemImg}
                          alt={item.name}
                          className="w-11 h-11 object-contain rounded-xl border border-amber-500/30 bg-black shrink-0"
                        />
                      ) : (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                          <IconComp className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {itemImg && <span className="text-[10px] text-amber-400">🖼️</span>}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">{item.description || 'Sin descripción'}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-mono">
                            ID: {item.id}
                          </span>
                          {item.useEffectAction && (
                            <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 font-semibold flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              <span>Efecto al usar</span>
                            </span>
                          )}
                          {existingCombos.length > 0 && (
                            <span className="text-[10px] text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30 font-semibold flex items-center gap-1">
                              <Puzzle className="w-3 h-3 text-sky-400" />
                              <span>{existingCombos.length} combinación(es)</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setComboManagingItemId(isManagingCombos ? null : item.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                          isManagingCombos
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                            : 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        <Puzzle className="w-3.5 h-3.5" />
                        <span>Combinar</span>
                      </button>
                      <button
                        onClick={() => handleEditClick(item)}
                        className="p-2 text-slate-400 hover:text-amber-400 transition-colors bg-slate-900 rounded-xl border border-slate-800"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 text-slate-400 hover:text-rose-400 transition-colors bg-slate-900 rounded-xl border border-slate-800"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Direct use effect preview */}
                  {item.useEffectAction && (
                    <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Efecto al usar directamente:</span>
                        </span>
                        {item.useEffectAction.stateChange?.removeItemId === item.id ? (
                          <span className="text-[10px] text-rose-300 bg-rose-950/50 px-2 py-0.5 rounded border border-rose-500/30 font-semibold">
                            Consumible (se gasta)
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-300 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                            Reutilizable
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-200 italic font-medium">
                        "{item.useEffectAction.responseMessage}"
                      </p>
                      <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 pt-1 border-t border-amber-500/20">
                        {item.useEffectAction.stateChange?.addItemId && (
                          <span className="text-emerald-300 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            + Añade: {project.inventoryItems.find((i) => i.id === item.useEffectAction?.stateChange?.addItemId)?.name || item.useEffectAction.stateChange.addItemId}
                          </span>
                        )}
                        {item.useEffectAction.stateChange?.setFlags && (
                          <span className="text-sky-300 bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-500/30">
                            🚩 Bandera: {Object.keys(item.useEffectAction.stateChange.setFlags).join(', ')}
                          </span>
                        )}
                        {item.useEffectAction.stateChange?.goToSceneId && (
                          <span className="text-purple-300 bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-500/30">
                            🚪 Cambia a escena: {project.scenes.find((s) => s.id === item.useEffectAction?.stateChange?.goToSceneId)?.name || item.useEffectAction.stateChange.goToSceneId}
                          </span>
                        )}
                        {item.useEffectAction.soundEffect && (
                          <span className="text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            🔊 Sonido: {item.useEffectAction.soundEffect}
                          </span>
                        )}
                        {(item.useEffectAction.isGameOver || item.useEffectAction.stateChange?.isGameOver) && (
                          <span className="text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/40 font-bold">
                            💀 Fin de partida
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* List of existing combinations for this item */}
                  {existingCombos.length > 0 && (
                    <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 space-y-2">
                      <h5 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Puzzle className="w-3.5 h-3.5" />
                        <span>Combinaciones configuradas para este objeto:</span>
                      </h5>
                      <div className="space-y-1.5">
                        {existingCombos.map((combo) => {
                          const reqItem = project.inventoryItems.find((i) => i.id === combo.requiredItemId);
                          const addedItem = combo.stateChange?.addItemId
                            ? project.inventoryItems.find((i) => i.id === combo.stateChange?.addItemId)
                            : null;

                          return (
                            <div
                              key={combo.id}
                              className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs"
                            >
                              <div className="space-y-1 pr-2">
                                <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                                  <span>Usar con:</span>
                                  <span className="text-amber-400 font-bold">[{reqItem?.name || combo.requiredItemId}]</span>
                                  <ArrowRight className="w-3 h-3 text-slate-500" />
                                  <span className="text-emerald-400">"{combo.responseMessage}"</span>
                                </div>
                                <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
                                  {addedItem && (
                                    <span className="text-emerald-300 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                      + Obtiene: {addedItem.name}
                                    </span>
                                  )}
                                  {combo.stateChange?.removeItemId && (
                                    <span className="text-rose-300 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-500/30">
                                      - Retira: {item.name}
                                    </span>
                                  )}
                                  {combo.stateChange?.removeItem2Id && (
                                    <span className="text-rose-300 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-500/30">
                                      - Retira: {reqItem?.name || combo.requiredItemId}
                                    </span>
                                  )}
                                  {combo.stateChange?.setFlags && (
                                    <span className="text-sky-300 bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-500/30">
                                      🚩 Activación de Flags
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => handleDeleteCombination(item.id, combo.id)}
                                className="p-1 text-slate-400 hover:text-rose-400 transition-colors shrink-0"
                                title="Eliminar combinación"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Combination Creator Panel when toggled */}
                  {isManagingCombos && (
                    <div className="bg-amber-950/20 border border-amber-500/40 rounded-xl p-4 space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                        <h5 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <Puzzle className="w-4 h-4 text-amber-400" />
                          <span>Añadir Combinación para "{item.name}"</span>
                        </h5>
                        <button
                          onClick={() => setComboManagingItemId(null)}
                          className="text-[10px] text-slate-400 hover:text-slate-200"
                        >
                          Cerrar
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            1. ¿Qué otro objeto se usará con "{item.name}"?
                          </label>
                          <select
                            value={comboRequiredItemId}
                            onChange={(e) => setComboRequiredItemId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:border-amber-500"
                          >
                            <option value="">-- Seleccionar Objeto del Inventario --</option>
                            {project.inventoryItems
                              .filter((i) => i.id !== item.id)
                              .map((other) => (
                                <option key={other.id} value={other.id}>
                                  {other.name} (ID: {other.id})
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            2. Efecto de Sonido al combinar
                          </label>
                          <select
                            value={comboSound}
                            onChange={(e) => setComboSound(e.target.value as SoundEffectType)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:border-amber-500"
                          >
                            {SOUND_EFFECT_OPTIONS.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          3. Respuesta / Mensaje al combinar
                        </label>
                        <input
                          type="text"
                          value={comboResponseMsg}
                          onChange={(e) => setComboResponseMsg(e.target.value)}
                          placeholder='Ej: Cortas el papel con las tijeras y obtienes un mapa recortado.'
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            4. Objeto resultante a entregar (Opcional)
                          </label>
                          <select
                            value={comboAddItem}
                            onChange={(e) => setComboAddItem(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:border-amber-500"
                          >
                            <option value="">-- Ninguno --</option>
                            {project.inventoryItems.map((inv) => (
                              <option key={inv.id} value={inv.id}>
                                + Entregar: {inv.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            5. Activar Flag (Opcional)
                          </label>
                          <input
                            type="text"
                            value={comboSetFlag}
                            onChange={(e) => setComboSetFlag(e.target.value)}
                            placeholder="Ej: papel_recortado"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:border-amber-500 font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={comboRemoveThis}
                            onChange={(e) => setComboRemoveThis(e.target.checked)}
                            className="rounded border-slate-800 text-amber-500 focus:ring-amber-500"
                          />
                          <span>Retirar "{item.name}" del inventario</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={comboRemoveRequired}
                            onChange={(e) => setComboRemoveRequired(e.target.checked)}
                            className="rounded border-slate-800 text-amber-500 focus:ring-amber-500"
                          />
                          <span>Retirar también el otro objeto de la combinación</span>
                        </label>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => handleAddCombination(item.id)}
                          disabled={!comboRequiredItemId}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Guardar Combinación</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
