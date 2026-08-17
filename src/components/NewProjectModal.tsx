import React from 'react';
import { AlertTriangle, Download, Plus, X } from 'lucide-react';

interface NewProjectModalProps {
  onConfirmNewProject: () => void;
  onOpenSaveExport: () => void;
  onClose: () => void;
  webAspect?: 'clean' | 'classic';
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  onConfirmNewProject,
  onOpenSaveExport,
  onClose,
  webAspect = 'clean',
}) => {
  const isClean = webAspect === 'clean';

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 cursor-pointer"
      onClick={onClose}
    >
      <div
        className={`rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 cursor-default border transition-colors ${
          isClean
            ? 'bg-[#FFFDF6] border-[#E5DCB8] text-[#2A2118]'
            : 'bg-[#2C241C] border-[#42362B] text-[#F4EFE3]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className={`flex items-start justify-between gap-3 border-b pb-4 ${
          isClean ? 'border-[#E5DCB8]' : 'border-[#42362B]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border ${
              isClean
                ? 'bg-[#A4332A]/10 border-[#A4332A]/30 text-[#A4332A]'
                : 'bg-[#C9A24B]/20 border-[#C9A24B]/40 text-[#C9A24B]'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`text-lg font-serif font-bold ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>
                ¿Crear un Nuevo Proyecto?
              </h3>
              <p className={`text-xs font-bold ${isClean ? 'text-[#A4332A]' : 'text-[#C9A24B]'}`}>
                Advertencia de guardado de datos
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

        {/* Message */}
        <div className={`space-y-3 text-sm leading-relaxed p-4 rounded-xl border ${
          isClean
            ? 'bg-[#F4EFE3] border-[#E5DCB8] text-[#2A2118]'
            : 'bg-[#241D17] border-[#42362B] text-[#F4EFE3]'
        }`}>
          <p>
            Estás a punto de iniciar un <strong>nuevo proyecto de aventura gráfica desde cero</strong>.
          </p>
          <p className={`text-xs ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
            Si has estado modificando la aventura actual en el editor y aún no has guardado el archivo <code className={isClean ? 'text-[#A4332A] font-bold' : 'text-[#C9A24B] font-bold'}>.json</code> o exportado el juego, <strong>perderás todos los cambios no guardados</strong>.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => {
              onClose();
              onOpenSaveExport();
            }}
            className={`w-full py-2.5 px-4 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer ${
              isClean
                ? 'bg-[#A4332A] hover:bg-[#8B2A22] text-white'
                : 'bg-[#C9A24B] hover:bg-[#B38E3B] text-[#2C241C]'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>💾 Guardar / Exportar Proyecto Actual Primero</span>
          </button>

          <button
            onClick={() => {
              onConfirmNewProject();
              onClose();
            }}
            className={`w-full py-2.5 px-4 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border ${
              isClean
                ? 'bg-[#F4EFE3] hover:bg-[#E5DCB8] text-[#2A2118] border-[#E5DCB8]'
                : 'bg-[#3B3026] hover:bg-[#4A3D30] text-[#F4EFE3] border-[#42362B]'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>✨ Sí, Crear Nuevo Proyecto Vacío</span>
          </button>

          <button
            onClick={onClose}
            className={`w-full py-2 font-medium text-xs transition-colors cursor-pointer ${
              isClean ? 'text-[#6B5C46] hover:text-[#2A2118]' : 'text-[#A89880] hover:text-[#F4EFE3]'
            }`}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
