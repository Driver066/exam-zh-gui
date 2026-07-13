import { createContext, useContext } from 'react';

export interface DeleteConfirmationContextValue {
  armedKey: string | null;
  requestDelete(key: string, onConfirm: () => void): boolean;
  cancelDelete(): void;
}

export const DeleteConfirmationContext = createContext<DeleteConfirmationContextValue>({
  armedKey: null,
  requestDelete: (_key, onConfirm) => {
    onConfirm();
    return true;
  },
  cancelDelete: () => undefined,
});

export function useDeleteConfirmation(): DeleteConfirmationContextValue {
  return useContext(DeleteConfirmationContext);
}
