import React from 'react';
import { ShieldCheck, X, FileText, Trash2, Lock, UserCheck, Database } from 'lucide-react';

interface PrivacyPolicyModalProps {
  onClose: () => void;
  onOpenDeleteAccount?: () => void;
  isLoggedIn?: boolean;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  onClose,
  onOpenDeleteAccount,
  isLoggedIn = false,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-[#0f0f14] border border-amber-500/30 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-slate-200 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Política de Privacidad y RGPD</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  Unión Europea (UE)
                </span>
              </h2>
              <p className="text-xs text-slate-400"> Cumplimiento del Reglamento General de Protección de Datos (Reglamento UE 2016/679)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm leading-relaxed text-slate-300">
          
          {/* Summary Callout */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-emerald-300 text-sm">Compromiso de Privacidad y Transparencia</h4>
              <p className="text-slate-300">
                Respetamos profundamente la privacidad de nuestros usuarios, autores y lectores. No realizamos seguimiento publicitario ni comercializamos ningún tipo de dato personal con terceros.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-2">
            <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-white/10 pb-1.5">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>1. Responsable del Tratamiento y Finalidad</span>
            </h3>
            <p className="text-xs text-slate-300">
              El tratamiento de datos es realizado por la plataforma <strong>Motor de Aventuras en Texto</strong> exclusivamente para:
            </p>
            <ul className="list-disc list-inside text-xs space-y-1 pl-2 text-slate-400">
              <li>Permitir el acceso autenticado a tu cuenta de autor o lector.</li>
              <li>Almacenar y sincronizar los relatos, historias y borradores que decidas publicar.</li>
              <li>Guardar el estado de avance en tus partidas jugadas (partidas guardadas).</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-white/10 pb-1.5">
              <Database className="w-4 h-4 text-sky-400" />
              <span>2. Datos Personales Recopilados</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5 space-y-1">
                <span className="font-bold text-amber-300 block">Identificación</span>
                <p className="text-slate-400 text-[11px]">
                  Correo electrónico y Nombre de usuario / Nick público elegible libremente por el usuario.
                </p>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5 space-y-1">
                <span className="font-bold text-amber-300 block">Contenido y Progreso</span>
                <p className="text-slate-400 text-[11px]">
                  Archivos de aventuras creadas en la nube y marcas de partidas guardadas en almacenamiento local.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: RGPD Rights */}
          <div className="space-y-2">
            <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-white/10 pb-1.5">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>3. Tus Derechos ARCO (Derechos de la Unión Europea)</span>
            </h3>
            <p className="text-xs text-slate-300">
              De acuerdo con los artículos 15 a 22 del RGPD, dispones de los siguientes derechos garantizados sobre tus datos:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <strong className="text-amber-300">• Derecho de Acceso y Rectificación:</strong> Puedes consultar o modificar en cualquier momento tu Nick o tus relatos desde tu <em>Perfil de Usuario</em> o desde la sección <em>Configuración y Fallback</em>.
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <strong className="text-amber-300">• Derecho de Supresión (Derecho al Olvido - Art. 17 RGPD):</strong> Puedes solicitar o ejecutar tú mismo la eliminación completa e irreversible de tu cuenta, tu nick y todas tus historias de nuestra base de datos en Firestore mediante el botón <em>Eliminar Cuenta</em> de tu perfil.
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                <strong className="text-amber-300">• Derecho a la Portabilidad:</strong> Puedes descargar en cualquier instante tus relatos en archivo de código autónomo HTML, ZIP o JSON desde el menú de exportación.
              </div>
            </div>
          </div>

          {/* Section 4: Cookies & Local Storage */}
          <div className="space-y-2">
            <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-white/10 pb-1.5">
              <Lock className="w-4 h-4 text-rose-400" />
              <span>4. Ausencia de Cookies de Rastreo Comercial</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Esta aplicación no utiliza cookies analíticas de terceros ni píxeles publicitarios. Únicamente se emplea el almacenamiento del navegador (<code className="text-amber-300">localStorage</code>) estrictamente necesario para preservar tu sesión de inicio de sesión y tus partidas guardadas locales.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-white/10 flex items-center justify-between flex-wrap gap-3 shrink-0">
          {isLoggedIn && onOpenDeleteAccount ? (
            <button
              onClick={() => {
                onClose();
                onOpenDeleteAccount();
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1.5 underline"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Ejercicio del Derecho al Olvido (Eliminar cuenta y datos)</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-500">
              Cumplimiento estricto RGPD / GDPR 2026 UE
            </span>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow transition-colors"
          >
            Entendido y Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
