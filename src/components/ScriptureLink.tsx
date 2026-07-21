'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ScriptureRef } from '@/atlas/types';
import { formatScriptureRef } from '@/atlas/search';
import { logosUrl } from '@/lib/bible-links';
import { chapterContext } from '@/lib/chapter-context';

interface ScriptureLinkProps {
  reference: ScriptureRef;
  /** Extra classes, e.g. to size the link differently in the person modal. */
  className?: string;
}

/** Delay before the hover summary appears, per the brief — about half a second. */
const HOVER_DELAY = 500;
const TIP_WIDTH = 260;

interface TipState {
  x: number;
  y: number;
}

/**
 * A scripture reference that opens in Logos, with a chapter summary on hover.
 *
 * The reference itself is a plain link — click it and Logos opens at the passage
 * (the desktop or mobile app if installed, otherwise the Logos web reader). Rest
 * on it for half a second and a small card appears by the cursor summarising what
 * happens in the chapter and which places it names. The card is rendered through a
 * portal so the panel's own scroll clipping can never cut it off, and it also
 * shows on keyboard focus so it is not a mouse-only affordance.
 */
export function ScriptureLink({ reference, className }: ScriptureLinkProps) {
  const [tip, setTip] = useState<TipState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const place = useCallback((clientX: number, clientY: number): TipState => {
    // Prefer down-and-right of the cursor; flip when it would leave the viewport.
    const x = clientX + 14 + TIP_WIDTH > window.innerWidth ? clientX - 14 - TIP_WIDTH : clientX + 14;
    const y = clientY + 18 > window.innerHeight - 140 ? Math.max(12, clientY - 18) : clientY + 18;
    return { x: Math.max(12, x), y };
  }, []);

  const scheduleFromMouse = useCallback(
    (event: React.MouseEvent) => {
      const { clientX, clientY } = event;
      clearTimer();
      timer.current = setTimeout(() => setTip(place(clientX, clientY)), HOVER_DELAY);
    },
    [clearTimer, place],
  );

  const moveWhileOpen = useCallback(
    (event: React.MouseEvent) => {
      if (tip) setTip(place(event.clientX, event.clientY));
    },
    [tip, place],
  );

  const hide = useCallback(() => {
    clearTimer();
    setTip(null);
  }, [clearTimer]);

  const showFromFocus = useCallback(
    (event: React.FocusEvent<HTMLAnchorElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      setTip(place(rect.left, rect.bottom));
    },
    [place],
  );

  const context = tip ? chapterContext(reference) : null;

  return (
    <>
      <a
        className={`scripture-link${className ? ` ${className}` : ''}`}
        href={logosUrl(reference)}
        target="_blank"
        rel="noreferrer"
        onMouseEnter={scheduleFromMouse}
        onMouseMove={moveWhileOpen}
        onMouseLeave={hide}
        onFocus={showFromFocus}
        onBlur={hide}
        onClick={hide}
      >
        {formatScriptureRef(reference)}
      </a>

      {tip &&
        context &&
        createPortal(
          <div className="scripture-tip" role="tooltip" style={{ left: tip.x, top: tip.y, width: TIP_WIDTH }}>
            <p className="scripture-tip__ref">{context.reference}</p>
            {context.summary && <p className="scripture-tip__summary">{context.summary}</p>}
            {context.places.length > 0 && (
              <p className="scripture-tip__places">
                <span className="scripture-tip__label">Places named</span> {context.places.join(', ')}
                {context.moreCount > 0 ? `, +${context.moreCount} more` : ''}
              </p>
            )}
            {context.setting && <p className="scripture-tip__setting">{context.setting}</p>}
            <p className="scripture-tip__cta">Open in Logos ↗</p>
          </div>,
          document.body,
        )}
    </>
  );
}
