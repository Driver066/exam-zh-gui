import {
  ArrowDown,
  ArrowUp,
  Copy,
  MoreHorizontal,
  Trash2,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { createPortal } from 'react-dom';

import { useDeleteConfirmation } from './delete-confirmation-context';
import { TooltipAnchor } from './TooltipAnchor';

export function QuestionActionsMenu({
  questionId,
  canMoveUp,
  canMoveDown,
  onMove,
  onDuplicate,
  onDelete,
  onDeleteFocus,
}: {
  questionId: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove(direction: 'up' | 'down'): void;
  onDuplicate(): void;
  onDelete(): void;
  onDeleteFocus?(): void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const generatedMenuId = useId();
  const menuId = `question-menu-${generatedMenuId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const deleteKey = `question:${questionId}`;
  const { armedKey, requestDelete, cancelDelete } = useDeleteConfirmation();
  const deleteArmed = armedKey === deleteKey;

  const closeMenu = useCallback(
    (restoreFocus: boolean) => {
      setOpen(false);
      if (deleteArmed) cancelDelete();

      if (restoreFocus) {
        requestAnimationFrame(() => triggerRef.current?.focus());
      }
    },
    [cancelDelete, deleteArmed],
  );

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuWidth = menuRef.current?.offsetWidth ?? 178;
    const menuHeight = menuRef.current?.offsetHeight ?? 205;
    const left = Math.min(
      Math.max(8, triggerRect.right - menuWidth),
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

    const frame = requestAnimationFrame(() =>
      itemRefs.current.find((item) => item && !item.disabled)?.focus(),
    );
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

  function run(action: () => void): void {
    action();
    closeMenu(true);
  }

  return (
    <div ref={rootRef} className="question-actions-menu-root">
      <TooltipAnchor text="题目操作" disabled={open}>
        <button
          ref={triggerRef}
          type="button"
          className="question-actions-menu-trigger"
          aria-label="题目操作"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={(event) => {
            if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
              event.preventDefault();
              setOpen(true);
            }
          }}
        >
          <MoreHorizontal aria-hidden="true" size={17} />
        </button>
      </TooltipAnchor>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              className="question-actions-menu"
              role="menu"
              aria-label="题目操作"
              style={position}
              onKeyDown={handleMenuKeyDown}
            >
              <MenuItem
                ref={(element) => {
                  itemRefs.current[0] = element;
                }}
                icon={ArrowUp}
                label="上移一题"
                disabled={!canMoveUp}
                onClick={() => run(() => onMove('up'))}
              />
              <MenuItem
                ref={(element) => {
                  itemRefs.current[1] = element;
                }}
                icon={ArrowDown}
                label="下移一题"
                disabled={!canMoveDown}
                onClick={() => run(() => onMove('down'))}
              />
              <div className="question-actions-menu-separator" role="separator" />
              <MenuItem
                ref={(element) => {
                  itemRefs.current[2] = element;
                }}
                icon={Copy}
                label="复制题目"
                onClick={() => run(onDuplicate)}
              />
              <div className="question-actions-menu-separator" role="separator" />
              <MenuItem
                ref={(element) => {
                  itemRefs.current[3] = element;
                }}
                icon={deleteArmed ? TriangleAlert : Trash2}
                label={deleteArmed ? '再次点击删除题目' : '删除题目'}
                danger
                deleteKey={deleteKey}
                onPointerDown={(event) => {
                  event.stopPropagation();

                  if (deleteArmed) {
                    event.preventDefault();
                    const confirmed = requestDelete(deleteKey, () => {
                      onDelete();
                      requestAnimationFrame(() => onDeleteFocus?.());
                    });
                    if (confirmed) closeMenu(false);
                  }
                }}
                onClick={() => {
                  const confirmed = requestDelete(deleteKey, () => {
                    onDelete();
                    requestAnimationFrame(() => onDeleteFocus?.());
                  });
                  if (confirmed) closeMenu(false);
                }}
              />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

const MenuItem = forwardRef<
  HTMLButtonElement,
  {
    icon: LucideIcon;
    label: string;
    disabled?: boolean;
    danger?: boolean;
    deleteKey?: string;
    onPointerDown?(event: ReactPointerEvent<HTMLButtonElement>): void;
    onClick(): void;
  }
>(function MenuItem(
  { icon: Icon, label, disabled = false, danger = false, deleteKey, onPointerDown, onClick },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`question-actions-menu-item ${danger ? 'question-actions-menu-item-danger' : ''}`}
      role="menuitem"
      tabIndex={-1}
      disabled={disabled}
      data-delete-confirmation-key={deleteKey}
      onPointerDown={onPointerDown ?? (deleteKey ? (event) => event.stopPropagation() : undefined)}
      onClick={onClick}
    >
      <Icon aria-hidden="true" size={15} />
      <span>{label}</span>
    </button>
  );
});
