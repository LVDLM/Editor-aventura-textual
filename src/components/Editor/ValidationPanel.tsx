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
      <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-300">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold text-white">Validación de Párrafos Correcta:</span> Todos los párrafos y escenas están bien vinculados y ofrecen posibilidades de continuar o regresar a párrafos anteriores.
          </div>
        </div>
      </div>
    );
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  return (
    <div className="bg-[#120f0a] border border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
      <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <h4 className="font-bold text-amber-300 text-xs uppercase tracking-wider">
            Alertas de Vinculación y Retorno ({issues.length} {issues.length === 1 ? 'observación' : 'observaciones'})
          </h4>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] font-mono">
            {errors.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                {errors.length} sin vincular
              </span>
            )}
            {warnings.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {warnings.length} sin retorno / salida
              </span>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
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
                    ? 'bg-amber-500/20 border-amber-400 text-white shadow-md'
                    : isError
                    ? 'bg-rose-950/40 border-rose-500/30 hover:bg-rose-900/30 text-rose-200'
                    : 'bg-black/40 border-amber-500/20 hover:bg-black/60 text-amber-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {issue.type === 'unlinked' ? (
                    <Link2 className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                  ) : issue.type === 'no_return' ? (
                    <CornerDownLeft className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{issue.sceneName}</span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                          issue.type === 'unlinked'
                            ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {issue.type === 'unlinked'
                          ? 'No vinculado'
                          : issue.type === 'no_return'
                          ? 'Sin retorno a anterior'
                          : 'Callejón sin salida'}
                      </span>
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed">{issue.message}</p>
                    <p className="text-[11px] text-amber-300/90 italic font-mono flex items-center gap-1">
                      <span>💡 Sugerencia:</span> {issue.suggestion}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectScene(issue.sceneId);
                  }}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
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
