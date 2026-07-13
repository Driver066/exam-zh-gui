import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Copy,
  MoreHorizontal,
  Plus,
  Trash2,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type Ref,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { TooltipAnchor } from './TooltipAnchor';
import { useDeleteConfirmation } from './delete-confirmation-context';

export function RepeatableEditorHeading({
  title,
  itemCount,
  allCollapsed,
  onToggleAll,
  addLabel,
  addButtonRef,
  onAdd,
}: {
  title: string;
  itemCount: number;
  allCollapsed: boolean;
  onToggleAll(): void;
  addLabel: string;
  addButtonRef?: Ref<HTMLButtonElement>;
  onAdd(): void;
}) {
  return (
    <div className="nested-heading repeatable-editor-heading">
      <span className="repeatable-editor-heading-copy">{title}</span>
      <div className="repeatable-editor-actions">
        <button
          type="button"
          className="mini-button repeatable-editor-toggle-all"
          disabled={itemCount === 0}
          onClick={onToggleAll}
        >
          {allCollapsed ? '全部展开' : '全部收起'}
        </button>
        <button
          ref={addButtonRef}
          type="button"
          className="mini-button repeatable-editor-add"
          onClick={onAdd}
        >
          <Plus aria-hidden="true" size={14} />
          {addLabel}
        </button>
      </div>
    </div>
  );
}

export function RepeatableItemHeader({
  identity,
  summary,
  status,
  collapsed,
  controlsId,
  itemLabel,
  onToggle,
  actions,
}: {
  identity: ReactNode;
  summary: ReactNode;
  status?: ReactNode;
  collapsed: boolean;
  controlsId: string;
  itemLabel: string;
  onToggle(): void;
  actions?: ReactNode;
}) {
  return (
    <div className="repeatable-item-header repeatable-item-header-shared">
      <button
        type="button"
        className="repeatable-item-disclosure"
        aria-label={`${collapsed ? '展开' : '收起'}${itemLabel}`}
        aria-expanded={!collapsed}
        aria-controls={controlsId}
        onClick={onToggle}
      >
        <CollapseToggleIcon collapsed={collapsed} />
      </button>
      <div className="repeatable-item-identity">{identity}</div>
      <button
        type="button"
        className="repeatable-item-summary-button"
        aria-label={`${collapsed ? '展开' : '收起'}${itemLabel}`}
        aria-expanded={!collapsed}
        aria-controls={controlsId}
        onClick={onToggle}
      >
        {summary}
      </button>
      {status ? <div className="repeatable-item-status">{status}</div> : null}
      {actions ? <div className="repeatable-item-actions">{actions}</div> : null}
    </div>
  );
}

function CollapseToggleIcon({ collapsed }: { collapsed: boolean }) {
  const Icon = collapsed ? ChevronRight : ChevronDown;
  return <Icon className="collapse-toggle-icon" aria-hidden="true" />;
}

export interface RepeatableMenuExtraItem {
  label: string;
  icon: LucideIcon;
  onSelect(): void;
  restoreFocus?: boolean;
}

