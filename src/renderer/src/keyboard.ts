export type GlobalKeyboardShortcutAction = 'newDocument' | 'openDocument' | 'save' | 'saveAs';

export type SingleLineInputKeyAction = 'commit' | 'cancel';
export type RichContentInputKeyAction = 'commit' | 'cancel';

export interface KeyboardEventLike {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  isComposing?: boolean;
  defaultPrevented?: boolean;
}

export function getGlobalKeyboardShortcutAction(
  event: KeyboardEventLike,
): GlobalKeyboardShortcutAction | null {
  if (event.defaultPrevented || event.isComposing || event.altKey) {
    return null;
  }

  const hasPrimaryModifier = Boolean(event.metaKey || event.ctrlKey);

  if (!hasPrimaryModifier) {
    return null;
  }

  const key = event.key.toLowerCase();

  if (key === 's') {
    return event.shiftKey ? 'saveAs' : 'save';
  }

  if (!event.shiftKey && key === 'o') {
    return 'openDocument';
  }

  if (!event.shiftKey && key === 'n') {
    return 'newDocument';
  }

  return null;
}

export function getSingleLineInputKeyAction(
  event: KeyboardEventLike,
): SingleLineInputKeyAction | null {
  if (event.defaultPrevented || event.isComposing) {
    return null;
  }

  if (event.key === 'Enter') {
    return 'commit';
  }

  if (event.key === 'Escape') {
    return 'cancel';
  }

  return null;
}

export function getRichContentInputKeyAction(
  event: KeyboardEventLike,
): RichContentInputKeyAction | null {
  if (event.defaultPrevented || event.isComposing) {
    return null;
  }

  if (event.key === 'Escape') {
    return 'cancel';
  }

  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    return 'commit';
  }

  return null;
}
