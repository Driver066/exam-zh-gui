import { describe, expect, it } from 'vitest';

import {
  createPdfReaderPositions,
  getAdjacentPdfPage,
  getFocusedPdfKeyboardAction,
  normalizePdfPageInput,
  resolveFocusedPdfViewMode,
  selectMostVisiblePdfPage,
  updatePdfReaderPosition,
} from './pdf-reader-state';

describe('pdf reader state', () => {
  it('resolves focused view modes against available artifacts', () => {
    expect(
      resolveFocusedPdfViewMode({
        requested: 'compare',
        availableVariants: ['student', 'teacher'],
      }),
    ).toBe('compare');
    expect(
      resolveFocusedPdfViewMode({
        requested: 'compare',
        availableVariants: ['teacher'],
        fallbackVariant: 'teacher',
      }),
    ).toBe('teacher');
    expect(
      resolveFocusedPdfViewMode({
        requested: 'teacher',
        availableVariants: ['student'],
      }),
    ).toBe('student');
  });

  it('keeps student and teacher positions independent', () => {
    const initial = createPdfReaderPositions();
    const studentUpdated = updatePdfReaderPosition(initial, 'student', {
      currentPage: 3,
      scrollTop: 640,
    });
    const teacherUpdated = updatePdfReaderPosition(studentUpdated, 'teacher', {
      currentPage: 5,
      scrollTop: 1280,
    });

    expect(teacherUpdated.student).toEqual({ currentPage: 3, scrollTop: 640 });
    expect(teacherUpdated.teacher).toEqual({ currentPage: 5, scrollTop: 1280 });
    expect(initial.student).toEqual({ currentPage: 1, scrollTop: 0 });
  });

  it('normalizes page input and adjacent navigation', () => {
    expect(normalizePdfPageInput(' 3 ', 8)).toBe(3);
    expect(normalizePdfPageInput('99', 8)).toBe(8);
    expect(normalizePdfPageInput('0', 8)).toBe(1);
    expect(normalizePdfPageInput('', 8)).toBeNull();
    expect(normalizePdfPageInput('2.5', 8)).toBeNull();
    expect(getAdjacentPdfPage(1, 8, 'previous')).toBe(1);
    expect(getAdjacentPdfPage(8, 8, 'next')).toBe(8);
    expect(getAdjacentPdfPage(4, 8, 'next')).toBe(5);
  });

  it('selects the page with the largest visible area and nearest top tie-break', () => {
    expect(
      selectMostVisiblePdfPage(
        [
          { pageNumber: 1, visibleArea: 120, topDistance: 20 },
          { pageNumber: 2, visibleArea: 260, topDistance: 300 },
          { pageNumber: 3, visibleArea: 260, topDistance: 180 },
        ],
        1,
      ),
    ).toBe(3);
    expect(selectMostVisiblePdfPage([], 4)).toBe(4);
  });

  it('maps PageUp and PageDown only outside editable controls', () => {
    expect(getFocusedPdfKeyboardAction({ key: 'PageUp', targetTagName: 'div' })).toBe(
      'previous-page',
    );
    expect(getFocusedPdfKeyboardAction({ key: 'PageDown', targetTagName: 'div' })).toBe(
      'next-page',
    );
    expect(getFocusedPdfKeyboardAction({ key: 'PageDown', targetTagName: 'input' })).toBeNull();
    expect(getFocusedPdfKeyboardAction({ key: 'PageDown', targetTagName: 'button' })).toBe(
      'next-page',
    );
    expect(
      getFocusedPdfKeyboardAction({ key: 'PageDown', targetContentEditable: true }),
    ).toBeNull();
    expect(getFocusedPdfKeyboardAction({ key: 'PageDown', metaKey: true })).toBeNull();
  });
});
