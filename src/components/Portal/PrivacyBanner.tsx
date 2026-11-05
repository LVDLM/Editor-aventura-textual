import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock } from 'lucide-react';

interface PrivacyBannerProps {
  onOpenPrivacyModal: () => void;
  webAspect?: 'clean' | 'classic';
}

const CONSENT_KEY = 'rgpd_privacy_consent_accepted_v1';

export const PrivacyBanner: React.FC<PrivacyBannerProps> = ({
  onOpenPrivacyModal,
  webAspect = 'clean',
}) => {
  const isClean = webAspect === 'clean';
  const [hasConsented, setHasConsented] = useState<boolean>(true);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setHasConsented(false);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    setHasConsented(true);
  };

  if (hasConsented) return null;

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-md p-2.5 sm:p-4 shadow-2xl animate-slideUp transition-colors ${
        isClean
          ? 'bg-[#FFFDF6]/98 border-[#E5DCB8] text-[#2A2118]'
          : 'bg-[#2C241C]/98 border-[#42362B] text-[#F4EFE3]'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <ShieldCheck
            className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 ${
              isClean ? 'text-[#3B6D11]' : 'text-emerald-400'
            }`}
          />
          <div className="space-y-0.5 text-xs">
            <p
              className={`font-serif font-bold text-xs flex flex-wrap items-center gap-1.5 ${
                isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'
              }`}
            >
              <span>Privacidad y Protección de Datos (RGPD)</span>
              <span
                className={`text-[9px] sm:text-[10px] font-sans font-bold px-1.5 py-0.2 rounded border ${
                  isClean
                    ? 'bg-[#3B6D11]/10 text-[#3B6D11] border-[#3B6D11]/30'
                    : 'bg-[#3B6D11]/20 text-[#5B9E22] border-[#3B6D11]/40'
                }`}
              >
                Sin cookies publicitarias
              </span>
            </p>
            <p
              className={`text-[10px] sm:text-[11px] leading-snug sm:leading-relaxed max-w-3xl ${
                isClean ? 'text-[#6B5C46]' : 'text-[#A89880]'
              }`}
            >
              Solo utilizamos almacenamiento técnico local para guardar tus partidas y sesión. No rastreamos tus datos ni los cedemos a terceros.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            onClick={onOpenPrivacyModal}
            className={`text-[11px] sm:text-xs underline font-bold px-1.5 py-0.5 transition-colors cursor-pointer ${
              isClean
                ? 'text-[#A4332A] hover:text-[#8B2A22]'
                : 'text-[#C9A24B] hover:text-amber-200'
            }`}
          >
            Política de Privacidad
          </button>
          <button
            onClick={handleAccept}
            className={`px-3 sm:px-4 py-1 sm:py-1.5 font-bold rounded-xl text-[11px] sm:text-xs shadow-sm transition-colors cursor-pointer ${
              isClean
                ? 'bg-[#3B6D11] hover:bg-[#2F570E] text-white'
                : 'bg-[#3B6D11] hover:bg-[#5B9E22] text-white'
            }`}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
