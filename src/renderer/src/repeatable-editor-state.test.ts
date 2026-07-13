import { describe, expect, it } from 'vitest';

import {
  expandRepeatableItem,
  getRepeatableDeleteFocusTarget,
  isRepeatableItemCollapsed,
  removeRepeatableItemState,
  toggleAllRepeatableItems,
  toggleRepeatableItem,
} from './repeatable-editor-state';

describe('repeatable editor state', () => {
  it('toggles items independently and can collapse or expand all', () => {
    let collapsed: ReadonlySet<string> = new Set();
    collapsed = toggleRepeatableItem(collapsed, 'a');
    expect(isRepeatableItemCollapsed(collapsed, 'a')).toBe(true);
    expect(isRepeatableItemCollapsed(collapsed, 'b')).toBe(false);

    collapsed = toggleAllRepeatableItems(collapsed, ['a', 'b']);
    expect([...collapsed]).toEqual(['a', 'b']);
    collapsed = toggleAllRepeatableItems(collapsed, ['a', 'b']);
    expect([...collapsed]).toEqual([]);
  });

  it('expands new or duplicated items and clears deleted item state', () => {
    const collapsed = new Set(['a', 'b']);
    expect([...expandRepeatableItem(collapsed, 'a')]).toEqual(['b']);
    expect([...removeRepeatableItemState(collapsed, 'b')]).toEqual(['a']);
  });

  it('prefers the next item after deletion, then the previous item, then the group fallback', () => {
    expect(getRepeatableDeleteFocusTarget(['a', 'b', 'c'], 'b')).toBe('c');
    expect(getRepeatableDeleteFocusTarget(['a', 'b'], 'b')).toBe('a');
    expect(getRepeatableDeleteFocusTarget(['a'], 'a')).toBeNull();
    expect(getRepeatableDeleteFocusTarget(['a'], 'missing')).toBeNull();
  });
});