export function RepeatableItemMenu({
  itemLabel,
  canMoveUp = false,
  canMoveDown = false,
  onMove,
  onDuplicate,
  extraItems = [],
  deleteKey,
  onDelete,
  onDeleteFocus,
}: {
  itemLabel: string;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMove?(direction: 'up' | 'down'): void;
  onDuplicate?(): void;
  extraItems?: RepeatableMenuExtraItem[];
  deleteKey: string;
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
  const menuId = `repeatable-menu-${generatedMenuId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const { armedKey, requestDelete } = useDeleteConfirmation();
  const deleteArmed = armedKey === deleteKey;
  const menuLabel = `${itemLabel} 操作`;

  const closeMenu = useCallback(
    (restoreFocus: boolean) => {
      setOpen(false);
      if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
    },
    [setOpen],
  );

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const width = menuRef.current?.offsetWidth ?? 190;
    const height = menuRef.current?.offsetHeight ?? 220;
    const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8);
    const below = rect.bottom + 4;
    const top =
      below + height <= window.innerHeight - 8 ? below : Math.max(8, rect.top - height - 4);
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

  const commands: Array<
    | { kind: 'separator'; key: string }
    | {
        kind: 'command';
        key: string;
        label: string;
        icon: LucideIcon;
        disabled?: boolean;
        danger?: boolean;
      }
  > = [];

  if (onMove) {
    commands.push(
      {
        kind: 'command',
        key: 'move-up',
        label: `上移${itemLabel}`,
        icon: ArrowUp,
        disabled: !canMoveUp,
      },
      {
        kind: 'command',
        key: 'move-down',
        label: `下移${itemLabel}`,
        icon: ArrowDown,
        disabled: !canMoveDown,
      },
      { kind: 'separator', key: 'move-separator' },
    );
  }

  extraItems.forEach((item, index) => {
    commands.push({
      kind: 'command',
      key: `extra-${index}`,
      label: item.label,
      icon: item.icon,
    });
  });

  if (onDuplicate) {
    commands.push({
      kind: 'command',
      key: 'duplicate',
      label: `复制${itemLabel}`,
      icon: Copy,
    });
  }

  if (extraItems.length > 0 || onDuplicate) {
    commands.push({ kind: 'separator', key: 'delete-separator' });
  }

  commands.push({
    kind: 'command',
    key: 'delete',
    label: deleteArmed ? `再次点击删除${itemLabel}` : `删除${itemLabel}`,
    icon: deleteArmed ? TriangleAlert : Trash2,
    danger: true,
  });

  function runCommand(commandKey: string): void {
    if (commandKey === 'move-up') onMove?.('up');
    else if (commandKey === 'move-down') onMove?.('down');
    else if (commandKey === 'duplicate') onDuplicate?.();
    else if (commandKey.startsWith('extra-')) {
      const index = Number(commandKey.slice('extra-'.length));
      const item = extraItems[index];
      item?.onSelect();
      closeMenu(item?.restoreFocus !== false);
      return;
    } else if (commandKey === 'delete') {
      const confirmed = requestDelete(deleteKey, () => {
        onDelete();
        requestAnimationFrame(() => onDeleteFocus?.());
      });
      if (confirmed) closeMenu(false);
      return;
    }

    closeMenu(true);
  }

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
    else nextIndex = items.length - 1;
    items[nextIndex]?.focus();
  }

  return (
    <div ref={rootRef} className="repeatable-item-menu-root">
      <TooltipAnchor text={menuLabel} disabled={open}>
        <button
          ref={triggerRef}
          type="button"
          className="repeatable-item-menu-trigger"
          aria-label={menuLabel}
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
          <MoreHorizontal aria-hidden="true" size={16} />
        </button>
      </TooltipAnchor>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              className="repeatable-item-menu"
              role="menu"
              aria-label={menuLabel}
              style={position}
              onKeyDown={handleMenuKeyDown}
            >
              {commands.map((command, index) => {
                if (command.kind === 'separator') {
                  return (
                    <div
                      key={command.key}
                      className="repeatable-item-menu-separator"
                      role="separator"
                    />
                  );
                }
                const Icon = command.icon;
                return (
                  <button
                    key={command.key}
                    ref={(element) => {
                      itemRefs.current[index] = element;
                    }}
                    type="button"
                    className={`repeatable-item-menu-item ${
                      command.danger ? 'repeatable-item-menu-item-danger' : ''
                    }`}
                    role="menuitem"
                    tabIndex={-1}
                    disabled={command.disabled}
                    data-delete-confirmation-key={command.key === 'delete' ? deleteKey : undefined}
                    onPointerDown={
                      command.key === 'delete'
                        ? (event) => {
                            event.stopPropagation();
                            if (deleteArmed) {
                              event.preventDefault();
                              const confirmed = requestDelete(deleteKey, () => {
                                onDelete();
                                requestAnimationFrame(() => onDeleteFocus?.());
                              });
                              if (confirmed) closeMenu(false);
                            }
                          }
                        : undefined
                    }
                    onClick={() => {
                      if (command.key === 'delete' && deleteArmed) return;
                      runCommand(command.key);
                    }}
                  >
                    <Icon aria-hidden="true" size={15} />
                    <span>{command.label}</span>
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
