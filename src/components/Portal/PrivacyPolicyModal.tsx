import React from 'react';
import { ShieldCheck, X, FileText, Trash2, Lock, UserCheck, Database } from 'lucide-react';

interface PrivacyPolicyModalProps {
  onClose: () => void;
  onOpenDeleteAccount?: () => void;
  isLoggedIn?: boolean;
  webAspect?: 'clean' | 'classic';
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  onClose,
  onOpenDeleteAccount,
  isLoggedIn = false,
  webAspect = 'clean',
}) => {
  const isClean = webAspect === 'clean';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className={`rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl cursor-default border transition-colors ${
          isClean
            ? 'bg-[#FFFDF6] border-[#E5DCB8] text-[#2A2118]'
            : 'bg-[#2C241C] border-[#42362B] text-[#F4EFE3]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
            isClean ? 'bg-[#F4EFE3] border-[#E5DCB8]' : 'bg-[#241D17] border-[#42362B]'
          }`}
        >
          <div className="flex items-center gap-3">
            <ShieldCheck
              className={`w-6 h-6 ${isClean ? 'text-[#3B6D11]' : 'text-emerald-400'}`}
            />
            <div>
              <h2
                className={`text-lg font-serif font-bold flex flex-wrap items-center gap-2 ${
                  isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'
                }`}
              >
                <span>Política de Privacidad y RGPD</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-sans font-bold border ${
                    isClean
                      ? 'bg-[#3B6D11]/10 text-[#3B6D11] border-[#3B6D11]/30'
                      : 'bg-[#3B6D11]/20 text-[#5B9E22] border-[#3B6D11]/40'
                  }`}
                >
                  Unión Europea (UE)
                </span>
              </h2>
              <p
                className={`text-xs ${
                  isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'
                }`}
              >
                Cumplimiento del Reglamento General de Protección de Datos (Reglamento UE 2016/679)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isClean
                ? 'text-[#6B5C46] hover:text-[#2A2118] hover:bg-[#E5DCB8]/50'
                : 'text-[#A89880] hover:text-[#F4EFE3] hover:bg-[#3B3026]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm leading-relaxed">
          {/* Summary Callout */}
          <div
            className={`rounded-xl p-4 flex items-start gap-3 border ${
              isClean
                ? 'bg-[#3B6D11]/10 border-[#3B6D11]/30 text-[#2A2118]'
                : 'bg-[#3B6D11]/20 border-[#3B6D11]/40 text-[#F4EFE3]'
            }`}
          >
            <Lock
              className={`w-5 h-5 shrink-0 mt-0.5 ${
                isClean ? 'text-[#3B6D11]' : 'text-emerald-400'
              }`}
            />
            <div className="space-y-1 text-xs">
              <h4
                className={`font-serif font-bold text-sm ${
                  isClean ? 'text-[#3B6D11]' : 'text-[#5B9E22]'
                }`}
              >
                Compromiso de Privacidad y Transparencia
              </h4>
              <p className={isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}>
                Respetamos profundamente la privacidad de nuestros usuarios, autores y lectores. No realizamos seguimiento publicitario ni comercializamos ningún tipo de dato personal con terceros.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-2">
            <h3
              className={`font-serif font-bold text-base flex items-center gap-2 border-b pb-1.5 ${
                isClean
                  ? 'text-[#A4332A] border-[#E5DCB8]'
                  : 'text-[#C9A24B] border-[#42362B]'
              }`}
            >
              <UserCheck
                className={`w-4 h-4 ${
                  isClean ? 'text-[#A4332A]' : 'text-[#C9A24B]'
                }`}
              />
              <span>1. Responsable del Tratamiento y Finalidad</span>
            </h3>
            <p className={`text-xs ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>
              El tratamiento de datos es realizado por la plataforma <strong>Motor de Aventuras en Texto</strong> exclusivamente para:
            </p>
            <ul
              className={`list-disc list-inside text-xs space-y-1 pl-2 ${
                isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'
              }`}
            >
              <li>Permitir el acceso autenticado a tu cuenta de autor o lector.</li>
              <li>Almacenar y sincronizar los relatos, historias y borradores que decidas publicar.</li>
              <li>Guardar el estado de avance en tus partidas jugadas (partidas guardadas).</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h3
              className={`font-serif font-bold text-base flex items-center gap-2 border-b pb-1.5 ${
                isClean
                  ? 'text-[#A4332A] border-[#E5DCB8]'
                  : 'text-[#C9A24B] border-[#42362B]'
              }`}
            >
              <Database
                className={`w-4 h-4 ${
                  isClean ? 'text-[#3B6D11]' : 'text-sky-400'
                }`}
              />
              <span>2. Datos Personales Recopilados</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div
                className={`p-3 rounded-xl border space-y-1 ${
                  isClean
                    ? 'bg-[#F4EFE3] border-[#E5DCB8]'
                    : 'bg-[#241D17] border-[#42362B]'
                }`}
              >
                <span
                  className={`font-serif font-bold block ${
                    isClean ? 'text-[#A4332A]' : 'text-[#C9A24B]'
                  }`}
                >
                  Identificación
                </span>
                <p className={isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}>
                  Correo electrónico y Nombre de usuario / Nick público elegible libremente por el usuario.
                </p>
              </div>
              <div
                className={`p-3 rounded-xl border space-y-1 ${
                  isClean
                    ? 'bg-[#F4EFE3] border-[#E5DCB8]'
                    : 'bg-[#241D17] border-[#42362B]'
                }`}
              >
                <span
                  className={`font-serif font-bold block ${
                    isClean ? 'text-[#A4332A]' : 'text-[#C9A24B]'
                  }`}
                >
                  Contenido y Progreso
                </span>
                <p className={isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}>
                  Archivos de aventuras creadas en la nube y marcas de partidas guardadas en almacenamiento local.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: RGPD Rights */}
          <div className="space-y-2">
            <h3
              className={`font-serif font-bold text-base flex items-center gap-2 border-b pb-1.5 ${
                isClean
                  ? 'text-[#A4332A] border-[#E5DCB8]'
                  : 'text-[#C9A24B] border-[#42362B]'
              }`}
            >
              <FileText
                className={`w-4 h-4 ${
                  isClean ? 'text-[#3B6D11]' : 'text-emerald-400'
                }`}
              />
              <span>3. Tus Derechos ARCO (Derechos de la Unión Europea)</span>
            </h3>
            <p className={`text-xs ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>
              De acuerdo con los artículos 15 a 22 del RGPD, dispones de los siguientes derechos garantizados sobre tus datos:
            </p>
            <div className="space-y-2 text-xs">
              <div
                className={`p-3 rounded-xl border ${
                  isClean
                    ? 'bg-[#F4EFE3] border-[#E5DCB8]'
                    : 'bg-[#241D17] border-[#42362B]'
                }`}
              >
                <strong className={isClean ? 'text-[#A4332A]' : 'text-[#C9A24B]'}>
                  • Derecho de Acceso y Rectificación:
                </strong>{' '}
                Puedes consultar o modificar en cualquier momento tu Nick o tus relatos desde tu <em>Perfil de Usuario</em> o desde la sección <em>Configuración y Fallback</em>.
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  isClean
                    ? 'bg-[#F4EFE3] border-[#E5DCB8]'
                    : 'bg-[#241D17] border-[#42362B]'
                }`}
              >
                <strong className={isClean ? 'text-[#A4332A]' : 'text-[#C9A24B]'}>
                  • Derecho de Supresión (Derecho al Olvido - Art. 17 RGPD):
                </strong>{' '}
                Puedes solicitar o ejecutar tú mismo la eliminación completa e irreversible de tu cuenta, tu nick y todas tus historias de nuestra base de datos en Firestore mediante el botón <em>Eliminar Cuenta</em> de tu perfil.
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  isClean
                    ? 'bg-[#F4EFE3] border-[#E5DCB8]'
                    : 'bg-[#241D17] border-[#42362B]'
                }`}
              >
                <strong className={isClean ? 'text-[#A4332A]' : 'text-[#C9A24B]'}>
                  • Derecho a la Portabilidad:
                </strong>{' '}
                Puedes descargar en cualquier instante tus relatos en archivo de código autónomo HTML, ZIP o JSON desde el menú de exportación.
              </div>
            </div>
          </div>

          {/* Section 4: Cookies & Local Storage */}
          <div className="space-y-2">
            <h3
              className={`font-serif font-bold text-base flex items-center gap-2 border-b pb-1.5 ${
                isClean
                  ? 'text-[#A4332A] border-[#E5DCB8]'
                  : 'text-[#C9A24B] border-[#42362B]'
              }`}
            >
              <Lock
                className={`w-4 h-4 ${
                  isClean ? 'text-[#A4332A]' : 'text-rose-400'
                }`}
              />
              <span>4. Ausencia de Cookies de Rastreo Comercial</span>
            </h3>
            <p className={`text-xs leading-relaxed ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>
              Esta aplicación no utiliza cookies analíticas de terceros ni píxeles publicitarios. Únicamente se emplea el almacenamiento del navegador (
              <code
                className={`font-mono px-1.5 py-0.5 rounded border text-[11px] ${
                  isClean
                    ? 'bg-[#E5DCB8]/50 border-[#E5DCB8] text-[#A4332A] font-bold'
                    : 'bg-[#3B3026] border-[#42362B] text-[#C9A24B] font-bold'
                }`}
              >
                localStorage
              </code>
              ) estrictamente necesario para preservar tu sesión de inicio de sesión y tus partidas guardadas locales.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between flex-wrap gap-3 shrink-0 ${
            isClean ? 'bg-[#F4EFE3] border-[#E5DCB8]' : 'bg-[#241D17] border-[#42362B]'
          }`}
        >
          {isLoggedIn && onOpenDeleteAccount ? (
            <button
              onClick={() => {
                onClose();
                onOpenDeleteAccount();
              }}
              className={`text-xs font-bold flex items-center gap-1.5 underline cursor-pointer ${
                isClean ? 'text-[#A4332A] hover:opacity-80' : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Ejercicio del Derecho al Olvido (Eliminar cuenta y datos)</span>
            </button>
          ) : (
            <span className={`text-[11px] ${isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'}`}>
              Cumplimiento estricto RGPD / GDPR 2026 UE
            </span>
          )}

          <button
            onClick={onClose}
            className={`px-5 py-2 font-bold rounded-xl text-xs shadow-sm transition-colors cursor-pointer ${
              isClean
                ? 'bg-[#A4332A] hover:bg-[#8B2A22] text-white'
                : 'bg-[#C9A24B] hover:bg-[#B38E3B] text-[#2C241C]'
            }`}
          >
            Entendido y Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
