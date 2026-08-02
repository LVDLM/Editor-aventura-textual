import React from 'react';
import { AlertTriangle, Download, Plus, X } from 'lucide-react';

interface NewProjectModalProps {
  onConfirmNewProject: () => void;
  onOpenSaveExport: () => void;
  onClose: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  onConfirmNewProject,
  onOpenSaveExport,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#0f0f12] border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">¿Crear un Nuevo Proyecto?</h3>
              <p className="text-xs text-amber-400/90 font-medium">
                Advertencia de guardado de datos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <div className="space-y-3 text-sm text-slate-300 leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5">
          <p>
            Estás a punto de iniciar un <strong>nuevo proyecto de aventura gráfica desde cero</strong>.
          </p>
          <p className="text-xs text-slate-400">
            Si has estado modificando la aventura actual en el editor y aún no has guardado el archivo <code className="text-amber-300">.json</code> o exportado el juego, <strong>perderás todos los cambios no guardados</strong>.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => {
              onClose();
              onOpenSaveExport();
            }}
            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>💾 Guardar / Exportar Proyecto Actual Primero</span>
          </button>

          <button
            onClick={() => {
              onConfirmNewProject();
              onClose();
            }}
            className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>✨ Sí, Crear Nuevo Proyecto Vacío</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-slate-400 hover:text-white font-medium text-xs transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
