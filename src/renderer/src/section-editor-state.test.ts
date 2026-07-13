import { describe, expect, it } from 'vitest';

import { createDefaultQuestion, createDefaultSection, type CreateId } from '../../shared/document';
import {
  expandSectionProperties,
  getNewSectionTitleSelection,
  getSectionEditorSummary,
  getSectionEditorTitle,
  getSectionKindHint,
  getSectionQuestionAddMode,
  getSelectableSectionKinds,
  isSectionPropertiesExpanded,
  removeSectionPropertiesState,
  toggleSectionProperties,
} from './section-editor-state';

describe('section editor state', () => {
  it('uses direct add controls for fixed sections and a menu for mixed sections', () => {
    expect(getSectionQuestionAddMode('singleChoice')).toEqual({
      kind: 'direct',
      questionType: 'singleChoice',
    });
    expect(getSectionQuestionAddMode('custom')).toEqual({
      kind: 'menu',
      questionTypes: ['singleChoice', 'multipleChoice', 'blank', 'judgement', 'problem'],
    });
  });

  it('formats section identity and summary without duplicating whole-document statistics', () => {
    const createId = sequenceIdFactory();
    const section = createDefaultSection(createId, 'singleChoice');
    section.title = '选择题';
    section.questions = [createDefaultQuestion('singleChoice', createId)];
    section.questions[0]!.points = 4;

    expect(getSectionEditorTitle(section, 0)).toBe('一、选择题');
    expect(getSectionEditorSummary(section)).toBe('单选节 · 1 题 · 共 4 分');
    expect(getNewSectionTitleSelection(section)).toEqual({ start: 0, end: 3 });
  });

  it('tracks section property disclosure independently by section', () => {
    let expanded: ReadonlySet<string> = new Set();
    expanded = expandSectionProperties(expanded, 'section-1');

    expect(isSectionPropertiesExpanded(expanded, 'section-1')).toBe(true);
    expect(isSectionPropertiesExpanded(expanded, 'section-2')).toBe(false);

    expanded = toggleSectionProperties(expanded, 'section-1');
    expect(isSectionPropertiesExpanded(expanded, 'section-1')).toBe(false);

    expanded = expandSectionProperties(expanded, 'section-2');
    expect([...removeSectionPropertiesState(expanded, 'section-2')]).toEqual([]);
  });

  it('preserves section kind compatibility for existing questions', () => {
    const createId = sequenceIdFactory();
    const fixed = createDefaultSection(createId, 'singleChoice');
    fixed.questions = [createDefaultQuestion('singleChoice', createId)];
    const mixed = createDefaultSection(createId, 'custom');
    mixed.questions = [
      createDefaultQuestion('singleChoice', createId),
      createDefaultQuestion('blank', createId),
    ];

    expect(getSelectableSectionKinds(fixed)).toEqual(['singleChoice', 'custom']);
    expect(getSectionKindHint(fixed, getSelectableSectionKinds(fixed))).not.toBeNull();
    expect(getSelectableSectionKinds(mixed)).toEqual(['custom']);
  });
});

function sequenceIdFactory(): CreateId {
  let index = 0;
  return (prefix: string) => `${prefix}-${++index}`;
}
