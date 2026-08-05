import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface FooterProps {
  variant?: 'web' | 'published';
  onOpenPrivacyModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ variant = 'web', onOpenPrivacyModal }) => {
  const isPublished = variant === 'published';

  return (
    <footer className="w-full border-t border-white/10 bg-slate-950/90 text-slate-400 py-6 px-4 text-xs mt-auto relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        {/* Creative Commons Licensing Info */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-1 text-[11px] leading-relaxed text-slate-400">
          {isPublished ? (
            <>
              <span>This work is licensed under</span>{' '}
              <a
                href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline font-medium"
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
                className="text-amber-400 hover:underline font-medium"
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

        {/* Privacy Policy Link */}
        {onOpenPrivacyModal && (
          <button
            onClick={onOpenPrivacyModal}
            className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-amber-400 transition-colors cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Política de Privacidad</span>
          </button>
        )}
      </div>
    </footer>
  );
};
