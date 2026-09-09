import React, { useState, useRef, useCallback, useEffect } from 'react';

export interface PanelResizerProps {
  id: string;
  label: string;
  onResize: (deltaX: number, clientX: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  onReset?: () => void;
  onStepChange?: (step: number) => void;
  disabled?: boolean;
  className?: string;
}

export const PanelResizer: React.FC<PanelResizerProps> = ({
  id,
  label,
  onResize,
  onResizeStart,
  onResizeEnd,
  onReset,
  onStepChange,
  disabled = false,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const startXRef = useRef<number>(0);
  const onResizeRef = useRef(onResize);
  const onResizeEndRef = useRef(onResizeEnd);

  // Keep refs fresh so event listeners always call latest handlers
  useEffect(() => {
    onResizeRef.current = onResize;
    onResizeEndRef.current = onResizeEnd;
  });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(true);
      startXRef.current = e.clientX;
      onResizeStart?.();

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startXRef.current;
        onResizeRef.current(delta, moveEvent.clientX);
      };

      const handlePointerUp = () => {
        setIsDragging(false);
        try {
          document.body.style.removeProperty('cursor');
          document.body.style.removeProperty('user-select');
        } catch {
          // ignore
        }
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
        onResizeEndRef.current?.();
      };

      try {
        document.body.style.setProperty('cursor', 'col-resize', 'important');
        document.body.style.setProperty('user-select', 'none', 'important');
      } catch {
        // ignore
      }

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
    },
    [disabled, onResizeStart]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onStepChange?.(-10);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onStepChange?.(10);
      } else if (e.key === 'Enter' || e.key === 'Home') {
        e.preventDefault();
        onReset?.();
      }
    },
    [disabled, onStepChange, onReset]
  );

  if (disabled) return null;

  return (
    <div
      id={id}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      tabIndex={0}
      title={`${label} — Drag to adjust width. Double-click to reset.`}
      onPointerDown={handlePointerDown}
      onDoubleClick={onReset}
      onKeyDown={handleKeyDown}
      className={`
        hidden md:flex
        relative w-1.5 -ml-[3px] -mr-[3px] h-full
        cursor-col-resize select-none z-30
        items-center justify-center
        transition-colors duration-100 group
        ${isDragging ? 'bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-transparent hover:bg-amber-500/40'}
        ${className}
      `}
    >
      {/* Visual hairline divider */}
      <div
        className={`
          w-px h-full pointer-events-none transition-colors duration-100
          ${isDragging ? 'bg-amber-400' : 'bg-stone-800 group-hover:bg-amber-400/80'}
        `}
      />

      {/* Center grip handle indicator */}
      <div
        className={`
          absolute top-1/2 -translate-y-1/2 w-1 h-7 rounded-full
          pointer-events-none transition-all duration-150
          ${
            isDragging
              ? 'bg-amber-300 opacity-100 scale-y-110 shadow-sm'
              : 'bg-stone-600 opacity-0 group-hover:opacity-100 group-hover:bg-amber-400/90'
          }
        `}
      />
    </div>
  );
};
