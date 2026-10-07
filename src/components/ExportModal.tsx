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
  webAspect?: 'clean' | 'classic';
}

export const ExportModal: React.FC<ExportModalProps> = ({
  project,
  onImportProject,
  onClose,
  currentUser,
  onOpenAuth,
  webAspect = 'clean',
}) => {
  const isClean = webAspect === 'clean';
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
      const savedDocId = await saveProjectToCloud(
        project.id,
        project,
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
        },
        'draft'
      );
      if (savedDocId && savedDocId !== project.id) {
        onImportProject({ ...project, id: savedDocId });
      }
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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className={`rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl cursor-default border transition-colors ${
          isClean
            ? 'bg-[#FFFDF6] border-[#E5DCB8] text-[#2A2118]'
            : 'bg-[#2C241C] border-[#42362B] text-[#F4EFE3]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isClean ? 'bg-[#F4EFE3] border-[#E5DCB8]' : 'bg-[#241D17] border-[#42362B]'
        }`}>
          <div className="flex items-center gap-2">
            <Download className={`w-5 h-5 ${isClean ? 'text-[#A4332A]' : 'text-[#C9A24B]'}`} />
            <div>
              <h3 className={`font-serif font-bold text-base ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>
                Proyecto de Aventura (Editor)
              </h3>
              <p className={`text-[11px] ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
                Guarda o exporta el archivo del juego o genera un HTML autónomo.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isClean ? 'text-[#6B5C46] hover:text-[#2A2118] hover:bg-[#E5DCB8]/50' : 'text-[#A89880] hover:text-[#F4EFE3] hover:bg-[#3B3026]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Cloud Save Section */}
          <div className={`border p-4 sm:p-5 rounded-2xl space-y-3 shadow-sm ${
            isClean ? 'bg-[#F4EFE3] border-[#E5DCB8]' : 'bg-[#241D17] border-[#42362B]'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border shrink-0 ${
                  isClean
                    ? 'bg-[#A4332A]/10 text-[#A4332A] border-[#A4332A]/20'
                    : 'bg-[#C9A24B]/20 text-[#C9A24B] border-[#C9A24B]/30'
                }`}>
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`font-serif font-bold text-sm flex flex-wrap items-center gap-2 ${
                    isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'
                  }`}>
                    <span>Guardar Proyecto en la Nube</span>
                    {currentUser && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-sans font-bold border ${
                        isClean
                          ? 'bg-[#E5DCB8] text-[#2A2118] border-[#C9A24B]/30'
                          : 'bg-[#3B3026] text-[#C9A24B] border-[#42362B]'
                      }`}>
                        {currentUser.displayName || currentUser.email}
                      </span>
                    )}
                  </h4>
                  <p className={`text-xs ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
                    Sincroniza la estructura de tu historia en tu cuenta para acceder y continuar editando desde cualquier lugar.
                  </p>
                </div>
              </div>
            </div>

            {cloudMessage && (
              <div
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                  cloudMessage.type === 'success'
                    ? isClean
                      ? 'bg-[#3B6D11]/10 text-[#3B6D11] border-[#3B6D11]/30'
                      : 'bg-[#3B6D11]/20 text-[#5B9E22] border-[#3B6D11]/40'
                    : isClean
                      ? 'bg-[#A4332A]/10 text-[#A4332A] border-[#A4332A]/30'
                      : 'bg-[#A4332A]/20 text-rose-300 border-[#A4332A]/40'
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
                className={`w-full py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 cursor-pointer ${
                  isClean
                    ? 'bg-[#A4332A] hover:bg-[#8B2A22] text-white'
                    : 'bg-[#C9A24B] hover:bg-[#B38E3B] text-[#2C241C]'
                }`}
              >
                <Cloud className="w-4 h-4" />
                <span>{isSavingCloud ? 'Guardando en la nube...' : 'Guardar en la Nube (Mi Cuenta)'}</span>
              </button>
            ) : (
              <div className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                isClean
                  ? 'bg-[#E5DCB8]/40 border-[#E5DCB8]'
                  : 'bg-[#3B3026]/40 border-[#42362B]'
              }`}>
                <p className={`text-xs ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
                  Inicia sesión con tu cuenta para guardar tu proyecto directamente en la nube.
                </p>
                {onOpenAuth && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className={`px-3 py-1.5 font-bold rounded-lg text-xs whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                      isClean
                        ? 'bg-[#A4332A] hover:bg-[#8B2A22] text-white shadow-sm'
                        : 'bg-[#C9A24B] hover:bg-[#B38E3B] text-[#2C241C]'
                    }`}
                  >
                    Iniciar Sesión
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Clarification Notice Banner */}
          <div className={`rounded-xl p-3 text-xs flex items-start gap-2.5 border ${
            isClean
              ? 'bg-[#E5DCB8]/50 border-[#C9A24B]/40 text-[#2A2118]'
              : 'bg-[#3B3026]/50 border-[#42362B] text-[#F4EFE3]'
          }`}>
            <span className="text-base shrink-0">🛠️</span>
            <div className="space-y-0.5">
              <p className={`font-serif font-bold text-xs ${isClean ? 'text-[#A4332A]' : 'text-[#C9A24B]'}`}>
                Guardado y Descarga del Proyecto (Editor)
              </p>
              <p className={`text-[11px] leading-relaxed ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
                Este panel te permite guardar la historia en la nube o descargar la estructura completa en formato JSON/ZIP. <strong className={isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}>Esto NO guarda el progreso de la partida de un jugador</strong> (para eso usa "Guardar/Cargar Partida").
              </p>
            </div>
          </div>

          {/* Export / Import JSON Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`p-4 rounded-2xl space-y-3 border shadow-sm ${
              isClean ? 'bg-[#FFFDF6] border-[#E5DCB8]' : 'bg-[#241D17] border-[#42362B]'
            }`}>
              <h5 className={`font-serif font-bold text-sm flex items-center gap-1.5 ${
                isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'
              }`}>
                <Download className={`w-4 h-4 ${isClean ? 'text-[#A4332A]' : 'text-[#C9A24B]'}`} />
                <span>Exportar Proyecto (.json)</span>
              </h5>
              <p className={`text-xs leading-relaxed ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
                Descarga el archivo completo del proyecto en JSON para guardarlo localmente o compartirlo con otros autores.
              </p>
              <button
                onClick={handleExportJSON}
                className={`w-full py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                  isClean
                    ? 'bg-[#A4332A] hover:bg-[#8B2A22] text-white'
                    : 'bg-[#C9A24B] hover:bg-[#B38E3B] text-[#2C241C]'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Descargar Proyecto en JSON</span>
              </button>
            </div>

            <div className={`p-4 rounded-2xl space-y-3 border shadow-sm ${
              isClean ? 'bg-[#FFFDF6] border-[#E5DCB8]' : 'bg-[#241D17] border-[#42362B]'
            }`}>
              <h5 className={`font-serif font-bold text-sm flex items-center gap-1.5 ${
                isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'
              }`}>
                <Upload className={`w-4 h-4 ${isClean ? 'text-[#3B6D11]' : 'text-[#C9A24B]'}`} />
                <span>Cargar Proyecto (.json)</span>
              </h5>
              <p className={`text-xs leading-relaxed ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
                Abre un proyecto guardado anteriormente en tu equipo para continuar editando o probarlo en el motor.
              </p>
              <label className={`w-full py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors border ${
                isClean
                  ? 'bg-[#F4EFE3] hover:bg-[#E5DCB8] text-[#2A2118] border-[#E5DCB8]'
                  : 'bg-[#3B3026] hover:bg-[#4A3D30] text-[#F4EFE3] border-[#42362B]'
              }`}>
                <Upload className={`w-4 h-4 ${isClean ? 'text-[#3B6D11]' : 'text-[#C9A24B]'}`} />
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
            <div className={`p-4 rounded-2xl space-y-3 border shadow-sm ${
              isClean ? 'bg-[#F4EFE3] border-[#E5DCB8]' : 'bg-[#241D17] border-[#42362B]'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl border shrink-0 ${
                  isClean
                    ? 'bg-[#C9A24B]/20 border-[#C9A24B]/40 text-[#A4332A]'
                    : 'bg-[#C9A24B]/20 border-[#C9A24B]/40 text-[#C9A24B]'
                }`}>
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`font-serif font-bold text-sm ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>
                    Exportar Paquete ZIP (Con Carpeta de Imágenes)
                  </h4>
                  <p className={`text-xs mt-1 leading-relaxed ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
                    Tu proyecto incluye imágenes locales. Genera un paquete ZIP comprimido con todos los recursos del juego.
                  </p>
                </div>
              </div>

              <button
                onClick={handleExportZip}
                disabled={isExportingZip}
                className={`w-full py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border transition-colors cursor-pointer disabled:opacity-50 ${
                  isClean
                    ? 'bg-[#FFFDF6] hover:bg-[#E5DCB8] text-[#2A2118] border-[#E5DCB8]'
                    : 'bg-[#3B3026] hover:bg-[#4A3D30] text-[#F4EFE3] border-[#42362B]'
                }`}
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
