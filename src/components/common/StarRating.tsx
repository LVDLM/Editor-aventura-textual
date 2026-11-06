import React, { useState, useEffect } from 'react';
import { Star, StarHalf, Sparkles, Check } from 'lucide-react';
import { submitStoryRating, getStoryRating } from '../../lib/firebase';

interface StarRatingDisplayProps {
  rating?: number; // 0 to 5
  count?: number; // total ratings
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showCount?: boolean;
  showNumber?: boolean;
  className?: string;
  theme?: 'dark' | 'light' | 'sepia';
}

export const StarRatingDisplay: React.FC<StarRatingDisplayProps> = ({
  rating = 0,
  count,
  size = 'sm',
  showCount = true,
  showNumber = true,
  className = '',
  theme = 'dark',
}) => {
  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizes = {
    xs: 'text-[9px]',
    sm: 'text-[11px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  const hasRatings = (count !== undefined ? count > 0 : rating > 0);
  const roundedRating = Math.round(rating * 10) / 10;

  return (
    <div className={`inline-flex items-center gap-1 font-sans ${className}`} title={hasRatings ? `Valoración media: ${roundedRating} de 5 (${count || 0} valoraciones)` : 'Sin valoraciones todavía'}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          if (!hasRatings) {
            return (
              <Star
                key={starIndex}
                className={`${iconSizes[size]} text-amber-500/25 stroke-current`}
              />
            );
          }

          const fillDiff = rating - (starIndex - 1);
          if (fillDiff >= 0.75) {
            // Full star
            return (
              <Star
                key={starIndex}
                className={`${iconSizes[size]} text-amber-400 fill-amber-400 drop-shadow-[0_1px_2px_rgba(245,158,11,0.3)]`}
              />
            );
          } else if (fillDiff >= 0.25) {
            // Half star
            return (
              <div key={starIndex} className="relative">
                <Star className={`${iconSizes[size]} text-amber-500/30`} />
                <div className="absolute inset-0 overflow-hidden w-1/2">
                  <Star className={`${iconSizes[size]} text-amber-400 fill-amber-400`} />
                </div>
              </div>
            );
          } else {
            // Empty star
            return (
              <Star
                key={starIndex}
                className={`${iconSizes[size]} text-amber-500/30`}
              />
            );
          }
        })}
      </div>

      {hasRatings ? (
        <div className={`flex items-center gap-1 font-semibold ${textSizes[size]} ${
          theme === 'sepia' ? 'text-[#786146]' : theme === 'light' ? 'text-slate-700' : 'text-amber-200'
        }`}>
          {showNumber && <span>{roundedRating.toFixed(1)}</span>}
          {showCount && count !== undefined && (
            <span className={`text-[10px] font-normal opacity-75`}>
              ({count})
            </span>
          )}
        </div>
      ) : (
        <span className={`text-[10px] opacity-60 italic ${
          theme === 'sepia' ? 'text-[#786146]' : theme === 'light' ? 'text-slate-500' : 'text-slate-400'
        }`}>
          (Sin valorar)
        </span>
      )}
    </div>
  );
};

interface StoryRatingWidgetProps {
  storyId: string;
  initialAverage?: number;
  initialCount?: number;
  userId?: string;
  theme?: 'dark' | 'sepia' | 'light';
  onRatingSubmitted?: (result: { ratingAverage: number; ratingCount: number; userRating: number }) => void;
}

export const StoryRatingWidget: React.FC<StoryRatingWidgetProps> = ({
  storyId,
  initialAverage = 0,
  initialCount = 0,
  userId,
  theme = 'dark',
  onRatingSubmitted,
}) => {
  const [ratingAverage, setRatingAverage] = useState<number>(initialAverage);
  const [ratingCount, setRatingCount] = useState<number>(initialCount);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [justVoted, setJustVoted] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    getStoryRating(storyId, userId).then((res) => {
      if (!isMounted) return;
      if (res.ratingAverage > 0) setRatingAverage(res.ratingAverage);
      if (res.ratingCount > 0) setRatingCount(res.ratingCount);
      if (res.userRating) setUserRating(res.userRating);
    });
    return () => {
      isMounted = false;
    };
  }, [storyId, userId]);

  const handleRate = async (stars: number) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await submitStoryRating(storyId, stars, userId);
      setRatingAverage(res.ratingAverage);
      setRatingCount(res.ratingCount);
      setUserRating(res.userRating);
      setJustVoted(true);
      if (onRatingSubmitted) onRatingSubmitted(res);
      setTimeout(() => setJustVoted(false), 3500);
    } catch (err) {
      console.error('Error submitting rating:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSepia = theme === 'sepia';

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-lg text-left ${
        isSepia
          ? 'bg-[#ebdcb9]/80 border-[#c2aa79] text-[#3b2d1d]'
          : 'bg-slate-900/90 border-amber-500/30 text-slate-100'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left header / title */}
        <div>
          <div className="flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Valoración de la Historia</span>
          </div>
          <p className={`text-xs mt-0.5 ${isSepia ? 'text-[#786146]' : 'text-slate-300'}`}>
            {userRating
              ? `Has valorado esta historia con ${userRating} de 5 estrellas.`
              : '¿Qué te ha parecido la aventura? Deja tu puntuación:'}
          </p>
        </div>

        {/* Community Score Display */}
        {ratingCount > 0 && (
          <div className={`text-xs sm:text-right shrink-0 px-3 py-1.5 rounded-xl border ${
            isSepia
              ? 'bg-[#f5ebd7] border-[#c2aa79]/60'
              : 'bg-black/40 border-white/10'
          }`}>
            <div className="text-[10px] uppercase font-semibold text-amber-400/90">
              Media de lectores
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <StarRatingDisplay
                rating={ratingAverage}
                count={ratingCount}
                size="sm"
                theme={isSepia ? 'sepia' : 'dark'}
              />
            </div>
          </div>
        )}
      </div>

      {/* Interactive 5-Star Input */}
      <div className="mt-4 pt-3 border-t border-amber-500/20 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((starNum) => {
            const activeThreshold = hoverRating !== null ? hoverRating : (userRating || 0);
            const isFilled = starNum <= activeThreshold;

            return (
              <button
                key={starNum}
                type="button"
                disabled={isSubmitting}
                onClick={() => handleRate(starNum)}
                onMouseEnter={() => setHoverRating(starNum)}
                onMouseLeave={() => setHoverRating(null)}
                aria-label={`Valorar con ${starNum} estrella${starNum > 1 ? 's' : ''}`}
                title={`Valorar con ${starNum} de 5 estrellas`}
                className="p-1 rounded-lg transition-transform hover:scale-125 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Star
                  className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                    isFilled
                      ? 'text-amber-400 fill-amber-400 drop-shadow-[0_2px_6px_rgba(245,158,11,0.5)]'
                      : 'text-amber-500/30 hover:text-amber-400/70'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Status text or Thank you feedback */}
        <div className="text-xs font-medium">
          {justVoted ? (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold animate-pulse">
              <Check className="w-4 h-4" /> ¡Puntuación guardada!
            </span>
          ) : userRating ? (
            <span className={`text-[11px] ${isSepia ? 'text-[#786146]' : 'text-slate-400'}`}>
              Pulsa otra estrella para modificar tu voto
            </span>
          ) : (
            <span className={`text-[11px] ${isSepia ? 'text-[#786146]' : 'text-slate-400'}`}>
              Escala de 1 a 5 estrellas
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
