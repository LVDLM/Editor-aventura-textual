import React, { useRef, useEffect } from 'react';

interface AutoGrowTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
}

export const AutoGrowTextarea: React.FC<AutoGrowTextareaProps> = ({
  value,
  onChange,
  className = '',
  style,
  minRows = 2,
  rows = 2,
  ...props
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      rows={rows || minRows}
      onChange={(e) => {
        adjustHeight();
        onChange?.(e);
      }}
      onInput={adjustHeight}
      className={`resize-none overflow-hidden transition-[height] duration-75 block ${className}`}
      style={{
        fieldSizing: 'content',
        ...style,
      } as React.CSSProperties}
      {...props}
    />
  );
};
