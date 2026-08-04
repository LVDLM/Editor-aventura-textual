import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock } from 'lucide-react';

interface PrivacyBannerProps {
  onOpenPrivacyModal: () => void;
}

const CONSENT_KEY = 'rgpd_privacy_consent_accepted_v1';

export const PrivacyBanner: React.FC<PrivacyBannerProps> = ({ onOpenPrivacyModal }) => {
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
    <div className="fixed bottom-0 inset-x-0 z-40 bg-[#0c0c10]/95 border-t border-amber-500/30 backdrop-blur-md p-4 shadow-2xl animate-slideUp text-white">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <p className="font-bold text-slate-100 flex items-center gap-1.5">
              <span>Privacidad y Protección de Datos (Normativa UE / RGPD)</span>
              <span className="text-[10px] text-emerald-400 font-mono font-normal">
                Sin cookies publicitarias
              </span>
            </p>
            <p className="text-slate-300 text-[11px] leading-relaxed max-w-3xl">
              Utilizamos únicamente almacenamiento local técnico (<code className="text-amber-300">localStorage</code>) para guardar tu sesión y el avance en tus partidas jugadas. No rastreamos tus datos ni los cedemos a terceros.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
          <button
            onClick={onOpenPrivacyModal}
            className="text-xs text-amber-300 hover:text-amber-200 underline font-medium px-2 py-1"
          >
            Ver Política de Privacidad
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow transition-colors"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
