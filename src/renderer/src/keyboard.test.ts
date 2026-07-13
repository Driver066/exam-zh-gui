import { describe, expect, it } from 'vitest';

import {
  getGlobalKeyboardShortcutAction,
  getRichContentInputKeyAction,
  getSingleLineInputKeyAction,
} from './keyboard';

describe('keyboard helpers', () => {
  it('maps file-level global shortcuts', () => {
    expect(getGlobalKeyboardShortcutAction({ key: 's', metaKey: true })).toBe('save');
    expect(getGlobalKeyboardShortcutAction({ key: 'S', ctrlKey: true })).toBe('save');
    expect(getGlobalKeyboardShortcutAction({ key: 's', metaKey: true, shiftKey: true })).toBe(
      'saveAs',
    );
    expect(getGlobalKeyboardShortcutAction({ key: 'o', ctrlKey: true })).toBe('openDocument');
    expect(getGlobalKeyboardShortcutAction({ key: 'n', metaKey: true })).toBe('newDocument');
  });

  it('ignores unsupported or unsafe global shortcuts', () => {
    expect(getGlobalKeyboardShortcutAction({ key: 'e', metaKey: true })).toBeNull();
    expect(getGlobalKeyboardShortcutAction({ key: 'o', metaKey: true, shiftKey: true })).toBeNull();
    expect(getGlobalKeyboardShortcutAction({ key: 's' })).toBeNull();
    expect(getGlobalKeyboardShortcutAction({ key: 's', metaKey: true, altKey: true })).toBeNull();
    expect(
      getGlobalKeyboardShortcutAction({ key: 's', metaKey: true, isComposing: true }),
    ).toBeNull();
  });

  it('maps single-line input keys', () => {
    expect(getSingleLineInputKeyAction({ key: 'Enter' })).toBe('commit');
    expect(getSingleLineInputKeyAction({ key: 'Escape' })).toBe('cancel');
    expect(getSingleLineInputKeyAction({ key: 'a' })).toBeNull();
    expect(getSingleLineInputKeyAction({ key: 'Enter', isComposing: true })).toBeNull();
  });

  it('maps rich content textarea keys', () => {
    expect(getRichContentInputKeyAction({ key: 'Enter', metaKey: true })).toBe('commit');
    expect(getRichContentInputKeyAction({ key: 'Enter', ctrlKey: true })).toBe('commit');
    expect(getRichContentInputKeyAction({ key: 'Escape' })).toBe('cancel');
    expect(getRichContentInputKeyAction({ key: 'Enter' })).toBeNull();
    expect(getRichContentInputKeyAction({ key: 'Escape', isComposing: true })).toBeNull();
  });
});
