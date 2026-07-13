import type { PdfExportVariant } from '../../shared/ipc/contracts';

export type FocusedPdfViewMode = PdfExportVariant | 'compare';

export interface PdfReaderPosition {
  currentPage: number;
  scrollTop: number;
}

export type PdfReaderPositions = Record<PdfExportVariant, PdfReaderPosition>;

export interface PdfPageVisibility {
  pageNumber: number;
  visibleArea: number;
  topDistance: number;
}

export type FocusedPdfKeyboardAction = 'previous-page' | 'next-page';

export interface FocusedPdfKeyboardEventLike {
  key: string;
  defaultPrevented?: boolean;
  isComposing?: boolean;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  targetTagName?: string;
  targetContentEditable?: boolean;
}

export function createPdfReaderPositions(): PdfReaderPositions {
  return {
    student: { currentPage: 1, scrollTop: 0 },
    teacher: { currentPage: 1, scrollTop: 0 },
  };
}

export function updatePdfReaderPosition(
  positions: PdfReaderPositions,
  variant: PdfExportVariant,
  update: Partial<PdfReaderPosition>,
): PdfReaderPositions {
  return {
    ...positions,
    [variant]: {
      ...positions[variant],
      ...update,
    },
  };
}

export function resolveFocusedPdfViewMode({
  requested,
  availableVariants,
  fallbackVariant,
}: {
  requested: FocusedPdfViewMode;
  availableVariants: PdfExportVariant[];
  fallbackVariant?: PdfExportVariant | null;
}): FocusedPdfViewMode {
  const available = new Set(availableVariants);
  const canCompare = available.has('student') && available.has('teacher');

  if (requested === 'compare') {
    if (canCompare) return requested;
  } else if (available.has(requested)) {
    return requested;
  }

  if (fallbackVariant && available.has(fallbackVariant)) return fallbackVariant;
  if (available.has('student')) return 'student';
  if (available.has('teacher')) return 'teacher';
  return fallbackVariant ?? 'student';
}

export function normalizePdfPageInput(value: string, pageCount: number): number | null {
  const trimmed = value.trim();
  if (!trimmed || pageCount < 1 || !/^\d+$/.test(trimmed)) return null;

  const pageNumber = Number(trimmed);
  if (!Number.isSafeInteger(pageNumber)) return null;
  return Math.max(1, Math.min(pageNumber, pageCount));
}

export function getAdjacentPdfPage(
  currentPage: number,
  pageCount: number,
  direction: 'previous' | 'next',
): number {
  if (pageCount < 1) return 1;
  const offset = direction === 'previous' ? -1 : 1;
  return Math.max(1, Math.min(currentPage + offset, pageCount));
}

export function selectMostVisiblePdfPage(pages: PdfPageVisibility[], fallbackPage: number): number {
  const visible = pages.filter((page) => page.visibleArea > 0);
  if (visible.length === 0) return fallbackPage;

  return visible.reduce((best, page) => {
    if (page.visibleArea > best.visibleArea) return page;
    if (page.visibleArea < best.visibleArea) return best;
    return page.topDistance < best.topDistance ? page : best;
  }).pageNumber;
}

export function getFocusedPdfKeyboardAction(
  event: FocusedPdfKeyboardEventLike,
): FocusedPdfKeyboardAction | null {
  if (
    event.defaultPrevented ||
    event.isComposing ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    event.shiftKey ||
    event.targetContentEditable
  ) {
    return null;
  }

  const tagName = event.targetTagName?.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return null;
  }

  if (event.key === 'PageUp') return 'previous-page';
  if (event.key === 'PageDown') return 'next-page';
  return null;
}
