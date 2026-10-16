import React from 'react';
import { CloudProjectDoc } from '../../types';
import { Eye, EyeOff, Edit3, X, Sparkles, AlertCircle, BookOpen } from 'lucide-react';

interface EditStoryModalProps {
  projectDoc: CloudProjectDoc | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: 'keep_published' | 'hide_to_draft') => void;
  webAspect?: 'clean' | 'classic';
}

export const EditStoryModal: React.FC<EditStoryModalProps> = ({
  projectDoc,
  isOpen,
  onClose,
  onConfirm,
  webAspect = 'clean',
}) => {
  if (!isOpen || !projectDoc) return null;

  const isClean = webAspect === 'clean';
  const isPublished = projectDoc.status === 'published';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`max-w-md w-full rounded-2xl border p-6 shadow-2xl relative cursor-default ${
          isClean
            ? 'bg-[#FFFDF6] border-[#E5DCB8] text-[#2A2118]'
            : 'bg-[#1F1913] border-[#42362B] text-[#F4EFE3]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1 rounded-lg transition-colors cursor-pointer ${
            isClean ? 'text-[#6B5C46] hover:bg-[#E5DCB8]' : 'text-[#D1C7B7] hover:bg-[#2C241C]'
          }`}
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#A4332A]/10 border border-[#A4332A]/20 flex items-center justify-center text-[#A4332A] shrink-0">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-serif font-bold leading-tight">
              Opciones de Edición
            </h3>
            <p className={`text-xs truncate max-w-[280px] ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
              {projectDoc.title || 'Historia sin título'}
            </p>
          </div>
        </div>

        {isPublished ? (
          <div className="space-y-4">
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              isClean
                ? 'bg-[#E5DCB8]/30 border-[#E5DCB8] text-[#6B5C46]'
                : 'bg-[#2C241C] border-[#42362B] text-[#D1C7B7]'
            }`}>
              <BookOpen className="w-4 h-4 text-[#A4332A] shrink-0 mt-0.5" />
              <div>
                <strong className={isClean ? 'text-[#2A2118]' : 'text-white'}>Historia actualmente publicada:</strong>{' '}
                Puedes elegir si deseas que siga disponible para los lectores en la Galería mientras preparas nuevos cambios, o si prefieres ocultarla temporalmente.
              </div>
            </div>

            <div className="space-y-3">
              {/* Option 1: Solo editar (mantener visible) */}
              <button
                type="button"
                onClick={() => onConfirm('keep_published')}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col gap-1.5 group ${
                  isClean
                    ? 'border-[#3B6D11] bg-[#3B6D11]/5 hover:bg-[#3B6D11]/10'
                    : 'border-[#3B6D11] bg-[#3B6D11]/10 hover:bg-[#3B6D11]/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#3B6D11] dark:text-[#5B9E22]">
                    <Eye className="w-4 h-4" />
                    <span>Solo editar (Mantener visible en Galería)</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#3B6D11] text-white">
                    Recomendado
                  </span>
                </div>
                <p className={`text-[11px] leading-relaxed ${isClean ? 'text-[#42362B]' : 'text-[#D1C7B7]'}`}>
                  La historia sigue disponible para los lectores con su versión actual. Trabajas en tus mejoras en el editor y nadie verá los cambios hasta que decidas publicarlos.
                </p>
              </button>

              {/* Option 2: Ocultar y editar */}
              <button
                type="button"
                onClick={() => onConfirm('hide_to_draft')}
                className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 group ${
                  isClean
                    ? 'border-[#E5DCB8] hover:border-[#A4332A] bg-white hover:bg-[#FFFDF6]'
                    : 'border-[#42362B] hover:border-amber-500 bg-[#2C241C]/60 hover:bg-[#2C241C]'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-[#A4332A]">
                  <EyeOff className="w-4 h-4" />
                  <span>Ocultar y editar (Retirar de la Galería)</span>
                </div>
                <p className={`text-[11px] leading-relaxed ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
                  Retira el relato de la Galería pública de inmediato (cambiándolo a borrador privado) mientras realizas tus modificaciones. Nadie podrá jugarlo hasta que lo vuelvas a publicar.
                </p>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className={`text-xs leading-relaxed ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
              Este relato se encuentra en estado <strong>{projectDoc.status === 'draft' ? 'Borrador (Privado)' : 'En Revisión'}</strong>. Se abrirá en el editor para continuar su redacción.
            </p>
            <button
              onClick={() => onConfirm('keep_published')}
              className="w-full py-2.5 bg-[#A4332A] hover:bg-[#8B2A22] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Abrir en el Editor
            </button>
          </div>
        )}

        <div className="mt-4 pt-3 border-t flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              isClean ? 'text-[#6B5C46] hover:bg-[#E5DCB8]' : 'text-[#D1C7B7] hover:bg-[#2C241C]'
            }`}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
