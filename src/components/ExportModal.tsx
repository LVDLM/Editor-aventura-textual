import React, { useState } from 'react';
import { GameProject } from '../types';
import { generateStandaloneHTML } from '../utils/htmlExporter';
import { exportProjectAsZip, projectHasImages } from '../utils/zipExporter';
import { Download, FileCode, Upload, X, Archive, FileArchive } from 'lucide-react';

interface ExportModalProps {
  project: GameProject;
  onImportProject: (project: GameProject) => void;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  project,
  onImportProject,
  onClose,
}) => {
  const [isExportingZip, setIsExportingZip] = useState(false);
  const hasImages = projectHasImages(project);

  const handleExportHTML = () => {
    const html = generateStandaloneHTML(project);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.id || 'juego'}_autonomo.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportZip = async () => {
    try {
      setIsExportingZip(true);
      const blob = await exportProjectAsZip(project);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.id || 'juego'}_paquete_juego.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error al generar el archivo ZIP del juego.');
      console.error(err);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.id || 'proyecto'}.adventure.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string) as GameProject;
        if (parsed.scenes && parsed.initialSceneId) {
          onImportProject(parsed);
          alert('¡Proyecto cargado correctamente en el editor!');
          onClose();
        } else {
          alert('El archivo no tiene una estructura de proyecto válida.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base text-slate-100">Proyecto de Aventura (Editor)</h3>
              <p className="text-[11px] text-slate-400">Guarda o exporta el archivo del juego o genera un HTML autónomo.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Clarification Notice Banner */}
          <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200/90 flex items-start gap-2.5">
            <span className="text-base shrink-0">🛠️</span>
            <div className="space-y-0.5">
              <p className="font-semibold text-amber-300">Guardado de diseño de juego (Editor)</p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Este panel te permite guardar la estructura completa de tu juego (escenas, palabras clave, respuestas, objetos) en formato JSON o exportarla como web ejecutable HTML. <strong className="text-emerald-300">Esto NO guarda el progreso de la partida de un jugador</strong> (para eso usa "Progreso Partida").
              </p>
            </div>
          </div>
          {/* Export HTML / ZIP options */}
          <div className="bg-slate-950 border border-amber-500/40 p-5 rounded-2xl space-y-4 shadow-inner">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
                {hasImages ? <FileArchive className="w-6 h-6 text-amber-400" /> : <FileCode className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="font-bold text-base text-amber-300">
                  {hasImages ? 'Exportar Juego Completo (Paquete ZIP con carpeta IMG)' : 'Exportar Juego Completo en HTML Autónomo'}
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {hasImages
                    ? 'Tu juego incluye imágenes locales. Se generará un archivo ZIP que contiene la estructura HTML autónoma y la carpeta IMG con todas tus imágenes.'
                    : 'Genera un único archivo .html independiente que incluye el motor de lectura, los verbos, el selector de dificultad, el sistema de salvado/carga y todo tu juego.'}
                </p>
              </div>
            </div>

            {hasImages ? (
              <div className="space-y-2">
                <button
                  onClick={handleExportZip}
                  disabled={isExportingZip}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow transition-colors disabled:opacity-50"
                >
                  <Archive className="w-4 h-4" />
                  <span>{isExportingZip ? 'Generando ZIP con carpeta IMG...' : 'Descargar Juego Completo en ZIP (.zip)'}</span>
                </button>
                <button
                  onClick={handleExportHTML}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Descargar sólo el archivo HTML autónomo</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleExportHTML}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar HTML del Juego Independiente</span>
                </button>
                <button
                  onClick={handleExportZip}
                  disabled={isExportingZip}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-medium rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-800 transition-colors"
                >
                  <Archive className="w-3.5 h-3.5 text-slate-400" />
                  <span>Exportar como ZIP (.zip)</span>
                </button>
              </div>
            )}
          </div>

          {/* Export / Import JSON Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
              <h5 className="font-bold text-xs text-slate-200">Guardar Proyecto (.json)</h5>
              <p className="text-[11px] text-slate-400">
                Descarga una copia de seguridad en JSON para seguir editando más tarde.
              </p>
              <button
                onClick={handleExportJSON}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Descargar Proyecto JSON</span>
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
              <h5 className="font-bold text-xs text-slate-200">Cargar Proyecto (.json)</h5>
              <p className="text-[11px] text-slate-400">
                Abre un proyecto previamente guardado para editarlo o jugarlo.
              </p>
              <label className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Abrir Proyecto JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
