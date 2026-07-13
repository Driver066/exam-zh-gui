import { useState } from 'react';

import {
  expandRepeatableItem,
  isRepeatableItemCollapsed,
  removeRepeatableItemState,
  toggleAllRepeatableItems,
  toggleRepeatableItem,
} from './repeatable-editor-state';

export function useCollapsedRepeatableItems(itemIds: string[]) {
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<string>>(() => new Set());
  const allCollapsed = itemIds.length > 0 && itemIds.every((itemId) => collapsedIds.has(itemId));

  return {
    allCollapsed,
    isCollapsed(itemId: string): boolean {
      return isRepeatableItemCollapsed(collapsedIds, itemId);
    },
    toggle(itemId: string): void {
      setCollapsedIds((current) => toggleRepeatableItem(current, itemId));
    },
    toggleAll(): void {
      setCollapsedIds((current) => toggleAllRepeatableItems(current, itemIds));
    },
    expand(itemId: string): void {
      setCollapsedIds((current) => expandRepeatableItem(current, itemId));
    },
    remove(itemId: string): void {
      setCollapsedIds((current) => removeRepeatableItemState(current, itemId));
    },
  };
}
