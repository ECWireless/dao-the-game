import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';

type PointerState = {
  pointerId: number;
  startX: number;
  startY: number;
  startScrollLeft: number;
  startScrollTop: number;
};

export function usePannableViewport(onInitialLayout?: (viewport: HTMLDivElement) => void) {
  const [isDragging, setIsDragging] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const hasInitializedRef = useRef(false);
  const dragRef = useRef<PointerState | null>(null);

  useEffect(() => {
    if (hasInitializedRef.current || !onInitialLayout || !viewportRef.current) {
      return;
    }

    const viewport = viewportRef.current;
    const frame = window.requestAnimationFrame(() => {
      onInitialLayout(viewport);
      hasInitializedRef.current = true;
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [onInitialLayout]);

  const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;

    if (target.closest('[data-pan-block="true"], button, input, textarea, label') || !viewportRef.current) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: viewportRef.current.scrollLeft,
      startScrollTop: viewportRef.current.scrollTop
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId || !viewportRef.current) {
      return;
    }

    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;
    viewportRef.current.scrollLeft = dragRef.current.startScrollLeft - deltaX;
    viewportRef.current.scrollTop = dragRef.current.startScrollTop - deltaY;
  }, []);

  const handlePointerEnd = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) {
      return;
    }

    dragRef.current = null;
    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const focusViewportOnPoint = useCallback((x: number, y: number, behavior: ScrollBehavior = 'smooth') => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const desiredLeft = x - viewport.clientWidth * 0.48;
    const desiredTop = y - viewport.clientHeight * 0.34;
    const maxLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const maxTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight);

    viewport.scrollTo({
      left: Math.max(0, Math.min(desiredLeft, maxLeft)),
      top: Math.max(0, Math.min(desiredTop, maxTop)),
      behavior
    });
  }, []);

  return {
    viewportRef,
    isDragging,
    focusViewportOnPoint,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd
  };
}
