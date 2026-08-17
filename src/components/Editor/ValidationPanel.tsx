import React, { useState } from 'react';
import { SceneValidationIssue } from '../../utils/sceneValidator';
import { AlertTriangle, AlertCircle, CheckCircle2, ArrowRight, CornerDownLeft, Link2, ChevronDown, ChevronUp } from 'lucide-react';

interface ValidationPanelProps {
  issues: SceneValidationIssue[];
  onSelectScene: (sceneId: string) => void;
  activeSceneId?: string;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  issues,
  onSelectScene,
  activeSceneId,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (issues.length === 0) {
    return (
      <div className="bg-[#3B6D11]/10 border border-[#3B6D11]/30 rounded-2xl p-4 flex items-center justify-between text-xs text-[#3B6D11]">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-[#3B6D11] shrink-0" />
          <div>
            <span className="font-bold">Validación de Párrafos Correcta:</span> Todos los párrafos y escenas están bien vinculados y ofrecen posibilidades de continuar o regresar a párrafos anteriores.
          </div>
        </div>
      </div>
    );
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  return (
    <div className="bg-[#2C241C] border border-[#42362B] rounded-2xl p-4 space-y-3 shadow-sm text-[#F4EFE3]">
      <div className="flex items-center justify-between border-b border-[#42362B] pb-2.5">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
          <AlertTriangle className="w-5 h-5 text-[#C9A24B] shrink-0" />
          <h4 className="font-serif font-bold text-[#C9A24B] text-xs uppercase tracking-wider">
            Alertas de Vinculación y Retorno ({issues.length} {issues.length === 1 ? 'observación' : 'observaciones'})
          </h4>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] font-mono">
            {errors.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#A4332A]/20 text-rose-300 border border-[#A4332A]/40">
                {errors.length} sin vincular
              </span>
            )}
            {warnings.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#C9A24B]/20 text-[#C9A24B] border border-[#C9A24B]/40">
                {warnings.length} sin retorno / salida
              </span>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="px-2.5 py-1 bg-[#1F1913] hover:bg-[#382E25] text-[#D1C7B7] border border-[#42362B] rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            title={isCollapsed ? 'Desplegar listado de alertas' : 'Replegar listado de alertas'}
          >
            <span>{isCollapsed ? 'Desplegar' : 'Replegar'}</span>
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {issues.map((issue) => {
            const isCurrent = issue.sceneId === activeSceneId;
            const isError = issue.severity === 'error';

            return (
              <div
                key={issue.id}
                onClick={() => onSelectScene(issue.sceneId)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  isCurrent
                    ? 'bg-[#A4332A]/30 border-[#A4332A] text-white shadow-sm'
                    : isError
                    ? 'bg-[#A4332A]/10 border-[#A4332A]/30 hover:bg-[#A4332A]/20 text-rose-200'
                    : 'bg-[#1F1913] border-[#42362B] hover:bg-[#382E25] text-[#F4EFE3]'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {issue.type === 'unlinked' ? (
                    <Link2 className="w-4 h-4 text-[#A4332A] mt-0.5 shrink-0" />
                  ) : issue.type === 'no_return' ? (
                    <CornerDownLeft className="w-4 h-4 text-[#C9A24B] mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[#C9A24B] mt-0.5 shrink-0" />
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-xs text-white">{issue.sceneName}</span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                          issue.type === 'unlinked'
                            ? 'bg-[#A4332A]/30 text-rose-300 border border-[#A4332A]/40'
                            : 'bg-[#C9A24B]/30 text-[#C9A24B] border border-[#C9A24B]/40'
                        }`}
                      >
                        {issue.type === 'unlinked'
                          ? 'No vinculado'
                          : issue.type === 'no_return'
                          ? 'Sin retorno a anterior'
                          : 'Callejón sin salida'}
                      </span>
                    </div>
                    <p className="text-xs text-[#D1C7B7] leading-relaxed">{issue.message}</p>
                    <p className="text-[11px] text-[#C9A24B] italic font-mono flex items-center gap-1">
                      <span>💡 Sugerencia:</span> {issue.suggestion}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectScene(issue.sceneId);
                  }}
                  className="px-2.5 py-1 bg-[#A4332A] hover:bg-[#8B2A22] text-white rounded-lg text-[10px] font-bold shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Editar Escena</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
