import type { ExamDocument } from '../../shared/document';

export type LeftWorkbenchMode = 'navigation' | 'settings';
export type DocumentSettingsGroup = 'basic' | 'frontMatter' | 'questionDefaults' | 'pageOutput';

export interface SectionMenuAvailability {
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export function getSectionMenuAvailability(
  sectionIndex: number,
  sectionCount: number,
): SectionMenuAvailability {
  return {
    canMoveUp: sectionIndex > 0 && sectionIndex < sectionCount,
    canMoveDown: sectionIndex >= 0 && sectionIndex < sectionCount - 1,
  };
}

export function resolveSectionSelectionAfterDelete(
  document: ExamDocument,
  sectionId: string,
  selectedSectionId: string | null,
): string | null {
  if (sectionId !== selectedSectionId) {
    return selectedSectionId;
  }

  const index = document.sections.findIndex((section) => section.id === sectionId);

  if (index === -1) {
    return selectedSectionId;
  }

  return document.sections[index + 1]?.id ?? document.sections[index - 1]?.id ?? null;
}

export function toggleCollapsedSectionId(
  collapsedIds: ReadonlySet<string>,
  sectionId: string,
): Set<string> {
  const next = new Set(collapsedIds);

  if (next.has(sectionId)) {
    next.delete(sectionId);
  } else {
    next.add(sectionId);
  }

  return next;
}

export function expandSectionId(collapsedIds: ReadonlySet<string>, sectionId: string): Set<string> {
  const next = new Set(collapsedIds);
  next.delete(sectionId);
  return next;
}
