import { describe, expect, it } from 'vitest';

import {
  cancelDeleteConfirmation,
  requestDeleteConfirmation,
  type DeleteConfirmationState,
} from './delete-confirmation-state';

describe('delete confirmation', () => {
  it('arms on first request and confirms the same target on second request', () => {
    const initial: DeleteConfirmationState = { key: null, expiresAt: null };
    const armed = requestDeleteConfirmation(initial, 'question:1', 1_000, 4_000);
    const confirmed = requestDeleteConfirmation(armed.state, 'question:1', 2_000, 4_000);

    expect(armed).toEqual({
      state: { key: 'question:1', expiresAt: 5_000 },
      confirmed: false,
    });
    expect(confirmed).toEqual({
      state: { key: null, expiresAt: null },
      confirmed: true,
    });
  });

  it('re-arms expired and different targets instead of confirming', () => {
    const armed: DeleteConfirmationState = { key: 'question:1', expiresAt: 5_000 };

    expect(requestDeleteConfirmation(armed, 'question:1', 5_001, 4_000)).toMatchObject({
      state: { key: 'question:1', expiresAt: 9_001 },
      confirmed: false,
    });
    expect(requestDeleteConfirmation(armed, 'blank:2', 2_000, 4_000)).toMatchObject({
      state: { key: 'blank:2', expiresAt: 6_000 },
      confirmed: false,
    });
  });

  it('cancels to an empty state', () => {
    expect(cancelDeleteConfirmation()).toEqual({ key: null, expiresAt: null });
  });
});
