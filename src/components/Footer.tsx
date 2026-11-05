import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface FooterProps {
  variant?: 'web' | 'published';
  onOpenPrivacyModal?: () => void;
  webAspect?: 'clean' | 'classic';
}

export const Footer: React.FC<FooterProps> = ({ variant = 'web', onOpenPrivacyModal, webAspect = 'clean' }) => {
  const isPublished = variant === 'published';
  const isClean = webAspect === 'clean';

  return (
    <footer className={`w-full border-t py-3 sm:py-4 px-4 text-xs mt-auto relative z-10 transition-colors duration-300 ${
      isClean
        ? 'border-slate-200 bg-white text-slate-600'
        : 'border-white/10 bg-slate-950/90 text-slate-400'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-4 text-center md:text-left">
        {/* Creative Commons Licensing Info & Image Attribution */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 sm:gap-3 text-[11px]">
          {/* CC Icons only on mobile, with descriptive text on desktop */}
          <a
            href={isPublished ? "https://creativecommons.org/licenses/by-nc-sa/4.0/" : "https://creativecommons.org/licenses/by-nc-nd/4.0/"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
            title={isPublished ? "Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)" : "Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)"}
          >
            <span className="hidden md:inline">This work is licensed under</span>
            <span className="hidden md:inline text-amber-600 hover:underline font-medium">
              {isPublished ? 'CC BY-NC-SA 4.0' : 'CC BY-NC-ND 4.0'}
            </span>
            <img
              src="https://mirrors.creativecommons.org/presskit/icons/cc.svg"
              alt="CC"
              style={{ maxWidth: '1.1em', maxHeight: '1.1em', display: 'inline' }}
            />
            <img
              src="https://mirrors.creativecommons.org/presskit/icons/by.svg"
              alt="BY"
              style={{ maxWidth: '1.1em', maxHeight: '1.1em', display: 'inline' }}
            />
            <img
              src="https://mirrors.creativecommons.org/presskit/icons/nc.svg"
              alt="NC"
              style={{ maxWidth: '1.1em', maxHeight: '1.1em', display: 'inline' }}
            />
            <img
              src={isPublished ? "https://mirrors.creativecommons.org/presskit/icons/sa.svg" : "https://mirrors.creativecommons.org/presskit/icons/nd.svg"}
              alt={isPublished ? "SA" : "ND"}
              style={{ maxWidth: '1.1em', maxHeight: '1.1em', display: 'inline' }}
            />
          </a>

          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>

          {/* Favicon Attribution: [imagen] by catalyststuff */}
          <div className="inline-flex items-center gap-1 text-[11px]">
            <img
              src="https://i.ibb.co/BHqzTkfN/favicon-16x16.png"
              alt=""
              className="w-3.5 h-3.5 inline-block shrink-0 rounded-xs"
            />
            <a
              href="https://www.magnific.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`hover:underline font-medium ${
                isClean ? 'text-amber-700 hover:text-amber-800' : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              [imagen] by catalyststuff
            </a>
          </div>
        </div>

        {/* Privacy Policy Link */}
        {onOpenPrivacyModal && (
          <button
            type="button"
            onClick={onOpenPrivacyModal}
            className={`inline-flex items-center text-xs transition-colors cursor-pointer border px-2.5 py-1 rounded-lg shrink-0 font-medium ${
              isClean
                ? 'text-slate-700 hover:text-amber-700 bg-slate-100 hover:bg-slate-200 border-slate-200'
                : 'text-slate-300 hover:text-amber-400 bg-white/5 hover:bg-white/10 border-white/10'
            }`}
          >
            <span>Política de Privacidad</span>
          </button>
        )}
      </div>
    </footer>
  );
};
