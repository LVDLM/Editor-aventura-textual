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
 * Parses plain text containing HTTP/HTTPS URLs or embedded HTML tags (like <a href="...">...</a>, <b>, <i>, <br/>)
 * and turns them into clickable, styled React elements.
 */
export function renderTextWithLinks(
  text: string,
  options?: { linkClassName?: string }
): React.ReactNode {
  if (!text) return null;

  const defaultLinkClass =
    options?.linkClassName ||
    'text-amber-600 dark:text-amber-400 underline hover:opacity-80 font-medium break-all transition-colors cursor-pointer';

  // Detect if text contains HTML tags
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(text);

  if (hasHtmlTags && typeof window !== 'undefined' && window.DOMParser) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');

      const convertDomNodeToReact = (
        node: Node,
        keyIndex: number
      ): React.ReactNode => {
        if (node.nodeType === Node.TEXT_NODE) {
          const content = node.textContent || '';
          if (!content) return null;

          const urlRegex = /(https?:\/\/[^\s]+)/g;
          if (urlRegex.test(content)) {
            const parts = content.split(urlRegex);
            return (
              <React.Fragment key={keyIndex}>
                {parts.map((part, pIdx) => {
                  if (part.match(urlRegex)) {
                    let cleanUrl = part;
                    let trailingPunct = '';
                    if (/[.,;:)\]]$/.test(cleanUrl)) {
                      trailingPunct = cleanUrl.slice(-1);
                      cleanUrl = cleanUrl.slice(0, -1);
                    }
                    return (
                      <React.Fragment key={pIdx}>
                        <a
                          href={cleanUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={defaultLinkClass}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {cleanUrl}
                        </a>
                        {trailingPunct}
                      </React.Fragment>
                    );
                  }
                  return part;
                })}
              </React.Fragment>
            );
          }
          return content;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tagName = el.tagName.toLowerCase();

          const allowedTags = [
            'a',
            'b',
            'i',
            'strong',
            'em',
            'u',
            'span',
            'p',
            'br',
            'div',
            'ul',
            'ol',
            'li',
            'code',
            'small',
            'sub',
            'sup',
          ];

          if (!allowedTags.includes(tagName)) {
            return el.textContent;
          }

          const children = Array.from(el.childNodes).map((child, idx) =>
            convertDomNodeToReact(child, idx)
          );

          if (tagName === 'br') {
            return <br key={keyIndex} />;
          }

          if (tagName === 'a') {
            let href = el.getAttribute('href') || '#';
            if (href.toLowerCase().startsWith('javascript:')) href = '#';
            return (
              <a
                key={keyIndex}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={defaultLinkClass}
                onClick={(e) => e.stopPropagation()}
              >
                {children}
              </a>
            );
          }

          return React.createElement(tagName, { key: keyIndex }, children);
        }

        return null;
      };

      const nodes = Array.from(doc.body.childNodes);
      return (
        <React.Fragment>
          {nodes.map((node, i) => convertDomNodeToReact(node, i))}
        </React.Fragment>
      );
    } catch {
      // Fallback if parsing fails
    }
  }

  // Fallback / Plain text mode
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
            className={defaultLinkClass}
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

