import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { TooltipAnchor } from './TooltipAnchor';

export function ChoiceLabelButton({
  displayLabel,
  storedLabel,
  editable,
  readOnlyHint,
  onApply,
}: {
  displayLabel: string;
  storedLabel: string;
  editable: boolean;
  readOnlyHint: string;
  onApply(value: string): void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(storedLabel);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const close = useCallback(
    (restoreFocus: boolean) => {
      setOpen(false);
      setDraft(storedLabel);
      if (restoreFocus) requestAnimationFrame(() => buttonRef.current?.focus());
    },
    [storedLabel],
  );

  const updatePosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const width = popoverRef.current?.offsetWidth ?? 230;
    const height = popoverRef.current?.offsetHeight ?? 120;
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
    const below = rect.bottom + 4;
    const top =
      below + height <= window.innerHeight - 8 ? below : Math.max(8, rect.top - height - 4);
    setPosition({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const frame = requestAnimationFrame(() => {
      updatePosition();
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => cancelAnimationFrame(frame);
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !popoverRef.current?.contains(target)) close(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [close, open, updatePosition]);

  const apply = () => {
    const nextLabel = draft.trim();
    if (!nextLabel) return;
    onApply(nextLabel);
    setOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  };

  const button = (
    <button
      ref={buttonRef}
      type="button"
      className={`choice-label-button ${!editable ? 'choice-label-button-readonly' : ''}`}
      aria-label={editable ? `编辑选项标签 ${displayLabel}` : readOnlyHint}
      aria-haspopup={editable ? 'dialog' : undefined}
      aria-expanded={editable ? open : undefined}
      aria-disabled={!editable || undefined}
      onClick={() => {
        if (!editable) return;
        setDraft(storedLabel);
        setOpen((current) => !current);
      }}
    >
      {displayLabel}
    </button>
  );

  return (
    <div ref={rootRef} className="choice-label-button-root">
      {editable ? button : <TooltipAnchor text={readOnlyHint}>{button}</TooltipAnchor>}
      {open
        ? createPortal(
            <div
              ref={popoverRef}
              className="choice-label-popover"
              role="dialog"
              aria-label={`编辑选项标签 ${displayLabel}`}
              style={position}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  close(true);
                } else if (event.key === 'Enter') {
                  event.preventDefault();
                  apply();
                }
              }}
            >
              <label className="field">
                <span>选项标签</span>
                <input
                  ref={inputRef}
                  value={draft}
                  aria-invalid={draft.trim().length === 0 || undefined}
                  onChange={(event) => setDraft(event.target.value)}
                />
              </label>
              {draft.trim().length === 0 ? (
                <span className="field-warning">标签不能为空。</span>
              ) : null}
              <div className="choice-label-popover-actions">
                <button type="button" className="mini-button" onClick={() => close(true)}>
                  取消
                </button>
                <button
                  type="button"
                  className="mini-button mini-button-primary"
                  disabled={draft.trim().length === 0}
                  onClick={apply}
                >
                  应用
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
