import React from 'react';
import { GameProject, EngineTheme, VerbType } from '../../types';
import { ALL_VERBS } from '../../utils/verbs';
import { Settings, Shield, BookOpen, Award } from 'lucide-react';

interface GeneralSettingsProps {
  project: GameProject;
  updateProject: (fn: (prev: GameProject) => GameProject) => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ project, updateProject }) => {
  return (
    <div className="space-y-6">
      {/* Basic Metadata */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Settings className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-slate-100 text-base">Información Principal de la Aventura</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Título del Juego</label>
            <input
              type="text"
              value={project.title}
              onChange={(e) =>
                updateProject((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:ring-1 focus:ring-amber-500"
              placeholder="Ej: El Misterio del Faro"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Autor / Creador</label>
            <input
              type="text"
              value={project.author}
              onChange={(e) =>
                updateProject((prev) => ({ ...prev, author: e.target.value }))
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:ring-1 focus:ring-amber-500"
              placeholder="Ej: Laura Martínez"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Sinopsis / Descripción del Texto-Juego</span>
          </label>
          <p className="text-[11px] text-slate-400 mb-1.5">
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
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:ring-1 focus:ring-amber-500"
            placeholder="Escribe la sinopsis completa o resumen que atrape a los lectores..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Créditos Finales, Fuentes de Imágenes y Colaboradores</span>
          </label>
          <p className="text-[11px] text-slate-400 mb-1.5">
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
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:ring-1 focus:ring-amber-500 font-mono text-xs"
            placeholder="Ejemplo:&#10;• Guion y Dirección: Laura Martínez&#10;• Ilustraciones: Diseñadas en Midjourney / Unsplash&#10;• Música y Sonido: Biblioteca de efectos Freesound.org&#10;• Colaboradores: Carlos R., Elena M."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Escena Inicial de Entrada</label>
            <select
              value={project.initialSceneId}
              onChange={(e) =>
                updateProject((prev) => ({ ...prev, initialSceneId: e.target.value }))
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              {project.scenes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Estilo Visual (Tema)</label>
            <select
              value={project.theme}
              onChange={(e) =>
                updateProject((prev) => ({ ...prev, theme: e.target.value as EngineTheme }))
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="classic-retro">🕹️ LucasArts Retro (Verde / Ámbar CRT)</option>
              <option value="modern-dark">🌙 Oscuro Elegante (Slate / Dorado)</option>
              <option value="sepia-parchment">📜 Pergamino Sepia (Tinta Tradicional)</option>
              <option value="cyber-terminal">💻 Terminal Cyber (Matriz Verde)</option>
              <option value="emerald-vintage">🌲 Esmeralda Vintage (Verde Oscuro)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Default Verb Fallback Messages */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-slate-100 text-base">Mensajes Genéricos de Respuesta (Fallbacks)</h3>
          </div>
          <span className="text-xs text-slate-400">
            Respuesta cuando una palabra no tiene una acción específica
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Si el jugador ejecuta un verbo (por ejemplo "abrir") sobre una palabra que no tiene una acción configurada, se mostrará este mensaje genérico por defecto.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ALL_VERBS.map((v) => (
            <div key={v.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <label className="block text-xs font-semibold text-amber-400 mb-1">
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
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
