import {
  useCallback,
  cloneElement,
  useEffect,
  useId,
  isValidElement,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

interface TooltipAnchorProps {
  text: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

interface TooltipPosition {
  top: number;
  left: number;
}

export function TooltipAnchor({ text, children, className, disabled = false }: TooltipAnchorProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const generatedTooltipId = useId();
  const tooltipId = `tooltip-${generatedTooltipId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({ top: 0, left: 0 });
  const describedBy = visible && !disabled ? tooltipId : undefined;
  const describedChild = isValidElement<{ 'aria-describedby'?: string }>(children)
    ? cloneElement(children, {
        'aria-describedby': describedBy
          ? [children.props['aria-describedby'], describedBy].filter(Boolean).join(' ')
          : children.props['aria-describedby'],
      })
    : children;

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;

    if (!anchor) {
      return;
    }

    const anchorRect = anchor.getBoundingClientRect();
    const tooltipWidth = Math.min(tooltipRef.current?.offsetWidth ?? 320, window.innerWidth - 24);
    const tooltipHeight = tooltipRef.current?.offsetHeight ?? 44;
    const maxLeft = Math.max(12, window.innerWidth - tooltipWidth - 12);
    const preferredLeft = anchorRect.left + anchorRect.width / 2 - tooltipWidth / 2;
    const left = Math.min(Math.max(12, preferredLeft), maxLeft);
    const preferredTop = anchorRect.top - tooltipHeight - 8;
    const top = preferredTop >= 8 ? preferredTop : anchorRect.bottom + 8;

    setPosition({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!visible) {
      return;
    }

    updatePosition();
    const frame = requestAnimationFrame(updatePosition);

    return () => cancelAnimationFrame(frame);
  }, [text, updatePosition, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [updatePosition, visible]);

  return (
    <span
      ref={anchorRef}
      className={`tooltip-anchor ${className ?? ''}`}
      onBlur={() => setVisible(false)}
      onFocus={() => {
        if (!disabled) {
          setVisible(true);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && visible) {
          event.preventDefault();
          setVisible(false);
        }
      }}
      onMouseEnter={() => {
        if (!disabled) {
          setVisible(true);
        }
      }}
      onMouseLeave={() => setVisible(false)}
    >
      {describedChild}
      {visible && !disabled
        ? createPortal(
            <div
              ref={tooltipRef}
              id={tooltipId}
              className="floating-tooltip"
              role="tooltip"
              style={{ left: position.left, top: position.top }}
            >
              {text}
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}
