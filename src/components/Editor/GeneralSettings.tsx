import React, { useEffect } from 'react';
import { GameProject, EngineTheme, VerbType, UserProfile, GENRE_TAGS } from '../../types';
import { ALL_VERBS } from '../../utils/verbs';

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
            Información de créditos que acompañará la portada de tu historia. Los jugadores podrán verla al pulsar &quot;Ver más detalles&quot;.
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
            placeholder="Ejemplo:&#10;• Guion y Dirección: Laura Martínez&#10;• Ilustraciones: Diseñadas en Midjourney / Unsplash&#10;• Música y Sonido: Biblioteca de efectos Freesound.org&#10;• Colaboradores: Carlos R., Elena M."
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

      {/* Default Verb Fallback Messages */}
      <div className={`border rounded-2xl p-6 shadow-sm space-y-4 ${
        isClean ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className={`flex items-center justify-between border-b pb-3 flex-wrap gap-2 ${
          isClean ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div>
            <h3 className={`font-bold text-base ${isClean ? 'text-slate-900' : 'text-slate-100'}`}>
              Mensajes Genéricos de Respuesta (Fallbacks)
            </h3>
          </div>
          <span className={`text-xs ${isClean ? 'text-slate-500' : 'text-slate-400'}`}>
            Respuesta cuando una palabra no tiene una acción específica
          </span>
        </div>

        <p className={`text-xs leading-relaxed ${isClean ? 'text-slate-600' : 'text-slate-400'}`}>
          Si el jugador ejecuta un verbo (por ejemplo "abrir") sobre una palabra que no tiene una acción configurada, se mostrará este mensaje genérico por defecto.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ALL_VERBS.map((v) => (
            <div key={v.id} className={`p-3 rounded-xl border ${
              isClean ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <label className="block text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
                Verbo: {v.label}
              </label>
              <input
                type="text"
                value={project.defaultResponses[v.id as VerbType] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  updateProject((prev) => ({
                    ...prev,
                    defaultResponses: {
                      ...prev.defaultResponses,
                      [v.id]: val,
                    },
                  }));
                }}
                className={`w-full rounded-lg px-2.5 py-1.5 text-xs outline-none transition-colors border ${
                  isClean
                    ? 'bg-white border-slate-200 text-slate-800 focus:border-amber-500'
                    : 'bg-slate-900 border-slate-800 text-slate-200 focus:border-amber-500'
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
