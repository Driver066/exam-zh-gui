export function isRepeatableItemCollapsed(
  collapsedIds: ReadonlySet<string>,
  itemId: string,
): boolean {
  return collapsedIds.has(itemId);
}

export function toggleRepeatableItem(
  collapsedIds: ReadonlySet<string>,
  itemId: string,
): ReadonlySet<string> {
  const next = new Set(collapsedIds);
  if (next.has(itemId)) next.delete(itemId);
  else next.add(itemId);
  return next;
}

export function toggleAllRepeatableItems(
  collapsedIds: ReadonlySet<string>,
  itemIds: string[],
): ReadonlySet<string> {
  const allCollapsed = itemIds.length > 0 && itemIds.every((itemId) => collapsedIds.has(itemId));
  return allCollapsed ? new Set() : new Set(itemIds);
}

export function expandRepeatableItem(
  collapsedIds: ReadonlySet<string>,
  itemId: string,
): ReadonlySet<string> {
  const next = new Set(collapsedIds);
  next.delete(itemId);
  return next;
}

export function removeRepeatableItemState(
  collapsedIds: ReadonlySet<string>,
  itemId: string,
): ReadonlySet<string> {
  const next = new Set(collapsedIds);
  next.delete(itemId);
  return next;
}

export function getRepeatableDeleteFocusTarget(
  itemIds: readonly string[],
  deletedId: string,
): string | null {
  const deletedIndex = itemIds.indexOf(deletedId);
  if (deletedIndex < 0) return null;
  return itemIds[deletedIndex + 1] ?? itemIds[deletedIndex - 1] ?? null;
}
