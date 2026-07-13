import { Plus } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';

import type { QuestionType } from '../../shared/document/model';
import { questionTypeLabels } from './section-editor-state';

export function QuestionAddMenu({
  questionTypes,
  onAdd,
}: {
  questionTypes: QuestionType[];
  onAdd(type: QuestionType): void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const closeMenu = useCallback((restoreFocus: boolean) => {
    setOpen(false);

    if (restoreFocus) {
      requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuWidth = menuRef.current?.offsetWidth ?? 172;
    const menuHeight = menuRef.current?.offsetHeight ?? 190;
    const left = Math.min(
      Math.max(8, triggerRect.left),
      Math.max(8, window.innerWidth - menuWidth - 8),
    );
    const belowTop = triggerRect.bottom + 4;
    const top =
      belowTop + menuHeight <= window.innerHeight - 8
        ? belowTop
        : Math.max(8, triggerRect.top - menuHeight - 4);

    setPosition({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;

    updatePosition();
    const frame = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(frame);
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const frame = requestAnimationFrame(() => itemRefs.current[0]?.focus());
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        closeMenu(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [closeMenu, open, updatePosition]);

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
      return;
    }

    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;

    event.preventDefault();
    const items = itemRefs.current.filter(
      (item): item is HTMLButtonElement => item !== null && !item.disabled,
    );
    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
    let nextIndex = currentIndex < 0 ? 0 : currentIndex;

    if (event.key === 'ArrowDown') nextIndex = (nextIndex + 1) % items.length;
    else if (event.key === 'ArrowUp') nextIndex = (nextIndex - 1 + items.length) % items.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = items.length - 1;

    items[nextIndex]?.focus();
  }

  return (
    <div ref={rootRef} className="question-add-menu-root">
      <button
        ref={triggerRef}
        type="button"
        className="tool-button question-add-menu-trigger"
        aria-label="添加题目"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <Plus aria-hidden="true" size={16} />
        <span>添加题目</span>
      </button>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              className="question-add-menu"
              role="menu"
              aria-label="选择题型"
              style={position}
              onKeyDown={handleMenuKeyDown}
            >
              {questionTypes.map((questionType, index) => (
                <button
                  key={questionType}
                  ref={(element) => {
                    itemRefs.current[index] = element;
                  }}
                  type="button"
                  className="question-add-menu-item"
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => {
                    onAdd(questionType);
                    closeMenu(false);
                  }}
                >
                  <Plus aria-hidden="true" size={15} />
                  <span>{questionTypeLabels[questionType]}</span>
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
