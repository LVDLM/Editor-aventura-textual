import React from 'react';
import { GameProject, CloudProjectDoc } from '../../types';
import { FileJson, Cloud, AlertTriangle, CheckCircle2, X, Copy, RefreshCw, Edit3, ArrowRight } from 'lucide-react';

export interface ImportPendingData {
  fileProject: GameProject;
  fileName: string;
  fileLastModified: number;
  matchedCloudDoc: CloudProjectDoc | null;
  editorProject?: GameProject | null;
}

interface ImportJSONModalProps {
  data: ImportPendingData | null;
  isOpen: boolean;
  onClose: () => void;
  onOverwriteCloud: (targetDocId: string, project: GameProject) => void;
  onSaveAsNew: (project: GameProject) => void;
  onOpenLocalOnly: (project: GameProject, matchedDocId: string | null) => void;
  webAspect?: 'clean' | 'classic';
}

export const ImportJSONModal: React.FC<ImportJSONModalProps> = ({
  data,
  isOpen,
  onClose,
  onOverwriteCloud,
  onSaveAsNew,
  onOpenLocalOnly,
  webAspect = 'clean',
}) => {
  if (!isOpen || !data) return null;

  const isClean = webAspect === 'clean';
  const { fileProject, fileName, fileLastModified, matchedCloudDoc, editorProject } = data;

  const localDate = new Date(fileLastModified);
  const localDateStr = !isNaN(localDate.getTime())
    ? localDate.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Fecha desconocida';

  let cloudDateStr = 'Sin fecha';
  let isCloudNewer = false;
  let isLocalNewer = false;

  if (matchedCloudDoc) {
    const cloudDate = new Date(matchedCloudDoc.updatedAt || matchedCloudDoc.createdAt);
    if (!isNaN(cloudDate.getTime())) {
      cloudDateStr = cloudDate.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
      if (cloudDate.getTime() > fileLastModified) {
        isCloudNewer = true;
      } else if (fileLastModified > cloudDate.getTime()) {
        isLocalNewer = true;
      }
    }
  }

  const localScenesCount = fileProject.scenes?.length || 0;
  const localItemsCount = fileProject.inventoryItems?.length || 0;

  const comparisonTitle = matchedCloudDoc ? 'Coincidencia en la Nube' : editorProject ? 'Proyecto actual en el Editor' : null;
  const comparisonDocTitle = matchedCloudDoc?.title || editorProject?.title || 'Historia actual';
  const comparisonScenesCount = matchedCloudDoc?.projectData?.scenes?.length ?? editorProject?.scenes?.length ?? 0;
  const comparisonItemsCount = matchedCloudDoc?.projectData?.inventoryItems?.length ?? editorProject?.inventoryItems?.length ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`max-w-2xl w-full rounded-2xl border p-6 shadow-2xl relative cursor-default max-h-[90vh] overflow-y-auto ${
          isClean
            ? 'bg-[#FFFDF6] border-[#E5DCB8] text-[#2A2118]'
            : 'bg-[#1F1913] border-[#42362B] text-[#F4EFE3]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors cursor-pointer ${
            isClean ? 'text-[#6B5C46] hover:bg-[#E5DCB8]' : 'text-[#D1C7B7] hover:bg-[#2C241C]'
          }`}
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-[#A4332A]/10 border border-[#A4332A]/20 flex items-center justify-center text-[#A4332A] shrink-0">
            <FileJson className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold leading-tight">
              Importar Archivo JSON de Historia
            </h3>
            <p className={`text-xs ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
              Compara el archivo subido con tu proyecto actual antes de reemplazar o guardar.
            </p>
          </div>
        </div>

        {/* Comparison section */}
        {matchedCloudDoc ? (
          <div className="space-y-4 mb-6">
            {/* Status Warning / Info Banner */}
            {isCloudNewer && (
              <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">¡Atención! La versión en la nube es más reciente:</strong>
                  La historia guardada en la nube tiene una fecha de actualización posterior ({cloudDateStr}) a la de este archivo JSON ({localDateStr}). Si sobrescribes el borrador, podrías perder cambios recientes guardados en la nube.
                </div>
              </div>
            )}

            {isLocalNewer && (
              <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">El archivo local es más reciente:</strong>
                  Este archivo JSON ({localDateStr}) tiene una fecha posterior a la versión de la nube ({cloudDateStr}).
                </div>
              </div>
            )}

            {/* Side-by-side comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Card 1: Local File */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                isClean ? 'bg-white border-[#E5DCB8]' : 'bg-[#2A2118] border-[#42362B]'
              }`}>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#A4332A] uppercase tracking-wider mb-2">
                    <FileJson className="w-4 h-4" />
                    <span>Archivo Subido (Tu Equipo)</span>
                  </div>
                  <h4 className="font-serif font-bold text-sm mb-1 truncate" title={fileProject.title || fileName}>
                    {fileProject.title || 'Sin Título'}
                  </h4>
                  <div className={`text-[11px] font-mono truncate mb-3 ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
                    {fileName}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className={isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}>Modificado:</span>
                      <span className="font-medium">{localDateStr}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}>Escenas:</span>
                      <span className="font-bold">{localScenesCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}>Objetos de Inventario:</span>
                      <span className="font-medium">{localItemsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}>Versión interna:</span>
                      <span className="font-mono text-[11px]">{fileProject.version || '1.0'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Cloud Doc */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                isClean ? 'bg-[#FFFDF6] border-[#C9A24B]/40' : 'bg-[#261E16] border-[#C9A24B]/30'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#C9A24B] uppercase tracking-wider">
                      <Cloud className="w-4 h-4" />
                      <span>Coincidencia en la Nube</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C9A24B]/20 text-[#A07823] dark:text-[#E8C56E] font-bold">
                      {matchedCloudDoc.status === 'published' ? `Publicado v${matchedCloudDoc.publishedVersion || 1}` : 'Borrador'}
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-sm mb-1 truncate" title={matchedCloudDoc.title}>
                    {matchedCloudDoc.title}
                  </h4>
                  <div className={`text-[11px] font-mono truncate mb-3 ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
                    ID: {matchedCloudDoc.id}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className={isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}>Última actualización:</span>
                      <span className="font-medium">{cloudDateStr}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}>Escenas en la nube:</span>
                      <span className="font-bold">{comparisonScenesCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}>Objetos en la nube:</span>
                      <span className="font-medium">{comparisonItemsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}>Estado:</span>
                      <span className="font-medium capitalize">{matchedCloudDoc.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : editorProject ? (
          <div className="space-y-4 mb-6">
            <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Reemplazo de proyecto en el editor:</strong>
                Actualmente tienes una historia abierta en el editor ("{editorProject.title}"). Si importas este archivo, los datos actuales del editor se reemplazarán por el contenido del archivo JSON.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Card 1: Local File */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                isClean ? 'bg-white border-[#E5DCB8]' : 'bg-[#2A2118] border-[#42362B]'
              }`}>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#A4332A] uppercase tracking-wider mb-2">
                    <FileJson className="w-4 h-4" />
                    <span>Archivo Subido (Tu Equipo)</span>
                  </div>
                  <h4 className="font-serif font-bold text-sm mb-1 truncate" title={fileProject.title || fileName}>
                    {fileProject.title || 'Sin Título'}
                  </h4>
                  <div className={`text-[11px] font-mono truncate mb-3 ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
                    {fileName}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className={isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}>Modificado:</span>
                      <span className="font-medium">{localDateStr}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}>Escenas:</span>
                      <span className="font-bold">{localScenesCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}>Objetos de Inventario:</span>
                      <span className="font-medium">{localItemsCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Current Editor Project */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                isClean ? 'bg-[#FFFDF6] border-[#E5DCB8]' : 'bg-[#261E16] border-[#42362B]'
              }`}>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <Edit3 className="w-4 h-4" />
                    <span>Abierto en el Editor</span>
                  </div>
                  <h4 className="font-serif font-bold text-sm mb-1 truncate" title={editorProject.title}>
                    {editorProject.title || 'Sin Título'}
                  </h4>
                  <div className={`text-[11px] font-mono truncate mb-3 ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
                    ID: {editorProject.id || 'local'}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className={isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}>Escenas actuales:</span>
                      <span className="font-bold">{comparisonScenesCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}>Objetos actuales:</span>
                      <span className="font-medium">{comparisonItemsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}>Versión:</span>
                      <span className="font-mono text-[11px]">{editorProject.version || '1.0'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <div className={`p-4 rounded-xl border ${isClean ? 'bg-white border-[#E5DCB8]' : 'bg-[#2A2118] border-[#42362B]'}`}>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Nueva Historia Detectada</span>
              </div>
              <p className={`text-xs mb-3 ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
                No existe ninguna historia en tu nube con este identificador o título. Se creará como un nuevo proyecto independiente.
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className={isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}>Título:</span>
                  <span className="font-bold">{fileProject.title || 'Sin Título'}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}>Archivo:</span>
                  <span className="font-mono text-[11px]">{fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}>Modificado en equipo:</span>
                  <span className="font-medium">{localDateStr}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}>Escenas:</span>
                  <span className="font-bold">{localScenesCount}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
            ¿Qué deseas hacer con este archivo?
          </div>

          {matchedCloudDoc && (
            <button
              type="button"
              onClick={() => onOverwriteCloud(matchedCloudDoc.id, fileProject)}
              className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer group ${
                isClean
                  ? 'border-[#A4332A]/30 bg-[#A4332A]/5 hover:bg-[#A4332A]/10 text-[#2A2118]'
                  : 'border-[#A4332A]/40 bg-[#A4332A]/10 hover:bg-[#A4332A]/20 text-[#F4EFE3]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#A4332A]/10 flex items-center justify-center text-[#A4332A] shrink-0">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#A4332A]">
                    Sobrescribir el borrador existente en la nube
                  </div>
                  <div className={`text-[11px] ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
                    Reemplaza el borrador de "{matchedCloudDoc.title}" con este JSON.
                    {matchedCloudDoc.status === 'published' && ' (La versión pública web sigue intacta).'}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#A4332A] opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onSaveAsNew(fileProject)}
            className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer group ${
              isClean
                ? 'border-[#3B6D11]/30 bg-[#3B6D11]/5 hover:bg-[#3B6D11]/10 text-[#2A2118]'
                : 'border-[#3B6D11]/40 bg-[#3B6D11]/10 hover:bg-[#3B6D11]/20 text-[#F4EFE3]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#3B6D11]/10 flex items-center justify-center text-[#3B6D11] shrink-0">
                <Copy className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#3B6D11] dark:text-[#5B9E22]">
                  Guardar como nueva historia independiente en la nube
                </div>
                <div className={`text-[11px] ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
                  Asigna un nuevo identificador único. No alterará la historia existente en la nube.
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#3B6D11] opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => onOpenLocalOnly(fileProject, matchedCloudDoc ? matchedCloudDoc.id : null)}
            className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer group ${
              isClean
                ? 'border-[#E5DCB8] bg-white hover:bg-[#F4EFE3] text-[#2A2118]'
                : 'border-[#42362B] bg-[#2A2118] hover:bg-[#34291F] text-[#F4EFE3]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-500/10 flex items-center justify-center text-slate-500 shrink-0">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">
                  {editorProject ? 'Reemplazar en el editor local (sin guardar en la nube aún)' : 'Solo abrir en el editor local (sin guardar en la nube aún)'}
                </div>
                <div className={`text-[11px] ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
                  Carga la historia en memoria para que puedas examinarla o editarla antes de guardarla.
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
          </button>
        </div>

        {/* Footer with cancel button */}
        <div className="mt-5 pt-4 border-t border-[#E5DCB8] dark:border-[#42362B] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isClean
                ? 'border-[#E5DCB8] hover:bg-[#E5DCB8] text-[#6B5C46]'
                : 'border-[#42362B] hover:bg-[#2C241C] text-[#D1C7B7]'
            }`}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
