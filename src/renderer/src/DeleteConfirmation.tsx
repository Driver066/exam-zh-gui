import { Trash2, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { TooltipAnchor } from './TooltipAnchor';
import { DeleteConfirmationContext, useDeleteConfirmation } from './delete-confirmation-context';
import {
  cancelDeleteConfirmation,
  emptyDeleteConfirmationState,
  requestDeleteConfirmation,
  type DeleteConfirmationState,
} from './delete-confirmation-state';

export function DeleteConfirmationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DeleteConfirmationState>(emptyDeleteConfirmationState);

  const updateState = useCallback((nextState: DeleteConfirmationState) => {
    setState(nextState);
  }, []);

  const cancelDelete = useCallback(() => {
    updateState(cancelDeleteConfirmation());
  }, [updateState]);

  const requestDelete = useCallback(
    (key: string, onConfirm: () => void): boolean => {
      const result = requestDeleteConfirmation(state, key, Date.now());
      updateState(result.state);

      if (result.confirmed) {
        onConfirm();
      }

      return result.confirmed;
    },
    [state, updateState],
  );

  useEffect(() => {
    if (state.key === null || state.expiresAt === null) {
      return;
    }

    const timeoutId = window.setTimeout(cancelDelete, Math.max(0, state.expiresAt - Date.now()));
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        cancelDelete();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      const matchesArmedTarget = event
        .composedPath()
        .some(
          (target) =>
            target instanceof Element &&
            target.getAttribute('data-delete-confirmation-key') === state.key,
        );

      if (!matchesArmedTarget) {
        cancelDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [cancelDelete, state.expiresAt, state.key]);

  const value = useMemo(
    () => ({ armedKey: state.key, requestDelete, cancelDelete }),
    [cancelDelete, requestDelete, state.key],
  );

  return (
    <DeleteConfirmationContext.Provider value={value}>
      {children}
    </DeleteConfirmationContext.Provider>
  );
}

export function ConfirmDeleteButton({
  deleteKey,
  label,
  className = 'icon-button',
  disabled = false,
  onConfirm,
}: {
  deleteKey: string;
  label: string;
  className?: string;
  disabled?: boolean;
  onConfirm(): void;
}) {
  const { armedKey, requestDelete } = useDeleteConfirmation();
  const armed = armedKey === deleteKey;
  const accessibleLabel = armed ? `再次点击删除${label}` : `删除${label}`;

  return (
    <TooltipAnchor text={accessibleLabel}>
      <button
        type="button"
        className={`${className} ${armed ? 'delete-confirmation-armed' : ''}`}
        aria-label={accessibleLabel}
        aria-pressed={armed}
        data-delete-confirmation-key={deleteKey}
        disabled={disabled}
        onPointerDown={(event) => {
          event.stopPropagation();

          if (armed) {
            event.preventDefault();
            requestDelete(deleteKey, onConfirm);
          }
        }}
        onClick={() => {
          if (!armed) requestDelete(deleteKey, onConfirm);
        }}
      >
        {armed ? (
          <TriangleAlert aria-hidden="true" size={15} />
        ) : (
          <Trash2 aria-hidden="true" size={15} />
        )}
      </button>
    </TooltipAnchor>
  );
}
