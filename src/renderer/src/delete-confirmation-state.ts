export const DELETE_CONFIRMATION_TIMEOUT_MS = 4_000;

export interface DeleteConfirmationState {
  key: string | null;
  expiresAt: number | null;
}

export const emptyDeleteConfirmationState: DeleteConfirmationState = {
  key: null,
  expiresAt: null,
};

export function requestDeleteConfirmation(
  state: DeleteConfirmationState,
  key: string,
  now: number,
  timeoutMs = DELETE_CONFIRMATION_TIMEOUT_MS,
): { state: DeleteConfirmationState; confirmed: boolean } {
  if (state.key === key && state.expiresAt !== null && state.expiresAt >= now) {
    return { state: emptyDeleteConfirmationState, confirmed: true };
  }

  return {
    state: { key, expiresAt: now + timeoutMs },
    confirmed: false,
  };
}

export function cancelDeleteConfirmation(): DeleteConfirmationState {
  return emptyDeleteConfirmationState;
}
