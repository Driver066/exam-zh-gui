import { describe, expect, it } from 'vitest';

import { createEmptyExamDocument, createDefaultSection, addSection } from '../../shared/document';
import {
  expandSectionId,
  getSectionMenuAvailability,
  resolveSectionSelectionAfterDelete,
  toggleCollapsedSectionId,
} from './left-workbench';

describe('left workbench helpers', () => {
  it('reports section movement boundaries', () => {
    expect(getSectionMenuAvailability(0, 3)).toEqual({
      canMoveUp: false,
      canMoveDown: true,
    });
    expect(getSectionMenuAvailability(1, 3)).toEqual({
      canMoveUp: true,
      canMoveDown: true,
    });
    expect(getSectionMenuAvailability(2, 3)).toEqual({
      canMoveUp: true,
      canMoveDown: false,
    });
  });

  it('selects the next section first after deleting the current section', () => {
    let sequence = 0;
    const createId = (prefix: string) => `${prefix}-${++sequence}`;
    const sections = [
      createDefaultSection(createId),
      createDefaultSection(createId),
      createDefaultSection(createId),
    ];
    let document = createEmptyExamDocument('left-workbench-selection');
    sections.forEach((section) => {
      document = addSection(document, section);
    });

    expect(resolveSectionSelectionAfterDelete(document, sections[1]!.id, sections[1]!.id)).toBe(
      sections[2]!.id,
    );
    expect(resolveSectionSelectionAfterDelete(document, sections[2]!.id, sections[2]!.id)).toBe(
      sections[1]!.id,
    );
    expect(resolveSectionSelectionAfterDelete(document, sections[0]!.id, sections[2]!.id)).toBe(
      sections[2]!.id,
    );
  });

  it('toggles and explicitly expands section ids', () => {
    const collapsed = toggleCollapsedSectionId(new Set(), 'section-1');

    expect(collapsed.has('section-1')).toBe(true);
    expect(expandSectionId(collapsed, 'section-1').has('section-1')).toBe(false);
  });
});
