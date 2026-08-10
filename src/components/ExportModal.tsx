import React, { useState } from 'react';
import { GameProject, UserProfile } from '../types';
import { exportProjectAsZip, projectHasImages } from '../utils/zipExporter';
import { saveProjectToCloud } from '../lib/firebase';
import { Download, Upload, X, Archive, Cloud } from 'lucide-react';

interface ExportModalProps {
  project: GameProject;
  onImportProject: (project: GameProject) => void;
  onClose: () => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  project,
  onImportProject,
  onClose,
  currentUser,
  onOpenAuth,
}) => {
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [cloudMessage, setCloudMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const hasImages = projectHasImages(project);

  const handleSaveToCloud = async () => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setIsSavingCloud(true);
    setCloudMessage(null);
    try {
      await saveProjectToCloud(
        project.id,
        project,
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
        },
        'draft'
      );
      setCloudMessage({
        type: 'success',
        text: `¡Proyecto "${project.title}" guardado exitosamente en la nube!`,
      });
    } catch (err) {
      console.error(err);
      setCloudMessage({
        type: 'error',
        text: 'Error al guardar el proyecto en la nube. Inténtalo de nuevo.',
      });
    } finally {
      setIsSavingCloud(false);
    }
  };

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
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
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
          {/* Cloud Save Section */}
          <div className="bg-slate-950 border border-amber-500/50 p-4 sm:p-5 rounded-2xl space-y-3 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex flex-wrap items-center gap-2">
                    <span>Guardar Proyecto en la Nube</span>
                    {currentUser && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                        {currentUser.displayName || currentUser.email}
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Sincroniza la estructura de tu historia en tu cuenta para acceder y continuar editando desde cualquier lugar.
                  </p>
                </div>
              </div>
            </div>

            {cloudMessage && (
              <div
                className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  cloudMessage.type === 'success'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                }`}
              >
                <span>{cloudMessage.type === 'success' ? '✅' : '❌'}</span>
                <span>{cloudMessage.text}</span>
              </div>
            )}

            {currentUser ? (
              <button
                onClick={handleSaveToCloud}
                disabled={isSavingCloud}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                <Cloud className="w-4 h-4" />
                <span>{isSavingCloud ? 'Guardando en la nube...' : 'Guardar en la Nube (Mi Cuenta)'}</span>
              </button>
            ) : (
              <div className="flex items-center justify-between gap-3 bg-amber-950/30 border border-amber-500/30 p-3 rounded-xl">
                <p className="text-xs text-amber-200/90">
                  Inicia sesión con tu cuenta para guardar tu proyecto directamente en la nube.
                </p>
                {onOpenAuth && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs whitespace-nowrap transition-colors cursor-pointer shrink-0"
                  >
                    Iniciar Sesión
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Clarification Notice Banner */}
          <div className="bg-amber-950/20 border border-white/10 rounded-xl p-3 text-xs text-slate-300 flex items-start gap-2.5">
            <span className="text-base shrink-0">🛠️</span>
            <div className="space-y-0.5">
              <p className="font-semibold text-amber-300 text-xs">Guardado y Descarga del Proyecto (Editor)</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Este panel te permite guardar la historia en la nube o descargar la estructura completa en formato JSON/ZIP. <strong className="text-amber-200">Esto NO guarda el progreso de la partida de un jugador</strong> (para eso usa "Guardar/Cargar Partida").
              </p>
            </div>
          </div>

          {/* Export / Import JSON Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-amber-500/40 p-4 rounded-2xl space-y-3 shadow-sm">
              <h5 className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-amber-400" />
                <span>Exportar Proyecto (.json)</span>
              </h5>
              <p className="text-xs text-slate-300 leading-relaxed">
                Descarga el archivo completo del proyecto en JSON para guardarlo localmente o compartirlo con otros autores.
              </p>
              <button
                onClick={handleExportJSON}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Proyecto en JSON</span>
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-sm">
              <h5 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Cargar Proyecto (.json)</span>
              </h5>
              <p className="text-xs text-slate-300 leading-relaxed">
                Abre un proyecto guardado anteriormente en tu equipo para continuar editando o probarlo en el motor.
              </p>
              <label className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Abrir Archivo JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* ZIP Package Export */}
          {hasImages && (
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-inner">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
                  <Archive className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-200">
                    Exportar Paquete ZIP (Con Carpeta de Imágenes)
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Tu proyecto incluye imágenes locales. Genera un paquete ZIP comprimido con todos los recursos del juego.
                  </p>
                </div>
              </div>

              <button
                onClick={handleExportZip}
                disabled={isExportingZip}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Archive className="w-4 h-4" />
                <span>{isExportingZip ? 'Generando ZIP...' : 'Descargar Paquete ZIP (.zip)'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
