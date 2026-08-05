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
    <footer className={`w-full border-t py-6 px-4 text-xs mt-auto relative z-10 transition-colors duration-300 ${
      isClean
        ? 'border-slate-200 bg-white text-slate-600'
        : 'border-white/10 bg-slate-950/90 text-slate-400'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        {/* Creative Commons Licensing Info */}
        <div className={`flex flex-wrap items-center justify-center md:justify-start gap-1 text-[11px] leading-relaxed ${
          isClean ? 'text-slate-600' : 'text-slate-400'
        }`}>
          {isPublished ? (
            <>
              <span>This work is licensed under</span>{' '}
              <a
                href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 hover:underline font-medium"
              >
                Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
              </a>
              <img
                src="https://mirrors.creativecommons.org/presskit/icons/cc.svg"
                alt=""
                style={{ maxWidth: '1em', maxHeight: '1em', marginLeft: '.2em', display: 'inline' }}
              />
              <img
                src="https://mirrors.creativecommons.org/presskit/icons/by.svg"
                alt=""
                style={{ maxWidth: '1em', maxHeight: '1em', marginLeft: '.2em', display: 'inline' }}
              />
              <img
                src="https://mirrors.creativecommons.org/presskit/icons/nc.svg"
                alt=""
                style={{ maxWidth: '1em', maxHeight: '1em', marginLeft: '.2em', display: 'inline' }}
              />
              <img
                src="https://mirrors.creativecommons.org/presskit/icons/sa.svg"
                alt=""
                style={{ maxWidth: '1em', maxHeight: '1em', marginLeft: '.2em', display: 'inline' }}
              />
            </>
          ) : (
            <>
              <span>This work is licensed under</span>{' '}
              <a
                href="https://creativecommons.org/licenses/by-nc-nd/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 hover:underline font-medium"
              >
                Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International
              </a>
              <img
                src="https://mirrors.creativecommons.org/presskit/icons/cc.svg"
                alt=""
                style={{ maxWidth: '1em', maxHeight: '1em', marginLeft: '.2em', display: 'inline' }}
              />
              <img
                src="https://mirrors.creativecommons.org/presskit/icons/by.svg"
                alt=""
                style={{ maxWidth: '1em', maxHeight: '1em', marginLeft: '.2em', display: 'inline' }}
              />
              <img
                src="https://mirrors.creativecommons.org/presskit/icons/nc.svg"
                alt=""
                style={{ maxWidth: '1em', maxHeight: '1em', marginLeft: '.2em', display: 'inline' }}
              />
              <img
                src="https://mirrors.creativecommons.org/presskit/icons/nd.svg"
                alt=""
                style={{ maxWidth: '1em', maxHeight: '1em', marginLeft: '.2em', display: 'inline' }}
              />
            </>
          )}
        </div>

        {/* Privacy Policy Link - NO ICON */}
        {onOpenPrivacyModal && (
          <button
            onClick={onOpenPrivacyModal}
            className={`inline-flex items-center text-xs transition-colors cursor-pointer border px-3 py-1.5 rounded-lg shrink-0 font-medium ${
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
