import React, { useState } from 'react';
import {
  GameProject,
  DialogueBlock,
  DialogueNode,
  DialogueOption,
  SoundEffectType,
  SOUND_EFFECT_OPTIONS,
} from '../../types';
import { getAllMergedSounds } from '../../utils/audio';
import { AutoGrowTextarea } from '../common/AutoGrowTextarea';
import {
  MessageSquare,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
  PlusCircle,
  MinusCircle,
  CornerDownRight,
  GitBranch,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface DialogueEditorProps {
  project: GameProject;
  dialogue?: DialogueBlock;
  onChange: (updated: DialogueBlock | undefined) => void;
  webAspect?: 'clean' | 'classic';
}

export const DialogueEditor: React.FC<DialogueEditorProps> = ({
  project,
  dialogue,
  onChange,
  webAspect = 'clean',
}) => {
  const characters = project.characters || [];
  const inventoryItems = project.inventoryItems || [];
  const scenes = project.scenes || [];

  const isClean = webAspect === 'clean';

  if (!dialogue) {
    return (
      <div
        className={`p-4 rounded-xl border border-dashed flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isClean ? 'bg-slate-50 border-slate-300' : 'bg-slate-900/60 border-white/10'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h5 className={`font-bold text-xs ${isClean ? 'text-slate-800' : 'text-slate-200'}`}>
              Sin Árbol de Diálogo con Personaje
            </h5>
            <p className={`text-[11px] ${isClean ? 'text-slate-500' : 'text-slate-400'}`}>
              Crea un árbol de diálogo estilo aventura gráfica con ramas, respuestas del NPC e intercambio de objetos.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const defaultCharId = characters.length > 0 ? characters[0].id : '';
            const initialNodeId = `node_${Date.now()}`;
            onChange({
              characterId: defaultCharId,
              initialNodeId,
              greeting: '¿Qué deseas?',
              nodes: [
                {
                  id: initialNodeId,
                  title: 'Nodo 1: Saludo Inicial',
                  npcPrompt: 'Hola. ¿Qué se te ofrece?',
                  options: [
                    {
                      id: `opt_${Date.now()}_1`,
                      playerText: 'Hola, ¿quién eres?',
                      npcResponse: 'Soy un habitante de este lugar.',
                    },
                    {
                      id: `opt_${Date.now()}_2`,
                      playerText: 'No tengo tiempo para hablar.',
                      npcResponse: 'De acuerdo, hasta luego.',
                      endConversation: true,
                    },
                  ],
                },
              ],
            });
          }}
          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Insertar Editor de Árbol de Diálogos</span>
        </button>
      </div>
    );
  }

  // Normalize nodes
  const nodes: DialogueNode[] =
    dialogue.nodes && dialogue.nodes.length > 0
      ? dialogue.nodes
      : [
          {
            id: 'node_root',
            title: 'Nodo 1: Saludo Inicial',
            npcPrompt: dialogue.greeting || '¿Qué deseas?',
            options: dialogue.options || [],
          },
        ];

  const initialNodeId = dialogue.initialNodeId || nodes[0]?.id || 'node_root';

  const [activeNodeId, setActiveNodeId] = useState<string>(initialNodeId);
  const [expandedOptionId, setExpandedOptionId] = useState<string | null>(null);

  const currentNode = nodes.find((n) => n.id === activeNodeId) || nodes[0] || {
    id: 'node_root',
    title: 'Nodo 1',
    npcPrompt: '',
    options: [],
  };

  const handleUpdateBlock = (updatedNodes: DialogueNode[], newInitialNodeId?: string) => {
    onChange({
      ...dialogue,
      initialNodeId: newInitialNodeId || initialNodeId,
      nodes: updatedNodes,
      greeting: updatedNodes[0]?.npcPrompt || dialogue.greeting,
    });
  };

  const handleRemoveDialogue = () => {
    if (window.confirm('¿Seguro que deseas eliminar esta conversación?')) {
      onChange(undefined);
    }
  };

  const handleAddNode = () => {
    const newNodeId = `node_${Date.now()}`;
    const newNode: DialogueNode = {
      id: newNodeId,
      title: `Nodo ${nodes.length + 1}`,
      npcPrompt: 'Frase o planteamiento del NPC...',
      options: [
        {
          id: `opt_${Date.now()}`,
          playerText: 'Respuesta del jugador',
          npcResponse: 'Réplica del NPC',
        },
      ],
    };

    const updatedNodes = [...nodes, newNode];
    handleUpdateBlock(updatedNodes);
    setActiveNodeId(newNodeId);
  };

  const handleDeleteNode = (nodeIdToDelete: string) => {
    if (nodes.length <= 1) {
      alert('Debe haber al menos un nodo en el árbol de diálogo.');
      return;
    }
    if (!window.confirm('¿Seguro que deseas eliminar este nodo de conversación?')) return;

    const updatedNodes = nodes.filter((n) => n.id !== nodeIdToDelete);
    const newInitial = activeNodeId === nodeIdToDelete ? updatedNodes[0].id : initialNodeId;
    handleUpdateBlock(updatedNodes, newInitial);
    setActiveNodeId(updatedNodes[0].id);
  };

  const handleUpdateNode = (updatedNode: DialogueNode) => {
    const updatedNodes = nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n));
    handleUpdateBlock(updatedNodes);
  };

  const handleAddOption = () => {
    const newOption: DialogueOption = {
      id: `opt_${Date.now()}`,
      playerText: 'Nueva opción del jugador',
      npcResponse: 'Respuesta del personaje',
    };
    const updatedOptions = [...currentNode.options, newOption];
    handleUpdateNode({ ...currentNode, options: updatedOptions });
    setExpandedOptionId(newOption.id);
  };

  const handleUpdateOption = (index: number, updatedOption: DialogueOption) => {
    const newOptions = [...currentNode.options];
    newOptions[index] = updatedOption;
    handleUpdateNode({ ...currentNode, options: newOptions });
  };

  const handleDeleteOption = (index: number) => {
    const newOptions = currentNode.options.filter((_, i) => i !== index);
    handleUpdateNode({ ...currentNode, options: newOptions });
  };

  const globalFlagKeys = Object.keys(project.globalFlags || {});

  return (
    <div
      className={`p-4 rounded-xl border space-y-4 ${
        isClean ? 'bg-slate-900/80 border-amber-500/30' : 'bg-slate-950 border-amber-500/30'
      }`}
    >
      {/* Dialogue Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3 border-amber-500/20">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <h5 className="font-bold text-xs text-slate-100">
              Árbol de Diálogo Multinivel
            </h5>
            <p className="text-[11px] text-slate-400">
              Crea preguntas, réplicas y ramificaciones entre nodos de conversación estilo aventura gráfica.
            </p>
          </div>
        </div>

        <button
          onClick={handleRemoveDialogue}
          className="px-2 py-1 rounded-lg text-[11px] font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
          <span>Quitar Conversación</span>
        </button>
      </div>

      {/* Select NPC & Initial Node */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold mb-1 text-slate-300">
            Personaje Interactivo (NPC)
          </label>
          <select
            value={dialogue.characterId}
            onChange={(e) => onChange({ ...dialogue, characterId: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-slate-700 bg-slate-900 text-amber-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
          >
            <option value="">-- Seleccionar Personaje --</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.id})
              </option>
            ))}
          </select>
          {characters.length === 0 && (
            <p className="text-[10px] text-amber-400 mt-1">
              No hay personajes creados. Ve a la pestaña 'Personajes' para añadir uno.
            </p>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-semibold mb-1 text-slate-300">
            Nodo de Inicio de Conversación
          </label>
          <select
            value={initialNodeId}
            onChange={(e) => handleUpdateBlock(nodes, e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-slate-700 bg-slate-900 text-amber-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title} ({n.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Nodes Bar */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            Nodos de la Conversación ({nodes.length})
          </span>
          <button
            onClick={handleAddNode}
            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow"
          >
            <Plus className="w-3 h-3" />
            <span>Añadir Nuevo Nodo</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {nodes.map((n, idx) => {
            const isActive = n.id === activeNodeId;
            const isStartNode = n.id === initialNodeId;

            return (
              <button
                key={n.id}
                onClick={() => {
                  setActiveNodeId(n.id);
                  setExpandedOptionId(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span>{n.title || `Nodo ${idx + 1}`}</span>
                {isStartNode && (
                  <span className="px-1 py-0.2 text-[9px] bg-emerald-500/20 text-emerald-300 rounded font-bold border border-emerald-500/30">
                    Inicio
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Node Editor Box */}
      <div className="p-4 rounded-xl border border-slate-800 space-y-4 bg-slate-900 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3 border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <h6 className="font-bold text-xs text-slate-100">
              Editando: {currentNode.title}
            </h6>
          </div>

          {nodes.length > 1 && (
            <button
              onClick={() => handleDeleteNode(currentNode.id)}
              className="px-2 py-1 rounded text-[11px] font-medium text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Eliminar este Nodo</span>
            </button>
          )}
        </div>

        {/* Node Title & NPC Prompt */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1 text-slate-300">
              Título del Nodo (Para el Autor)
            </label>
            <input
              type="text"
              value={currentNode.title}
              onChange={(e) => handleUpdateNode({ ...currentNode, title: e.target.value })}
              placeholder="Ej: Nodo 1: Insultos"
              className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold mb-1 text-slate-300">
              Planteamiento o Pregunta del NPC en este Nodo
            </label>
            <input
              type="text"
              value={currentNode.npcPrompt || ''}
              onChange={(e) => handleUpdateNode({ ...currentNode, npcPrompt: e.target.value })}
              placeholder="Ej: ¡Luchas como un granjero!"
              className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-serif"
            />
          </div>
        </div>

        {/* Options inside Active Node */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">
              Opciones del Jugador en este Nodo ({currentNode.options.length})
            </span>
            <button
              onClick={handleAddOption}
              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow"
            >
              <Plus className="w-3 h-3" />
              <span>Añadir Opción</span>
            </button>
          </div>

          {currentNode.options.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400 italic bg-black/40 rounded-lg border border-slate-800">
              No hay opciones añadidas a este nodo. Pulsa "Añadir Opción".
            </div>
          ) : (
            <div className="space-y-2">
              {currentNode.options.map((opt, index) => {
                const isExpanded = expandedOptionId === opt.id;
                const targetNode = nodes.find((n) => n.id === opt.nextNodeId);
                const currentFlagKey = opt.setFlags ? Object.keys(opt.setFlags)[0] || '' : '';
                const currentFlagVal = currentFlagKey ? opt.setFlags![currentFlagKey] !== false : true;

                return (
                  <div
                    key={opt.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 transition-all"
                  >
                    {/* Header summary of option */}
                    <div
                      onClick={() => setExpandedOptionId(isExpanded ? null : opt.id)}
                      className="p-3 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-800/60 rounded-xl"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-bold shrink-0 border border-slate-700">
                          #{index + 1}
                        </span>
                        <div className="truncate">
                          <div className="text-xs font-bold truncate text-slate-100">
                            {opt.playerText || 'Opción sin texto'}
                          </div>
                          <div className="text-[11px] truncate flex items-center gap-1 text-slate-400">
                            <CornerDownRight className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>{opt.npcResponse || 'Sin réplica'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {opt.nextNodeId && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 border border-sky-500/30 text-sky-300 flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" />
                            <span>{targetNode?.title || opt.nextNodeId}</span>
                          </span>
                        )}
                        {opt.endConversation && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-500/10 border border-slate-500/30 text-slate-400">
                            Salir
                          </span>
                        )}
                        {opt.giveItemId && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                            +Objeto
                          </span>
                        )}
                        {opt.requiredItemId && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-300">
                            -Objeto
                          </span>
                        )}
                        {currentFlagKey && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300">
                            🚩 {currentFlagKey}
                          </span>
                        )}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expanded details for option */}
                    {isExpanded && (
                      <div className="p-3.5 border-t border-slate-800 space-y-3 bg-slate-900/90 rounded-b-xl">
                        <div className="space-y-2">
                          <div>
                            <label className="block text-[11px] font-semibold mb-1 text-slate-300">
                              Opción del jugador (Lo que dice o elige):
                            </label>
                            <input
                              type="text"
                              value={opt.playerText}
                              onChange={(e) => handleUpdateOption(index, { ...opt, playerText: e.target.value })}
                              placeholder="Ej: ¡Qué apropiado, tú peleas como una vaca!"
                              className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold mb-1 text-slate-300">
                              Réplica del personaje a esta opción:
                            </label>
                            <textarea
                              rows={2}
                              value={opt.npcResponse}
                              onChange={(e) => handleUpdateOption(index, { ...opt, npcResponse: e.target.value })}
                              placeholder="Ej: ¡Ay! Me has dejado sin palabras..."
                              className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-serif leading-relaxed"
                            />
                          </div>
                        </div>

                        {/* Navigation / Next Node Link */}
                        <div className="p-2.5 rounded-xl border border-sky-500/20 bg-sky-950/20 space-y-2">
                          <label className="block text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                            <GitBranch className="w-3.5 h-3.5 text-sky-400" />
                            <span>Continuación / Salto de Nodo en el Árbol</span>
                          </label>

                          <select
                            value={opt.endConversation ? 'end' : opt.nextNodeId || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'end') {
                                handleUpdateOption(index, { ...opt, endConversation: true, nextNodeId: undefined });
                              } else {
                                handleUpdateOption(index, { ...opt, endConversation: false, nextNodeId: val || undefined });
                              }
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-slate-700 bg-slate-950 text-slate-100"
                          >
                            <option value="">-- Permanece en el mismo nodo ({currentNode.title}) --</option>
                            <option value="end">⏹ Finalizar conversación y cerrar diálogo</option>
                            {nodes
                              .filter((n) => n.id !== currentNode.id)
                              .map((n) => (
                                <option key={n.id} value={n.id}>
                                  ➔ Ir al nodo: {n.title} ({n.id})
                                </option>
                              ))}
                          </select>
                        </div>

                        {/* Items (+Objeto & -Objeto) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 rounded-xl border border-slate-800 bg-slate-950">
                          <div>
                            <label className="block text-[11px] font-semibold mb-1 text-emerald-400 flex items-center gap-1">
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>Regalar Objeto al Jugador (+Objeto)</span>
                            </label>
                            <select
                              value={opt.giveItemId || ''}
                              onChange={(e) => handleUpdateOption(index, { ...opt, giveItemId: e.target.value || undefined })}
                              className="w-full px-2.5 py-1 rounded-md text-xs border border-slate-700 bg-slate-900 text-slate-100"
                            >
                              <option value="">-- Ninguno --</option>
                              {inventoryItems.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name} ({item.id})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold mb-1 text-rose-400 flex items-center gap-1">
                              <MinusCircle className="w-3.5 h-3.5" />
                              <span>Requerir o Entregar Objeto (-Objeto)</span>
                            </label>
                            <select
                              value={opt.requiredItemId || ''}
                              onChange={(e) => handleUpdateOption(index, { ...opt, requiredItemId: e.target.value || undefined })}
                              className="w-full px-2.5 py-1 rounded-md text-xs border border-slate-700 bg-slate-900 text-slate-100"
                            >
                              <option value="">-- Ninguno --</option>
                              {inventoryItems.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name} ({item.id})
                                </option>
                              ))}
                            </select>

                            {opt.requiredItemId && (
                              <label className="mt-1.5 flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={opt.consumeRequiredItem || false}
                                  onChange={(e) => handleUpdateOption(index, { ...opt, consumeRequiredItem: e.target.checked })}
                                  className="rounded text-amber-500 focus:ring-amber-500"
                                />
                                <span className="text-[11px] text-slate-400">
                                  Retirar objeto del inventario al elegir (-objeto)
                                </span>
                              </label>
                            )}
                          </div>
                        </div>

                        {/* Flags Selector & Append Extra Story Text */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 rounded-xl border border-amber-500/20 bg-amber-950/10">
                          <div>
                            <label className="block text-[11px] font-semibold mb-1 text-amber-300">
                              🚩 Modificar Bandera Global al Elegir
                            </label>
                            <div className="flex gap-1">
                              <select
                                value={currentFlagKey}
                                onChange={(e) => {
                                  const fk = e.target.value;
                                  if (!fk) {
                                    handleUpdateOption(index, { ...opt, setFlags: undefined });
                                  } else {
                                    handleUpdateOption(index, { ...opt, setFlags: { [fk]: currentFlagVal } });
                                  }
                                }}
                                className="w-full px-2 py-1 rounded-md text-xs border border-slate-700 bg-slate-900 text-slate-100 font-mono"
                              >
                                <option value="">-- Sin cambio de bandera --</option>
                                {globalFlagKeys.map((fk) => (
                                  <option key={fk} value={fk}>
                                    🚩 {fk}
                                  </option>
                                ))}
                              </select>
                              {currentFlagKey && (
                                <select
                                  value={currentFlagVal ? 'true' : 'false'}
                                  onChange={(e) => {
                                    const val = e.target.value === 'true';
                                    handleUpdateOption(index, { ...opt, setFlags: { [currentFlagKey]: val } });
                                  }}
                                  className="bg-slate-900 border border-slate-700 rounded-md px-1.5 py-1 text-xs font-bold text-amber-300"
                                >
                                  <option value="true">TRUE</option>
                                  <option value="false">FALSE</option>
                                </select>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold mb-1 text-amber-300">
                              Añadir Párrafo de Texto Extra a la Narración
                            </label>
                            <AutoGrowTextarea
                              value={opt.appendStoryText || ''}
                              onChange={(e) => handleUpdateOption(index, { ...opt, appendStoryText: e.target.value || undefined })}
                              placeholder="Ej: El personaje asiente y se retira en silencio."
                              className="w-full px-2.5 py-1.5 rounded-md text-xs border border-slate-700 bg-slate-900 text-slate-100 font-serif leading-relaxed focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>

                        {/* Navigation / Sound & One time */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold mb-1 text-slate-300">
                              Ir a Escena (Navegación)
                            </label>
                            <select
                              value={opt.goToSceneId || ''}
                              onChange={(e) => handleUpdateOption(index, { ...opt, goToSceneId: e.target.value || undefined })}
                              className="w-full px-2.5 py-1 rounded-md text-xs border border-slate-700 bg-slate-900 text-slate-100"
                            >
                              <option value="">-- Mantener en Escena --</option>
                              {scenes.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({s.id})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold mb-1 text-slate-300">
                              Efecto de Sonido
                            </label>
                            <select
                              value={opt.soundEffect || 'none'}
                              onChange={(e) =>
                                handleUpdateOption(index, {
                                  ...opt,
                                  soundEffect: (e.target.value as SoundEffectType) || undefined,
                                })
                              }
                              className="w-full px-2.5 py-1 rounded-md text-xs border border-slate-700 bg-slate-900 text-slate-100"
                            >
                              <option value="none">Sin Sonido</option>
                              <option value="stop_music">⏹ Detener música de fondo</option>
                              {project.customSounds && project.customSounds.length > 0 && (
                                <optgroup label={`📁 Sonidos de ${project.title || 'este proyecto'}`}>
                                  {project.customSounds.map((cs) => (
                                    <option key={cs.id} value={cs.id}>
                                      ⭐ {cs.name} ({cs.id})
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              <optgroup label="🛡️ Biblioteca Oficial">
                                {getAllMergedSounds(project)
                                  .filter((s) => s.isGlobal || !project.customSounds?.some((cs) => cs.id === s.id))
                                  .map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.name} ({s.id})
                                    </option>
                                  ))}
                              </optgroup>
                            </select>
                          </div>

                          <div className="space-y-1 pt-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={opt.isOneTime || false}
                                onChange={(e) => handleUpdateOption(index, { ...opt, isOneTime: e.target.checked })}
                                className="rounded text-amber-500 focus:ring-amber-500"
                              />
                              <span className="text-[11px] text-slate-300">
                                Agotar opción (Un solo uso)
                              </span>
                            </label>
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => handleDeleteOption(index)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar opción #{index + 1}</span>
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
    </div>
  );
};
