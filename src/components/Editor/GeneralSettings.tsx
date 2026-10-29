import React, { useEffect, useState } from 'react';
import { GameProject, EngineTheme, VerbType, UserProfile, GENRE_TAGS, VerbDefinition } from '../../types';
import { ALL_VERBS, getProjectVerbs, AVAILABLE_VERB_ICONS, renderVerbIcon } from '../../utils/verbs';
import { Plus, Trash2, ArrowUp, ArrowDown, RotateCcw, Sparkles, Check, X, ShieldAlert, Edit2 } from 'lucide-react';

interface GeneralSettingsProps {
  project: GameProject;
  updateProject: (fn: (prev: GameProject) => GameProject) => void;
  currentUser?: UserProfile | null;
  webAspect?: 'clean' | 'classic';
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  project,
  updateProject,
  currentUser,
  webAspect = 'clean',
}) => {
  const isClean = webAspect === 'clean';

  // State for adding custom verbs
  const [showAddVerbModal, setShowAddVerbModal] = useState(false);
  const [newVerbId, setNewVerbId] = useState('');
  const [newVerbLabel, setNewVerbLabel] = useState('');
  const [newVerbIcon, setNewVerbIcon] = useState('Swords');
  const [newVerbFallback, setNewVerbFallback] = useState('');
  const [errorAddVerb, setErrorAddVerb] = useState<string | null>(null);

  const activeVerbs = getProjectVerbs(project);

  const handleUpdateVerb = (index: number, updates: Partial<VerbDefinition>) => {
    const list = [...activeVerbs];
    list[index] = { ...list[index], ...updates };
    updateProject((prev) => ({
      ...prev,
      customVerbs: list,
    }));
  };

  const handleUpdateFallback = (verbId: string, text: string) => {
    updateProject((prev) => ({
      ...prev,
      defaultResponses: {
        ...prev.defaultResponses,
        [verbId]: text,
      },
    }));
  };

  const handleMoveVerb = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeVerbs.length) return;
    const list = [...activeVerbs];
    const item = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = item;
    updateProject((prev) => ({
      ...prev,
      customVerbs: list,
    }));
  };

  const handleRemoveVerb = (index: number) => {
    if (activeVerbs.length <= 2) {
      alert('Debes mantener al menos 2 verbos de acción en el juego.');
      return;
    }
    const verbToRemove = activeVerbs[index];
    if (confirm(`¿Estás seguro de que deseas eliminar el verbo "${verbToRemove.label}"? Las acciones que usen este verbo podrían requerir reasignación.`)) {
      const list = activeVerbs.filter((_, i) => i !== index);
      updateProject((prev) => ({
        ...prev,
        customVerbs: list,
      }));
    }
  };

  const handleAddNewVerb = () => {
    const cleanId = newVerbId.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const cleanLabel = newVerbLabel.trim();
    if (!cleanId) {
      setErrorAddVerb('Por favor, introduce un identificador único (ej: luchar, hechizar, disparar).');
      return;
    }
    if (!cleanLabel) {
      setErrorAddVerb('Por favor, introduce la etiqueta visible para el botón (ej: Luchar con).');
      return;
    }
    if (activeVerbs.some((v) => v.id === cleanId)) {
      setErrorAddVerb(`Ya existe un verbo con el identificador "${cleanId}". Elige otro ID.`);
      return;
    }

    const newDef: VerbDefinition = {
      id: cleanId,
      label: cleanLabel,
      iconName: newVerbIcon,
      defaultText: newVerbFallback.trim() || `Intentas ${cleanLabel.toLowerCase()}, pero no surte efecto.`,
    };

    const updatedList = [...activeVerbs, newDef];
    updateProject((prev) => ({
      ...prev,
      customVerbs: updatedList,
      defaultResponses: {
        ...prev.defaultResponses,
        [cleanId]: newDef.defaultText,
      },
    }));

    // Reset form
    setNewVerbId('');
    setNewVerbLabel('');
    setNewVerbIcon('Swords');
    setNewVerbFallback('');
    setErrorAddVerb(null);
    setShowAddVerbModal(false);
  };

  const handleResetToDefaults = () => {
    if (confirm('¿Quieres restablecer la lista de verbos a los 7 verbos clásicos predeterminados (Mirar, Usar, Abrir, Coger, Hablar, Empujar, Ir a)?')) {
      updateProject((prev) => {
        const defaultResp: Record<string, string> = { ...prev.defaultResponses };
        ALL_VERBS.forEach((v) => {
          if (!defaultResp[v.id]) {
            defaultResp[v.id] = v.defaultText;
          }
        });
        return {
          ...prev,
          customVerbs: [...ALL_VERBS],
          defaultResponses: defaultResp,
        };
      });
    }
  };

  // Auto-fill author if empty and user is logged in
  useEffect(() => {
    if (currentUser?.displayName && (!project.author || project.author === 'Autor Anónimo')) {
      updateProject((prev) => ({
        ...prev,
        author: currentUser.displayName,
      }));
    }
  }, [currentUser, project.author, updateProject]);

  return (
    <div className="space-y-6">
      {/* Basic Metadata */}
      <div className={`border rounded-2xl p-6 shadow-sm space-y-4 ${
        isClean ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className={`flex items-center justify-between border-b pb-3 flex-wrap gap-2 ${
          isClean ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div>
            <h3 className={`font-bold text-base ${isClean ? 'text-slate-900' : 'text-slate-100'}`}>
              Información Principal y Datos del Relato
            </h3>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
            isClean
              ? 'bg-amber-100 text-amber-900 border-amber-200'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            Configuración y Fallback
          </span>
        </div>

        {/* Notice about catalog title & author display */}
        <div className={`border rounded-xl p-3.5 text-xs flex items-start gap-3 ${
          isClean
            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
            : 'bg-amber-950/30 border-amber-500/30 text-amber-200/90'
        }`}>
          <div className="space-y-1">
            <p className="font-bold text-amber-900 dark:text-amber-300">Visualización en la Biblioteca Pública y Catálogo</p>
            <p className={`text-[11px] leading-relaxed ${isClean ? 'text-slate-700' : 'text-slate-300'}`}>
              El <strong className={isClean ? 'text-amber-900 font-extrabold' : 'text-amber-300'}>Título del Juego</strong> y el <strong className={isClean ? 'text-amber-900 font-extrabold' : 'text-amber-300'}>Autor / Creador</strong> configurados en esta casilla son la información oficial que aparecerá en las fichas y tarjetas de la biblioteca pública bajo la portada de tu obra cuando la publiques.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isClean ? 'text-slate-700' : 'text-slate-300'}`}>
              Título del Juego <span className="text-amber-600 dark:text-amber-400 font-normal">(Ver en biblioteca)</span>
            </label>
            <input
              type="text"
              value={project.title}
              onChange={(e) =>
                updateProject((prev) => ({ ...prev, title: e.target.value }))
              }
              className={`w-full rounded-xl px-3.5 py-2 text-sm outline-none transition-colors border ${
                isClean
                  ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-amber-500'
                  : 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-amber-500'
              }`}
              placeholder="Ej: El Misterio del Faro"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={`block text-xs font-semibold ${isClean ? 'text-slate-700' : 'text-slate-300'}`}>
                Autor / Creador <span className="text-amber-600 dark:text-amber-400 font-normal">(Ver en biblioteca)</span>
              </label>
              {currentUser?.displayName && project.author !== currentUser.displayName && (
                <button
                  type="button"
                  onClick={() =>
                    updateProject((prev) => ({ ...prev, author: currentUser.displayName }))
                  }
                  className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline cursor-pointer font-medium"
                  title="Copiar tu nick de usuario"
                >
                  <span>Usar mi nick ({currentUser.displayName})</span>
                </button>
              )}
            </div>
            <input
              type="text"
              value={project.author}
              onChange={(e) =>
                updateProject((prev) => ({ ...prev, author: e.target.value }))
              }
              className={`w-full rounded-xl px-3.5 py-2 text-sm outline-none transition-colors border ${
                isClean
                  ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-amber-500'
                  : 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-amber-500'
              }`}
              placeholder={currentUser?.displayName || 'Ej: Laura Martínez'}
            />
          </div>
        </div>

        <div>
          <label className={`block text-xs font-bold mb-1 ${isClean ? 'text-amber-900' : 'text-amber-300'}`}>
            <span>Sinopsis / Descripción del Texto-Juego</span>
          </label>
          <p className={`text-[11px] mb-1.5 ${isClean ? 'text-slate-500' : 'text-slate-400'}`}>
            Esta información acompañará a la portada de tu obra en la biblioteca de textos-juego y al seleccionar el título.
          </p>
          <textarea
            rows={3}
            value={project.synopsis || project.description}
            onChange={(e) => {
              const val = e.target.value;
              updateProject((prev) => ({
                ...prev,
                synopsis: val,
                description: val,
              }));
            }}
            className={`w-full rounded-xl px-3.5 py-2 text-sm outline-none transition-colors border ${
              isClean
                ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-amber-500'
                : 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-amber-500'
            }`}
            placeholder="Escribe la sinopsis completa o resumen que atrape a los lectores..."
          />
        </div>

        <div>
          <label className={`block text-xs font-bold mb-1 ${isClean ? 'text-amber-900' : 'text-amber-300'}`}>
            <span>Créditos Finales, Fuentes de Imágenes y Colaboradores</span>
          </label>
          <p className={`text-[11px] mb-1.5 ${isClean ? 'text-slate-500' : 'text-slate-400'}`}>
            Información de créditos que acompañará la portada de tu historia. Soporta etiquetas HTML como <code className="text-amber-600 font-bold">&lt;a href=&quot;...&quot;&gt;Enlace&lt;/a&gt;</code>, <code className="text-amber-600 font-bold">&lt;b&gt;</code> e <code className="text-amber-600 font-bold">&lt;i&gt;</code> para citas e hipervínculos interactivos.
          </p>
          <textarea
            rows={4}
            value={project.credits || ''}
            onChange={(e) => {
              const val = e.target.value;
              updateProject((prev) => ({
                ...prev,
                credits: val,
              }));
            }}
            className={`w-full rounded-xl px-3.5 py-2 text-xs font-mono outline-none transition-colors border ${
              isClean
                ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-amber-500'
                : 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-amber-500'
            }`}
            placeholder="Ejemplo:&#10;• Guion y Dirección: Laura Martínez&#10;• Imagen de portada: <a href='https://pixabay.com'>Phuong Luu</a> de Pixabay&#10;• Sonido: Freesound.org&#10;• Colaboradores: Carlos R., Elena M."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isClean ? 'text-slate-700' : 'text-slate-300'}`}>Escena Inicial de Entrada</label>
            <select
              value={project.initialSceneId}
              onChange={(e) =>
                updateProject((prev) => ({ ...prev, initialSceneId: e.target.value }))
              }
              className={`w-full rounded-xl px-3.5 py-2 text-sm cursor-pointer outline-none transition-colors border ${
                isClean
                  ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-amber-500'
                  : 'bg-slate-950 border-slate-800 text-slate-100 focus:border-amber-500'
              }`}
            >
              {project.scenes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1 ${isClean ? 'text-slate-700' : 'text-slate-300'}`}>Estilo Visual (Tema)</label>
            <select
              value={project.theme}
              onChange={(e) =>
                updateProject((prev) => ({ ...prev, theme: e.target.value as EngineTheme }))
              }
              className={`w-full rounded-xl px-3.5 py-2 text-sm cursor-pointer outline-none transition-colors border ${
                isClean
                  ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-amber-500'
                  : 'bg-slate-950 border-slate-800 text-slate-100 focus:border-amber-500'
              }`}
            >
              <option value="classic-retro">🕹️ LucasArts Retro (Verde / Ámbar CRT)</option>
              <option value="modern-dark">🌙 Oscuro Elegante (Slate / Dorado)</option>
              <option value="sepia-parchment">📜 Pergamino Sepia (Tinta Tradicional)</option>
              <option value="cyber-terminal">💻 Terminal Cyber (Matriz Verde)</option>
              <option value="emerald-vintage">🌲 Esmeralda Vintage (Verde Oscuro)</option>
            </select>
          </div>
        </div>

        {/* Permiso de Descarga */}
        <div className={`p-4 rounded-xl border space-y-2 mt-4 ${
          isClean
            ? 'bg-amber-50/60 border-amber-200'
            : 'bg-slate-950 border-amber-500/30'
        }`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={project.allowDownload ?? false}
              onChange={(e) =>
                updateProject((prev) => ({ ...prev, allowDownload: e.target.checked }))
              }
              className="w-4 h-4 mt-0.5 rounded border-slate-300 text-amber-500 focus:ring-amber-500 bg-white cursor-pointer shrink-0"
            />
            <div>
              <span className={`font-bold text-xs block ${isClean ? 'text-amber-900' : 'text-amber-300'}`}>
                Permitir descarga libre de la historia (HTML / ZIP / JSON)
              </span>
              <span className={`text-[11px] block leading-relaxed mt-0.5 ${isClean ? 'text-slate-600' : 'text-slate-400'}`}>
                Al publicar esta obra, si esta casilla está marcada, cualquier usuario diferente a ti (anónimo o registrado) podrá descargar la historia para jugarla de forma autónoma. Si no la marcas, solo tú podrás descargar los archivos.
              </span>
            </div>
          </label>
        </div>

        {/* Selector de Etiquetas por Género */}
        <div className={`p-4 rounded-xl border space-y-2 mt-4 ${
          isClean
            ? 'bg-amber-50/60 border-amber-200'
            : 'bg-slate-950 border-amber-500/30'
        }`}>
          <label className={`block text-xs font-bold mb-1 ${isClean ? 'text-amber-900' : 'text-amber-300'}`}>
            <span>Etiquetas por Género del Texto-Juego</span>
          </label>
          <p className={`text-[11px] mb-2 ${isClean ? 'text-slate-600' : 'text-slate-400'}`}>
            Selecciona uno o varios géneros para categorizar tu historia en la biblioteca pública (ordenadas alfabéticamente):
          </p>
          <div className="flex flex-wrap gap-2">
            {GENRE_TAGS.map((tag) => {
              const isSelected = project.genreTags?.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    updateProject((prev) => {
                      const currentTags = prev.genreTags || [];
                      const newTags = isSelected
                        ? currentTags.filter((t) => t !== tag)
                        : [...currentTags, tag];
                      return { ...prev, genreTags: newTags };
                    });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md font-bold'
                      : isClean
                      ? 'bg-white border-slate-200 text-slate-700 hover:border-amber-400'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-500/50 hover:text-white'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Default End Game Message (Párrafo Final) */}
      <div className={`border rounded-2xl p-6 shadow-sm space-y-4 ${
        isClean ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className={`flex items-center justify-between border-b pb-3 flex-wrap gap-2 ${
          isClean ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div>
            <h3 className={`font-bold text-base ${isClean ? 'text-slate-900' : 'text-slate-100'}`}>
              Mensaje del Cartel de Final de la Aventura
            </h3>
          </div>
          <span className={`text-xs ${isClean ? 'text-amber-800' : 'text-amber-400'}`}>
            Personalización del cierre
          </span>
        </div>

        <p className={`text-xs leading-relaxed ${isClean ? 'text-slate-600' : 'text-slate-400'}`}>
          Configura los textos que se mostrarán en el recuadro final cuando el lector alcance un párrafo o escena marcado de tipo &quot;Final&quot;.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isClean ? 'text-slate-700' : 'text-slate-300'}`}>
              Título del Cartel Final
            </label>
            <input
              type="text"
              value={project.gameCompleteTitle ?? '¡FIN DE LA AVENTURA!'}
              onChange={(e) => {
                const val = e.target.value;
                updateProject((prev) => ({
                  ...prev,
                  gameCompleteTitle: val,
                }));
              }}
              className={`w-full rounded-xl px-3.5 py-2 text-sm outline-none transition-colors border ${
                isClean
                  ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-amber-500'
                  : 'bg-slate-950 border-slate-800 text-slate-100 focus:border-amber-500'
              }`}
              placeholder="Ej: ¡FIN DE LA AVENTURA!"
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1 ${isClean ? 'text-slate-700' : 'text-slate-300'}`}>
              Subtítulo / Mensaje Secundario
            </label>
            <input
              type="text"
              value={project.gameCompleteSubtitle ?? 'Has completado felizmente la historia.'}
              onChange={(e) => {
                const val = e.target.value;
                updateProject((prev) => ({
                  ...prev,
                  gameCompleteSubtitle: val,
                }));
              }}
              className={`w-full rounded-xl px-3.5 py-2 text-sm outline-none transition-colors border ${
                isClean
                  ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-amber-500'
                  : 'bg-slate-950 border-slate-800 text-slate-100 focus:border-amber-500'
              }`}
              placeholder="Ej: Has completado felizmente la historia."
            />
          </div>
        </div>
      </div>

      {/* Verbs and Fallbacks Management Section */}
      <div className={`border rounded-2xl p-6 shadow-sm space-y-5 ${
        isClean ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className={`flex items-center justify-between border-b pb-4 flex-wrap gap-3 ${
          isClean ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div>
            <h3 className={`font-bold text-base flex items-center gap-2 ${isClean ? 'text-slate-900' : 'text-slate-100'}`}>
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Verbos de Acción y Mensajes Genéricos (Fallbacks)</span>
            </h3>
            <p className={`text-xs mt-1 ${isClean ? 'text-slate-500' : 'text-slate-400'}`}>
              Personaliza los botones de acción para este juego y su mensaje cuando una palabra no tenga acción asociada.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setErrorAddVerb(null);
                setShowAddVerbModal(true);
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Nuevo Verbo</span>
            </button>
            <button
              type="button"
              onClick={handleResetToDefaults}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer ${
                isClean
                  ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
              }`}
              title="Restablecer a los 7 verbos clásicos predeterminados"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Verbos</span>
            </button>
          </div>
        </div>

        {/* Modal / Panel for Adding Custom Verb */}
        {showAddVerbModal && (
          <div className={`p-4 rounded-xl border space-y-3.5 animate-fadeIn ${
            isClean ? 'bg-amber-50/70 border-amber-200' : 'bg-amber-950/20 border-amber-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>Nuevo Verbo de Acción</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddVerbModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorAddVerb && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
                {errorAddVerb}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  ID técnico (slug único)
                </label>
                <input
                  type="text"
                  value={newVerbId}
                  onChange={(e) => setNewVerbId(e.target.value)}
                  placeholder="ej: luchar, disparar, hechizar"
                  className={`w-full rounded-lg px-2.5 py-1.5 text-xs outline-none border font-mono ${
                    isClean
                      ? 'bg-white border-slate-200 text-slate-800 focus:border-amber-500'
                      : 'bg-slate-900 border-slate-800 text-slate-100 focus:border-amber-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Etiqueta visible del botón
                </label>
                <input
                  type="text"
                  value={newVerbLabel}
                  onChange={(e) => setNewVerbLabel(e.target.value)}
                  placeholder="ej: Luchar con, Disparar a"
                  className={`w-full rounded-lg px-2.5 py-1.5 text-xs outline-none border font-semibold ${
                    isClean
                      ? 'bg-white border-slate-200 text-slate-800 focus:border-amber-500'
                      : 'bg-slate-900 border-slate-800 text-slate-100 focus:border-amber-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Icono del botón
                </label>
                <select
                  value={newVerbIcon}
                  onChange={(e) => setNewVerbIcon(e.target.value)}
                  className={`w-full rounded-lg px-2.5 py-1.5 text-xs outline-none border ${
                    isClean
                      ? 'bg-white border-slate-200 text-slate-800 focus:border-amber-500'
                      : 'bg-slate-900 border-slate-800 text-slate-100 focus:border-amber-500'
                  }`}
                >
                  {AVAILABLE_VERB_ICONS.map((icon) => (
                    <option key={icon.name} value={icon.name}>
                      {icon.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Mensaje Genérico de Respuesta (Fallback)
              </label>
              <input
                type="text"
                value={newVerbFallback}
                onChange={(e) => setNewVerbFallback(e.target.value)}
                placeholder="ej: Intentas luchar, pero no hay ningún enemigo aquí."
                className={`w-full rounded-lg px-2.5 py-1.5 text-xs outline-none border ${
                  isClean
                    ? 'bg-white border-slate-200 text-slate-800 focus:border-amber-500'
                    : 'bg-slate-900 border-slate-800 text-slate-100 focus:border-amber-500'
                }`}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddVerbModal(false)}
                className={`px-3 py-1.5 text-xs rounded-lg border ${
                  isClean ? 'border-slate-200 hover:bg-slate-100' : 'border-slate-800 hover:bg-slate-800'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddNewVerb}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Guardar Verbo</span>
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {activeVerbs.map((v, index) => {
            const fallbackValue = project.defaultResponses[v.id] ?? v.defaultText ?? '';
            return (
              <div
                key={v.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isClean
                    ? 'bg-slate-50 border-slate-200 hover:border-amber-300'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  
                  {/* Left: Button Preview & Core Config */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Visual Button Preview */}
                    <div
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border shrink-0 shadow-sm ${
                        isClean
                          ? 'bg-[#FFFDF6] border-[#C9A24B]/50 text-[#A4332A]'
                          : 'bg-[#1F1913] border-[#42362B] text-[#F4EFE3]'
                      }`}
                      title="Vista previa del botón en el juego"
                    >
                      {renderVerbIcon(v.iconName, 'w-4 h-4')}
                      <span className="truncate max-w-[120px]">{v.label}</span>
                    </div>

                    {/* Inputs: Label, Icon, ID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 min-w-0">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                          Etiqueta visible
                        </label>
                        <input
                          type="text"
                          value={v.label}
                          onChange={(e) => handleUpdateVerb(index, { label: e.target.value })}
                          className={`w-full rounded-lg px-2.5 py-1 text-xs outline-none border font-semibold ${
                            isClean
                              ? 'bg-white border-slate-200 text-slate-800 focus:border-amber-500'
                              : 'bg-slate-900 border-slate-800 text-slate-100 focus:border-amber-500'
                          }`}
                          placeholder="Texto del botón..."
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                          Icono
                        </label>
                        <select
                          value={v.iconName}
                          onChange={(e) => handleUpdateVerb(index, { iconName: e.target.value })}
                          className={`w-full rounded-lg px-2 py-1 text-xs outline-none border ${
                            isClean
                              ? 'bg-white border-slate-200 text-slate-800 focus:border-amber-500'
                              : 'bg-slate-900 border-slate-800 text-slate-100 focus:border-amber-500'
                          }`}
                        >
                          {AVAILABLE_VERB_ICONS.map((icon) => (
                            <option key={icon.name} value={icon.name}>
                              {icon.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Reorder and Delete */}
                  <div className="flex items-center gap-1 shrink-0 self-end md:self-center">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mr-1.5" title="Identificador interno del verbo">
                      id: {v.id}
                    </span>
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveVerb(index, 'up')}
                      className={`p-1.5 rounded-lg border text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed ${
                        isClean ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                      }`}
                      title="Mover arriba en la barra de acciones"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === activeVerbs.length - 1}
                      onClick={() => handleMoveVerb(index, 'down')}
                      className={`p-1.5 rounded-lg border text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed ${
                        isClean ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                      }`}
                      title="Mover abajo en la barra de acciones"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={activeVerbs.length <= 2}
                      onClick={() => handleRemoveVerb(index)}
                      className={`p-1.5 rounded-lg border text-rose-500 hover:bg-rose-500/10 disabled:opacity-30 disabled:cursor-not-allowed ${
                        isClean ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                      }`}
                      title={activeVerbs.length <= 2 ? 'Se requieren al menos 2 verbos' : 'Eliminar verbo'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Generic Fallback Message */}
                <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60">
                  <label className="block text-[11px] font-semibold text-amber-700 dark:text-amber-400 mb-1">
                    Mensaje de Respuesta Genérica (Fallback):
                  </label>
                  <input
                    type="text"
                    value={fallbackValue}
                    onChange={(e) => handleUpdateFallback(v.id, e.target.value)}
                    className={`w-full rounded-lg px-2.5 py-1.5 text-xs outline-none transition-colors border ${
                      isClean
                        ? 'bg-white border-slate-200 text-slate-800 focus:border-amber-500'
                        : 'bg-slate-900 border-slate-800 text-slate-200 focus:border-amber-500'
                    }`}
                    placeholder={`Respuesta si el jugador usa ${v.label.toLowerCase()} en un elemento sin acción específica...`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
