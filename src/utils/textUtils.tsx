import React from 'react';

export function isWordChar(char: string): boolean {
  return /[\p{L}\p{N}_]/u.test(char);
}

export function isWordMatchInText(word: string, text: string): boolean {
  if (!word || !text) return false;
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const startChar = word.charAt(0);
  const endChar = word.charAt(word.length - 1);
  const prefix = isWordChar(startChar) ? '(?<![\\p{L}\\p{N}_])' : '';
  const suffix = isWordChar(endChar) ? '(?![\\p{L}\\p{N}_])' : '';
  const pattern = new RegExp(`${prefix}${escapeRegExp(word)}${suffix}`, 'iu');
  return pattern.test(text);
}

/**
 * Parses plain text containing HTTP/HTTPS URLs and turns them into clickable <a> links
 */
export function renderTextWithLinks(text: string): React.ReactNode {
  if (!text) return null;

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      let cleanUrl = part;
      let trailingPunct = '';
      if (/[.,;:)\]]$/.test(cleanUrl)) {
        trailingPunct = cleanUrl.slice(-1);
        cleanUrl = cleanUrl.slice(0, -1);
      }

      return (
        <React.Fragment key={index}>
          <a
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 underline hover:text-amber-300 font-medium break-all transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {cleanUrl}
          </a>
          {trailingPunct}
        </React.Fragment>
      );
    }

    return part;
  });
}
